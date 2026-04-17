import { api } from "./client";
import type {
  AgentStat,
  Application, Appointment, Campaign, CheckIn, Contact, ContactType,
  Conversation, CourseMaterial, DashboardStats,
  Document, Invoice, Partner, Payment, Product, Quotation, Service,
  Task, Team, User, Workflow,
} from "@/types";

// Auth
export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    return data as { access_token: string; token_type: string; user: User };
  },
  me: async () => (await api.get<User>("/auth/me")).data,
  register: async (payload: { email: string; password: string; full_name: string; role?: string }) =>
    (await api.post<User>("/auth/register", payload)).data,
};

// Users
export const usersApi = {
  list: async () => (await api.get<User[]>("/users/")).data,
  create: async (payload: Partial<User> & { password: string }) =>
    (await api.post<User>("/users/", payload)).data,
};

// Contacts
export const contactsApi = {
  list: async (params?: { type?: ContactType; search?: string; skip?: number; limit?: number }) =>
    (await api.get<{ items: Contact[]; total: number }>("/contacts/", { params })).data,
  get: async (id: number) => (await api.get<Contact>(`/contacts/${id}`)).data,
  create: async (payload: Partial<Contact>) => (await api.post<Contact>("/contacts/", payload)).data,
  update: async (id: number, payload: Partial<Contact>) =>
    (await api.patch<Contact>(`/contacts/${id}`, payload)).data,
  delete: async (id: number) => (await api.delete(`/contacts/${id}`)).data,
  convert: async (id: number, to_type: ContactType) =>
    (await api.post<Contact>(`/contacts/${id}/convert`, null, { params: { to_type } })).data,
};

// Catalog
export const servicesApi = {
  list: async () => (await api.get<Service[]>("/catalog/services/")).data,
  create: async (p: Partial<Service>) => (await api.post<Service>("/catalog/services/", p)).data,
  update: async (id: number, p: Partial<Service>) =>
    (await api.patch<Service>(`/catalog/services/${id}`, p)).data,
  delete: async (id: number) => (await api.delete(`/catalog/services/${id}`)).data,
};
export const partnersApi = {
  list: async () => (await api.get<Partner[]>("/catalog/partners/")).data,
  create: async (p: Partial<Partner>) => (await api.post<Partner>("/catalog/partners/", p)).data,
  update: async (id: number, p: Partial<Partner>) =>
    (await api.patch<Partner>(`/catalog/partners/${id}`, p)).data,
  delete: async (id: number) => (await api.delete(`/catalog/partners/${id}`)).data,
};
export const productsApi = {
  list: async () => (await api.get<Product[]>("/catalog/products/")).data,
  create: async (p: Partial<Product>) => (await api.post<Product>("/catalog/products/", p)).data,
  update: async (id: number, p: Partial<Product>) =>
    (await api.patch<Product>(`/catalog/products/${id}`, p)).data,
  delete: async (id: number) => (await api.delete(`/catalog/products/${id}`)).data,
};

// Applications
export const applicationsApi = {
  list: async (params?: Record<string, any>) =>
    (await api.get<Application[]>("/applications/", { params })).data,
  get: async (id: number) => (await api.get<Application>(`/applications/${id}`)).data,
  create: async (p: Partial<Application>) => (await api.post<Application>("/applications/", p)).data,
  update: async (id: number, p: Partial<Application>) =>
    (await api.patch<Application>(`/applications/${id}`, p)).data,
  delete: async (id: number) => (await api.delete(`/applications/${id}`)).data,
  workflows: async () => (await api.get<Workflow[]>("/applications/workflows/")).data,
  createWorkflow: async (p: { name: string; stages: { name: string; order: number; is_final?: boolean }[]; color?: string }) =>
    (await api.post<Workflow>("/applications/workflows/", p)).data,
};

// Tasks
export const tasksApi = {
  list: async (params?: Record<string, any>) =>
    (await api.get<Task[]>("/tasks/", { params })).data,
  create: async (p: Partial<Task>) => (await api.post<Task>("/tasks/", p)).data,
  update: async (id: number, p: Partial<Task>) =>
    (await api.patch<Task>(`/tasks/${id}`, p)).data,
  delete: async (id: number) => (await api.delete(`/tasks/${id}`)).data,
  appointmentsList: async (params?: Record<string, any>) =>
    (await api.get<Appointment[]>("/tasks/appointments/", { params })).data,
  appointmentsCreate: async (p: Partial<Appointment>) =>
    (await api.post<Appointment>("/tasks/appointments/", p)).data,
};

