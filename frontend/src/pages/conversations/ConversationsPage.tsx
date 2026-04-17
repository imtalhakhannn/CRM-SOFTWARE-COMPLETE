import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Send, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import { conversationsApi, contactsApi } from "@/api/endpoints";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";

export default function ConversationsPage() {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<{ subject: string; channel: string; contact_id?: number }>({ subject: "", channel: "email" });
  const [reply, setReply] = useState("");
  const qc = useQueryClient();

  const { data: list } = useQuery({ queryKey: ["conversations"], queryFn: () => conversationsApi.list() });
  const { data: contacts } = useQuery({ queryKey: ["contacts-all"], queryFn: () => contactsApi.list({ limit: 200 }) });
  const { data: active } = useQuery({
    queryKey: ["conversation", selectedId],
    queryFn: () => conversationsApi.get(selectedId!),
    enabled: !!selectedId,
  });

  const createMut = useMutation({
    mutationFn: conversationsApi.create,
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      setSelectedId(c.id); setOpen(false);
    },
  });
  const sendMut = useMutation({
    mutationFn: (body: string) => conversationsApi.addMessage(selectedId!, body),
    onSuccess: () => {
      setReply(""); qc.invalidateQueries({ queryKey: ["conversation", selectedId] });
    },
  });

  return (
    <div>
      <PageHeader title="Conversations" subtitle="Email, SMS and notes with contacts" actions={
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New</button>
      } />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[70vh]">
        <div className="card overflow-y-auto">
          {list && list.length ? (
            <ul className="divide-y">
              {list.map((c) => (
                <li key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedId === c.id ? "bg-blue-50 border-l-4 border-brand" : ""}`}>
                  <div className="font-medium text-sm">{c.subject}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <MessageCircle size={12} /> {c.channel}
                    <span className="ml-auto">{c.messages.length} msg</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : <div className="p-10 text-center text-sm text-gray-400">No conversations</div>}
        </div>

        <div className="lg:col-span-2 card flex flex-col">
          {active ? (
            <>
              <div className="border-b p-4">
                <div className="font-semibold">{active.subject}</div>
                <div className="text-xs text-gray-500">{active.channel}</div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {active.messages.length ? active.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      m.sender === "user" ? "bg-brand text-white" : "bg-gray-100 text-gray-800"
                    }`}>
                      <div>{m.body}</div>
                      <div className={`text-[10px] mt-1 opacity-70`}>{new Date(m.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                )) : <div className="text-center text-sm text-gray-400 py-10">No messages yet</div>}
              </div>
              <div className="border-t p-3 flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Type a message..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && reply.trim()) sendMut.mutate(reply); }}
                />
                <button className="btn-primary" disabled={!reply.trim() || sendMut.isPending}
                        onClick={() => sendMut.mutate(reply)}>
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Select a conversation</div>
          )}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Conversation" footer={
        <>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={() => {
            if (!form.subject) { toast.error("Subject required"); return; }
            createMut.mutate(form);
          }}>Start</button>
        </>
      }>
        <div className="grid gap-3">
          <div><label className="label">Subject *</label>
            <input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
          <div><label className="label">Channel</label>
            <select className="input" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
              <option value="email">Email</option><option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option><option value="note">Internal note</option>
            </select></div>
          <div><label className="label">Contact</label>
            <select className="input" value={form.contact_id || ""} onChange={(e) => setForm({ ...form, contact_id: Number(e.target.value) || undefined })}>
              <option value="">None</option>
              {contacts?.items.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select></div>
        </div>
      </Modal>
    </div>
  );
}
