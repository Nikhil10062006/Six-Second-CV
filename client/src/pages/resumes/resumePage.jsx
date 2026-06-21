import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllResumes } from "../../api/resumeAPI.jsx";
import Navbar from "../../components/navbar.jsx";
import Spinner from "../../components/spinner.jsx";
import ResumeThumbnail from "../../components/resumeThumbnail.jsx";
import ResumeUploader from "../upload/resumeUploader.jsx";

export default function ResumesPage() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploader, setShowUploader] = useState(false);

  const fetchResumes = () => {
    setLoading(true);
    getAllResumes()
      .then((res) => setResumes(res.data.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleNewUpload = () => {
    setShowUploader(false);
    fetchResumes();
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Navbar />
      <div className="flex-1 px-4 py-10">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-800">
                Your Resumes
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                All resumes you've uploaded.
              </p>
            </div>

            {!showUploader && (
              <button
                onClick={() => setShowUploader(true)}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
              >
                + Upload New
              </button>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {showUploader && (
            <div className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col gap-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-zinc-800">
                  Upload a New Resume
                </h3>
                <button
                  onClick={() => setShowUploader(false)}
                  className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
              <ResumeUploader onResumeUploaded={handleNewUpload} />
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner className="w-8 h-8" />
            </div>
          ) : resumes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {resumes.map((r) => (
                <div
                  key={r._id}
                  onClick={() => navigate(`/resume/${r._id}`)}
                  className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-3 cursor-pointer hover:border-sky-300 hover:shadow-md transition-all duration-200 group"
                >
                  <ResumeThumbnail resumeId={r._id} />
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-sm font-semibold text-zinc-800 truncate group-hover:text-sky-600 transition-colors">
                      {r.originalFileName}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 mt-0.5">
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !showUploader && (
              <div className="text-center py-16 border border-zinc-200 border-dashed rounded-xl bg-white">
                <p className="text-sm text-zinc-500">
                  No resumes uploaded yet.
                </p>
                <button
                  onClick={() => setShowUploader(true)}
                  className="mt-3 text-sm text-sky-600 font-medium hover:text-sky-500"
                >
                  Upload your first resume →
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
