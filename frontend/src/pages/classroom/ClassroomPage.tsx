import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Trash2, Video } from "lucide-react";
import toast from "react-hot-toast";
import { classroomApi } from "@/api/endpoints";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";

export default function ClassroomPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({ title: "", category: "training", description: "", content: "", video_url: "", duration_minutes: undefined });

  const { data } = useQuery({ queryKey: ["classroom"], queryFn: classroomApi.list });
  const { data: active } = useQuery({ queryKey: ["classroom", viewId], queryFn: () => classroomApi.get(viewId!), enabled: !!viewId });

  const createMut = useMutation({
    mutationFn: () => classroomApi.create(form),
    onSuccess: () => { toast.success("Created"); qc.invalidateQueries({ queryKey: ["classroom"] }); setOpen(false); },
  });
  const delMut = useMutation({ mutationFn: classroomApi.delete, onSuccess: () => qc.invalidateQueries({ queryKey: ["classroom"] }) });

  return (
    <div>
      <PageHeader title="Classroom" subtitle="Training materials and SOPs" actions={
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New Material</button>
      } />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((m) => (
          <div key={m.id} className="card p-5 hover:shadow cursor-pointer" onClick={() => setViewId(m.id)}>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              {m.video_url ? <Video size={14} /> : <BookOpen size={14} />}
              <span className="uppercase">{m.category || "general"}</span>
              {m.duration_minutes && <span>· {m.duration_minutes} min</span>}
            </div>
            <div className="font-semibold text-gray-800 mb-1">{m.title}</div>
            <div className="text-sm text-gray-500 line-clamp-2">{m.description}</div>
            <div className="flex justify-end mt-3">
              <button className="btn-danger" onClick={(e) => { e.stopPropagation(); delMut.mutate(m.id); }}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {!data?.length && <div className="col-span-full card p-10 text-center text-gray-400">No materials yet.</div>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Material" footer={
        <>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={() => createMut.mutate()}>Save</button>
        </>
      }>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2"><label className="label">Title *</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="training">Training</option><option value="sop">SOP</option>
              <option value="template">Template</option><option value="guide">Guide</option>
            </select></div>
          <div><label className="label">Duration (min)</label><input type="number" className="input" value={form.duration_minutes || ""} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) || undefined })} /></div>
          <div className="md:col-span-2"><label className="label">Video URL</label><input className="input" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} /></div>
          <div className="md:col-span-2"><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="md:col-span-2"><label className="label">Content</label><textarea className="input" rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
        </div>
      </Modal>

      <Modal open={!!viewId} onClose={() => setViewId(null)} title={active?.title || "Material"}>
        {active && (
          <div className="space-y-3">
            {active.video_url && (
              <a href={active.video_url} target="_blank" rel="noreferrer" className="text-brand underline text-sm flex items-center gap-1">
                <Video size={14} /> Open video
              </a>
            )}
            <div className="text-sm text-gray-600">{active.description}</div>
            {active.content && <div className="whitespace-pre-wrap text-sm border-t pt-3">{active.content}</div>}
          </div>
        )}
      </Modal>
    </div>
  );
}
