export default function Spinner({ className = "w-10 h-10" }) {
  return (
    <div
      className={`${className} rounded-full border-4 border-zinc-200 border-t-sky-500 animate-spin`}
    />
  );
}