import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, LogIn, Contact, Briefcase, Building2, Package,
  FileStack, MessageCircle, FileText, DollarSign, Users, Network,
  CheckSquare, GraduationCap, Megaphone, BarChart3, Sparkles,
} from "lucide-react";

const sections: { label?: string; items: { to: string; label: string; icon: any; color: string }[] }[] = [
  {
    items: [
      { to: "/dashboard",      label: "Dashboard",     icon: LayoutDashboard, color: "text-indigo-400" },
      { to: "/office-checkin", label: "Office Check-In", icon: LogIn,         color: "text-sky-400"    },
    ],
  },
  {
    label: "Sales & CRM",
    items: [
      { to: "/contacts",       label: "Contacts",      icon: Contact,    color: "text-pink-400"   },
      { to: "/applications",   label: "Applications",  icon: FileStack,  color: "text-violet-400" },
      { to: "/conversations",  label: "Conversations", icon: MessageCircle, color: "text-teal-400" },
      { to: "/quotations",     label: "Quotations",    icon: FileText,   color: "text-amber-400"  },
      { to: "/tasks",          label: "Tasks",         icon: CheckSquare,color: "text-emerald-400"},
    ],
  },
  {
    label: "Catalog",
    items: [
      { to: "/services",       label: "Services",      icon: Briefcase,  color: "text-orange-400" },
      { to: "/partners",       label: "Partners",      icon: Building2,  color: "text-blue-400"   },
      { to: "/products",       label: "Products",      icon: Package,    color: "text-rose-400"   },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/accounts",       label: "Accounts",      icon: DollarSign, color: "text-green-400"  },
      { to: "/teams",          label: "Teams",         icon: Users,      color: "text-cyan-400"   },
      { to: "/agents",         label: "Agents",        icon: Network,    color: "text-fuchsia-400"},
      { to: "/classroom",      label: "Classroom",     icon: GraduationCap, color: "text-yellow-400" },
      { to: "/campaign",       label: "Campaign",      icon: Megaphone,  color: "text-red-400"    },
      { to: "/reports",        label: "Reports",       icon: BarChart3,  color: "text-lime-400"   },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gradient-sidebar text-slate-200 flex flex-col border-r border-slate-900">
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/5">
        <div className="w-9 h-9 rounded-lg bg-gradient-brand flex items-center justify-center shadow-lg">
          <Sparkles size={18} className="text-white" />
        </div>
        <div>
          <div className="font-bold text-white leading-tight">CRM Pro</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Professional Suite</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {sections.map((sec, i) => (
          <div key={i}>
            {sec.label && (
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {sec.label}
              </div>
            )}
            <div className="space-y-0.5">
              {sec.items.map((it) => {
                const Icon = it.icon;
                return (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
                        isActive
                          ? "bg-white/10 text-white shadow-sm"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={18} className={isActive ? "text-white" : `${it.color} group-hover:scale-110 transition-transform`} />
                        <span className="font-medium">{it.label}</span>
                        {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white"/>}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="rounded-lg bg-gradient-brand p-3 text-xs text-white shadow-lg">
          <div className="font-semibold mb-0.5">Need help?</div>
          <div className="text-white/80">Check the Classroom for SOPs and training.</div>
        </div>
      </div>
    </aside>
  );
}
