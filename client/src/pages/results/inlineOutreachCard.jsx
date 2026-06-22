import { useState, useEffect } from "react";
import { useOutReach } from "../../hooks/useOutReach.jsx";
import { useAuth } from "../../hooks/useAuth.jsx";
import VariantsList from "../coldreach/variantList.jsx";
import Spinner from "../../components/spinner.jsx";

export default function InlineOutreachCard({
  resumeId,
  jobPostingId,
  companyName,
  gaps,
}) {
  const { user } = useAuth();
  const {
    loading,
    error,
    variants,
    draft,
    handleGenerateVariants,
    handleSaveDrafts,
    resetOutreachState,
    handleCheckExistingDraft,
  } = useOutReach();

  const [checkingExisting, setCheckingExisting] = useState(true);
  const [generated, setGenerated] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function checkExisting() {
      if (!resumeId || !companyName) {
        setCheckingExisting(false);
        return;
      }

      resetOutreachState();

      // FIX: jobPostingId is now passed through — previously this looked up
      // a draft scoped only to (resumeId, companyName), so the same resume
      // reaching out to the same company from a different job posting could
      // surface (and later overwrite) the wrong draft.
      const found = await handleCheckExistingDraft(
        resumeId,
        companyName,
        jobPostingId,
      );
      if (!cancelled && found) {
        setGenerated(true);
        setSaved(true);
      }
      if (!cancelled) setCheckingExisting(false);
    }
    checkExisting();
    return () => {
      cancelled = true;
    };
  }, [resumeId, companyName, jobPostingId]);

  const onGenerate = async () => {
    await handleGenerateVariants(resumeId, companyName, { jobPostingId });
    setGenerated(true);
  };

  useEffect(() => {
    if (generated && variants?.length > 0 && !saved) {
      setSaved(true);
      handleSaveDrafts(
        user?._id,
        resumeId,
        jobPostingId,
        companyName,
        null,
        variants,
        gaps,
      );
    }
  }, [generated, variants]);

  if (!companyName) return null;

  if (checkingExisting) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-6 flex items-center justify-center gap-2">
        <Spinner className="w-5 h-5" />
        <p className="text-xs text-zinc-400">Checking for existing outreach…</p>
      </div>
    );
  }

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm gap-4">
          <Spinner className="w-12 h-12" />
          <p className="text-sm font-medium text-zinc-600 font-mono">
            Generating message variants…
          </p>
          <p className="text-xs text-zinc-400 font-mono">
            This may take 2–3 minutes
          </p>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-800">
              Outreach for {companyName}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Uses this resume and the gaps identified above
            </p>
          </div>
          {saved && draft?._id && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
              Saved
            </span>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {!generated && !loading && (
          <button
            onClick={onGenerate}
            className="w-full max-w-sm py-3 rounded-lg text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700 transition-colors"
          >
            Generate Outreach Message →
          </button>
        )}

        {generated && !saved && variants?.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Spinner className="w-4 h-4" />
            Saving draft…
          </div>
        )}

        {saved && draft?._id && (
          <VariantsList variants={draft.variants} draftId={draft._id} />
        )}
      </div>
    </>
  );
}
