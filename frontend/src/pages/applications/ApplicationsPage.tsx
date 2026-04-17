import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { applicationsApi, contactsApi } from "@/api/endpoints";
import type { Application } from "@/types";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";

const statusColors: Record<string, string> = {
  new: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  submitted: "bg-indigo-100 text-indigo-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
};

export default function ApplicationsPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [form, setForm] = useState<Partial<Application>>({ status: "new", currency: "USD", amount: 0 });
  const qc = useQueryClient();

  const { data } = useQuery({ queryKey: ["applications"], queryFn: () => applicationsApi.list() });
  const { data: contacts } = useQuery({ queryKey: ["contacts-all"], queryFn: () => contactsApi.list({ limit: 200 }) });
  const { data: workflows } = useQuery({ queryKey: ["workflows"], queryFn: applicationsApi.workflows });

  const createMut = useMutation({
    mutationFn: (p: Partial<Application>) => applicationsApi.create(p),
    onSuccess: () => { toast.success("Application created"); qc.invalidateQueries({ queryKey: ["applications"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); setOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Failed"),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Application> }) => applicationsApi.update(id, payload),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["applications"] }); setEditing(null); setOpen(false); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => applicationsApi.delete(id),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["applications"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });

  const openNew = () => { setEditing(null); setForm({ status: "new", currency: "USD", amount: 0 }); setOpen(true); };
  const openEdit = (a: Application) => { setEditing(a); setForm(a); setOpen(true); };
  const submit = () => {
    if (!form.title || !form.contact_id) { toast.error("Title and contact are required"); return; }
    if (editing) updateMut.mutate({ id: editing.id, payload: form });
    else createMut.mutate(form);
  };

  return (
    <div>
      <PageHeader title="Applications" subtitle={`${data?.length ?? 0} total · track client applications across workflows`} actions={
        <button className="btn-primary" onClick={openNew}><Plus size={16} /> New Application</button>
      } />

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr><th>Ref</th><th>Title</th><th>Status</th><th>Start</th><th>Amount</th><th className="text-right">Actions</th></tr>
          </thead>
          <tbody>
            {data?.map((a) => (
              <tr key={a.id}>
                <td className="font-mono text-xs text-slate-500">{a.reference}</td>
                <td className="font-medium">{a.title}</td>
                <td><span className={`badge ${statusColors[a.status]} capitalize`}>{a.status.replace("_", " ")}</span></td>
                <td className="text-slate-600">{a.expected_start || "-"}</td>
                <td className="font-semibold">{a.currency} {a.amount.toFixed(2)}</td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <button className="btn-ghost" onClick={() => openEdit(a)}><Pencil size={14} /></button>
                    <button className="btn-ghost text-red-600 hover:bg-red-50" onClick={() => { if (confirm(`Delete ${a.reference}?`)) deleteMut.mutate(a.id); }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={6} className="text-center py-12 text-slate-400">No applications yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        title={editing ? `Edit ${editing.reference}` : "New Application"}
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setOpen(false); setEditing(null); }}>Cancel</button>
            <button className="btn-primary" onClick={submit}>{editing ? "Save changes" : "Create"}</button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Title *</label>
            <input className="input" value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
          </div>
          <div>
            <label className="label">Contact *</label>
            <select className="input" value={form.contact_id || ""} onChange={(e) => setForm({ ...form, contact_id: Number(e.target.value) })}>
              <option value="">Select contact</option>
              {contacts?.items.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Workflow</label>
            <select className="input" value={form.workflow_id || ""} onChange={(e) => setForm({ ...form, workflow_id: Number(e.target.value) || undefined })}>
              <option value="">None</option>
              {workflows?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
              {Object.keys(statusColors).map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Expected start</label>
            <input type="date" className="input" value={form.expected_start || ""} onChange={(e) => setForm({ ...form, expected_start: e.target.value })} />
          </div>
          <div>
            <label className="label">Amount</label>
            <input type="number" className="input" value={form.amount ?? 0} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Currency</label>
            <input className="input" value={form.currency || "USD"} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Notes</label>
            <textarea className="input" rows={3} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
