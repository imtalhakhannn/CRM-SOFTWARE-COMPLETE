import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2, UserPlus, X } from "lucide-react";
import toast from "react-hot-toast";
import { contactsApi } from "@/api/endpoints";
import type { Contact, ContactType } from "@/types";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";

const typeBadge: Record<ContactType, string> = {
  lead: "bg-indigo-100 text-indigo-700",
  prospect: "bg-amber-100 text-amber-700",
  client: "bg-emerald-100 text-emerald-700",
};

const ratingColors: Record<string, string> = {
  hot: "bg-red-100 text-red-700",
  warm: "bg-orange-100 text-orange-700",
  cold: "bg-sky-100 text-sky-700",
  flagged: "bg-amber-100 text-amber-700",
  dead: "bg-slate-100 text-slate-500",
};

export default function ContactsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const initialType = (searchParams.get("type") as ContactType | "") || "";

  const [search, setSearch] = useState(initialQ);
  const [type, setType] = useState<ContactType | "">(initialType);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState<Partial<Contact>>({ type: "lead" });

  const qc = useQueryClient();

  useEffect(() => {
    // keep URL in sync
    const next: Record<string, string> = {};
    if (search) next.q = search;
    if (type) next.type = type;
    setSearchParams(next, { replace: true });
  }, [search, type, setSearchParams]);

  const { data } = useQuery({
    queryKey: ["contacts", { search, type }],
    queryFn: () => contactsApi.list({ search: search || undefined, type: type || undefined }),
  });

  const createMut = useMutation({
    mutationFn: contactsApi.create,
    onSuccess: () => { toast.success("Contact created"); qc.invalidateQueries({ queryKey: ["contacts"] }); setOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Failed"),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Contact> }) => contactsApi.update(id, payload),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["contacts"] }); setEditing(null); setOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Failed"),
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => contactsApi.delete(id),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["contacts"] }); },
  });
  const convertMut = useMutation({
    mutationFn: ({ id, to }: { id: number; to: ContactType }) => contactsApi.convert(id, to),
    onSuccess: () => { toast.success("Converted"); qc.invalidateQueries({ queryKey: ["contacts"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });

  const openNew = () => { setEditing(null); setForm({ type: "lead" }); setOpen(true); };
  const openEdit = (c: Contact) => { setEditing(c); setForm(c); setOpen(true); };
  const submit = () => {
    if (!form.first_name) { toast.error("First name is required"); return; }
    if (editing) updateMut.mutate({ id: editing.id, payload: form });
    else createMut.mutate(form);
  };

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle={`${data?.total ?? 0} total · leads, prospects and clients`}
        actions={<button className="btn-primary" onClick={openNew}><Plus size={16} /> Add Contact</button>}
      />

      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600" onClick={() => setSearch("")}>
              <X size={16} />
            </button>
          )}
        </div>
        <select className="input max-w-[200px]" value={type} onChange={(e) => setType(e.target.value as any)}>
          <option value="">All types</option>
          <option value="lead">Leads</option>
          <option value="prospect">Prospects</option>
          <option value="client">Clients</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Phone</th><th>Type</th><th>Rating</th><th>Country</th><th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link to={`/contacts/${c.id}`} className="text-brand-600 font-semibold hover:underline">{c.full_name}</Link>
                </td>
                <td className="text-slate-600">{c.email || "-"}</td>
                <td className="text-slate-600">{c.phone || "-"}</td>
                <td><span className={`badge ${typeBadge[c.type]} capitalize`}>{c.type}</span></td>
                <td>{c.rating ? <span className={`badge ${ratingColors[c.rating]} capitalize`}>{c.rating}</span> : <span className="text-slate-400">-</span>}</td>
                <td className="text-slate-600">{c.country || "-"}</td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    {c.type !== "client" && (
                      <button className="btn-ghost text-xs" title="Convert to client"
                              onClick={() => convertMut.mutate({ id: c.id, to: "client" })}>
                        <UserPlus size={14} />
                      </button>
                    )}
                    <button className="btn-ghost" title="Edit" onClick={() => openEdit(c)}><Pencil size={14} /></button>
                    <button className="btn-ghost text-red-600 hover:bg-red-50" title="Delete"
                            onClick={() => { if (confirm(`Delete ${c.full_name}?`)) deleteMut.mutate(c.id); }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!data?.items.length && (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400">No contacts match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        title={editing ? `Edit ${editing.full_name}` : "Add Contact"}
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setOpen(false); setEditing(null); }}>Cancel</button>
            <button className="btn-primary" onClick={submit} disabled={createMut.isPending || updateMut.isPending}>
              {editing ? "Save changes" : "Create"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">First name *</label>
            <input className="input" value={form.first_name || ""} onChange={(e) => setForm({ ...form, first_name: e.target.value })} autoFocus />
          </div>
          <div>
            <label className="label">Last name</label>
            <input className="input" value={form.last_name || ""} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ContactType })}>
              <option value="lead">Lead</option>
              <option value="prospect">Prospect</option>
              <option value="client">Client</option>
            </select>
          </div>
          <div>
            <label className="label">Rating</label>
            <select className="input" value={form.rating || ""} onChange={(e) => setForm({ ...form, rating: (e.target.value || undefined) as any })}>
              <option value="">—</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
              <option value="flagged">Flagged</option>
              <option value="dead">Dead</option>
            </select>
          </div>
          <div>
            <label className="label">Country</label>
            <input className="input" value={form.country || ""} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
          <div>
            <label className="label">City</label>
            <input className="input" value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <label className="label">Source</label>
            <input className="input" value={form.source || ""} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Website / Referral / ..." />
          </div>
          <div>
            <label className="label">Passport number</label>
            <input className="input" value={form.passport_number || ""} onChange={(e) => setForm({ ...form, passport_number: e.target.value })} />
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
