import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TutorPage } from './TutorPage';
import { demoChallenges } from './demo-content';

describe('TutorPage', () => {
  it('keeps the predefined-response label visible and shows a selected answer', async () => {
    const user = userEvent.setup();
    render(<TutorPage />);

    expect(screen.getAllByText('Demo — predefined responses')[0]).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: /why use an object for counting/i }),
    );
    expect(
      screen.getByText(/an object gives each distinct value its own named slot/i),
    ).toBeVisible();
    expect(screen.getAllByText('Demo — predefined responses')[0]).toBeVisible();
  });

  it('reveals three progressive hints and never exceeds the curated levels', async () => {
    const user = userEvent.setup();
    render(<TutorPage />);

    const hintButton = screen.getByRole('button', { name: /show hint 1/i });
    await user.click(hintButton);
    expect(
      screen.getByText(/what needs to persist from one loop iteration/i),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: /show hint 2/i }));
    expect(screen.getByText(/initialize a count the first time/i)).toBeVisible();
    await user.click(screen.getByRole('button', { name: /show hint 3/i }));
    expect(screen.getByText(/create an empty object before the loop/i)).toBeVisible();
    expect(
      screen.queryByRole('button', { name: /show hint 4/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/all three predefined hints are visible/i)).toBeVisible();
  });

  it('explains that arbitrary questions are unsupported without implying analysis', async () => {
    const user = userEvent.setup();
    render(<TutorPage />);

    await user.click(
      screen.getByRole('button', { name: /i have a different question/i }),
    );
    expect(screen.getByText(/live ai is unavailable in this version/i)).toBeVisible();
    expect(
      screen.getByText(/choose one of the predefined example questions/i),
    ).toBeVisible();
  });

  it('resets the selected response and hints', async () => {
    const user = userEvent.setup();
    render(<TutorPage />);

    await user.click(
      screen.getByRole('button', { name: /why use an object for counting/i }),
    );
    await user.click(screen.getByRole('button', { name: /show hint 1/i }));
    await user.click(screen.getByRole('button', { name: /reset demo/i }));
    expect(
      screen.queryByText(/an object gives each distinct value/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/what needs to persist from one loop iteration/i),
    ).not.toBeInTheDocument();
  });

  it('does not make external requests during interaction', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<TutorPage />);
    await user.click(
      screen.getByRole('button', { name: /why use an object for counting/i }),
    );
    await user.click(screen.getByRole('button', { name: /show hint 1/i }));
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it.each(
    demoChallenges.flatMap((challenge) =>
      challenge.questions.map((question) => ({ challenge, question })),
    ),
  )(
    'maps $challenge.title / $question.question to its curated answer',
    async ({ challenge, question }) => {
      const user = userEvent.setup();
      render(<TutorPage />);
      await user.selectOptions(screen.getByLabelText(/challenge/i), challenge.id);
      await user.click(screen.getByRole('button', { name: question.question }));
      expect(screen.getByText(question.answer)).toBeVisible();
    },
  );

  it('clears the previous response and hints when the challenge changes', async () => {
    const user = userEvent.setup();
    render(<TutorPage />);
    await user.click(
      screen.getByRole('button', { name: /why use an object for counting/i }),
    );
    await user.click(screen.getByRole('button', { name: /show hint 1/i }));
    await user.selectOptions(screen.getByLabelText(/challenge/i), 'normalize-words');
    expect(
      screen.queryByText(/an object gives each distinct value/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/what needs to persist from one loop iteration/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /why trim before filtering/i }),
    ).toBeVisible();
  });
});
