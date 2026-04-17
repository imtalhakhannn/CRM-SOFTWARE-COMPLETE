import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users, UserCheck, UserPlus, Flame, Coffee, Snowflake, AlertTriangle, Ban,
  Plus, Calendar, CheckSquare, Bell, TrendingUp, Activity,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import toast from "react-hot-toast";
import { contactsApi, dashboardApi, tasksApi } from "@/api/endpoints";
import Modal from "@/components/Modal";
import InviteUserModal from "@/components/InviteUserModal";

const PIE_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ec4899", "#06b6d4", "#f43f5e", "#8b5cf6"];

const STAT_GRADIENTS: Record<string, string> = {
  leads:     "from-indigo-500 to-purple-500",
  prospects: "from-amber-500 to-orange-500",
  clients:   "from-emerald-500 to-teal-500",
  rating:    "from-pink-500 to-rose-500",
};

function StatCard({
  label, value, icon: Icon, sub, gradient,
}: { label: string; value: React.ReactNode; icon: any; sub?: React.ReactNode; gradient: string }) {
  return (
    <div className="card-hover relative overflow-hidden p-5">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</div>
          <div className="text-4xl font-extrabold text-slate-800 mt-2">{value}</div>
          {sub && <div className="text-xs text-slate-500 mt-2">{sub}</div>}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const qc = useQueryClient();
  const [taskOpen, setTaskOpen] = useState(false);
  const [apptOpen, setApptOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [taskForm, setTaskForm] = useState<any>({ title: "", priority: "medium", status: "pending" });
  const [apptForm, setApptForm] = useState<any>({ title: "", start_at: "", end_at: "", location: "" });

  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: dashboardApi.stats });
  const { data: appts } = useQuery({
    queryKey: ["appts"], queryFn: () => tasksApi.appointmentsList(),
  });
  const { data: tasks } = useQuery({
    queryKey: ["my-tasks"], queryFn: () => tasksApi.list({ status: "pending" }),
  });
  const { data: contacts } = useQuery({
    queryKey: ["dash-contacts"], queryFn: () => contactsApi.list({ limit: 200 }),
  });

  const createTask = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      toast.success("Task added");
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setTaskOpen(false);
      setTaskForm({ title: "", priority: "medium", status: "pending" });
    },
    onError: () => toast.error("Failed to add task"),
  });
  const createAppt = useMutation({
    mutationFn: tasksApi.appointmentsCreate,
    onSuccess: () => {
      toast.success("Appointment added");
      qc.invalidateQueries({ queryKey: ["appts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setApptOpen(false);
      setApptForm({ title: "", start_at: "", end_at: "", location: "" });
    },
    onError: () => toast.error("Failed to add appointment"),
  });

  const completeTask = useMutation({
    mutationFn: (id: number) => tasksApi.update(id, { status: "completed" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  if (!data) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="card h-36 animate-pulse" />)}
      </div>
    );
  }

  const ratings = [
    { key: "hot",     icon: Flame,          color: "text-red-500"    },
    { key: "warm",    icon: Coffee,         color: "text-orange-500" },
    { key: "cold",    icon: Snowflake,      color: "text-sky-500"    },
    { key: "flagged", icon: AlertTriangle,  color: "text-amber-500"  },
    { key: "dead",    icon: Ban,            color: "text-slate-400"  },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
            Welcome back <span className="bg-gradient-brand bg-clip-text text-transparent">👋</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            <Activity size={14} className="text-emerald-500" />
            Overview and Stats · All branches · {new Date().toLocaleDateString(undefined, { dateStyle: "long" })}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setInviteOpen(true)}>
          <Plus size={16} /> Invite User
        </button>
      </div>
      <InviteUserModal open={inviteOpen} onClose={() => setInviteOpen(false)} />

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          label="Total Leads" value={data.total_leads} icon={UserPlus}
          gradient={STAT_GRADIENTS.leads}
          sub={<><b className="text-indigo-600">{data.leads_new_this_month}</b> new this month</>}
        />
        <StatCard
          label="Total Prospects" value={data.total_prospects} icon={UserCheck}
          gradient={STAT_GRADIENTS.prospects}
          sub={<><b className="text-amber-600">{data.prospects_new_this_month}</b> new this month</>}
        />
        <StatCard
          label="Total Clients" value={data.total_clients} icon={Users}
          gradient={STAT_GRADIENTS.clients}
          sub={<><b className="text-emerald-600">{data.clients_ongoing}</b> ongoing</>}
        />
        <div className="card-hover relative overflow-hidden p-5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-rose-500" />
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Prospects Rating</div>
          <div className="flex justify-between mt-4">
            {ratings.map(({ key, icon: Icon, color }) => (
              <div key={key} className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <Icon size={18} className={color} />
                </div>
                <div className="text-lg font-bold text-slate-700">{data.rating_counts[key] ?? 0}</div>
                <div className="text-[10px] capitalize text-slate-400">{key}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Appointments / Tasks / Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-info flex items-center justify-center text-white">
                <Calendar size={16} />
              </div>
              <h3 className="font-bold text-slate-700">My Appointments</h3>
            </div>
            <button className="btn-ghost text-xs" onClick={() => setApptOpen(true)}>
              <Plus size={14}/> Add
            </button>
          </div>
          {appts && appts.length ? (
            <ul className="space-y-2">
              {appts.slice(0, 5).map((a) => (
                <li key={a.id} className="flex items-start gap-3 text-sm p-2 rounded-lg hover:bg-slate-50">
                  <div className="mt-0.5 w-2 h-2 rounded-full bg-gradient-info" />
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">{a.title}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(a.start_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                      {a.location && ` · ${a.location}`}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Calendar} text="All Clear! No appointments." />
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-success flex items-center justify-center text-white">
                <CheckSquare size={16} />
              </div>
              <h3 className="font-bold text-slate-700">My Tasks Today</h3>
            </div>
            <button className="btn-ghost text-xs" onClick={() => setTaskOpen(true)}>
              <Plus size={14}/> Add
            </button>
          </div>
          {tasks && tasks.length ? (
            <ul className="space-y-2">
              {tasks.slice(0, 5).map((t) => (
                <li key={t.id} className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-slate-50 group">
                  <button
                    onClick={() => completeTask.mutate(t.id)}
                    className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-emerald-500 transition"
                    title="Mark complete"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">{t.title}</div>
                    <div className="text-xs text-slate-500">
                      {t.due_date ? new Date(t.due_date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "No due date"}
                    </div>
                  </div>
                  <span className={`badge ${
                    t.priority === "high" ? "bg-red-100 text-red-700" :
                    t.priority === "low"  ? "bg-slate-100 text-slate-600" : "bg-blue-100 text-blue-700"
                  }`}>{t.priority}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={CheckSquare} text="No tasks at the moment." />
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-warn flex items-center justify-center text-white">
                <Bell size={16} />
              </div>
              <h3 className="font-bold text-slate-700">Application Reminders</h3>
            </div>
          </div>
          <EmptyState icon={Bell} text="No reminders at the moment." />
        </div>
      </div>

      {/* Bottom row: Clients by user + Workflow pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-600" />
              <h3 className="font-bold text-slate-700">Clients by Users</h3>
            </div>
            <span className="text-xs text-slate-500">Top {data.clients_by_user.length}</span>
          </div>
          {data.clients_by_user.length ? (
            <div className="space-y-4">
              {data.clients_by_user.map((c: any, idx: number) => {
                const max = Math.max(...data.clients_by_user.map((x: any) => x.count));
                const pct = (c.count / max) * 100;
                return (
                  <div key={c.name}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="flex items-center gap-2 truncate max-w-[70%]">
                        <div className="w-7 h-7 rounded-full bg-gradient-brand text-white text-xs font-bold flex items-center justify-center">
                          {c.name?.[0] || "?"}
                        </div>
                        <span className="font-medium text-slate-700 truncate">{c.name}</span>
                      </span>
                      <span className="font-bold text-slate-700">{c.count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${PIE_COLORS[idx % PIE_COLORS.length]}, ${PIE_COLORS[(idx + 1) % PIE_COLORS.length]})` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState icon={TrendingUp} text="No data yet" />}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white">
              <Activity size={16} />
            </div>
            <h3 className="font-bold text-slate-700">In-Progress Applications by Workflow</h3>
          </div>
          {data.applications_by_workflow.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.applications_by_workflow} dataKey="count" nameKey="name" outerRadius={95} paddingAngle={2} label>
                    {data.applications_by_workflow.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyState icon={Activity} text="No in-progress applications" />}
        </div>
      </div>

      {/* Task modal */}
      <Modal open={taskOpen} onClose={() => setTaskOpen(false)} title="Add Task" footer={
        <>
          <button className="btn-secondary" onClick={() => setTaskOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={() => {
            if (!taskForm.title) { toast.error("Title is required"); return; }
            createTask.mutate(taskForm);
          }}>Create Task</button>
        </>
      }>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Title</label>
            <input className="input" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} autoFocus />
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="label">Due date</label>
            <input type="datetime-local" className="input"
              onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Contact</label>
            <select className="input" value={taskForm.contact_id || ""} onChange={(e) => setTaskForm({ ...taskForm, contact_id: Number(e.target.value) || undefined })}>
              <option value="">None</option>
              {contacts?.items.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={taskForm.description || ""} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
          </div>
        </div>
      </Modal>

      {/* Appointment modal */}
      <Modal open={apptOpen} onClose={() => setApptOpen(false)} title="Add Appointment" footer={
        <>
          <button className="btn-secondary" onClick={() => setApptOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={() => {
            if (!apptForm.title || !apptForm.start_at || !apptForm.end_at) {
              toast.error("Title, start and end are required"); return;
            }
            createAppt.mutate({
              ...apptForm,
              start_at: new Date(apptForm.start_at).toISOString(),
              end_at: new Date(apptForm.end_at).toISOString(),
            });
          }}>Create Appointment</button>
        </>
      }>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Title</label>
            <input className="input" value={apptForm.title} onChange={(e) => setApptForm({ ...apptForm, title: e.target.value })} autoFocus />
          </div>
          <div>
            <label className="label">Starts at</label>
            <input type="datetime-local" className="input" value={apptForm.start_at} onChange={(e) => setApptForm({ ...apptForm, start_at: e.target.value })} />
          </div>
          <div>
            <label className="label">Ends at</label>
            <input type="datetime-local" className="input" value={apptForm.end_at} onChange={(e) => setApptForm({ ...apptForm, end_at: e.target.value })} />
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" value={apptForm.location} onChange={(e) => setApptForm({ ...apptForm, location: e.target.value })} />
          </div>
          <div>
            <label className="label">Contact</label>
            <select className="input" value={apptForm.contact_id || ""} onChange={(e) => setApptForm({ ...apptForm, contact_id: Number(e.target.value) || undefined })}>
              <option value="">None</option>
              {contacts?.items.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={apptForm.description || ""} onChange={(e) => setApptForm({ ...apptForm, description: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="text-center py-10 text-slate-400">
      <Icon size={28} className="mx-auto mb-2 opacity-40" />
      <div className="text-sm">{text}</div>
    </div>
  );
}
