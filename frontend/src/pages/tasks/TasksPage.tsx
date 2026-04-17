import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Check } from "lucide-react";
import toast from "react-hot-toast";
import { tasksApi, contactsApi } from "@/api/endpoints";
import type { Task } from "@/types";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";

const prioColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-red-100 text-red-700",
};

export default function TasksPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Task>>({ priority: "medium", status: "pending" });
  const qc = useQueryClient();

  const { data: tasks } = useQuery({ queryKey: ["tasks-all"], queryFn: () => tasksApi.list() });
  const { data: contacts } = useQuery({ queryKey: ["contacts-all"], queryFn: () => contactsApi.list({ limit: 200 }) });

  const createMut = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      toast.success("Task created");
      qc.invalidateQueries({ queryKey: ["tasks-all"] });
      setOpen(false);
    },
  });

  const completeMut = useMutation({
    mutationFn: (id: number) => tasksApi.update(id, { status: "completed" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks-all"] }),
  });

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="Your team's to-do list"
        actions={
          <button className="btn-primary" onClick={() => { setForm({ priority: "medium", status: "pending" }); setOpen(true); }}>
            <Plus size={16} /> New Task
          </button>
        }
      />

      <div className="card overflow-hidden">
        <table className="table">
          <thead><tr><th></th><th>Title</th><th>Status</th><th>Priority</th><th>Due</th></tr></thead>
          <tbody>
            {tasks?.map((t) => (
              <tr key={t.id}>
                <td className="w-8">
                  {t.status !== "completed" && (
                    <button className="text-green-600 hover:bg-green-50 rounded-full p-1" onClick={() => completeMut.mutate(t.id)}>
                      <Check size={16} />
                    </button>
                  )}
                </td>
                <td className={t.status === "completed" ? "line-through text-gray-400" : ""}>{t.title}</td>
                <td>{t.status}</td>
                <td><span className={`badge ${prioColors[t.priority] || prioColors.medium}`}>{t.priority}</span></td>
                <td>{t.due_date ? new Date(t.due_date).toLocaleString() : "-"}</td>
              </tr>
            ))}
            {!tasks?.length && <tr><td colSpan={5} className="text-center py-10 text-gray-400">No tasks.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New Task"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={() => createMut.mutate(form)}>Create</button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="label">Title *</label>
            <input className="input" value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="label">Due date</label>
            <input type="datetime-local" className="input" onChange={(e) => setForm({ ...form, due_date: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Contact</label>
            <select className="input" value={form.contact_id || ""} onChange={(e) => setForm({ ...form, contact_id: Number(e.target.value) || undefined })}>
              <option value="">None</option>
              {contacts?.items.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
