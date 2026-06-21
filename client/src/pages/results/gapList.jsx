import { useState } from "react";

const SEVERITY_STYLES = {
  high: "bg-red-50 text-red-600 border-red-200",
  medium: "bg-amber-50 text-amber-600 border-amber-200",
  low: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

const TYPE_LABELS = {
  missingSkill: "Missing",
  weakPhrasing: "Weak phrasing",
  rewriteSuggestion: "Suggested rewrite",
};

const INITIAL_SHOW = 4;

function sortBySeverity(gaps) {
  const order = { high: 0, medium: 1, low: 2 };
  return [...gaps].sort((a, b) => order[a.severity] - order[b.severity]);
}

function GapItem({ gap }) {
  return (
    <div className="border border-zinc-200 rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-zinc-800">{gap.skill}</span>
        <span
          className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${SEVERITY_STYLES[gap.severity]}`}
        >
          {gap.severity}
        </span>
        <span className="text-[10px] text-zinc-400 uppercase tracking-wide">
          {TYPE_LABELS[gap.type] || gap.type}
        </span>
      </div>
      <p className="text-xs text-zinc-500">{gap.detail}</p>
      {gap.suggestion && (
        <p className="text-xs text-sky-700 bg-sky-50 rounded-lg px-3 py-2">
          {gap.suggestion}
        </p>
      )}
    </div>
  );
}

// Each severity bucket gets its own independent show-more state, so a long
// nice-to-have list doesn't force scrolling past must-haves, and vice versa.
function GapSection({ title, gaps, emptyMessage }) {
  const [showAll, setShowAll] = useState(false);
  const sorted = sortBySeverity(gaps);
  const visible = showAll ? sorted : sorted.slice(0, INITIAL_SHOW);

  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-800 mb-3">
        {title} ({gaps.length})
      </h3>
      {gaps.length === 0 ? (
        <p className="text-xs text-zinc-400">{emptyMessage}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((gap) => (
            <GapItem key={`${title}-${gap.skill}`} gap={gap} />
          ))}
          {sorted.length > INITIAL_SHOW && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="w-full py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors mt-1"
            >
              {showAll
                ? "Show less"
                : `Show ${sorted.length - INITIAL_SHOW} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function GapList({ gaps = [], jobId }) {
  const mustHaveGaps = gaps.filter((g) => g.toImprove === "mustHave");
  const niceToHaveGaps = gaps.filter((g) => g.toImprove === "niceToHave");

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col gap-6">
      <GapSection
        title="Must-haves missing"
        gaps={mustHaveGaps}
        emptyMessage="No must-have gaps found — solid coverage here."
      />
      <GapSection
        title="Nice-to-haves missing"
        gaps={niceToHaveGaps}
        emptyMessage="No gaps here."
      />
    </div>
  );
}
