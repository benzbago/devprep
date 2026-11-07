import { describe, expect, it } from 'vitest';

import { quizSubmissionSchema } from './quiz-contract';

const validSubmission = {
  quizId: 'javascript-foundations',
  quizVersion: 1,
  submissionId: '11111111-1111-4111-8111-111111111111',
  answers: [
    { questionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', optionIndex: 1 },
    { questionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', optionIndex: 2 },
  ],
};

describe('quizSubmissionSchema', () => {
  it('accepts a bounded complete submission shape', () => {
    expect(quizSubmissionSchema.parse(validSubmission)).toEqual(validSubmission);
  });

  it.each([
    ['malformed quiz id', { ...validSubmission, quizId: '../private' }],
    ['zero version', { ...validSubmission, quizVersion: 0 }],
    ['non-integer version', { ...validSubmission, quizVersion: 1.5 }],
    ['malformed submission uuid', { ...validSubmission, submissionId: 'retry-1' }],
    ['missing answers', { ...validSubmission, answers: [] }],
    [
      'too many answers',
      {
        ...validSubmission,
        answers: Array.from({ length: 21 }, (_, index) => ({
          questionId: `aaaaaaaa-aaaa-4aaa-8aaa-${String(index).padStart(12, '0')}`,
          optionIndex: 0,
        })),
      },
    ],
    [
      'duplicate question ids',
      {
        ...validSubmission,
        answers: [validSubmission.answers[0], validSubmission.answers[0]],
      },
    ],
    [
      'negative option index',
      {
        ...validSubmission,
        answers: [{ ...validSubmission.answers[0], optionIndex: -1 }],
      },
    ],
    [
      'option index above the database maximum',
      {
        ...validSubmission,
        answers: [{ ...validSubmission.answers[0], optionIndex: 6 }],
      },
    ],
  ])('rejects %s', (_label, submission) => {
    expect(quizSubmissionSchema.safeParse(submission).success).toBe(false);
  });
});
