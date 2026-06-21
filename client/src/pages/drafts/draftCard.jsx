import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react"; // Added a nice icon

export default function DraftCard({ draft }) {
  const navigate = useNavigate();

  const statusColors = {
    draft: "bg-zinc-100 text-zinc-600",
    sent: "bg-blue-100 text-blue-700",
    responded: "bg-emerald-100 text-emerald-700",
    archived: "bg-red-100 text-red-700",
  };

  const badgeClass = statusColors[draft.status] || statusColors.draft;

  return (
    <div
      onClick={() => navigate(`/drafts/${draft._id}`)}
      className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col gap-3.5 cursor-pointer hover:border-sky-300 hover:shadow-sm transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <h3 className="text-base font-semibold text-zinc-800 truncate pr-2">
          {draft.companyName}
        </h3>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${badgeClass}`}
        >
          {draft.status}
        </span>
      </div>

      {/* NEW: Display the Resume Name */}
      <div className="flex items-center gap-1.5 text-xs text-zinc-600 bg-zinc-50 border border-zinc-100 px-2.5 py-1.5 rounded-md truncate">
        <FileText size={13} className="text-zinc-400 shrink-0" />
        <span className="truncate font-medium">
          {draft.resumeName || "Unknown Resume"}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span>{draft.variantCount} variants</span>
        <span>•</span>
        <span>{new Date(draft.updatedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
