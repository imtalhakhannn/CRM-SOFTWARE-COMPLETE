import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Send, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { campaignsApi } from "@/api/endpoints";
import type { CampaignStatus } from "@/types";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";

const statusColors: Record<CampaignStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-100 text-blue-700",
  sending: "bg-amber-100 text-amber-700",
  sent: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function CampaignsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ name: "", type: "email", subject: "", content: "", target_filter: "", status: "draft" });

  const { data } = useQuery({ queryKey: ["campaigns"], queryFn: campaignsApi.list });

  const createMut = useMutation({
    mutationFn: () => campaignsApi.create(form),
    onSuccess: () => { toast.success("Created"); qc.invalidateQueries({ queryKey: ["campaigns"] }); setOpen(false); },
  });
  const sendMut = useMutation({
    mutationFn: campaignsApi.send,
    onSuccess: () => { toast.success("Sent"); qc.invalidateQueries({ queryKey: ["campaigns"] }); },
  });
  const delMut = useMutation({ mutationFn: campaignsApi.delete, onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }) });

  return (
    <div>
      <PageHeader title="Campaigns" subtitle="Email and SMS outreach" actions={
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New Campaign</button>
      } />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((c) => (
          <div key={c.id} className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className={`badge ${statusColors[c.status]}`}>{c.status}</span>
              <div className="flex gap-1">
                {c.status === "draft" && <button className="btn-secondary" title="Send" onClick={() => sendMut.mutate(c.id)}><Send size={14} /></button>}
                <button className="btn-danger" onClick={() => delMut.mutate(c.id)}><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="font-semibold text-gray-800">{c.name}</div>
            <div className="text-xs text-gray-500 mb-3">{c.type.toUpperCase()} · {c.subject || "no subject"}</div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div><div className="text-gray-500">Recipients</div><div className="font-semibold">{c.recipient_count}</div></div>
              <div><div className="text-gray-500">Delivered</div><div className="font-semibold">{c.delivered_count}</div></div>
              <div><div className="text-gray-500">Opened</div><div className="font-semibold">{c.opened_count}</div></div>
            </div>
            {c.sent_at && <div className="text-xs text-gray-400 mt-3">Sent {new Date(c.sent_at).toLocaleString()}</div>}
          </div>
        ))}
        {!data?.length && <div className="col-span-full card p-10 text-center text-gray-400">No campaigns yet.</div>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Campaign" footer={
        <>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={() => createMut.mutate()}>Save</button>
        </>
      }>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2"><label className="label">Name *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="email">Email</option><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option>
            </select></div>
          <div><label className="label">Target filter</label>
            <input className="input" placeholder="e.g. type=lead" value={form.target_filter} onChange={(e) => setForm({ ...form, target_filter: e.target.value })} /></div>
          <div className="md:col-span-2"><label className="label">Subject</label>
            <input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
          <div className="md:col-span-2"><label className="label">Content</label>
            <textarea className="input" rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
        </div>
      </Modal>
    </div>
  );
}
