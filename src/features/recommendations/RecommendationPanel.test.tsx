import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { RecommendationPanel } from './RecommendationPanel';

describe('RecommendationPanel', () => {
  it('explains limited evidence with threshold-relevant precision and links', () => {
    render(
      <MemoryRouter>
        <RecommendationPanel
          result={{
            kind: 'recommendations',
            consideredAttemptCount: 1,
            unmatchedAttemptCount: 0,
            items: [
              {
                topic: 'JavaScript fundamentals',
                status: 'practice',
                score: 84.99,
                evidenceCount: 1,
                latestEvidenceAt: '2026-11-07T10:00:00Z',
                quizTitle: 'JavaScript foundations',
                quizPath: '/quizzes/javascript-foundations/1',
              },
            ],
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Practice again')).toBeVisible();
    expect(screen.getByText(/84\.99%/)).toBeVisible();
    expect(screen.getByText(/early signal.*one graded quiz/i)).toBeVisible();
    expect(
      screen.getByRole('link', { name: /take javascript foundations/i }),
    ).toHaveAttribute('href', '/quizzes/javascript-foundations/1');
    expect(
      screen.getByRole('link', { name: /practice normalize a list/i }),
    ).toHaveAttribute('href', '/challenges/normalize-words');
  });

  it('states when recommendation evidence is incomplete', () => {
    render(
      <MemoryRouter>
        <RecommendationPanel
          result={{
            kind: 'recommendations',
            consideredAttemptCount: 3,
            unmatchedAttemptCount: 2,
            items: [],
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/evidence is incomplete.*2 attempts/i)).toBeVisible();
  });

  it('shows a useful state without rendering a broken quiz link', () => {
    render(
      <MemoryRouter>
        <RecommendationPanel
          result={{
            kind: 'no-published-quizzes',
            consideredAttemptCount: 0,
            unmatchedAttemptCount: 0,
            items: [],
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/no published quiz is available/i)).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
