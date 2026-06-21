import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Document, Page } from "react-pdf";
import { getResume, deleteResume, getHeatMap } from "../../api/resumeAPI.jsx";
import {
  allJobsWithSameResume,
  getJobPosting,
} from "../../api/jobPostingAPI.jsx";
import { baseURL } from "../../api/axiosInstance.jsx";
import Navbar from "../../components/navbar.jsx";
import Spinner from "../../components/spinner.jsx";


import ATSSideBySide from "../results/atsSideBySide.jsx";
import HeatmapOverlay from "../results/heatMapOverlay.jsx";

import GapList from "../results/gapList.jsx";
import InlineOutreachCard from "../results/inlineOutreachCard.jsx";

// --- INLINE COMPONENT ---
function InlineJobAnalysis({ resumeId, jobId, onBack }) {
  const [jobDetails, setJobDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJobPosting(jobId)
      .then((res) => setJobDetails(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [jobId]);

  if (loading) {
    return (
      <div className="py-12 flex justify-center text-zinc-400 text-sm">
        Loading analysis...
      </div>
    );
  }

  if (!jobDetails) return null;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center gap-3 border-b border-zinc-200 pb-4">
        <button
          onClick={onBack}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          ← Back to all jobs
        </button>
        <div className="h-4 w-px bg-zinc-300" />
        <h2 className="text-sm font-semibold text-zinc-800">
          {jobDetails.jobTitle} @ {jobDetails.companyName}
        </h2>
      </div>

      {/* Your Exact GapList Component */}
      <GapList gaps={jobDetails.gaps} jobId={jobId} />

      {/* Your Exact InlineOutreachCard Component */}
      <InlineOutreachCard
        resumeId={resumeId}
        jobPostingId={jobId}
        companyName={jobDetails.companyName}
        gaps={jobDetails.gaps}
      />
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function ResumeDetailPage() {
  const { resumeId } = useParams();
  const navigate = useNavigate();

  const [resume, setResume] = useState(null);
  const [heatmapData, setHeatmapData] = useState({ blocks: [], pages: [] });
  const [jobs, setJobs] = useState([]);

  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [activeTab, setActiveTab] = useState("pdf");
  const [selectedJobId, setSelectedJobId] = useState(null);

  useEffect(() => {
    setLoading(true);
    getResume(resumeId)
      .then((res) => {
        setResume(res.data.data);
        Promise.all([
          getHeatMap(resumeId).catch(() => ({
            data: { data: { blocks: [], pages: [] } },
          })),
          allJobsWithSameResume(resumeId).catch(() => ({ data: { data: [] } })),
        ]).then(([heatmapRes, jobsRes]) => {
          setHeatmapData(heatmapRes.data?.data || { blocks: [], pages: [] });
          setJobs(jobsRes.data?.data || []);
        });
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [resumeId]);

  const onDelete = async () => {
    setDeleting(true);
    try {
      await deleteResume(resumeId);
      navigate("/resume");
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setDeleting(false);
    }
  };

  const pdfUrl = `${baseURL}/resume/pdf-proxy/${resumeId}`;
  const pdfFile = useMemo(
    () => ({
      url: pdfUrl,
      httpHeaders: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    }),
    [pdfUrl],
  );
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
       <Spinner className="w-12 h-12" />
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-zinc-500">{error || "Resume not found."}</p>
        <button
          onClick={() => navigate("/resume")}
          className="text-sm text-sky-600 font-medium"
        >
          ← Back to Resumes
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Navbar />
      <div className="flex-1 px-4 py-10">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate("/resume")}
                className="text-sm text-zinc-500 hover:text-zinc-800 mb-2 block transition-colors"
              >
                ← Back
              </button>
              <h1 className="text-xl font-semibold text-zinc-800">
                {resume.originalFileName}
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                Uploaded {new Date(resume.createdAt).toLocaleDateString()}
              </p>
            </div>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
              >
                Delete Resume
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Are you sure?</span>
                <button
                  onClick={onDelete}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleting ? "Deleting..." : "Confirm"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-2 rounded-lg text-sm text-zinc-500 hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-6 border-b border-zinc-200">
            {[
              { id: "pdf", label: "Original PDF" },
              { id: "ats", label: "ATS View" },
              { id: "heatmap", label: "6-Second Heatmap" },
              { id: "jobs", label: `Matched Jobs (${jobs.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== "jobs") setSelectedJobId(null);
                }}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-zinc-800 text-zinc-800"
                    : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          <div className="mt-2">
            {activeTab === "pdf" && (
              <div className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col items-center gap-4">
                <Document
                  file={pdfFile}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  loading={
                    <p className="text-xs text-zinc-400 py-12">Loading PDF…</p>
                  }
                >
                  {Array.from({ length: numPages || 0 }, (_, i) => (
                    <Page
                      key={i}
                      pageNumber={i + 1}
                      width={680}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  ))}
                </Document>
              </div>
            )}

            {activeTab === "ats" && (
              <ATSSideBySide storagePath={pdfUrl} sections={resume.sections} />
            )}

            {activeTab === "heatmap" && (
              <HeatmapOverlay
                storagePath={pdfUrl}
                heatmapBlocks={heatmapData.blocks}
                pages={heatmapData.pages}
              />
            )}

            {activeTab === "jobs" && (
              <div className="flex flex-col gap-4">
                {!selectedJobId ? (
                  jobs.length === 0 ? (
                    <div className="text-center py-16 border border-zinc-200 border-dashed rounded-xl bg-white">
                      <p className="text-sm text-zinc-500">
                        No jobs matched with this resume yet.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {jobs.map((job) => (
                        <div
                          key={job._id}
                          onClick={() => setSelectedJobId(job._id)}
                          className="bg-white border border-zinc-200 rounded-xl p-5 cursor-pointer hover:border-sky-300 hover:shadow-md transition-all group"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-sm font-semibold text-zinc-800 group-hover:text-sky-600 transition-colors line-clamp-1">
                              {job.jobTitle}
                            </h3>
                            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 bg-zinc-100 text-zinc-500 rounded">
                              {job.status}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 mb-4 truncate">
                            {job.companyName}
                          </p>

                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  job.matchScore >= 0.7
                                    ? "bg-emerald-500"
                                    : job.matchScore >= 0.4
                                      ? "bg-amber-400"
                                      : "bg-red-400"
                                }`}
                                style={{
                                  width: `${Math.min(100, Math.max(0, job.matchScore * 100))}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-zinc-700">
                              {Math.round(job.matchScore * 100)}% Match
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <InlineJobAnalysis
                    resumeId={resumeId}
                    jobId={selectedJobId}
                    onBack={() => setSelectedJobId(null)}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
