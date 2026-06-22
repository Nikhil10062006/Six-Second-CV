import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOutReach } from "../../hooks/useOutReach.jsx";
import { useAuth } from "../../hooks/useAuth.jsx";
import Navbar from "../../components/navbar.jsx";
import VariantsList from "../coldreach/variantList.jsx";
import Spinner from "../../components/spinner.jsx";

export default function DraftDetail() {
  const { draftId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { draft, loading, error, handleGetDraft } = useOutReach();

  useEffect(() => {
    if (user?._id && draftId) {
      handleGetDraft(user._id, draftId);
    }
  }, [user, draftId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Spinner className="w-12 h-12" />
        </div>
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-zinc-500">{error || "Draft not found."}</p>
          <button
            onClick={() => navigate("/drafts")}
            className="text-sm text-sky-600 font-medium"
          >
            ← Back to Drafts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Navbar />
      <div className="flex-1 px-4 py-10">
        {/* Widened container for better focus on variants */}
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate("/drafts")}
              className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              ← Back to All Drafts
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            <h1 className="text-2xl font-bold text-zinc-800">
              {draft.companyName} Outreach
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Refining drafts generated on{" "}
              {new Date(draft.updatedAt).toLocaleDateString()}
            </p>
          </div>

          {/* Full-width VariantsList, no sidebar needed */}
          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            <VariantsList
              variants={draft.variants}
              draftId={draft._id}
              singleColumn={false} // Lets variants take up the full space
            />
          </div>
        </div>
      </div>
    </div>
  );
}
