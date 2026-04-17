import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, DollarSign } from "lucide-react";
import toast from "react-hot-toast";
import { contactsApi, invoicesApi } from "@/api/endpoints";
import type { InvoiceStatus } from "@/types";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";

const statusColors: Record<InvoiceStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  partially_paid: "bg-amber-100 text-amber-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function AccountsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payFor, setPayFor] = useState<number | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState<any>({
    contact_id: undefined, issue_date: today, due_date: "", currency: "USD", status: "draft",
    notes: "", items: [{ description: "", quantity: 1, unit_price: 0, amount: 0 }], tax: 0,
  });
  const [pay, setPay] = useState<any>({ paid_on: today, amount: 0, method: "cash", reference: "", notes: "" });

  const { data } = useQuery({ queryKey: ["invoices"], queryFn: () => invoicesApi.list() });
  const { data: contacts } = useQuery({ queryKey: ["contacts-all"], queryFn: () => contactsApi.list({ limit: 200 }) });

  const subtotal = form.items.reduce((s: number, it: any) => s + (it.amount || 0), 0);
  const total = subtotal + Number(form.tax || 0);

  const createMut = useMutation({
    mutationFn: () => invoicesApi.create({ ...form, subtotal, total, tax: Number(form.tax) || 0 }),
    onSuccess: () => { toast.success("Invoice created"); qc.invalidateQueries({ queryKey: ["invoices"] }); setOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Failed"),
  });
  const payMut = useMutation({
    mutationFn: () => invoicesApi.addPayment(payFor!, pay),
    onSuccess: () => { toast.success("Payment recorded"); qc.invalidateQueries({ queryKey: ["invoices"] }); setPayOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Failed"),
  });
  const delMut = useMutation({
    mutationFn: invoicesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const updateItem = (i: number, patch: any) => {
    const next = [...form.items];
    next[i] = { ...next[i], ...patch };
    next[i].amount = (Number(next[i].quantity) || 0) * (Number(next[i].unit_price) || 0);
    setForm({ ...form, items: next });
  };

  return (
    <div>
      <PageHeader title="Accounts" subtitle="Invoices and payments" actions={
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New Invoice</button>
      } />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {(["draft","sent","paid","overdue"] as InvoiceStatus[]).map((st) => {
          const items = data?.filter((i) => i.status === st) || [];
          const sum = items.reduce((s, i) => s + i.total, 0);
          return (
            <div key={st} className="card p-4">
              <div className="text-xs text-gray-500 uppercase">{st.replace("_"," ")}</div>
              <div className="text-2xl font-bold">{items.length}</div>
              <div className="text-xs text-gray-400">${sum.toFixed(2)}</div>
            </div>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <table className="table">
          <thead><tr><th>Ref</th><th>Contact</th><th>Issued</th><th>Status</th><th>Total</th><th>Paid</th><th>Balance</th><th></th></tr></thead>
          <tbody>
            {data?.map((i) => (
              <tr key={i.id}>
                <td className="font-mono text-xs">{i.reference}</td>
                <td>#{i.contact_id}</td>
                <td>{i.issue_date}</td>
                <td><span className={`badge ${statusColors[i.status]}`}>{i.status.replace("_"," ")}</span></td>
                <td>{i.currency} {i.total.toFixed(2)}</td>
                <td>{i.currency} {i.amount_paid.toFixed(2)}</td>
                <td>{i.currency} {(i.total - i.amount_paid).toFixed(2)}</td>
                <td className="flex gap-2">
                  {i.status !== "paid" && <button className="btn-primary text-xs" onClick={() => { setPayFor(i.id); setPay({ ...pay, amount: i.total - i.amount_paid }); setPayOpen(true); }}><DollarSign size={12}/></button>}
                  <button className="btn-danger" onClick={() => delMut.mutate(i.id)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={8} className="text-center py-10 text-gray-400">No invoices yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Invoice" footer={
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
          <div><label className="label">Due date</label>
            <input type="date" className="input" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
        </div>

        <div className="text-sm font-medium mb-2">Items</div>
        <table className="w-full text-sm mb-3">
          <thead><tr className="text-left text-xs text-gray-500"><th>Description</th><th>Qty</th><th>Price</th><th>Amount</th><th></th></tr></thead>
          <tbody>
            {form.items.map((it: any, i: number) => (
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
            <input type="number" className="input" value={form.tax} onChange={(e) => setForm({ ...form, tax: Number(e.target.value) })} /></div>
          <div className="text-right self-end">
            <div className="text-xs text-gray-500">Subtotal: {form.currency} {subtotal.toFixed(2)}</div>
            <div className="text-lg font-semibold">Total: {form.currency} {total.toFixed(2)}</div>
          </div>
        </div>
        <textarea className="input" rows={2} placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </Modal>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Record Payment" footer={
        <>
          <button className="btn-secondary" onClick={() => setPayOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={() => payMut.mutate()}>Save</button>
        </>
      }>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Paid on</label><input type="date" className="input" value={pay.paid_on} onChange={(e) => setPay({ ...pay, paid_on: e.target.value })} /></div>
          <div><label className="label">Amount</label><input type="number" className="input" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: Number(e.target.value) })} /></div>
          <div><label className="label">Method</label>
            <select className="input" value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>
              <option value="cash">Cash</option><option value="card">Card</option>
              <option value="bank">Bank</option><option value="other">Other</option>
            </select></div>
          <div><label className="label">Reference</label><input className="input" value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} /></div>
          <div className="col-span-2"><label className="label">Notes</label><textarea className="input" rows={2} value={pay.notes} onChange={(e) => setPay({ ...pay, notes: e.target.value })} /></div>
        </div>
      </Modal>
    </div>
  );
}
