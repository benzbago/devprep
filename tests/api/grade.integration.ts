import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { QuizSubmission } from '../../shared/quiz-contract';
import { POST } from '../../api/quizzes/grade';

const url = process.env.VITE_SUPABASE_URL;
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !publishableKey || !serviceRoleKey) {
  throw new Error('Local Supabase values are required; integration tests do not skip.');
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const publicClient = createClient(url, publishableKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let userId = '';
let accessToken = '';

const answers = [
  { questionId: '10000000-0000-4000-8000-000000000001', optionIndex: 1 },
  { questionId: '10000000-0000-4000-8000-000000000002', optionIndex: 2 },
  { questionId: '10000000-0000-4000-8000-000000000003', optionIndex: 0 },
];

function submission(submissionId: string, selectedAnswers = answers): QuizSubmission {
  return {
    quizId: 'javascript-foundations',
    quizVersion: 1,
    submissionId,
    answers: selectedAnswers,
  };
}

function gradeRequest(body: QuizSubmission, token = accessToken) {
  return POST(
    new Request('http://local.test/api/quizzes/grade', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    }),
  );
}

beforeAll(async () => {
  const email = `handler-${crypto.randomUUID()}@example.test`;
  const password = `Local-${crypto.randomUUID()}`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error || !created.data.user)
    throw created.error ?? new Error('User creation failed');
  userId = created.data.user.id;
  const signedIn = await publicClient.auth.signInWithPassword({ email, password });
  if (signedIn.error || !signedIn.data.session)
    throw signedIn.error ?? new Error('Sign-in failed');
  accessToken = signedIn.data.session.access_token;
});

afterAll(async () => {
  if (userId) await admin.auth.admin.deleteUser(userId);
});

describe('real local grading handler', () => {
  it('rejects an invalid or expired token through Supabase Auth', async () => {
    expect(
      (await gradeRequest(submission(crypto.randomUUID()), 'expired-token')).status,
    ).toBe(401);
  });

  it('collapses concurrent identical submissions and rejects changed content', async () => {
    const submissionId = crypto.randomUUID();
    const [first, second] = await Promise.all([
      gradeRequest(submission(submissionId)),
      gradeRequest(submission(submissionId)),
    ]);
    const firstBody = (await first.json()) as {
      attempt: { id: string; scorePercent: number };
    };
    const secondBody = (await second.json()) as {
      attempt: { id: string; scorePercent: number };
    };

    expect([first.status, second.status]).toEqual([200, 200]);
    expect(secondBody.attempt).toEqual(firstBody.attempt);
    expect(firstBody.attempt.scorePercent).toBe(100);

    const { count, error } = await admin
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('submission_id', submissionId);
    expect(error).toBeNull();
    expect(count).toBe(1);

    const changed = [...answers];
    changed[0] = { ...changed[0], optionIndex: 0 };
    expect((await gradeRequest(submission(submissionId, changed))).status).toBe(409);
  });

  it('persists the five-per-minute limit while allowing exact retries', async () => {
    const ids = Array.from({ length: 4 }, () => crypto.randomUUID());
    for (const id of ids) {
      expect((await gradeRequest(submission(id))).status).toBe(200);
    }

    expect((await gradeRequest(submission(crypto.randomUUID()))).status).toBe(429);
    expect((await gradeRequest(submission(ids[0]))).status).toBe(200);
  });
});
