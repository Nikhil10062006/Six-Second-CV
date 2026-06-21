export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md bg-white border border-zinc-200 rounded-xl p-6 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-zinc-800">{title}</p>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 transition-colors duration-200 text-xl leading-none"
          >
            ✕
          </button>
        </div>
        <div className="text-sm text-zinc-600">{children}</div>
      </div>
    </div>
  );
}
