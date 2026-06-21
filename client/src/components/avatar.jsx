function getInitials(username) {
  if (!username) return "?";
  return username.slice(0, 2).toUpperCase();
}

export default function Avatar({ username, email }) {
  return (
    <div className="flex flex-row items-center gap-2.5 text-left">
      <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-white tracking-wide">
          {getInitials(username)}
        </span>
      </div>
      <div className="flex flex-col">
        <p className="text-sm font-semibold text-zinc-800 leading-tight">
          {username}
        </p>
        <p className="text-[10px] font-medium text-zinc-500 leading-tight">
          {email}
        </p>
      </div>
    </div>
  );
}
