import { memo, useState, useEffect, useRef } from "react";
import VariantCard from "./variantCard.jsx";

function VariantsList({ variants, draftId, singleColumn = false }) {
  const [activeTab, setActiveTab] = useState("");
  // FIX: Use a ref to track if we have already initialized a tab.
  // This prevents the useEffect from resetting the tab after the initial load.
  const initialized = useRef(false);

  const groupedVariants = (variants || []).reduce((acc, variant) => {
    const role = variant.role || "General Outreach";
    if (!acc[role]) acc[role] = [];
    acc[role].push(variant);
    return acc;
  }, {});

  const roles = Object.keys(groupedVariants);

  useEffect(() => {
    if (roles.length > 0) {
      // If no tab is set, or the current tab is invalid, pick the first one.
      // We check initialized.current to ensure we don't jump on re-renders.
      if (!activeTab || !roles.includes(activeTab)) {
        setActiveTab(roles[0]);
        initialized.current = true;
      }
    }
  }, [roles.length]);

  if (!variants || variants.length === 0) return null;

  const currentVariants = groupedVariants[activeTab] || [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <h3 className="text-xl font-bold text-zinc-800">Generated Variants</h3>

        {roles.length > 1 && (
          <div className="flex flex-wrap gap-2 border-b border-zinc-200">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => setActiveTab(role)}
                className={`px-4 py-2.5 text-sm font-semibold transition-all -mb-px ${
                  activeTab === role
                    ? "text-sky-700 border-b-2 border-sky-600 bg-sky-50/50 rounded-t-lg"
                    : "text-zinc-500 border-b-2 border-transparent hover:text-zinc-800 hover:bg-zinc-50 rounded-t-lg"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className={`grid gap-6 ${singleColumn ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}
      >
        {currentVariants.map((variant) => (
          <VariantCard
            key={`${variant._id || variant.channel}-${variant.generatedAt || ""}`}
            variant={variant}
            draftId={draftId}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(VariantsList);
