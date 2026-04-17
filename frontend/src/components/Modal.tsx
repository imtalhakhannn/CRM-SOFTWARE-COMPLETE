import { X } from "lucide-react";
import { ReactNode } from "react";

export default function Modal({
  open, onClose, title, children, footer, size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  if (!open) return null;
  const sizeCls = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-3xl", xl: "max-w-5xl" }[size];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className={`card w-full ${sizeCls} shadow-pop animate-slide-up`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 text-base">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 rounded-b-xl flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
