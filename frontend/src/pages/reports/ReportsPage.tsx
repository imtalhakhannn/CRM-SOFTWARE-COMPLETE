import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { reportsApi } from "@/api/endpoints";
import PageHeader from "@/components/PageHeader";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#fb923c"];

export default function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [start, setStart] = useState(monthAgo);
  const [end, setEnd] = useState(today);

  const { data: summary } = useQuery({ queryKey: ["rep-summary", start, end], queryFn: () => reportsApi.summary({ start, end }) });
  const { data: appsByStatus } = useQuery({ queryKey: ["rep-apps"], queryFn: reportsApi.appsByStatus });
  const { data: contactsByType } = useQuery({ queryKey: ["rep-contacts"], queryFn: reportsApi.contactsByType });
  const { data: revenue } = useQuery({ queryKey: ["rep-revenue"], queryFn: reportsApi.revenueMonthly });

  return (
    <div>
      <PageHeader title="Reports" subtitle="Aggregate insights across contacts, applications and revenue" />

      <div className="card p-4 mb-4 flex gap-3 items-end">
        <div><label className="label">Start</label><input type="date" className="input" value={start} onChange={(e) => setStart(e.target.value)} /></div>
        <div><label className="label">End</label><input type="date" className="input" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
        {summary && [
          ["New contacts", summary.new_contacts],
          ["New leads", summary.new_leads],
          ["New clients", summary.new_clients],
          ["Applications", summary.applications_total],
          ["Revenue", `$${summary.revenue.toFixed(2)}`],
        ].map(([label, value]) => (
          <div key={String(label)} className="card p-4">
            <div className="text-xs text-gray-500 uppercase">{label}</div>
            <div className="text-2xl font-bold mt-1">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold uppercase text-gray-600 mb-3">Applications by Status</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={appsByStatus || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold uppercase text-gray-600 mb-3">Contacts by Type</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={contactsByType || []} dataKey="count" nameKey="type" outerRadius={90} label>
                  {(contactsByType || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold uppercase text-gray-600 mb-3">Monthly Revenue (invoiced vs. paid)</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={revenue || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip /><Legend />
              <Bar dataKey="invoiced" fill="#94a3b8" />
              <Bar dataKey="paid" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
