import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import AppLayout from "@/layouts/AppLayout";
import LoginPage from "@/pages/auth/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ContactsPage from "@/pages/contacts/ContactsPage";
import ContactDetailPage from "@/pages/contacts/ContactDetailPage";
import ApplicationsPage from "@/pages/applications/ApplicationsPage";
import TasksPage from "@/pages/tasks/TasksPage";
import ServicesPage from "@/pages/catalog/ServicesPage";
import PartnersPage from "@/pages/catalog/PartnersPage";
import ProductsPage from "@/pages/catalog/ProductsPage";
import ConversationsPage from "@/pages/conversations/ConversationsPage";
import QuotationsPage from "@/pages/quotations/QuotationsPage";
import AccountsPage from "@/pages/accounts/AccountsPage";
import CampaignsPage from "@/pages/campaigns/CampaignsPage";
import ClassroomPage from "@/pages/classroom/ClassroomPage";
import TeamsPage from "@/pages/teams/TeamsPage";
import AgentsPage from "@/pages/agents/AgentsPage";
import CheckInPage from "@/pages/checkin/CheckInPage";
import ReportsPage from "@/pages/reports/ReportsPage";

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="contacts/:id" element={<ContactDetailPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="partners" element={<PartnersPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="conversations" element={<ConversationsPage />} />
        <Route path="quotations" element={<QuotationsPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="classroom" element={<ClassroomPage />} />
        <Route path="campaign" element={<CampaignsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="office-checkin" element={<CheckInPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
