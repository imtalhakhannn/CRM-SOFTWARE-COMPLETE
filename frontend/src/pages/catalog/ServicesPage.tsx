import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { servicesApi } from "@/api/endpoints";
import type { Service } from "@/types";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";

export default function ServicesPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<Partial<Service>>({ currency: "USD", is_active: true, base_price: 0 });
  const qc = useQueryClient();

  const { data } = useQuery({ queryKey: ["services"], queryFn: servicesApi.list });

  const createMut = useMutation({
    mutationFn: (p: Partial<Service>) => servicesApi.create(p),
    onSuccess: () => { toast.success("Created"); qc.invalidateQueries({ queryKey: ["services"] }); setOpen(false); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Service> }) => servicesApi.update(id, payload),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["services"] }); setOpen(false); setEditing(null); },
  });
  const delMut = useMutation({
    mutationFn: (id: number) => servicesApi.delete(id),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["services"] }); },
  });

  const openNew = () => { setEditing(null); setForm({ currency: "USD", is_active: true, base_price: 0 }); setOpen(true); };
  const openEdit = (s: Service) => { setEditing(s); setForm(s); setOpen(true); };
  const submit = () => {
    if (!form.name) { toast.error("Name is required"); return; }
    if (editing) updateMut.mutate({ id: editing.id, payload: form });
    else createMut.mutate(form);
  };

  return (
    <div>
      <PageHeader title="Services" subtitle={`${data?.length ?? 0} services · offerings you sell`} actions={
        <button className="btn-primary" onClick={openNew}><Plus size={16} /> New Service</button>
      } />
      <div className="card overflow-hidden">
        <table className="table">
          <thead><tr><th>Name</th><th>Code</th><th>Price</th><th>Active</th><th className="text-right">Actions</th></tr></thead>
          <tbody>
            {data?.map((s) => (
              <tr key={s.id}>
                <td className="font-medium">{s.name}</td>
                <td className="font-mono text-xs text-slate-500">{s.code || "-"}</td>
                <td className="font-semibold">{s.currency} {s.base_price.toFixed(2)}</td>
                <td><span className={`badge ${s.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{s.is_active ? "Active" : "Inactive"}</span></td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <button className="btn-ghost" onClick={() => openEdit(s)}><Pencil size={14}/></button>
                    <button className="btn-ghost text-red-600 hover:bg-red-50" onClick={() => { if (confirm(`Delete ${s.name}?`)) delMut.mutate(s.id); }}><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={5} className="text-center py-12 text-slate-400">No services yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => { setOpen(false); setEditing(null); }} title={editing ? `Edit ${editing.name}` : "New Service"} footer={
        <>
          <button className="btn-secondary" onClick={() => { setOpen(false); setEditing(null); }}>Cancel</button>
          <button className="btn-primary" onClick={submit}>{editing ? "Save" : "Create"}</button>
        </>
      }>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="label">Name *</label><input className="input" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus/></div>
          <div><label className="label">Code</label><input className="input" value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          <div><label className="label">Base price</label><input type="number" className="input" value={form.base_price ?? 0} onChange={(e) => setForm({ ...form, base_price: Number(e.target.value) })} /></div>
          <div><label className="label">Currency</label><input className="input" value={form.currency || "USD"} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
          <div><label className="label">Status</label>
            <select className="input" value={form.is_active ? "1" : "0"} onChange={(e) => setForm({ ...form, is_active: e.target.value === "1" })}>
              <option value="1">Active</option><option value="0">Inactive</option>
            </select></div>
          <div className="md:col-span-2"><label className="label">Description</label><textarea className="input" rows={3} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
      </Modal>
    </div>
  );
}
