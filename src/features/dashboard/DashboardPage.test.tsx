import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthContext, type AuthState } from '../auth/auth-context';
import { listAttempts, listRecommendationAttempts } from '../quizzes/attempt-service';
import { listQuizVersions } from '../quizzes/quiz-service';
import { DashboardPage } from './DashboardPage';

vi.mock('../quizzes/attempt-service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../quizzes/attempt-service')>()),
  listAttempts: vi.fn(),
  listRecommendationAttempts: vi.fn(),
}));

vi.mock('../quizzes/quiz-service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../quizzes/quiz-service')>()),
  listQuizVersions: vi.fn(),
}));

const signedOut: AuthState = {
  status: 'signedOut',
  signIn: () => Promise.resolve({ ok: false, message: '' }),
  signUp: () => Promise.resolve({ ok: false, message: '' }),
  signOut: () => Promise.resolve(),
};

function renderDashboard(auth: AuthState) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={auth}>
        <DashboardPage />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.mocked(listAttempts).mockReset();
    vi.mocked(listRecommendationAttempts).mockReset();
    vi.mocked(listQuizVersions).mockReset();
    vi.mocked(listRecommendationAttempts).mockResolvedValue([]);
    vi.mocked(listQuizVersions).mockResolvedValue([]);
  });

  it('clearly labels signed-out figures as sample content', () => {
    renderDashboard(signedOut);

    expect(
      screen.getByRole('heading', { name: /sample learning dashboard/i }),
    ).toBeVisible();
    expect(screen.getByText(/sample content only/i)).toBeVisible();
    expect(listAttempts).not.toHaveBeenCalled();
    expect(listRecommendationAttempts).not.toHaveBeenCalled();
    expect(listQuizVersions).not.toHaveBeenCalled();
  });

  it('shows only real figures derived from signed-in attempts', async () => {
    vi.mocked(listAttempts).mockResolvedValue([
      {
        id: 'attempt-2',
        quizId: 'javascript-foundations',
        quizVersion: 1,
        correctCount: 2,
        questionCount: 3,
        scorePercent: 67,
        submittedAt: '2026-11-07T09:00:00Z',
      },
      {
        id: 'attempt-1',
        quizId: 'javascript-foundations',
        quizVersion: 1,
        correctCount: 3,
        questionCount: 3,
        scorePercent: 100,
        submittedAt: '2026-11-07T08:00:00Z',
      },
    ]);
    renderDashboard({
      ...signedOut,
      status: 'signedIn',
      user: { id: 'user-one' } as AuthState['user'],
    });

    expect(await screen.findByText('2')).toBeVisible();
    expect(screen.getByText('100%')).toBeVisible();
    expect(screen.getByText('67%')).toBeVisible();
    expect(screen.queryByText(/sample study time/i)).not.toBeInTheDocument();
  });

  it('shows an honest empty state for a signed-in user', async () => {
    vi.mocked(listAttempts).mockResolvedValue([]);
    renderDashboard({
      ...signedOut,
      status: 'signedIn',
      user: { id: 'user-one' } as AuthState['user'],
    });

    expect(await screen.findByText(/no graded attempts yet/i)).toBeVisible();
  });

  it('derives signed-in recommendations from the bounded evidence query', async () => {
    vi.mocked(listAttempts).mockResolvedValue([]);
    vi.mocked(listRecommendationAttempts).mockResolvedValue([
      {
        id: 'attempt-1',
        quizId: 'javascript-foundations',
        quizVersion: 1,
        correctCount: 2,
        questionCount: 3,
        scorePercent: 67,
        submittedAt: '2026-11-07T09:00:00Z',
      },
    ]);
    vi.mocked(listQuizVersions).mockResolvedValue([
      {
        id: 'javascript-foundations',
        version: 1,
        title: 'JavaScript foundations',
        description: 'Fundamentals',
        topic: 'JavaScript fundamentals',
        questionCount: 3,
      },
    ]);
    renderDashboard({
      ...signedOut,
      status: 'signedIn',
      user: { id: 'user-one' } as AuthState['user'],
    });

    expect(await screen.findByText('Review next')).toBeVisible();
    expect(screen.getByText(/66\.67%/)).toBeVisible();
    expect(listRecommendationAttempts).toHaveBeenCalledTimes(1);
  });

  it('rejects a stale recommendation response after an account change', async () => {
    let resolveFirst!: (
      value: Awaited<ReturnType<typeof listRecommendationAttempts>>,
    ) => void;
    vi.mocked(listAttempts).mockResolvedValue([]);
    vi.mocked(listRecommendationAttempts)
      .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce([]);
    vi.mocked(listQuizVersions).mockResolvedValue([
      {
        id: 'javascript-foundations',
        version: 1,
        title: 'JavaScript foundations',
        description: 'Fundamentals',
        topic: 'JavaScript fundamentals',
        questionCount: 3,
      },
    ]);
    const first = {
      ...signedOut,
      status: 'signedIn' as const,
      user: { id: 'user-one' } as AuthState['user'],
    };
    const { rerender } = renderDashboard(first);
    rerender(
      <MemoryRouter>
        <AuthContext.Provider
          value={{ ...first, user: { id: 'user-two' } as AuthState['user'] }}
        >
          <DashboardPage />
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    resolveFirst([
      {
        id: 'stale',
        quizId: 'javascript-foundations',
        quizVersion: 1,
        correctCount: 0,
        questionCount: 3,
        scorePercent: 0,
        submittedAt: '2026-11-07T09:00:00Z',
      },
    ]);

    expect(await screen.findByText('Start here')).toBeVisible();
    expect(screen.queryByText('Review next')).not.toBeInTheDocument();
  });
});
