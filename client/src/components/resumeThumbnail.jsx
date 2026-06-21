import { useState } from "react";
import { Document, Page } from "react-pdf";
import { baseURL } from "../api/axiosInstance.jsx";

export default function ResumeThumbnail({ resumeId, width = 220 }) {
  const [loaded, setLoaded] = useState(false);
  const pdfUrl = `${baseURL}/resume/pdf-proxy/${resumeId}`;

  return (
    <div className="w-full aspect-[3/4] bg-zinc-100 rounded-lg overflow-hidden flex items-center justify-center relative">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100">
          <div className="w-8 h-10 bg-zinc-300 rounded animate-pulse" />
        </div>
      )}
      <Document
        file={{
          url: pdfUrl,
          httpHeaders: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }}
        onLoadSuccess={() => setLoaded(true)}
        loading={null}
        error={
          <div className="flex flex-col items-center gap-1 text-zinc-400">
            <span className="text-2xl">📄</span>
            <span className="text-[10px]">PDF</span>
          </div>
        }
      >
        <Page
          pageNumber={1}
          width={width}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>
    </div>
  );
}
