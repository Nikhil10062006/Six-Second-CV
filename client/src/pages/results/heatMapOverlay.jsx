import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Document, Page } from "react-pdf";

function scoreToColor(score) {
  const clamped = Math.max(0, Math.min(1, score));
  if (clamped >= 0.66) return `rgba(239, 68, 68, 0.45)`;
  if (clamped >= 0.33) return `rgba(245, 158, 11, 0.4)`;
  if (clamped > 0) return `rgba(59, 130, 246, 0.3)`;
  return null; // score = 0 (unseen items) → don't paint
}

export default function HeatmapOverlay({
  storagePath,
  heatmapBlocks = [],
  pages = [],
}) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfWidth, setPdfWidth] = useState(0);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const dimsRef = useRef(null);
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
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const measured = Math.floor(entry.contentRect.width);
        if (measured > 0) setPdfWidth(Math.min(measured, 640));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const drawHeatmap = useCallback(
    (renderedWidth, renderedHeight) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = renderedWidth;
      canvas.height = renderedHeight;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, renderedWidth, renderedHeight);

      const pageMeta = pages.find((p) => p.pageNumber === pageNumber);
      if (!pageMeta) return;

      const scaleX = renderedWidth / pageMeta.width;
      const scaleY = renderedHeight / pageMeta.height;

      // Blend overlapping colors to create realistic "hotspots"
      ctx.globalCompositeOperation = "multiply";

      heatmapBlocks
        .filter((block) => block.page === pageNumber)
        .forEach((block) => {
          const color = scoreToColor(block.score);
          if (!color) return;

          ctx.fillStyle = color;

          // Add a soft glow so it looks like a real heatmap, not a highlighter
          ctx.shadowColor = color;
          ctx.shadowBlur = 12;

          // FIX: Subtract height from Y to start at the TOP of the text.
          // FIX: Multiply width by 0.9 to trim the trailing space PDF.js adds.
          ctx.fillRect(
            block.x * scaleX,
            (block.y - block.height) * scaleY,
            block.width * scaleX * 0.95, // Trim trailing space
            block.height * scaleY * 1.2, // Slightly taller for visual comfort
          );
        });
    },
    [heatmapBlocks, pages, pageNumber],
  );
  useEffect(() => {
    if (!dimsRef.current) return;
    drawHeatmap(dimsRef.current.width, dimsRef.current.height);
  }, [drawHeatmap]);

  const onPageRenderSuccess = useCallback(
    (page) => {
      const viewport = page.getViewport({ scale: 1 });
      const w = pdfWidth;
      const h = (pdfWidth / viewport.width) * viewport.height;
      // Store in ref (no re-render) and draw immediately.
      dimsRef.current = { width: w, height: h };
      drawHeatmap(w, h);
    },
    [pdfWidth, drawHeatmap],
  );

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-800">
          Where a recruiter's eyes land in 6 seconds
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

      <div ref={containerRef} className="p-5 flex justify-center bg-zinc-50">
        {pdfWidth > 0 && (
          <div className="relative" style={{ width: pdfWidth }}>
            <Document
              file={pdfFile}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              loading={
                <p className="text-xs text-zinc-400 py-12">Loading PDF…</p>
              }
            >
              <Page
                pageNumber={pageNumber}
                width={pdfWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                onRenderSuccess={onPageRenderSuccess}
              />
            </Document>
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 pointer-events-none"
            />
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-zinc-100 flex items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/60" /> High attention
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500/60" /> Medium
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500/60" /> Low
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-zinc-200" /> Not scanned
        </span>
      </div>
    </div>
  );
}
