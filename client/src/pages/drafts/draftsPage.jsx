import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOutReach } from "../../hooks/useOutReach.jsx";
import { useAuth } from "../../hooks/useAuth.jsx";
import Navbar from "../../components/navbar.jsx";
import DraftCard from "./DraftCard.jsx";
import Spinner from "../../components/spinner.jsx";

export default function DraftsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { drafts, error, handleGetAllDrafts } = useOutReach();
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    if (user?._id) {
      setLocalLoading(true);
      handleGetAllDrafts(user._id).finally(() => setLocalLoading(false));
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Navbar />
      <div className="flex-1 px-4 py-10">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-800">
                Outreach Drafts
              </h1>
              <p className="text-base text-zinc-500 mt-1">
                Manage your active and past conversations.
              </p>
            </div>
            <button
              onClick={() => navigate("/coldreach")}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
            >
              + New Analysis
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {localLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Spinner className="w-8 h-8" />
            </div>
          ) : drafts && drafts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {drafts.map((draft) => (
                <DraftCard key={draft._id} draft={draft} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-zinc-200 border-dashed rounded-xl bg-white">
              <p className="text-sm text-zinc-500">No outreach drafts found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
