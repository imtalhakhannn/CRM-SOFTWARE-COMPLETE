import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { usersApi } from "@/api/endpoints";
import Modal from "@/components/Modal";

const ROLES = ["super_admin", "admin", "manager", "consultant", "agent", "viewer"] as const;

export default function InviteUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>({
    email: "", full_name: "", password: "", role: "consultant", phone: "",
  });

  const mut = useMutation({
    mutationFn: () => usersApi.create(form),
    onSuccess: () => {
      toast.success("User invited");
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["agents-stats"] });
      onClose();
      setForm({ email: "", full_name: "", password: "", role: "consultant", phone: "" });
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Failed — check permissions"),
  });

  return (
    <Modal open={open} onClose={onClose} title="Invite new user" footer={
      <>
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={() => {
          if (!form.email || !form.full_name || !form.password) {
            toast.error("Email, name and password are required"); return;
          }
          mut.mutate();
        }}>Send invitation</button>
      </>
    }>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="label">Full name *</label>
          <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} autoFocus />
        </div>
        <div>
          <label className="label">Email *</label>
          <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Password *</label>
          <input className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
      </div>
      <div className="mt-4 text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
        User will be able to log in immediately with the email and password you set here. They can change the password after first login.
      </div>
    </Modal>
  );
}
