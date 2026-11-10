import { describe, expect, it, vi } from 'vitest';

import type { GradedAttempt, QuizSubmission } from '../../shared/quiz-contract';
import { createGradeHandler, GradeServiceError } from '../../api/quizzes/grade';

const validSubmission: QuizSubmission = {
  quizId: 'javascript-foundations',
  quizVersion: 1,
  submissionId: '11111111-1111-4111-8111-111111111111',
  answers: [
    { questionId: '10000000-0000-4000-8000-000000000001', optionIndex: 1 },
    { questionId: '10000000-0000-4000-8000-000000000002', optionIndex: 2 },
    { questionId: '10000000-0000-4000-8000-000000000003', optionIndex: 0 },
  ],
};

const gradedAttempt: GradedAttempt = {
  id: '22222222-2222-4222-8222-222222222222',
  quizId: 'javascript-foundations',
  quizVersion: 1,
  correctCount: 3,
  questionCount: 3,
  scorePercent: 100,
  submittedAt: '2026-11-07T08:00:00.000Z',
};

function request(body: unknown = validSubmission, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/quizzes/grade', {
    method: 'POST',
    headers: {
      authorization: 'Bearer valid-access-token',
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function dependencies() {
  return {
    authenticate: vi.fn<(token: string) => Promise<{ userId: string } | null>>(() =>
      Promise.resolve({ userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }),
    ),
    grade: vi.fn(() => Promise.resolve(gradedAttempt)),
  };
}

describe('grade quiz handler', () => {
  it('rejects non-POST methods', async () => {
    const handler = createGradeHandler(dependencies());
    const response = await handler(new Request('http://localhost/api/quizzes/grade'));

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
  });

  it('rejects missing JSON content type', async () => {
    const handler = createGradeHandler(dependencies());
    const response = await handler(
      request(validSubmission, { 'content-type': 'text/plain' }),
    );

    expect(response.status).toBe(415);
  });

  it('rejects a declared body above 16 KiB without authenticating', async () => {
    const deps = dependencies();
    const handler = createGradeHandler(deps);
    const response = await handler(
      request(validSubmission, { 'content-length': '16385' }),
    );

    expect(response.status).toBe(413);
    expect(deps.authenticate).not.toHaveBeenCalled();
  });

  it('rejects a missing bearer token', async () => {
    const handler = createGradeHandler(dependencies());
    const response = await handler(request(validSubmission, { authorization: '' }));

    expect(response.status).toBe(401);
  });

  it('rejects an invalid or expired token', async () => {
    const deps = dependencies();
    deps.authenticate.mockResolvedValue(null);
    const handler = createGradeHandler(deps);

    expect((await handler(request())).status).toBe(401);
  });

  it('rejects malformed submissions before grading', async () => {
    const deps = dependencies();
    const handler = createGradeHandler(deps);
    const response = await handler(request({ ...validSubmission, answers: [] }));

    expect(response.status).toBe(400);
    expect(deps.grade).not.toHaveBeenCalled();
  });

  it('grades with the verified identity and returns no-store authoritative results', async () => {
    const deps = dependencies();
    const handler = createGradeHandler(deps);
    const response = await handler(request());

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ attempt: gradedAttempt });
    expect(deps.grade).toHaveBeenCalledWith(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      validSubmission,
    );
  });

  it.each([
    ['QUIZ_NOT_FOUND', 409],
    ['INVALID_SUBMISSION', 400],
    ['IDEMPOTENCY_CONFLICT', 409],
    ['RATE_LIMITED', 429],
  ] as const)('maps %s without exposing database details', async (code, status) => {
    const deps = dependencies();
    deps.grade.mockRejectedValue(new GradeServiceError(code));
    const response = await createGradeHandler(deps)(request());

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error: code });
  });

  it('sanitizes unexpected database failures', async () => {
    const deps = dependencies();
    deps.grade.mockRejectedValue(new Error('private.quiz_answer_keys connection failed'));
    const response = await createGradeHandler(deps)(request());

    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('quiz_answer_keys');
  });
});
