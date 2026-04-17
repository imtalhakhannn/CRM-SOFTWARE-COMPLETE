import { useQuery } from "@tanstack/react-query";
import { Network } from "lucide-react";
import { agentsApi } from "@/api/endpoints";
import PageHeader from "@/components/PageHeader";

export default function AgentsPage() {
  const { data } = useQuery({ queryKey: ["agents-stats"], queryFn: agentsApi.stats });

  return (
    <div>
      <PageHeader title="Agents" subtitle="Users with the agent role and their assigned contacts" />
      <div className="card overflow-hidden">
        <table className="table">
          <thead><tr><th></th><th>Name</th><th>Email</th><th>Assigned Contacts</th></tr></thead>
          <tbody>
            {data?.map((a) => (
              <tr key={a.id}>
                <td className="w-10"><Network size={16} className="text-brand" /></td>
                <td>{a.full_name}</td>
                <td>{a.email}</td>
                <td><span className="badge bg-brand text-white">{a.contact_count}</span></td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={4} className="text-center py-10 text-gray-400">No agents yet. Create users with role=agent.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
