import {
  quizSubmissionSchema,
  type GradedAttempt,
  type QuizSubmission,
} from '../../shared/quiz-contract.js';
import { jsonResponse, MAX_GRADING_BODY_BYTES } from '../_lib/http.js';
import { createServerDependencies } from '../_lib/server-supabase.js';

const knownServiceErrors = [
  'QUIZ_NOT_FOUND',
  'INVALID_SUBMISSION',
  'IDEMPOTENCY_CONFLICT',
  'RATE_LIMITED',
] as const;

type GradeServiceErrorCode = (typeof knownServiceErrors)[number];

export class GradeServiceError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'GradeServiceError';
  }
}

export interface GradeDependencies {
  authenticate(accessToken: string): Promise<{ userId: string } | null>;
  grade(userId: string, submission: QuizSubmission): Promise<GradedAttempt>;
}

function bearerToken(request: Request) {
  const authorization = request.headers.get('authorization');
  const match = authorization?.match(/^Bearer ([^\s]+)$/);
  return match?.[1] ?? null;
}

function serviceErrorStatus(code: GradeServiceErrorCode) {
  if (code === 'INVALID_SUBMISSION') return 400;
  if (code === 'RATE_LIMITED') return 429;
  return 409;
}

export function createGradeHandler(dependencies: GradeDependencies) {
  return async function gradeHandler(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return jsonResponse(405, { error: 'METHOD_NOT_ALLOWED' }, { allow: 'POST' });
    }

    if (
      !request.headers.get('content-type')?.toLowerCase().startsWith('application/json')
    ) {
      return jsonResponse(415, { error: 'JSON_REQUIRED' });
    }

    const declaredLength = Number(request.headers.get('content-length') ?? 0);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_GRADING_BODY_BYTES) {
      return jsonResponse(413, { error: 'BODY_TOO_LARGE' });
    }

    const token = bearerToken(request);
    if (!token) return jsonResponse(401, { error: 'AUTHENTICATION_REQUIRED' });

    let text: string;
    try {
      text = await request.text();
    } catch {
      return jsonResponse(400, { error: 'INVALID_JSON' });
    }

    if (new TextEncoder().encode(text).byteLength > MAX_GRADING_BODY_BYTES) {
      return jsonResponse(413, { error: 'BODY_TOO_LARGE' });
    }

    let input: unknown;
    try {
      input = JSON.parse(text);
    } catch {
      return jsonResponse(400, { error: 'INVALID_JSON' });
    }

    const parsed = quizSubmissionSchema.safeParse(input);
    if (!parsed.success) return jsonResponse(400, { error: 'INVALID_SUBMISSION' });

    const identity = await dependencies.authenticate(token);
    if (!identity) return jsonResponse(401, { error: 'INVALID_OR_EXPIRED_SESSION' });

    try {
      const attempt = await dependencies.grade(identity.userId, parsed.data);
      return jsonResponse(200, { attempt });
    } catch (error) {
      if (
        error instanceof GradeServiceError &&
        knownServiceErrors.includes(error.code as GradeServiceErrorCode)
      ) {
        const code = error.code as GradeServiceErrorCode;
        return jsonResponse(serviceErrorStatus(code), { error: code });
      }

      return jsonResponse(503, { error: 'GRADING_UNAVAILABLE' });
    }
  };
}

export async function POST(request: Request) {
  return createGradeHandler(createServerDependencies())(request);
}
