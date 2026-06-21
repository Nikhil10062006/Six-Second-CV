import { useRef, useState } from "react";
import { useResume } from "../../hooks/useResume.jsx";
import Modal from "../../components/modal.jsx";

export default function ResumeUploader({ onResumeUploaded }) {
  const { loading, error, handleUploadCV } = useResume();
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const processFile = async (file) => {
    if (!file || file.type !== "application/pdf") {
      setModalOpen(true);
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setModalOpen(true);
      return;
    }
    setSelectedFile(file);
    const success = await handleUploadCV(file);
    if (success) onResumeUploaded();
  };

  const onInputChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={onInputChange}
      />

      <div
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl px-6 py-8 flex flex-col items-center gap-3 cursor-pointer transition-colors duration-200 select-none ${
          dragOver
            ? "border-sky-400 bg-sky-50"
            : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-zinc-100"
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 text-xl">
          ↑
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-700">
            {selectedFile
              ? selectedFile.name
              : "Click to upload or drag and drop"}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">PDF only · Max 4 MB</p>
        </div>
        {loading && (
          <p className="text-xs text-sky-600 font-medium animate-pulse">
            Uploading…
          </p>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Invalid file"
      >
        <p>Please upload a PDF file under 4 MB.</p>
      </Modal>
    </>
  );
}