// Documents
export const documentsApi = {
  list: async (params?: { contact_id?: number; application_id?: number }) =>
    (await api.get<Document[]>("/documents/", { params })).data,
  upload: async (file: File, meta: { name?: string; category?: string; contact_id?: number; application_id?: number }) => {
    const fd = new FormData();
    fd.append("file", file);
    if (meta.name) fd.append("name", meta.name);
    if (meta.category) fd.append("category", meta.category);
    if (meta.contact_id) fd.append("contact_id", String(meta.contact_id));
    if (meta.application_id) fd.append("application_id", String(meta.application_id));
    const { data } = await api.post<Document>("/documents/", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  downloadUrl: (id: number) => `${api.defaults.baseURL}/documents/${id}/download`,
  delete: async (id: number) => (await api.delete(`/documents/${id}`)).data,
};

// Dashboard
export const dashboardApi = {
  stats: async () => (await api.get<DashboardStats>("/dashboard/")).data,
};

// Conversations
export const conversationsApi = {
  list: async (contact_id?: number) =>
    (await api.get<Conversation[]>("/conversations/", { params: contact_id ? { contact_id } : undefined })).data,
  get: async (id: number) => (await api.get<Conversation>(`/conversations/${id}`)).data,
  create: async (p: { subject: string; channel?: string; contact_id?: number }) =>
    (await api.post<Conversation>("/conversations/", p)).data,
  addMessage: async (id: number, body: string, sender = "user") =>
    (await api.post(`/conversations/${id}/messages`, { body, sender })).data,
};

// Quotations
export const quotationsApi = {
  list: async () => (await api.get<Quotation[]>("/quotations/")).data,
  get: async (id: number) => (await api.get<Quotation>(`/quotations/${id}`)).data,
  create: async (p: any) => (await api.post<Quotation>("/quotations/", p)).data,
  delete: async (id: number) => (await api.delete(`/quotations/${id}`)).data,
};

// Accounts (Invoices + Payments)
export const invoicesApi = {
  list: async (params?: Record<string, any>) =>
    (await api.get<Invoice[]>("/accounts/invoices/", { params })).data,
  get: async (id: number) => (await api.get<Invoice>(`/accounts/invoices/${id}`)).data,
  create: async (p: any) => (await api.post<Invoice>("/accounts/invoices/", p)).data,
  update: async (id: number, p: any) =>
    (await api.patch<Invoice>(`/accounts/invoices/${id}`, p)).data,
  delete: async (id: number) => (await api.delete(`/accounts/invoices/${id}`)).data,
  addPayment: async (id: number, p: any) =>
    (await api.post<Payment>(`/accounts/invoices/${id}/payments`, p)).data,
};

// Campaigns
export const campaignsApi = {
  list: async () => (await api.get<Campaign[]>("/campaigns/")).data,
  create: async (p: any) => (await api.post<Campaign>("/campaigns/", p)).data,
  update: async (id: number, p: any) => (await api.patch<Campaign>(`/campaigns/${id}`, p)).data,
  delete: async (id: number) => (await api.delete(`/campaigns/${id}`)).data,
  send: async (id: number) => (await api.post<Campaign>(`/campaigns/${id}/send`)).data,
};

// Classroom
export const classroomApi = {
  list: async () => (await api.get<CourseMaterial[]>("/classroom/")).data,
  get: async (id: number) => (await api.get<CourseMaterial>(`/classroom/${id}`)).data,
  create: async (p: any) => (await api.post<CourseMaterial>("/classroom/", p)).data,
  update: async (id: number, p: any) => (await api.patch<CourseMaterial>(`/classroom/${id}`, p)).data,
  delete: async (id: number) => (await api.delete(`/classroom/${id}`)).data,
};

// Check-in
export const checkinApi = {
  list: async (params?: Record<string, any>) =>
    (await api.get<CheckIn[]>("/checkin/", { params })).data,
  current: async () => (await api.get<CheckIn | null>("/checkin/me/current")).data,
  in: async (p: { location?: string; notes?: string } = {}) =>
    (await api.post<CheckIn>("/checkin/in", p)).data,
  out: async () => (await api.post<CheckIn>("/checkin/out")).data,
};

// Teams
export const teamsApi = {
  list: async () => (await api.get<Team[]>("/users/teams/")).data,
  create: async (p: Partial<Team>) => (await api.post<Team>("/users/teams/", p)).data,
};

// Agents
export const agentsApi = {
  list: async () => (await api.get<User[]>("/agents/")).data,
  stats: async () => (await api.get<AgentStat[]>("/agents/stats")).data,
};

// Notifications
export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  severity: "info" | "warning" | "danger";
  link: string;
  created_at: string;
};
export const notificationsApi = {
  list: async () =>
    (await api.get<{ items: NotificationItem[]; total: number }>("/notifications/")).data,
};

// Reports
export const reportsApi = {
  summary: async (params?: { start?: string; end?: string }) =>
    (await api.get("/reports/summary", { params })).data,
  appsByStatus: async () =>
    (await api.get<{ status: string; count: number }[]>("/reports/applications-by-status")).data,
  contactsByType: async () =>
    (await api.get<{ type: string; count: number }[]>("/reports/contacts-by-type")).data,
  revenueMonthly: async () =>
    (await api.get<{ month: string; paid: number; invoiced: number }[]>("/reports/revenue-monthly")).data,
};
