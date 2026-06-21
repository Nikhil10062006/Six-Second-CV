import { useState } from "react";

export default function CompanyInputForm({ onSubmit, fallbackMessage }) {
  const [formData, setFormData] = useState({
    companyName: "",
    careersUrl: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col gap-5"
    >
      {/* ADD this block at the top */}
      {fallbackMessage && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium">
          {fallbackMessage}
        </div>
      )}
      <div>
        <label className="block text-sm font-semibold text-zinc-800 mb-1">
          Target Company Name *
        </label>
        <input
          required
          type="text"
          placeholder="e.g. Stripe"
          className="w-full p-3 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          value={formData.companyName}
          onChange={(e) =>
            setFormData({ ...formData, companyName: e.target.value })
          }
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-zinc-800 mb-1">
          Careers / About URL (Optional)
        </label>
        <input
          type="url"
          placeholder="https://stripe.com/jobs"
          className="w-full p-3 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          value={formData.careersUrl}
          onChange={(e) =>
            setFormData({ ...formData, careersUrl: e.target.value })
          }
        />
        <p className="text-xs text-zinc-400 mt-1">
          If left blank, we will attempt to find it automatically.
        </p>
      </div>
      <button
        type="submit"
        disabled={!formData.companyName}
        className="mt-2 w-full py-3 rounded-lg text-sm font-semibold bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Scrape Company Signals
      </button>
    </form>
  );
}
