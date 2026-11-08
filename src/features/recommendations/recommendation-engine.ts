import type { QuizAttempt } from '../quizzes/attempt-service';
import type { QuizSummary } from '../quizzes/quiz-service';

export type RecommendationStatus = 'start' | 'review' | 'practice' | 'keep-fresh';

export interface StudyRecommendation {
  topic: string;
  status: RecommendationStatus;
  score?: number;
  evidenceCount: number;
  latestEvidenceAt?: string;
  quizTitle: string;
  quizPath: string;
}

export interface RecommendationResult {
  kind: 'recommendations' | 'no-published-quizzes';
  items: StudyRecommendation[];
  consideredAttemptCount: number;
  unmatchedAttemptCount: number;
}

const EVIDENCE_LIMIT = 100;

function newestFirst(left: QuizAttempt, right: QuizAttempt) {
  return (
    right.submittedAt.localeCompare(left.submittedAt) || left.id.localeCompare(right.id)
  );
}

function latestQuizForTopic(quizzes: QuizSummary[], topic: string) {
  return quizzes
    .filter((quiz) => quiz.topic === topic)
    .sort(
      (left, right) => right.version - left.version || left.id.localeCompare(right.id),
    )[0];
}

export function deriveStudyRecommendations(
  attempts: QuizAttempt[],
  quizzes: QuizSummary[],
): RecommendationResult {
  const published = [...quizzes].sort(
    (left, right) =>
      left.topic.localeCompare(right.topic) ||
      left.id.localeCompare(right.id) ||
      right.version - left.version,
  );
  const considered = [...attempts].sort(newestFirst).slice(0, EVIDENCE_LIMIT);

  if (published.length === 0) {
    return {
      kind: 'no-published-quizzes',
      items: [],
      consideredAttemptCount: considered.length,
      unmatchedAttemptCount: considered.length,
    };
  }

  const metadata = new Map<string, QuizSummary>(
    published.map((quiz) => [`${quiz.id}:${quiz.version}`, quiz] as const),
  );
  const latestByVersion = new Map<string, QuizAttempt>();
  let unmatchedAttemptCount = 0;
  for (const attempt of considered) {
    const key = `${attempt.quizId}:${attempt.quizVersion}`;
    if (!metadata.has(key)) {
      unmatchedAttemptCount += 1;
    } else if (!latestByVersion.has(key)) {
      latestByVersion.set(key, attempt);
    }
  }

  const topicEvidence = new Map<
    string,
    { correct: number; questions: number; count: number; latestAt: string }
  >();
  for (const [key, attempt] of latestByVersion) {
    const quiz = metadata.get(key);
    if (!quiz) continue;
    const current = topicEvidence.get(quiz.topic) ?? {
      correct: 0,
      questions: 0,
      count: 0,
      latestAt: attempt.submittedAt,
    };
    current.correct += attempt.correctCount;
    current.questions += attempt.questionCount;
    current.count += 1;
    if (attempt.submittedAt > current.latestAt) current.latestAt = attempt.submittedAt;
    topicEvidence.set(quiz.topic, current);
  }

  if (topicEvidence.size === 0) {
    const starter = published[0];
    return {
      kind: 'recommendations',
      consideredAttemptCount: considered.length,
      unmatchedAttemptCount,
      items: [
        {
          status: 'start',
          topic: starter.topic,
          evidenceCount: 0,
          quizTitle: starter.title,
          quizPath: `/quizzes/${starter.id}/${starter.version}`,
        },
      ],
    };
  }

  const all = [...topicEvidence].map(([topic, evidence]) => {
    const score = (evidence.correct / evidence.questions) * 100;
    const quiz = latestQuizForTopic(published, topic);
    const status: RecommendationStatus =
      score < 70 ? 'review' : score < 85 ? 'practice' : 'keep-fresh';
    return {
      topic,
      score,
      evidenceCount: evidence.count,
      latestEvidenceAt: evidence.latestAt,
      quizTitle: quiz.title,
      quizPath: `/quizzes/${quiz.id}/${quiz.version}`,
      status,
    };
  });
  all.sort(
    (left, right) =>
      left.score - right.score ||
      left.latestEvidenceAt.localeCompare(right.latestEvidenceAt) ||
      left.topic.localeCompare(right.topic),
  );
  const remediation = all.filter(({ score }) => score < 85);
  const selected = remediation.length > 0 ? remediation : all.slice(0, 1);

  return {
    kind: 'recommendations',
    items: selected,
    consideredAttemptCount: considered.length,
    unmatchedAttemptCount,
  };
}
