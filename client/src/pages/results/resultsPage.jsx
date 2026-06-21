import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useResume } from "../../hooks/useResume.jsx";
import { useJob } from "../../hooks/useJobPosting.jsx";
import Navbar from "../../components/navbar.jsx";
import ATSSideBySide from "./atsSideBySide.jsx";
import MatchScoreCard from "./matchScoreCard.jsx";
import Spinner from "../../components/spinner.jsx";
import { baseURL } from "../../api/axiosInstance.jsx";
import InlineOutreachCard from "./inlineOutreachCard.jsx";
import GapList from "./gapList.jsx";
export default function ResultsPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { resume, handleGetATSVisuals, handleGetCVHeatMap } = useResume();
  const { job, handleFetchJob } = useJob();
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!jobId) {
      navigate("/upload", { replace: true });
      return;
    }

    let cancelled = false;

    async function loadAll() {
      setPageLoading(true);
      setLoadError(null);
      try {
        await handleFetchJob(jobId);
      } catch {
        if (!cancelled) setLoadError("Couldn't load this analysis.");
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  useEffect(() => {
    if (!job?.resumeId) return;
    // Heatmap data is still fetched here (not on its own page) because the
    // backend's rule engine reuses the same coordinate/layout data ATS
    // parsing already extracted — no second parse step. We just don't
    // RENDER the heatmap overlay on this page anymore; that view moved to
    // /results/:jobId/heatmap. Fetching it here means it's ready instantly
    // when the user clicks through, no extra loading state on that page.
    Promise.all([
      handleGetATSVisuals(job.resumeId),
      handleGetCVHeatMap(job.resumeId),
    ]);
  }, [job?.resumeId]);

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Spinner className="w-12 h-12" />
      </div>
    );
  }

  if (loadError || !job) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-zinc-500">
          {loadError || "No analysis found."}
        </p>
        <button
          onClick={() => navigate("/upload")}
          className="text-sm text-sky-600 font-medium"
        >
          Start a new analysis →
        </button>
      </div>
    );
  }

  const pdfUrl = job?.resumeId
    ? `${baseURL}/resume/pdf-proxy/${job.resumeId}`
    : null;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Navbar />
      <div className="flex-1 px-4 py-10">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-800">
              {job.jobTitle || "Analysis"}
              {job.companyName && (
                <span className="text-zinc-400 font-normal">
                  {" "}
                  · {job.companyName}
                </span>
              )}
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Here's how your resume actually gets read — by machines and by
              people.
            </p>
          </div>

          {/* Top row: score + heatmap entry side by side, since both are
              compact "at a glance" cards rather than dense content. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <MatchScoreCard matchScore={job.matchScore} />
            <HeatmapEntryCard
              onOpen={() => navigate(`/results/${jobId}/heatmap`)}
            />
          </div>

          {/* ATS view — full width now that the heatmap (the other big PDF
              render) lives on its own page. This was the main source of
              crowding: two full PDF renders stacked in a 2/3-width column. */}
          <ATSSideBySide storagePath={pdfUrl} sections={resume?.sections} />

          {/* Gaps — full width, own row. */}
          <GapList gaps={job.gaps} jobId={jobId} />

          {/* Outreach — full width, own row below. Its generated variants
              are dense (subject, textarea, history, regenerate per card),
              so it gets the whole row rather than squeezing into a sidebar
              or splitting space with GapList. */}
          <InlineOutreachCard
            resumeId={job.resumeId}
            jobPostingId={jobId}
            companyName={job.companyName}
            gaps={job.gaps}
          />
        </div>
      </div>
    </div>
  );
}

function HeatmapEntryCard({ onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-center hover:border-sky-300 hover:shadow-md transition-all duration-200 group"
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 via-amber-400 to-sky-400 opacity-80 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-lg">
        👁
      </div>
      <div>
        <h3 className="text-sm font-semibold text-zinc-800 group-hover:text-sky-600 transition-colors">
          View 6-Second Scan Heatmap
        </h3>
        <p className="text-xs text-zinc-500 mt-1">
          See where a recruiter's eyes actually land on your resume
        </p>
      </div>
      <span className="text-xs font-semibold text-sky-600">Open heatmap →</span>
    </button>
  );
}
