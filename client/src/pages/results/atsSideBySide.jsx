import { useState, useRef, useEffect, useMemo } from "react";
import { Document, Page } from "react-pdf";

const KNOWN_SECTIONS = [
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
];

const SECTION_COLORS = {
  summary: "border-sky-300 bg-sky-50",
  experience: "border-violet-300 bg-violet-50",
  education: "border-amber-300 bg-amber-50",
  skills: "border-emerald-300 bg-emerald-50",
  projects: "border-rose-300 bg-rose-50",
  other: "border-zinc-300 bg-zinc-50",
};

export default function ATSSideBySide({ storagePath, sections = [] }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfColWidth, setPdfColWidth] = useState(0);
  const pdfColRef = useRef(null);

  const pdfFile = useMemo(
    () => ({
      url: storagePath,
      httpHeaders: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    }),
    [storagePath],
  );

  useEffect(() => {
    if (!pdfColRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const measured = Math.floor(entry.contentRect.width - 32); // Adjusted for padding
        if (measured > 0) setPdfColWidth(measured);
      }
    });
    observer.observe(pdfColRef.current);
    return () => observer.disconnect();
  }, []);

  const foundNames = sections.map((s) => s.name);
  const missingSections = KNOWN_SECTIONS.filter(
    (name) => !foundNames.includes(name),
  );

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-white z-10 relative">
        <h3 className="text-sm font-semibold text-zinc-800">
          Original vs. how an ATS reads it
        </h3>
        {numPages > 1 && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <button
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
              className="px-2 py-1 rounded border border-zinc-200 disabled:opacity-30"
            >
              ←
            </button>
            Page {pageNumber} of {numPages}
            <button
              onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
              disabled={pageNumber >= numPages}
              className="px-2 py-1 rounded border border-zinc-200 disabled:opacity-30"
            >
              →
            </button>
          </div>
        )}
      </div>

      {missingSections.length > 0 && (
        <div className="px-5 py-3 bg-red-50 border-b border-red-100">
          <p className="text-xs text-red-600">
            <span className="font-semibold">Dropped by the ATS parse: </span>
            {missingSections.join(", ")} — these section headers weren't
            detected at all.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-100 relative">
        {/* LEFT: PDF Column (This naturally sets the total height of the row) */}
        <div
          ref={pdfColRef}
          className="p-4 flex justify-center items-start bg-zinc-50 min-w-0"
        >
          {pdfColWidth > 0 && (
            <Document
              file={pdfFile}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              loading={
                <p className="text-xs text-zinc-400 py-12">Loading PDF…</p>
              }
            >
              <Page
                pageNumber={pageNumber}
                width={pdfColWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="shadow-sm"
              />
            </Document>
          )}
        </div>

        {/* RIGHT: ATS Text Column (Fills the exact height of the PDF column and scrolls internally) */}
        <div className="relative min-h-[400px] md:min-h-0 bg-white">
          <div className="md:absolute md:inset-0 p-4 overflow-y-auto flex flex-col gap-2">
            {sections.length === 0 ? (
              <p className="text-xs text-zinc-400">
                No sections detected in ATS order.
              </p>
            ) : (
              sections
                .filter((s) => s.page === pageNumber || !s.page)
                .sort((a, b) => a.atsOrder - b.atsOrder)
                .map((section) => (
                  <div
                    key={section.name + section.atsOrder}
                    className={`border rounded-lg p-3 ${
                      SECTION_COLORS[section.name] || SECTION_COLORS.other
                    }`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-1">
                      {section.name}
                    </p>
                    <p className="text-xs text-zinc-700 font-mono leading-relaxed whitespace-pre-wrap">
                      {section.atsText}
                    </p>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
