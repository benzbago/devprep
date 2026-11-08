import { supabase } from '../auth/supabase-client';

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizVersion: number;
  correctCount: number;
  questionCount: number;
  scorePercent: number;
  submittedAt: string;
}

export async function listAttempts(): Promise<QuizAttempt[]> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select(
      'id,quiz_id,quiz_version,correct_count,question_count,score_percent,submitted_at',
    )
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    quizId: String(row.quiz_id),
    quizVersion: Number(row.quiz_version),
    correctCount: Number(row.correct_count),
    questionCount: Number(row.question_count),
    scorePercent: Number(row.score_percent),
    submittedAt: String(row.submitted_at),
  }));
}

export async function listRecommendationAttempts(): Promise<QuizAttempt[]> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select(
      'id,quiz_id,quiz_version,correct_count,question_count,score_percent,submitted_at',
    )
    .order('submitted_at', { ascending: false })
    .order('id', { ascending: true })
    .limit(100);
  if (error) throw error;
  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    quizId: String(row.quiz_id),
    quizVersion: Number(row.quiz_version),
    correctCount: Number(row.correct_count),
    questionCount: Number(row.question_count),
    scorePercent: Number(row.score_percent),
    submittedAt: String(row.submitted_at),
  }));
}
