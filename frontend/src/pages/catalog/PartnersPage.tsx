import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { partnersApi } from "@/api/endpoints";
import type { Partner } from "@/types";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";

export default function PartnersPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState<Partial<Partner>>({ commission_rate: 0, is_active: true });
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["partners"], queryFn: partnersApi.list });

  const createMut = useMutation({
    mutationFn: (p: Partial<Partner>) => partnersApi.create(p),
    onSuccess: () => { toast.success("Created"); qc.invalidateQueries({ queryKey: ["partners"] }); setOpen(false); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Partner> }) => partnersApi.update(id, payload),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["partners"] }); setOpen(false); setEditing(null); },
  });
  const delMut = useMutation({
    mutationFn: (id: number) => partnersApi.delete(id),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["partners"] }); },
  });

  const openNew = () => { setEditing(null); setForm({ commission_rate: 0, is_active: true }); setOpen(true); };
  const openEdit = (p: Partner) => { setEditing(p); setForm(p); setOpen(true); };
  const submit = () => {
    if (!form.name) { toast.error("Name is required"); return; }
    if (editing) updateMut.mutate({ id: editing.id, payload: form });
    else createMut.mutate(form);
  };

  return (
    <div>
      <PageHeader title="Partners" subtitle={`${data?.length ?? 0} partners · universities, visa providers, insurers`} actions={
        <button className="btn-primary" onClick={openNew}><Plus size={16} /> New Partner</button>
      } />
      <div className="card overflow-hidden">
        <table className="table">
          <thead><tr><th>Name</th><th>Type</th><th>Country</th><th>Email</th><th>Commission</th><th className="text-right">Actions</th></tr></thead>
          <tbody>
            {data?.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">{p.name}</td>
                <td className="text-slate-600">{p.type || "-"}</td>
                <td className="text-slate-600">{p.country || "-"}</td>
                <td className="text-slate-600">{p.email || "-"}</td>
                <td className="font-semibold">{p.commission_rate}%</td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <button className="btn-ghost" onClick={() => openEdit(p)}><Pencil size={14}/></button>
                    <button className="btn-ghost text-red-600 hover:bg-red-50" onClick={() => { if (confirm(`Delete ${p.name}?`)) delMut.mutate(p.id); }}><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={6} className="text-center py-12 text-slate-400">No partners yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => { setOpen(false); setEditing(null); }} title={editing ? `Edit ${editing.name}` : "New Partner"} footer={
        <>
          <button className="btn-secondary" onClick={() => { setOpen(false); setEditing(null); }}>Cancel</button>
          <button className="btn-primary" onClick={submit}>{editing ? "Save" : "Create"}</button>
        </>
      }>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="label">Name *</label><input className="input" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus /></div>
          <div><label className="label">Type</label><input className="input" value={form.type || ""} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="University, Visa, Insurance..." /></div>
          <div><label className="label">Country</label><input className="input" value={form.country || ""} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
          <div><label className="label">Email</label><input className="input" type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="label">Website</label><input className="input" value={form.website || ""} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
          <div><label className="label">Commission rate (%)</label><input type="number" className="input" value={form.commission_rate ?? 0} onChange={(e) => setForm({ ...form, commission_rate: Number(e.target.value) })} /></div>
        </div>
      </Modal>
    </div>
  );
}
