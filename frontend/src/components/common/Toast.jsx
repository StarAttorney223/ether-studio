function Toast({ toast, onClose }) {
  if (!toast?.message) return null;

  const toneClass = toast.type === "error" ? "bg-rose-600" : "bg-[#232a39]";

  return (
    <div className="fixed bottom-5 right-5 z-[70] studio-animate-in">
      <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-soft ${toneClass}`}>
        <span>{toast.message}</span>
        <button onClick={onClose} className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
          Close
        </button>
      </div>
    </div>
  );
}

export default Toast;
