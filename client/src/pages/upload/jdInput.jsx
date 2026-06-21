import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJob } from "../../hooks/useJobPosting";
import Input from "../../components/input.jsx";
import { useResume } from "../../hooks/useResume.jsx";
import Spinner from "../../components/spinner.jsx";

export default function JDInput({ resumeId: resumeIdProp }) {
  // FIX: Added 'error' from useJob to catch API failures (like bad URLs)
  const { loading, error: apiError, handlePostJob } = useJob();
  const { resume } = useResume();
  const navigate = useNavigate();

  const resumeId = resumeIdProp || resume?._id;

  const [mode, setMode] = useState("paste");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleSubmit = async () => {
    setValidationError("");

    if (!resumeId) {
      setValidationError("Select or upload a resume first.");
      return;
    }
    if (mode === "paste" && !text.trim()) {
      setValidationError("Paste the job description before continuing.");
      return;
    }
    if (mode === "url" && !url.trim()) {
      setValidationError("Enter a job posting URL.");
      return;
    }

    const payload =
      mode === "paste"
        ? { resumeId, sourceType: "text", rawText: text }
        : { resumeId, sourceType: "url", sourceUrl: url };

    const postedJob = await handlePostJob(payload);

    if (postedJob) {
      navigate(`/results/${postedJob._id}`);
    }
  };
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm gap-4">
        <Spinner className="w-12 h-12" />
        <p className="text-sm font-medium text-zinc-600 font-mono">
          Analyzing your resume…
        </p>
        <p className="text-xs text-zinc-400 font-mono">
          This may take 2–3 minutes
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {["paste", "url"].map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setValidationError("");
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-colors duration-200 ${
              mode === m
                ? "bg-sky-600 text-white border-sky-600"
                : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
            }`}
          >
            {m === "paste" ? "Paste text" : "Enter URL"}
          </button>
        ))}
      </div>

      {mode === "paste" ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the full job description here…"
          rows={6}
          className="w-full px-4 py-3 text-sm bg-zinc-50 text-zinc-800 rounded-lg border border-zinc-200 outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-zinc-400 resize-none transition-all duration-200"
        />
      ) : (
        <Input
          label="Job posting URL"
          type="url"
          placeholder="https://company.com/jobs/frontend-engineer"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      )}

      {/* Global Error Display - Renders only once, handles both local and API errors */}
      {(validationError || apiError) && (
        <p className="text-xs font-medium text-red-500">
          {validationError || apiError}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 rounded-lg text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Spinner className="w-4 h-4" />
            Analyzing...
          </>
        ) : (
          "Run Analysis"
        )}
      </button>
    </div>
  );
}
