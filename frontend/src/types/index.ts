export type UserRole = "super_admin" | "admin" | "manager" | "consultant" | "agent" | "viewer";

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string;
  branch_id?: number;
  team_id?: number;
}

export type ContactType = "lead" | "prospect" | "client";
export type ProspectRating = "hot" | "warm" | "cold" | "flagged" | "dead";

export interface Contact {
  id: number;
  first_name: string;
  last_name?: string;
  full_name: string;
  email?: string;
  phone?: string;
  alt_phone?: string;
  type: ContactType;
  rating?: ProspectRating;
  source?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  passport_number?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  notes?: string;
  branch_id?: number;
  assigned_to_id?: number;
}

export interface Service {
  id: number;
  name: string;
  code?: string;
  description?: string;
  base_price: number;
  currency: string;
  is_active: boolean;
}

export interface Partner {
  id: number;
  name: string;
  type?: string;
  country?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  commission_rate: number;
  notes?: string;
  is_active: boolean;
}

export interface Product {
  id: number;
  name: string;
  code?: string;
  description?: string;
  price: number;
  currency: string;
  duration_months?: number;
  level?: string;
  intake?: string;
  is_active: boolean;
  service_id?: number;
  partner_id?: number;
}

export type ApplicationStatus =
  | "new" | "in_progress" | "submitted" | "approved" | "rejected" | "withdrawn" | "completed";

export interface Application {
  id: number;
  reference: string;
  title: string;
  status: ApplicationStatus;
  expected_start?: string;
  amount: number;
  currency: string;
  notes?: string;
  contact_id: number;
  product_id?: number;
  service_id?: number;
  partner_id?: number;
  workflow_id?: number;
  current_stage_id?: number;
  assigned_to_id?: number;
}

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface Task {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  status: TaskStatus;
  priority: string;
  assignee_id?: number;
  contact_id?: number;
  application_id?: number;
}

export interface Appointment {
  id: number;
  title: string;
  description?: string;
  start_at: string;
  end_at: string;
  location?: string;
  is_done: boolean;
  user_id?: number;
  contact_id?: number;
}

export interface Document {
  id: number;
  name: string;
  original_filename: string;
  mime_type?: string;
  size_bytes: number;
  category?: string;
  contact_id?: number;
  application_id?: number;
  uploaded_by_id?: number;
}

export interface DashboardStats {
  total_leads: number;
  total_prospects: number;
  total_clients: number;
  prospects_new_this_month: number;
  leads_new_this_month: number;
  clients_ongoing: number;
  rating_counts: Record<string, number>;
  clients_by_user: { name: string; count: number }[];
  applications_by_workflow: { name: string; count: number }[];
  tasks_today: number;
  appointments_today: number;
}

export interface Workflow {
  id: number;
  name: string;
  description?: string;
  color?: string;
  stages: { id: number; name: string; order: number; is_final: boolean; workflow_id: number }[];
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "partially_paid" | "overdue" | "cancelled";

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Payment {
  id: number;
  invoice_id: number;
  paid_on: string;
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
}

export interface Invoice {
  id: number;
  reference: string;
  contact_id: number;
  application_id?: number;
  issue_date: string;
  due_date?: string;
  currency: string;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  total: number;
  amount_paid: number;
  notes?: string;
  items: InvoiceItem[];
  payments: Payment[];
}

export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "cancelled";

export interface Campaign {
  id: number;
  name: string;
  type: string;
  status: CampaignStatus;
  subject?: string;
  content?: string;
  target_filter?: string;
  scheduled_at?: string;
  sent_at?: string;
  recipient_count: number;
  delivered_count: number;
  opened_count: number;
  created_by_id?: number;
}

export interface CourseMaterial {
  id: number;
  title: string;
  category?: string;
  description?: string;
  content?: string;
  video_url?: string;
  duration_minutes?: number;
  document_id?: number;
}

export interface CheckIn {
  id: number;
  user_id: number;
  check_in_at: string;
  check_out_at?: string;
  location?: string;
  notes?: string;
}

export interface Quotation {
  id: number;
  reference: string;
  contact_id: number;
  issue_date: string;
  valid_until?: string;
  currency: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  items: { id: number; description: string; quantity: number; unit_price: number; amount: number }[];
}

export interface ConversationMessage {
  id: number;
  body: string;
  sender: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  subject: string;
  channel: string;
  contact_id?: number;
  user_id?: number;
  messages: ConversationMessage[];
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  branch_id?: number;
}

export interface AgentStat {
  id: number;
  full_name: string;
  email: string;
  contact_count: number;
}
