import { describe, expect, it } from 'vitest';

import type { QuizAttempt } from '../quizzes/attempt-service';
import type { QuizSummary } from '../quizzes/quiz-service';
import { deriveStudyRecommendations } from './recommendation-engine';

const quizzes: QuizSummary[] = [
  {
    id: 'arrays',
    version: 1,
    title: 'Arrays',
    description: 'Array practice',
    topic: 'Arrays',
    questionCount: 10,
  },
  {
    id: 'objects',
    version: 1,
    title: 'Objects',
    description: 'Object practice',
    topic: 'Objects',
    questionCount: 10,
  },
];

function attempt(
  id: string,
  quizId: string,
  correctCount: number,
  questionCount = 10,
  submittedAt = '2026-11-07T10:00:00.000Z',
): QuizAttempt {
  return {
    id,
    quizId,
    quizVersion: 1,
    correctCount,
    questionCount,
    scorePercent: Math.round((correctCount / questionCount) * 100),
    submittedAt,
  };
}

describe('deriveStudyRecommendations', () => {
  it('offers a useful starter when there are quizzes but no attempts', () => {
    const result = deriveStudyRecommendations([], quizzes);

    expect(result.kind).toBe('recommendations');
    expect(result.items[0]).toMatchObject({
      status: 'start',
      topic: 'Arrays',
      quizPath: '/quizzes/arrays/1',
      evidenceCount: 0,
    });
  });

  it('returns a useful empty state when no published quiz exists', () => {
    expect(deriveStudyRecommendations([], [])).toEqual({
      kind: 'no-published-quizzes',
      unmatchedAttemptCount: 0,
      consideredAttemptCount: 0,
      items: [],
    });
  });

  it.each([
    [6999, 10000, 'review'],
    [7000, 10000, 'practice'],
    [8499, 10000, 'practice'],
    [8500, 10000, 'keep-fresh'],
  ] as const)(
    'classifies %s/%s using the unrounded score',
    (correctCount, questionCount, status) => {
      const result = deriveStudyRecommendations(
        [attempt('one', 'arrays', correctCount, questionCount)],
        quizzes,
      );

      expect(result.items[0].status).toBe(status);
      expect(result.items[0].score).toBe((correctCount / questionCount) * 100);
    },
  );

  it('uses only the latest retake for each immutable quiz version', () => {
    const result = deriveStudyRecommendations(
      [
        attempt('older', 'arrays', 2, 10, '2026-11-07T09:00:00.000Z'),
        attempt('newer', 'arrays', 9, 10, '2026-11-07T10:00:00.000Z'),
      ],
      quizzes,
    );

    expect(result.items[0]).toMatchObject({ status: 'keep-fresh', score: 90 });
    expect(result.items[0].evidenceCount).toBe(1);
  });

  it('sorts tied topics by older evidence and then topic name', () => {
    const result = deriveStudyRecommendations(
      [
        attempt('arrays', 'arrays', 6, 10, '2026-11-07T10:00:00.000Z'),
        attempt('objects', 'objects', 6, 10, '2026-11-07T09:00:00.000Z'),
      ],
      quizzes,
    );

    expect(result.items.map(({ topic }) => topic)).toEqual(['Objects', 'Arrays']);
  });

  it('keeps only the weakest topic fresh when every topic meets 85 percent', () => {
    const result = deriveStudyRecommendations(
      [attempt('000', 'objects', 10), attempt('999', 'arrays', 9)],
      quizzes,
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ topic: 'Arrays', status: 'keep-fresh' });
  });

  it('reports unmatched attempts separately from genuinely empty history', () => {
    const result = deriveStudyRecommendations(
      [attempt('missing', 'retired-quiz', 4, 10)],
      quizzes,
    );

    expect(result.unmatchedAttemptCount).toBe(1);
    expect(result.consideredAttemptCount).toBe(1);
    expect(result.items[0].status).toBe('start');
  });

  it('applies a deterministic 100-attempt evidence cutoff when timestamps match', () => {
    const attempts = Array.from({ length: 101 }, (_, index) =>
      attempt(String(index).padStart(3, '0'), index === 100 ? 'objects' : 'arrays', 6),
    );
    const result = deriveStudyRecommendations(attempts, quizzes);

    expect(result.consideredAttemptCount).toBe(100);
    expect(result.items.map(({ topic }) => topic)).toEqual(['Arrays']);
  });
});
