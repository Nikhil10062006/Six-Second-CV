import { useEffect, useState } from "react";
import ResumeUploader from "./resumeUploader.jsx";
import JDInput from "./jdInput.jsx";
import Navbar from "../../components/navbar.jsx";
import { getAllResumes } from "../../api/resumeAPI.jsx";
import ResumeThumbnail from "../../components/resumeThumbnail.jsx";
import Spinner from "../../components/spinner.jsx";

function ResumePickerCard({ resume, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-xl p-4 flex flex-col gap-3 cursor-pointer transition-all duration-200 group ${
        selected
          ? "border-sky-500 ring-2 ring-sky-200 shadow-md"
          : "border-zinc-200 hover:border-sky-300 hover:shadow-md"
      }`}
    >
      <div className="relative">
        <ResumeThumbnail resumeId={resume._id} />
        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold shadow">
            ✓
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <h3
          className={`text-sm font-semibold truncate transition-colors ${
            selected ? "text-sky-700" : "text-zinc-800 group-hover:text-sky-600"
          }`}
        >
          {resume.originalFileName}
        </h3>
        <p className="text-xs text-zinc-400">
          {new Date(resume.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

export default function UploadPage() {
  const [resumes, setResumes] = useState([]);
  const [resumesLoading, setResumesLoading] = useState(true);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);

  useEffect(() => {
    getAllResumes()
      .then((res) => {
        const list = res.data.data || [];
        setResumes(list);
        if (list.length === 0) setShowUploader(true);
      })
      .finally(() => setResumesLoading(false));
  }, []);

  const onPickExisting = (resumeId) => {
    setSelectedResumeId(resumeId);
    setResumeUploaded(true);
  };

  const onNewResumeUploaded = async () => {
    setResumesLoading(true);
    try {
      const res = await getAllResumes();
      const list = res.data.data || [];
      setResumes(list);
      const newest = [...list].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      )[0];
      if (newest) {
        setSelectedResumeId(newest._id);
        setResumeUploaded(true);
        setShowUploader(false);
      }
    } finally {
      setResumesLoading(false);
    }
  };

  const resumeStepDone = resumeUploaded && selectedResumeId;
  const selectedResume = resumes.find((r) => r._id === selectedResumeId);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-3xl flex flex-col gap-3">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-zinc-800">
              Analyze your resume
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Pick a resume and a job description to get your ATS score,
              heatmap, and gap analysis.
            </p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                  resumeStepDone
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {resumeStepDone ? "✓" : 1}
              </span>
              <span className="text-sm font-semibold text-zinc-700">
                Resume
              </span>
              {resumeStepDone && (
                <span className="ml-auto text-xs text-emerald-600 font-medium truncate max-w-[200px]">
                  {selectedResume?.originalFileName || "Resume selected"}
                </span>
              )}
              {resumeStepDone && (
                <button
                  onClick={() => {
                    setResumeUploaded(false);
                    setSelectedResumeId(null);
                  }}
                  className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  Change
                </button>
              )}
            </div>

            {!resumeStepDone && (
              <div className="px-5 py-5 flex flex-col gap-4">
                {resumesLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner className="w-8 h-8" />
                  </div>
                ) : (
                  <>
                    {resumes.length > 0 && !showUploader && (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[420px] overflow-y-auto pr-1">
                          {resumes.map((r) => (
                            <ResumePickerCard
                              key={r._id}
                              resume={r}
                              selected={selectedResumeId === r._id}
                              onClick={() => onPickExisting(r._id)}
                            />
                          ))}
                        </div>
                        <button
                          onClick={() => setShowUploader(true)}
                          className="self-start text-sm text-sky-600 font-medium hover:text-sky-500 transition-colors"
                        >
                          + Upload a different resume
                        </button>
                      </>
                    )}

                    {showUploader && (
                      <div className="flex flex-col gap-3">
                        <ResumeUploader
                          onResumeUploaded={onNewResumeUploaded}
                        />
                        {resumes.length > 0 && (
                          <button
                            onClick={() => setShowUploader(false)}
                            className="self-start text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                          >
                            ← Choose from existing resumes instead
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 bg-zinc-100 text-zinc-500">
                2
              </span>
              <span className="text-sm font-semibold text-zinc-700">
                Job description
              </span>
            </div>

            <div className="px-5 py-5">
              <JDInput resumeId={selectedResumeId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
