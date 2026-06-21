import { useState } from "react";

const INITIAL_SHOW = 5;

export default function CompanySignalsCard({
  companySignals,
  selectedRoleKey,
  onSelectRole,
  compactMode = false,
}) {
  const signals = companySignals?.data ? companySignals.data : companySignals;
  const [showAll, setShowAll] = useState(false);

  if (!signals) return null;

  const allRoles = (signals.hiringSignals || []).map((role) => ({
    ...role,
    roleKey: `${role.title || ""}__${role.team || ""}`,
  }));

  const visibleRoles = showAll ? allRoles : allRoles.slice(0, INITIAL_SHOW);
  const selectable = typeof onSelectRole === "function";

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-zinc-800">
          {compactMode ? "Outreach Context" : "Company Intelligence"}
        </h3>
        {signals.scrapingMeta?.usedHNFallback && (
          <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded">
            HN Fallback
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col gap-6">
        {/* Recent Activity */}
        <div>
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Recent Activity Hook
          </h4>
          {signals.recentActivity && signals.recentActivity.length > 0 ? (
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {signals.recentActivity.map((post, idx) => (
                <a
                  key={idx}
                  href={post.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm text-zinc-700 bg-amber-50 border border-amber-100 p-3 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <span className="font-semibold block mb-1 text-xs">
                    {post.headline}
                  </span>
                  <span className="text-[10px] text-amber-600 font-medium">
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 p-3 rounded-lg">
              No recent press or blog activity found in the last 30 days.
            </p>
          )}
        </div>

        {/* Active Roles */}
        {!compactMode && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Active Roles
              </h4>
              {allRoles.length > 0 && (
                <span className="text-[10px] text-zinc-400 font-medium">
                  {allRoles.length} open roles
                </span>
              )}
            </div>

            {selectable && (
              <p className="text-[10px] text-zinc-400 mb-3">
                <span className="font-semibold text-sky-600">Click a role</span>{" "}
                to target it for outreach
              </p>
            )}

            {allRoles.length > 0 ? (
              <div className="flex flex-col gap-2">
                {visibleRoles.map((role) => {
                  const isSelected =
                    selectable && selectedRoleKey === role.roleKey;
                  return (
                    <div
                      key={role.roleKey}
                      onClick={
                        selectable ? () => onSelectRole(role) : undefined
                      }
                      className={`border rounded-lg p-3 flex flex-col gap-2 transition-all duration-200 ${
                        selectable ? "cursor-pointer" : ""
                      } ${
                        isSelected
                          ? "bg-sky-50 border-sky-400 ring-1 ring-sky-300 shadow-sm"
                          : "bg-white border-zinc-200 hover:border-sky-200 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {role.url ? (
                            <a
                              href={role.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm font-semibold text-zinc-800 hover:text-sky-600 transition-colors"
                            >
                              {role.title} ↗
                            </a>
                          ) : (
                            <span className="text-sm font-semibold text-zinc-800">
                              {role.title}
                            </span>
                          )}
                          {role.team && (
                            <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mt-0.5">
                              {role.team}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-bold bg-sky-600 text-white px-2 py-0.5 rounded-full shadow-sm shrink-0">
                            Selected
                          </span>
                        )}
                      </div>

                      {(role.stack || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-100">
                          {role.stack.map((skill, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] text-zinc-500 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {allRoles.length > INITIAL_SHOW && (
                  <button
                    onClick={() => setShowAll((v) => !v)}
                    className="w-full py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors mt-1"
                  >
                    {showAll
                      ? "Show less"
                      : `Show ${allRoles.length - INITIAL_SHOW} more roles`}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 bg-zinc-50 border border-zinc-200 p-3 rounded-lg">
                No open roles found on the careers page.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
