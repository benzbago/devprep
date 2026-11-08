import { Link } from 'react-router-dom';

import { challengeByTopic } from './recommendation-catalog';
import type { RecommendationResult, RecommendationStatus } from './recommendation-engine';

const labels: Record<RecommendationStatus, string> = {
  start: 'Start here',
  review: 'Review next',
  practice: 'Practice again',
  'keep-fresh': 'Keep it fresh',
};

function formatScore(score: number) {
  return new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(score);
}

export function RecommendationPanel({ result }: { result: RecommendationResult }) {
  if (result.kind === 'no-published-quizzes') {
    return (
      <section aria-labelledby="study-recommendations" className="mt-10">
        <h2 className="text-2xl font-semibold text-white" id="study-recommendations">
          Study recommendations
        </h2>
        <p className="mt-4 rounded-xl border border-white/10 p-5 text-slate-300">
          No published quiz is available right now. Your saved attempt history remains
          unchanged; check back after more curated material is published.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="study-recommendations" className="mt-10">
      <h2 className="text-2xl font-semibold text-white" id="study-recommendations">
        Study recommendations
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
        Deterministic suggestions use your latest result for each attempted quiz version,
        from up to 100 recent graded attempts. They are not AI-generated.
      </p>
      {result.unmatchedAttemptCount > 0 ? (
        <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-amber-100">
          Recommendation evidence is incomplete: {result.unmatchedAttemptCount}{' '}
          {result.unmatchedAttemptCount === 1 ? 'attempt could' : 'attempts could'} not be
          matched to current published quiz metadata.
        </p>
      ) : null}
      {result.items.length === 0 ? (
        <p className="mt-4 text-slate-300">
          No matched quiz evidence is available for a topic recommendation yet.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {result.items.map((item) => {
            const challenge = challengeByTopic[item.topic];
            return (
              <article
                className="rounded-2xl border border-white/10 p-6"
                key={item.topic}
              >
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-indigo-300">
                  {labels[item.status]}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">{item.topic}</h3>
                {item.score === undefined ? (
                  <p className="mt-3 text-slate-300">
                    You have no matched graded attempt for this topic yet.
                  </p>
                ) : (
                  <p className="mt-3 text-slate-300">
                    Latest-retake evidence across versions: {formatScore(item.score)}%
                    across {item.evidenceCount} graded quiz{' '}
                    {item.evidenceCount === 1 ? 'version' : 'versions'}.
                  </p>
                )}
                {item.evidenceCount === 1 ? (
                  <p className="mt-2 text-sm text-amber-100">
                    Early signal — based on one graded quiz version.
                  </p>
                ) : null}
                <div className="mt-5 flex flex-wrap gap-4">
                  <Link className="font-semibold text-indigo-300" to={item.quizPath}>
                    Take {item.quizTitle}
                  </Link>
                  {challenge ? (
                    <Link className="font-semibold text-violet-300" to={challenge.path}>
                      Practice {challenge.title}
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
