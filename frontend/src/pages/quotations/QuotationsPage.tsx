import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { contactsApi, quotationsApi } from "@/api/endpoints";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";

type Item = { description: string; quantity: number; unit_price: number; amount: number };

export default function QuotationsPage() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<any>({
    contact_id: undefined, issue_date: today, valid_until: "", currency: "USD",
    status: "draft", notes: "", items: [{ description: "", quantity: 1, unit_price: 0, amount: 0 }],
  });

  const { data } = useQuery({ queryKey: ["quotations"], queryFn: quotationsApi.list });
  const { data: contacts } = useQuery({ queryKey: ["contacts-all"], queryFn: () => contactsApi.list({ limit: 200 }) });

  const subtotal = (form.items as Item[]).reduce((s, it) => s + it.amount, 0);
  const total = subtotal + (Number(form.tax) || 0);

  const createMut = useMutation({
    mutationFn: () => quotationsApi.create({ ...form, subtotal, total, tax: Number(form.tax) || 0 }),
    onSuccess: () => { toast.success("Quotation created"); qc.invalidateQueries({ queryKey: ["quotations"] }); setOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Failed"),
  });
  const delMut = useMutation({
    mutationFn: quotationsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotations"] }),
  });

  const updateItem = (i: number, patch: Partial<Item>) => {
    const next = [...form.items];
    next[i] = { ...next[i], ...patch };
    next[i].amount = (Number(next[i].quantity) || 0) * (Number(next[i].unit_price) || 0);
    setForm({ ...form, items: next });
  };

  return (
    <div>
      <PageHeader title="Quotations" subtitle="Proposals sent to contacts" actions={
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New Quote</button>
      } />
      <div className="card overflow-hidden">
        <table className="table">
          <thead><tr><th>Ref</th><th>Contact</th><th>Issued</th><th>Status</th><th>Total</th><th></th></tr></thead>
          <tbody>
            {data?.map((q) => (
              <tr key={q.id}>
                <td className="font-mono text-xs">{q.reference}</td>
                <td>#{q.contact_id}</td>
                <td>{q.issue_date}</td>
                <td><span className="badge bg-gray-100 text-gray-700 capitalize">{q.status}</span></td>
                <td>{q.currency} {q.total.toFixed(2)}</td>
                <td><button className="btn-danger" onClick={() => delMut.mutate(q.id)}><Trash2 size={14} /></button></td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={6} className="text-center py-10 text-gray-400">No quotations yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Quotation" footer={
        <>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={() => createMut.mutate()}>Create</button>
        </>
      }>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div><label className="label">Contact *</label>
            <select className="input" value={form.contact_id || ""} onChange={(e) => setForm({ ...form, contact_id: Number(e.target.value) })}>
              <option value="">Select</option>
              {contacts?.items.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select></div>
          <div><label className="label">Currency</label>
            <input className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
          <div><label className="label">Issue date</label>
            <input type="date" className="input" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} /></div>
          <div><label className="label">Valid until</label>
            <input type="date" className="input" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} /></div>
        </div>

        <div className="text-sm font-medium mb-2">Items</div>
        <table className="w-full text-sm mb-3">
          <thead><tr className="text-left text-xs text-gray-500"><th>Description</th><th>Qty</th><th>Price</th><th>Amount</th><th></th></tr></thead>
          <tbody>
            {(form.items as Item[]).map((it, i) => (
              <tr key={i}>
                <td><input className="input" value={it.description} onChange={(e) => updateItem(i, { description: e.target.value })} /></td>
                <td><input type="number" className="input w-20" value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} /></td>
                <td><input type="number" className="input w-28" value={it.unit_price} onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) })} /></td>
                <td className="w-28">{it.amount.toFixed(2)}</td>
                <td><button className="btn-secondary" onClick={() => setForm({ ...form, items: form.items.filter((_: any, j: number) => j !== i) })}><Trash2 size={12} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn-secondary mb-3" onClick={() => setForm({ ...form, items: [...form.items, { description: "", quantity: 1, unit_price: 0, amount: 0 }] })}>+ Add row</button>

        <div className="grid grid-cols-2 gap-3 mb-2">
          <div><label className="label">Tax</label>
            <input type="number" className="input" value={form.tax || 0} onChange={(e) => setForm({ ...form, tax: Number(e.target.value) })} /></div>
          <div className="text-right self-end">
            <div className="text-xs text-gray-500">Subtotal: {form.currency} {subtotal.toFixed(2)}</div>
            <div className="text-lg font-semibold">Total: {form.currency} {total.toFixed(2)}</div>
          </div>
        </div>
        <textarea className="input" rows={2} placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </Modal>
    </div>
  );
}
