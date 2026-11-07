import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { gradedAttemptSchema, type QuizSubmission } from '../../shared/quiz-contract.ts';
import { GradeServiceError, type GradeDependencies } from '../quizzes/grade.ts';

const rpcRowSchema = z.object({
  id: z.string(),
  quiz_id: z.string(),
  quiz_version: z.number(),
  correct_count: z.number(),
  question_count: z.number(),
  score_percent: z.number(),
  submitted_at: z.string(),
});

const rpcEnvelopeSchema = z.object({
  data: z.union([rpcRowSchema, z.array(rpcRowSchema)]).nullable(),
  error: z.object({ message: z.string() }).passthrough().nullable(),
});

function requiredEnvironment(name: string, fallbackName?: string) {
  const value =
    process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined);

  if (!value?.trim()) {
    throw new Error(`Missing server environment: ${name}`);
  }

  return value;
}

export function createServerDependencies(): GradeDependencies {
  const url = requiredEnvironment('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const publishableKey = requiredEnvironment(
    'SUPABASE_PUBLISHABLE_KEY',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
  );
  const secretKey = requiredEnvironment(
    'SUPABASE_SECRET_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  );
  const authClient = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const serverClient = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    async authenticate(accessToken) {
      const { data, error } = await authClient.auth.getUser(accessToken);
      if (error || !data.user) return null;
      return { userId: data.user.id };
    },

    async grade(userId: string, submission: QuizSubmission) {
      const rpcResponse: unknown = await serverClient.rpc('grade_quiz_attempt', {
        p_user_id: userId,
        p_quiz_id: submission.quizId,
        p_quiz_version: submission.quizVersion,
        p_submission_id: submission.submissionId,
        p_answers: submission.answers,
      });
      const { data, error } = rpcEnvelopeSchema.parse(rpcResponse);

      if (error) {
        const knownCode = [
          'QUIZ_NOT_FOUND',
          'INVALID_SUBMISSION',
          'IDEMPOTENCY_CONFLICT',
          'RATE_LIMITED',
        ].find((code) => error.message.includes(code));

        if (knownCode) throw new GradeServiceError(knownCode);
        throw new Error('Quiz grading is temporarily unavailable');
      }

      const row = Array.isArray(data) ? data[0] : data;
      return gradedAttemptSchema.parse({
        id: row?.id,
        quizId: row?.quiz_id,
        quizVersion: row?.quiz_version,
        correctCount: row?.correct_count,
        questionCount: row?.question_count,
        scorePercent: row?.score_percent,
        submittedAt: row?.submitted_at,
      });
    },
  };
}
