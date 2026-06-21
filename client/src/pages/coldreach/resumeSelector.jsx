// src/pages/Outreach/ResumeSelector.jsx
import { useEffect, useState } from "react";
import { getAllResumes } from "../../api/resumeAPI.jsx"; 

export default function ResumeSelector({ onSelect }) {
  const [resumes, setResumes] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllResumes()
      .then((res) => setResumes(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const id = e.target.value;
    setSelectedId(id);
    onSelect(id);
  };

  if (loading) return <p className="text-xs text-zinc-400">Loading resumes…</p>;

  if (resumes.length === 0) {
    return (
      <p className="text-sm text-zinc-500 bg-amber-50 border border-amber-200 rounded-lg p-4">
        No resumes uploaded yet. Upload one first to start outreach.
      </p>
    );
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-zinc-800 mb-1">
        Resume to use *
      </label>
      <select
        value={selectedId}
        onChange={handleChange}
        className="w-full p-3 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
      >
        <option value="" disabled>Select a resume</option>
        {resumes.map((r) => (
          <option key={r._id} value={r._id}>
            {r.originalFileName} — {new Date(r.createdAt).toLocaleDateString()}
          </option>
        ))}
      </select>
    </div>
  );
}