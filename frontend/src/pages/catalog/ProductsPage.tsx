import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { productsApi, servicesApi, partnersApi } from "@/api/endpoints";
import type { Product } from "@/types";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";

export default function ProductsPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>({ currency: "USD", is_active: true, price: 0 });
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["products"], queryFn: productsApi.list });
  const { data: services } = useQuery({ queryKey: ["services"], queryFn: servicesApi.list });
  const { data: partners } = useQuery({ queryKey: ["partners"], queryFn: partnersApi.list });

  const createMut = useMutation({
    mutationFn: (p: Partial<Product>) => productsApi.create(p),
    onSuccess: () => { toast.success("Created"); qc.invalidateQueries({ queryKey: ["products"] }); setOpen(false); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Product> }) => productsApi.update(id, payload),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["products"] }); setOpen(false); setEditing(null); },
  });
  const delMut = useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["products"] }); },
  });

  const openNew = () => { setEditing(null); setForm({ currency: "USD", is_active: true, price: 0 }); setOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm(p); setOpen(true); };
  const submit = () => {
    if (!form.name) { toast.error("Name is required"); return; }
    if (editing) updateMut.mutate({ id: editing.id, payload: form });
    else createMut.mutate(form);
  };

  const partnerName = (id?: number) => partners?.find((p) => p.id === id)?.name || "-";
  const serviceName = (id?: number) => services?.find((s) => s.id === id)?.name || "-";

  return (
    <div>
      <PageHeader title="Products" subtitle={`${data?.length ?? 0} products · specific offerings (courses, visas, policies)`}
        actions={<button className="btn-primary" onClick={openNew}><Plus size={16} /> New Product</button>} />
      <div className="card overflow-hidden">
        <table className="table">
          <thead><tr><th>Name</th><th>Partner</th><th>Level</th><th>Intake</th><th>Price</th><th className="text-right">Actions</th></tr></thead>
          <tbody>
            {data?.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">{p.name} <span className="text-xs text-slate-400 ml-1">{p.code}</span></td>
                <td className="text-slate-600">{partnerName(p.partner_id)}</td>
                <td className="text-slate-600">{p.level || "-"}</td>
                <td className="text-slate-600">{p.intake || "-"}</td>
                <td className="font-semibold">{p.currency} {p.price.toFixed(2)}</td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <button className="btn-ghost" onClick={() => openEdit(p)}><Pencil size={14}/></button>
                    <button className="btn-ghost text-red-600 hover:bg-red-50" onClick={() => { if (confirm(`Delete ${p.name}?`)) delMut.mutate(p.id); }}><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={6} className="text-center py-12 text-slate-400">No products yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => { setOpen(false); setEditing(null); }} title={editing ? `Edit ${editing.name}` : "New Product"} footer={
        <>
          <button className="btn-secondary" onClick={() => { setOpen(false); setEditing(null); }}>Cancel</button>
          <button className="btn-primary" onClick={submit}>{editing ? "Save" : "Create"}</button>
        </>
      }>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="label">Name *</label><input className="input" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus/></div>
          <div><label className="label">Code</label><input className="input" value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          <div><label className="label">Level</label><input className="input" value={form.level || ""} onChange={(e) => setForm({ ...form, level: e.target.value })} /></div>
          <div><label className="label">Intake</label><input className="input" value={form.intake || ""} onChange={(e) => setForm({ ...form, intake: e.target.value })} /></div>
          <div><label className="label">Duration (months)</label><input type="number" className="input" value={form.duration_months ?? ""} onChange={(e) => setForm({ ...form, duration_months: Number(e.target.value) || undefined })} /></div>
          <div><label className="label">Price</label><input type="number" className="input" value={form.price ?? 0} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
          <div><label className="label">Currency</label><input className="input" value={form.currency || "USD"} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
          <div><label className="label">Service</label>
            <select className="input" value={form.service_id || ""} onChange={(e) => setForm({ ...form, service_id: Number(e.target.value) || undefined })}>
              <option value="">None</option>
              {services?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div><label className="label">Partner</label>
            <select className="input" value={form.partner_id || ""} onChange={(e) => setForm({ ...form, partner_id: Number(e.target.value) || undefined })}>
              <option value="">None</option>
              {partners?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
