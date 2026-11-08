import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthContext, type AuthState } from '../auth/auth-context';
import {
  getQuizQuestions,
  listQuizzes,
  submitQuiz,
  type QuizQuestion,
  type QuizSummary,
} from './quiz-service';
import { QuizListPage } from './QuizListPage';
import { QuizPage } from './QuizPage';

vi.mock('./quiz-service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./quiz-service')>()),
  getQuizQuestions: vi.fn(),
  listQuizzes: vi.fn(),
  submitQuiz: vi.fn(),
}));

const signedOut: AuthState = {
  status: 'signedOut',
  signIn: () => Promise.resolve({ ok: false, message: '' }),
  signUp: () => Promise.resolve({ ok: false, message: '' }),
  signOut: () => Promise.resolve(),
};

const signedIn: AuthState = {
  ...signedOut,
  status: 'signedIn',
  user: { id: 'user-one' } as AuthState['user'],
};

const quiz: QuizSummary = {
  id: 'javascript-foundations',
  version: 1,
  title: 'JavaScript foundations',
  description: 'A short fundamentals quiz.',
  topic: 'JavaScript fundamentals',
  questionCount: 2,
};

const questions: QuizQuestion[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    position: 1,
    prompt: 'What is one plus one?',
    options: ['1', '2'],
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    position: 2,
    prompt: 'Which keyword declares a constant?',
    options: ['let', 'const'],
  },
];

function renderWithAuth(ui: React.ReactNode, auth: AuthState = signedIn) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={auth}>{ui}</AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('authenticated quizzes', () => {
  beforeEach(() => {
    vi.mocked(listQuizzes).mockReset();
    vi.mocked(getQuizQuestions).mockReset();
    vi.mocked(submitQuiz).mockReset();
  });

  it('requires sign-in for the private quiz catalog', () => {
    renderWithAuth(<QuizListPage />, signedOut);

    expect(
      screen.getByRole('heading', { name: /sign in to take quizzes/i }),
    ).toBeVisible();
    expect(listQuizzes).not.toHaveBeenCalled();
  });

  it('shows only published quiz metadata returned by the service', async () => {
    vi.mocked(listQuizzes).mockResolvedValue([quiz]);
    renderWithAuth(<QuizListPage />);

    expect(await screen.findByRole('heading', { name: quiz.title })).toBeVisible();
    expect(screen.getByText(/2 questions/)).toBeVisible();
  });

  it('submits one complete selection and displays the authoritative result', async () => {
    vi.mocked(getQuizQuestions).mockResolvedValue({ quiz, questions });
    vi.mocked(submitQuiz).mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      quizId: quiz.id,
      quizVersion: quiz.version,
      correctCount: 2,
      questionCount: 2,
      scorePercent: 100,
      submittedAt: '2026-11-07T08:00:00.000Z',
    });
    const user = userEvent.setup();
    renderWithAuth(<QuizPage quizId={quiz.id} quizVersion={quiz.version} />);

    await user.click(await screen.findByRole('radio', { name: '2' }));
    await user.click(screen.getByRole('radio', { name: 'const' }));
    await user.click(screen.getByRole('button', { name: /submit quiz/i }));

    const resultHeading = await screen.findByRole('heading', { name: '100%' });
    expect(resultHeading).toBeVisible();
    expect(resultHeading).toHaveFocus();
    expect(resultHeading.closest('[aria-live]')).toBeNull();
    expect(screen.getByText(/authoritatively graded/i)).toBeVisible();
    expect(submitQuiz).toHaveBeenCalledTimes(1);
  });

  it('prevents submitting until every question has one selection', async () => {
    vi.mocked(getQuizQuestions).mockResolvedValue({ quiz, questions });
    renderWithAuth(<QuizPage quizId={quiz.id} quizVersion={quiz.version} />);

    expect(await screen.findByRole('button', { name: /submit quiz/i })).toBeDisabled();
  });

  it('shows an expired-session response without exposing server details', async () => {
    vi.mocked(getQuizQuestions).mockResolvedValue({ quiz, questions });
    vi.mocked(submitQuiz).mockRejectedValue(new Error('INVALID_OR_EXPIRED_SESSION'));
    const user = userEvent.setup();
    renderWithAuth(<QuizPage quizId={quiz.id} quizVersion={quiz.version} />);

    await user.click(await screen.findByRole('radio', { name: '2' }));
    await user.click(screen.getByRole('radio', { name: 'const' }));
    await user.click(screen.getByRole('button', { name: /submit quiz/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/session ended/i);
    expect(screen.queryByText(/private/i)).not.toBeInTheDocument();
  });

  it('can abandon a failed retry and submit edited answers with a new identifier', async () => {
    vi.mocked(getQuizQuestions).mockResolvedValue({ quiz, questions });
    vi.mocked(submitQuiz)
      .mockRejectedValueOnce(new Error('NETWORK_ERROR'))
      .mockResolvedValueOnce({
        id: '22222222-2222-4222-8222-222222222222',
        quizId: quiz.id,
        quizVersion: quiz.version,
        correctCount: 1,
        questionCount: 2,
        scorePercent: 50,
        submittedAt: '2026-11-07T08:00:00.000Z',
      });
    const user = userEvent.setup();
    renderWithAuth(<QuizPage quizId={quiz.id} quizVersion={quiz.version} />);

    await user.click(await screen.findByRole('radio', { name: '2' }));
    await user.click(screen.getByRole('radio', { name: 'const' }));
    await user.click(screen.getByRole('button', { name: /submit quiz/i }));
    await screen.findByText(/could not be graded/i);
    const firstId = vi.mocked(submitQuiz).mock.calls[0][0].submissionId;

    expect(screen.getByRole('button', { name: /start a new attempt/i })).toBeVisible();
    await user.click(screen.getByRole('radio', { name: '1' }));
    await user.click(screen.getByRole('button', { name: /submit quiz/i }));

    expect(await screen.findByText('50%')).toBeVisible();
    expect(vi.mocked(submitQuiz).mock.calls[1][0].submissionId).not.toBe(firstId);
  });
});
