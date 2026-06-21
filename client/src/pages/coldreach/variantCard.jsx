import { useState, memo } from "react";
import { useOutReach } from "../../hooks/useOutReach.jsx";

function VariantCard({ variant, draftId }) {
  // Reverted to regeneratingId
  const { handleUpdateVariants, handleRegenerateVariant, regeneratingId } =
    useOutReach();

  const [content, setContent] = useState(
    variant.editedContent ?? variant.content ?? "",
  );
  const [subject, setSubject] = useState(variant.subject || "");
  const [status, setStatus] = useState(variant.status || "draft");
  const [isSaving, setIsSaving] = useState(false);
  const [showRegenerateInput, setShowRegenerateInput] = useState(false);
  const [regenerateContext, setRegenerateContext] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  // Check if THIS card is spinning
  const isRegeneratingThis = regeneratingId === variant._id;
  // Check if ANY card is spinning (so we can lock all buttons globally)
  const isRegeneratingAny = Boolean(regeneratingId);

  const hasEdits = Boolean(
    variant.editedContent && variant.editedContent !== variant.content,
  );
  const hasHistory = variant.history && variant.history.length > 0;

  const onSave = async () => {
    setIsSaving(true);
    const editedContentToSave = content !== variant.content ? content : null;
    await handleUpdateVariants(
      draftId,
      variant._id,
      status,
      editedContentToSave,
    );
    setIsSaving(false);
  };

  const onRegenerate = async () => {
    await handleRegenerateVariant(
      draftId,
      variant._id,
      regenerateContext || null,
    );
    setShowRegenerateInput(false);
    setRegenerateContext("");
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col gap-4 shadow-sm relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600">
          {variant.channel} • {variant.role || "General Outreach"}
        </span>
        <div className="flex items-center gap-3">
          {hasEdits && (
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Edited
            </span>
          )}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={isRegeneratingAny} // Lock dropdown if busy
            className="text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-md px-2 py-1 text-zinc-600 focus:ring-0 cursor-pointer disabled:opacity-50"
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="responded">Responded</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Editor Area */}
      {variant.channel === "email" && (
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={isRegeneratingAny}
          placeholder="Subject Line"
          className="w-full text-sm font-semibold text-zinc-800 border-b border-zinc-100 pb-2 focus:outline-none focus:border-sky-500 disabled:opacity-50 disabled:bg-white"
        />
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        disabled={isRegeneratingAny} // Prevent edits while anything is saving/generating
        className="w-full text-sm text-zinc-700 leading-relaxed border border-zinc-200 rounded-lg p-3 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none disabled:opacity-50 disabled:bg-zinc-50"
      />

      {/* History Accordion */}
      {hasHistory && (
        <div className="border border-zinc-100 rounded-lg bg-zinc-50/50">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="w-full px-3 py-2 text-xs font-medium text-zinc-500 flex items-center justify-between hover:text-zinc-800 transition-colors"
          >
            <span>View Previous Versions ({variant.history.length})</span>
            <span>{showHistory ? "↑" : "↓"}</span>
          </button>

          {showHistory && (
            <div className="px-3 pb-3 flex flex-col gap-3 max-h-48 overflow-y-auto border-t border-zinc-100 pt-3">
              {variant.history
                .slice()
                .reverse()
                .map((entry, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-zinc-200 rounded-md p-3 shadow-sm"
                  >
                    <span className="text-[10px] font-bold text-zinc-400 block mb-1">
                      {new Date(entry.generatedAt).toLocaleString()}
                    </span>
                    {entry.context && (
                      <p className="text-[11px] font-medium text-sky-600 mb-1.5 bg-sky-50 px-2 py-1 rounded">
                        Prompt: "{entry.context}"
                      </p>
                    )}
                    <p className="text-xs text-zinc-600 whitespace-pre-wrap">
                      {entry.content}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Regenerate Context Input */}
      {showRegenerateInput && (
        <div className="flex flex-col gap-2 p-3 bg-sky-50 border border-sky-100 rounded-lg">
          <label className="text-xs font-semibold text-sky-700">
            Add context for this regeneration
          </label>
          <textarea
            value={regenerateContext}
            onChange={(e) => setRegenerateContext(e.target.value)}
            rows={2}
            disabled={isRegeneratingAny}
            placeholder="e.g. Make it sound more urgent..."
            className="w-full text-xs p-2 border border-sky-200 rounded resize-none focus:outline-none focus:border-sky-500 disabled:opacity-50"
          />
          <div className="flex gap-2">
            <button
              onClick={onRegenerate}
              disabled={isRegeneratingAny} // Disabled if ANY card is regenerating
              className="flex-1 py-2 rounded-lg text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 transition-colors"
            >
              {isRegeneratingThis ? "Regenerating..." : "Confirm"}
            </button>
            <button
              onClick={() => setShowRegenerateInput(false)}
              disabled={isRegeneratingAny}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={onSave}
          disabled={isSaving || isRegeneratingAny} // Disabled globally while generating
          className="flex-1 py-2 rounded-lg text-sm font-semibold bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? "Saving..." : "Save Edits"}
        </button>
        {!showRegenerateInput && (
          <button
            onClick={() => setShowRegenerateInput(true)}
            disabled={isRegeneratingAny} // Disable Regenerate button globally
            className="flex-1 py-2 rounded-lg text-sm font-semibold bg-white text-sky-600 border border-sky-200 hover:bg-sky-50 disabled:opacity-50 transition-colors"
          >
            Regenerate
          </button>
        )}
      </div>

      {/* Loading Overlay just for this card */}
      {isRegeneratingThis && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
          <div className="bg-white border border-sky-200 shadow-lg rounded-full px-5 py-2 text-sm font-bold text-sky-600 animate-pulse flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></span>
            Rewriting...
          </div>
        </div>
      )}
    </div>
  );
}

function areEqual(prevProps, nextProps) {
  if (prevProps.draftId !== nextProps.draftId) return false;
  if (prevProps.variant === nextProps.variant) return true;

  const a = prevProps.variant;
  const b = nextProps.variant;
  return (
    a._id === b._id &&
    a.role === b.role &&
    a.content === b.content &&
    a.subject === b.subject &&
    a.status === b.status &&
    a.editedContent === b.editedContent &&
    a.generatedAt === b.generatedAt &&
    (a.history?.length || 0) === (b.history?.length || 0)
  );
}

export default memo(VariantCard, areEqual);
