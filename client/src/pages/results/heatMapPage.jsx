import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useResume } from "../../hooks/useResume.jsx";
import { useJob } from "../../hooks/useJobPosting.jsx";
import Navbar from "../../components/navbar.jsx";
import HeatmapOverlay from "./heatMapOverlay.jsx";
import Spinner from "../../components/spinner.jsx";
import { baseURL } from "../../api/axiosInstance.jsx";

export default function HeatmapPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { heatmapPages, arr: heatmapBlocks, handleGetCVHeatMap } = useResume();
  const { job, handleFetchJob } = useJob();
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Self-sufficient on direct navigation/refresh — doesn't assume
  // ResultsPage already populated context, since a user could land here
  // directly via a shared link or browser refresh.
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
    handleGetCVHeatMap(job.resumeId);
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
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/results/${jobId}`)}
              className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              ← Back to results
            </button>
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-zinc-800">
              6-Second Scan Heatmap
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Simulated recruiter attention based on position, density, and
              section placement — not a second parse, the same layout data from
              your ATS analysis.
            </p>
          </div>

          <HeatmapOverlay
            storagePath={pdfUrl}
            heatmapBlocks={heatmapBlocks}
            pages={heatmapPages}
          />
        </div>
      </div>
    </div>
  );
}
