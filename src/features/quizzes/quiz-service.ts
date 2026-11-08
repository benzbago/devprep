import {
  gradedAttemptSchema,
  type GradedAttempt,
  type QuizSubmission,
} from '../../../shared/quiz-contract';
import { supabase } from '../auth/supabase-client';

export interface QuizSummary {
  id: string;
  version: number;
  title: string;
  description: string;
  topic: string;
  questionCount: number;
}

export interface QuizQuestion {
  id: string;
  position: number;
  prompt: string;
  options: string[];
}

const quizColumns = 'id,version,title,description,topic,question_count';

function mapQuiz(row: Record<string, unknown>): QuizSummary {
  return {
    id: String(row.id),
    version: Number(row.version),
    title: String(row.title),
    description: String(row.description),
    topic: String(row.topic),
    questionCount: Number(row.question_count),
  };
}

export async function listQuizzes(): Promise<QuizSummary[]> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('quizzes')
    .select(quizColumns)
    .order('version', { ascending: false });
  if (error) throw error;

  const latest = new Map<string, QuizSummary>();
  for (const row of data as Record<string, unknown>[]) {
    const quiz = mapQuiz(row);
    if (!latest.has(quiz.id)) latest.set(quiz.id, quiz);
  }
  return [...latest.values()];
}

export async function listQuizVersions(): Promise<QuizSummary[]> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('quizzes')
    .select(quizColumns)
    .order('id')
    .order('version', { ascending: false });
  if (error) throw error;
  return (data as Record<string, unknown>[]).map(mapQuiz);
}

export async function getQuizQuestions(
  quizId: string,
  quizVersion: number,
): Promise<{ quiz: QuizSummary; questions: QuizQuestion[] }> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const [quizResult, questionResult] = await Promise.all([
    supabase
      .from('quizzes')
      .select(quizColumns)
      .eq('id', quizId)
      .eq('version', quizVersion)
      .single(),
    supabase
      .from('quiz_questions')
      .select('id,position,prompt,options')
      .eq('quiz_id', quizId)
      .eq('quiz_version', quizVersion)
      .order('position'),
  ]);
  if (quizResult.error) throw quizResult.error;
  if (questionResult.error) throw questionResult.error;

  return {
    quiz: mapQuiz(quizResult.data),
    questions: (questionResult.data as Record<string, unknown>[]).map((row) => ({
      id: String(row.id),
      position: Number(row.position),
      prompt: String(row.prompt),
      options: row.options as string[],
    })),
  };
}

export async function submitQuiz(submission: QuizSubmission): Promise<GradedAttempt> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error('INVALID_OR_EXPIRED_SESSION');

  const response = await fetch('/api/quizzes/grade', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(submission),
  });
  const result = (await response.json()) as { attempt?: unknown; error?: string };
  if (!response.ok) throw new Error(result.error ?? 'GRADING_UNAVAILABLE');
  return gradedAttemptSchema.parse(result.attempt);
}
