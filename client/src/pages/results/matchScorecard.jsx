export default function MatchScoreCard({ matchScore }) {
  const pct = Math.round((matchScore || 0) * 100);

  const verdict =
    pct >= 75
      ? { label: "Strong match", color: "text-emerald-600" }
      : pct >= 50
        ? { label: "Moderate match", color: "text-amber-600" }
        : { label: "Needs work", color: "text-red-500" };

  const ringColor = pct >= 75 ? "#059669" : pct >= 50 ? "#d97706" : "#ef4444";

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col items-center gap-3">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#e4e4e7"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-zinc-800">{pct}%</span>
        </div>
      </div>
      <p className={`text-sm font-semibold ${verdict.color}`}>
        {verdict.label}
      </p>
      <p className="text-xs text-zinc-400 text-center">
        Based on cosine similarity between your resume and this job's
        requirements
      </p>
    </div>
  );
}
