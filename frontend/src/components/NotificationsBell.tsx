import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell, AlertTriangle, Clock, Calendar, CheckCircle2, Info } from "lucide-react";
import { notificationsApi } from "@/api/endpoints";

const LAST_SEEN_KEY = "crm-notifications-last-seen";

const severityStyle = {
  danger:  { ring: "bg-red-500",    icon: AlertTriangle, color: "text-red-500" },
  warning: { ring: "bg-amber-500",  icon: Clock,          color: "text-amber-500" },
  info:    { ring: "bg-sky-500",    icon: Info,           color: "text-sky-500" },
} as const;

const typeIcons: Record<string, any> = {
  task_overdue: AlertTriangle,
  task_due_today: Clock,
  appointment_today: Calendar,
  appointment_upcoming: Calendar,
  invoice_overdue: AlertTriangle,
  application_stalled: Info,
};

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.list,
    refetchInterval: 60_000,
  });

  const [lastSeen, setLastSeen] = useState<number>(() => {
    const v = localStorage.getItem(LAST_SEEN_KEY);
    return v ? Number(v) : 0;
  });

  const items = data?.items || [];
  const unread = items.filter((i) => new Date(i.created_at).getTime() > lastSeen).length;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!popRef.current || !btnRef.current) return;
      if (!popRef.current.contains(e.target as Node) && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const openPanel = () => {
    setOpen((o) => !o);
    if (!open) {
      const ts = Date.now();
      setLastSeen(ts);
      localStorage.setItem(LAST_SEEN_KEY, String(ts));
    }
  };

  return (
    <div className="relative">
      <button ref={btnRef} className="btn-ghost relative" title="Notifications" onClick={openPanel}>
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div ref={popRef} className="absolute right-0 mt-2 w-96 card shadow-pop animate-slide-up z-50">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">Notifications</div>
              <div className="text-[11px] text-slate-500">{items.length} active</div>
            </div>
            {items.length > 0 && (
              <CheckCircle2 size={16} className="text-emerald-500" />
            )}
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-400">
                <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-400" />
                You're all caught up!
              </div>
            ) : (
              <ul>
                {items.map((n) => {
                  const Icon = typeIcons[n.type] || Info;
                  const s = severityStyle[n.severity] || severityStyle.info;
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => { navigate(n.link); setOpen(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 flex gap-3 border-b border-slate-100 last:border-b-0 transition"
                      >
                        <div className={`w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 ${s.color}`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">{n.title}</div>
                          <div className="text-xs text-slate-500 truncate">{n.subtitle}</div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${s.ring} mt-2 shrink-0`} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
