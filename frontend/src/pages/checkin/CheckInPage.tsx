import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { checkinApi } from "@/api/endpoints";
import PageHeader from "@/components/PageHeader";

export default function CheckInPage() {
  const qc = useQueryClient();
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const { data: current } = useQuery({ queryKey: ["checkin-current"], queryFn: checkinApi.current });
  const { data: list } = useQuery({ queryKey: ["checkin-history"], queryFn: () => checkinApi.list({ limit: 25 }) });

  const inMut = useMutation({
    mutationFn: () => checkinApi.in({ location, notes }),
    onSuccess: () => { toast.success("Checked in"); setLocation(""); setNotes(""); qc.invalidateQueries(); },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Failed"),
  });
  const outMut = useMutation({
    mutationFn: checkinApi.out,
    onSuccess: () => { toast.success("Checked out"); qc.invalidateQueries(); },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Failed"),
  });

  return (
    <div>
      <PageHeader title="Office Check-In" subtitle="Track your attendance" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="card p-6">
          <div className="text-xs uppercase text-gray-500 mb-2">Current status</div>
          {current ? (
            <div>
              <div className="text-xl font-semibold text-green-600 mb-1">Checked in</div>
              <div className="text-sm text-gray-600">Since {new Date(current.check_in_at).toLocaleString()}</div>
              {current.location && <div className="text-sm text-gray-500">📍 {current.location}</div>}
              <button className="btn-danger mt-4" onClick={() => outMut.mutate()}><LogOut size={16}/> Check out</button>
            </div>
          ) : (
            <div>
              <div className="text-xl font-semibold text-gray-600 mb-3">Not checked in</div>
              <div className="grid gap-2">
                <input className="input" placeholder="Location (optional)" value={location} onChange={(e) => setLocation(e.target.value)} />
                <input className="input" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
                <button className="btn-primary" onClick={() => inMut.mutate()}><LogIn size={16}/> Check in</button>
              </div>
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="text-xs uppercase text-gray-500 mb-3">Recent history</div>
          {list && list.length ? (
            <ul className="divide-y">
              {list.slice(0, 10).map((c) => {
                const duration = c.check_out_at
                  ? ((new Date(c.check_out_at).getTime() - new Date(c.check_in_at).getTime()) / 3600000).toFixed(2) + "h"
                  : "ongoing";
                return (
                  <li key={c.id} className="py-2 text-sm flex justify-between">
                    <div>
                      <div>{new Date(c.check_in_at).toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{c.location || "—"}</div>
                    </div>
                    <span className="text-gray-700">{duration}</span>
                  </li>
                );
              })}
            </ul>
          ) : <div className="text-sm text-gray-400">No history yet.</div>}
        </div>
      </div>
    </div>
  );
}
