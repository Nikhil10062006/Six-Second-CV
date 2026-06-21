export default function Toast({ message, success, error }) {
  const bg = success
    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
    : error
      ? "bg-red-50 border-red-200 text-red-700"
      : "bg-white border-zinc-200 text-zinc-700";

  return (
    <div className={`w-80 px-4 py-3 rounded-lg border shadow-lg ${bg}`}>
      <p className="text-sm font-semibold">{message}</p>
    </div>
  );
}
