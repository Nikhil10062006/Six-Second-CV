import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useOutReach } from "../../hooks/useOutReach.jsx";
import Navbar from "../../components/navbar.jsx";
import ResumeSelector from "./resumeSelector.jsx";
import CompanyInputForm from "./companyInputForm.jsx";
import CompanySignalsCard from "./companySignalsCard.jsx";
import VariantsList from "./variantList.jsx";
import Spinner from "../../components/spinner.jsx";
import { useAuth } from "../../hooks/useAuth.jsx";

export default function ColdReachPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    loading,
    error,
    companySignals,
    variants,
    draft,
    handleScrapeDetails,
    handleGenerateVariants,
    handleSaveDrafts,
    resetOutreachState,
  } = useOutReach();
  const [scrapeEmpty, setScrapeEmpty] = useState(false);
  const [resumeId, setResumeId] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  // FIX: Create a Ref to lock the ID. Once a draft is created,
  // this ref will hold onto that specific ID and never change,
  // preventing the "jump" even if the global context draft object updates.
  const sessionDraftId = useRef(null);

  useEffect(() => {
    resetOutreachState();
  }, []);

  // Sync ref with draft id
  useEffect(() => {
    if (draft?._id) {
      sessionDraftId.current = draft._id;
    }
  }, [draft?._id]);

  useEffect(() => {
    if (draft?.companySignals?.targetRole && !selectedRole) {
      setSelectedRole(draft.companySignals.targetRole);
    }
  }, [draft, selectedRole]);
  useEffect(() => {
    if (
      companySignals &&
      (!companySignals.hiringSignals ||
        companySignals.hiringSignals.length === 0)
    ) {
      setScrapeEmpty(true);
      resetOutreachState();
    }
  }, [companySignals]);

  const onScrapeSubmit = async (formData) => {
    setScrapeEmpty(false); // RESET on each attempt
    setCompanyName(formData.companyName);
    await handleScrapeDetails(
      formData.companyName,
      formData.careersUrl,
      resumeId,
      null,
    );
  };

  const onGenerateSubmit = async () => {
    const newVariants = await handleGenerateVariants(resumeId, companyName, {
      companySignals,
      targetRole: selectedRole || undefined,
    });

    if (newVariants && newVariants.length > 0) {
      setSaving(true);
      setSaveError(null);
      try {
        const currentVariants = draft?.variants
          ? [...draft.variants, ...newVariants]
          : newVariants;
        await handleSaveDrafts(
          user?._id,
          resumeId,
          null,
          companyName,
          { ...companySignals, targetRole: selectedRole },
          currentVariants,
          [],
        );
      } catch (err) {
        setSaveError(
          err?.response?.data?.message || err?.message || "Save failed",
        );
      } finally {
        setSaving(false);
      }
    }
  };

  const onSelectRole = useCallback((role) => {
    setSelectedRole((prev) => (prev?.roleKey === role.roleKey ? null : role));
  }, []);

  const onViewDraft = () => {
    // FIX: Use the ref here. This ID is guaranteed not to change
    // even if the context state flickers.
    const targetId = sessionDraftId.current;
    if (targetId && !saving) {
      navigate(`/drafts/${targetId}`);
    }
  };

  const currentRoleTitle = selectedRole?.title || "General Outreach";
  const hasVariantsForSelectedRole = variants?.some(
    (v) => (v.role || "General Outreach") === currentRoleTitle,
  );
  const showGenerateButton =
    !variants || variants.length === 0
      ? companySignals?.hiringSignals?.length > 0
      : selectedRole && !hasVariantsForSelectedRole;

  const onStartOver = () => {
    resetOutreachState();
    sessionDraftId.current = null;
    setResumeId(null);
    setCompanyName("");
    setSelectedRole(null);
    setScrapeEmpty(false);
    setSaveError(null);
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm gap-4">
          <Spinner className="w-12 h-12" />
          <p className="text-sm font-medium text-zinc-600 font-mono">
            {!companySignals
              ? "Scraping company signals…"
              : "Generating message variants…"}
          </p>
          <p className="text-xs text-zinc-400 font-mono">
            This may take 2–3 minutes
          </p>
        </div>
      )}

      <div className="min-h-screen bg-zinc-50 flex flex-col">
        <Navbar />
        <div className="flex-1 px-4 py-10">
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-zinc-800">
                New Outreach
              </h1>
              {resumeId && (
                <button
                  onClick={onStartOver}
                  className="text-xs font-semibold text-zinc-500 hover:text-red-600 border border-zinc-200 hover:border-red-200 rounded-lg px-3 py-1.5 transition-colors"
                >
                  ↺ Start Over
                </button>
              )}
            </div>

            {(error || saveError) && (
              <div className="p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
                {error || saveError}
              </div>
            )}

            {!resumeId && <ResumeSelector onSelect={setResumeId} />}

            {resumeId && !companySignals && !loading && (
              <CompanyInputForm
                onSubmit={onScrapeSubmit}
                fallbackMessage={
                  scrapeEmpty
                    ? `No openings found for "${companyName}". Paste the careers page URL directly and try again.`
                    : null
                }
              />
            )}
            {companySignals && !loading && (
              <div className="flex flex-col gap-6">
                <CompanySignalsCard
                  companySignals={companySignals}
                  selectedRoleKey={selectedRole?.roleKey}
                  onSelectRole={onSelectRole}
                />

                {showGenerateButton && (
                  <button
                    onClick={onGenerateSubmit}
                    disabled={saving}
                    className="w-full py-3 rounded-xl text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700 transition-colors"
                  >
                    Generate Message Variants →
                  </button>
                )}

                {(variants?.length > 0 || draft?.variants?.length > 0) && (
                  <>
                    <VariantsList
                      key={`variants-${draft?._id || "new"}-${variants.length}`}
                      variants={
                        draft?.variants?.length ? draft.variants : variants
                      }
                      draftId={draft?._id}
                      selectedRole={selectedRole}
                    />

                    <button
                      onClick={onViewDraft}
                      disabled={!sessionDraftId.current || saving}
                      className="w-full py-3 rounded-xl text-sm font-semibold bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                    >
                      {saving
                        ? "Saving..."
                        : sessionDraftId.current
                          ? `View ${draft?.companyName || "Current"} Draft →`
                          : "Processing..."}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
