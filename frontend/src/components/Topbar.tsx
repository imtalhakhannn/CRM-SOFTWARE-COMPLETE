import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Search } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import NotificationsBell from "@/components/NotificationsBell";

export default function Topbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const initials = (user?.full_name || "U")
    .split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/contacts?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <form onSubmit={onSearch} className="flex-1 max-w-md relative">
        <Search size={16} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
        <input
          className="input pl-9 bg-slate-50 border-slate-200"
          placeholder="Search contacts, applications..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      <div className="flex items-center gap-3">
        <NotificationsBell />
        <div className="h-8 w-px bg-slate-200" />
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-brand text-white flex items-center justify-center font-bold text-sm shadow">
            {initials}
          </div>
          <div className="hidden md:block leading-tight">
            <div className="text-sm font-semibold text-slate-800">{user?.full_name}</div>
            <div className="text-[11px] text-slate-500 capitalize">{user?.role?.replace("_", " ")}</div>
          </div>
        </div>
        <button onClick={logout} className="btn-ghost" title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
