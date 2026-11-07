import { z } from 'zod';

const quizAnswerSchema = z.object({
  questionId: z.uuid(),
  optionIndex: z.number().int().min(0).max(5),
});

export const quizSubmissionSchema = z
  .object({
    quizId: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(80),
    quizVersion: z.number().int().positive().max(2_147_483_647),
    submissionId: z.uuid(),
    answers: z.array(quizAnswerSchema).min(1).max(20),
  })
  .superRefine(({ answers }, context) => {
    const questionIds = new Set<string>();

    for (const answer of answers) {
      if (questionIds.has(answer.questionId)) {
        context.addIssue({
          code: 'custom',
          message: 'Question IDs must be unique',
          path: ['answers'],
        });
        return;
      }

      questionIds.add(answer.questionId);
    }
  });

export const gradedAttemptSchema = z.object({
  id: z.uuid(),
  quizId: z.string(),
  quizVersion: z.number().int().positive(),
  correctCount: z.number().int().nonnegative(),
  questionCount: z.number().int().positive(),
  scorePercent: z.number().int().min(0).max(100),
  submittedAt: z.iso.datetime({ offset: true }),
});

export type QuizSubmission = z.infer<typeof quizSubmissionSchema>;
export type GradedAttempt = z.infer<typeof gradedAttemptSchema>;
