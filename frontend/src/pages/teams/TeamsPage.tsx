import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import toast from "react-hot-toast";
import { teamsApi } from "@/api/endpoints";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";

export default function TeamsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ name: "", description: "" });

  const { data } = useQuery({ queryKey: ["teams"], queryFn: teamsApi.list });

  const createMut = useMutation({
    mutationFn: () => teamsApi.create(form),
    onSuccess: () => { toast.success("Team created"); qc.invalidateQueries({ queryKey: ["teams"] }); setOpen(false); setForm({ name: "", description: "" }); },
    onError: () => toast.error("Failed — admin/manager role required"),
  });

  return (
    <div>
      <PageHeader title="Teams" subtitle="Organize users into teams" actions={
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New Team</button>
      } />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((t) => (
          <div key={t.id} className="card p-5">
            <div className="flex items-center gap-2 mb-2"><Users size={16} className="text-brand" /><span className="font-semibold">{t.name}</span></div>
            <div className="text-sm text-gray-500">{t.description || "No description"}</div>
          </div>
        ))}
        {!data?.length && <div className="col-span-full card p-10 text-center text-gray-400">No teams yet.</div>}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="New Team" footer={
        <>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={() => createMut.mutate()}>Save</button>
        </>
      }>
        <div className="grid gap-3">
          <div><label className="label">Name *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
      </Modal>
    </div>
  );
}
