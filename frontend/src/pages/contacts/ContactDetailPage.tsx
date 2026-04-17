import { useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Upload, Download, Trash2, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { applicationsApi, contactsApi, documentsApi, tasksApi } from "@/api/endpoints";
import PageHeader from "@/components/PageHeader";

export default function ContactDetailPage() {
  const { id } = useParams();
  const cid = Number(id);
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"overview" | "applications" | "tasks" | "documents">("overview");

  const { data: contact } = useQuery({ queryKey: ["contact", cid], queryFn: () => contactsApi.get(cid) });
  const { data: apps } = useQuery({
    queryKey: ["contact-apps", cid],
    queryFn: () => applicationsApi.list({ contact_id: cid }),
  });
  const { data: tasks } = useQuery({
    queryKey: ["contact-tasks", cid],
    queryFn: () => tasksApi.list({ contact_id: cid }),
  });
  const { data: docs } = useQuery({
    queryKey: ["contact-docs", cid],
    queryFn: () => documentsApi.list({ contact_id: cid }),
  });

  const uploadMut = useMutation({
    mutationFn: async (file: File) =>
      documentsApi.upload(file, { contact_id: cid, name: file.name }),
    onSuccess: () => {
      toast.success("Uploaded");
      qc.invalidateQueries({ queryKey: ["contact-docs", cid] });
    },
    onError: () => toast.error("Upload failed"),
  });

  const deleteDocMut = useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contact-docs", cid] }),
  });

  if (!contact) return <div>Loading…</div>;

  return (
    <div>
      <Link to="/contacts" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
        <ArrowLeft size={14} /> Back to contacts
      </Link>

      <PageHeader
        title={contact.full_name}
        subtitle={`${contact.type.toUpperCase()}${contact.email ? ` • ${contact.email}` : ""}`}
      />

      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {(["overview", "applications", "tasks", "documents"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize transition ${
              tab === t ? "border-b-2 border-brand text-brand font-medium" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="card p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Field label="Phone" value={contact.phone} />
          <Field label="Alt phone" value={contact.alt_phone} />
          <Field label="Email" value={contact.email} />
          <Field label="Nationality" value={contact.nationality} />
          <Field label="Date of birth" value={contact.date_of_birth} />
          <Field label="Passport" value={contact.passport_number} />
          <Field label="Address" value={[contact.address, contact.city, contact.state, contact.country].filter(Boolean).join(", ")} />
          <Field label="Rating" value={contact.rating} />
          <Field label="Source" value={contact.source} />
          <div className="md:col-span-2">
            <Field label="Notes" value={contact.notes} />
          </div>
        </div>
      )}

      {tab === "applications" && (
        <div className="card overflow-hidden">
          <table className="table">
            <thead><tr><th>Ref</th><th>Title</th><th>Status</th><th>Amount</th></tr></thead>
            <tbody>
              {apps?.map((a) => (
                <tr key={a.id}>
                  <td className="font-mono text-xs">{a.reference}</td>
                  <td>{a.title}</td>
                  <td>{a.status}</td>
                  <td>{a.currency} {a.amount.toFixed(2)}</td>
                </tr>
              ))}
              {!apps?.length && <tr><td colSpan={4} className="text-center text-gray-400 py-8">No applications</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === "tasks" && (
        <div className="card overflow-hidden">
          <table className="table">
            <thead><tr><th>Title</th><th>Status</th><th>Due</th><th>Priority</th></tr></thead>
            <tbody>
              {tasks?.map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{t.status}</td>
                  <td>{t.due_date ? new Date(t.due_date).toLocaleString() : "-"}</td>
                  <td>{t.priority}</td>
                </tr>
              ))}
              {!tasks?.length && <tr><td colSpan={4} className="text-center text-gray-400 py-8">No tasks</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === "documents" && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Documents</h3>
            <button className="btn-primary" onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> Upload
            </button>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadMut.mutate(f);
                e.target.value = "";
              }}
            />
          </div>
          {docs?.length ? (
            <ul className="divide-y">
              {docs.map((d) => (
                <li key={d.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">{d.name}</div>
                      <div className="text-xs text-gray-500">{(d.size_bytes / 1024).toFixed(1)} KB • {d.mime_type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={documentsApi.downloadUrl(d.id)} target="_blank" rel="noreferrer" className="btn-secondary">
                      <Download size={14} />
                    </a>
                    <button className="btn-danger" onClick={() => deleteDocMut.mutate(d.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-sm text-gray-400 py-10">No documents uploaded yet.</div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-gray-800">{value || "-"}</div>
    </div>
  );
}
