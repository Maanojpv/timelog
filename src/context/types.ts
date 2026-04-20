export interface Client {
  id: string;
  name: string;
  initial: string;
  color: string;
  createdAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  color: string;
  createdAt: string;
}

export type PaymentType = 'hourly' | 'fixed' | 'non-billable';

export interface Task {
  id: string;
  projectId: string;
  clientId: string;
  name: string;
  paymentType: PaymentType;
  rate: number;
  createdAt: string;
}

export type LogMethod = 'range' | 'duration';

export interface TimeLog {
  id: string;
  taskId: string;
  projectId: string;
  clientId: string;
  date: string;
  method: LogMethod;
  startTime?: string;
  endTime?: string;
  durationMinutes: number;
  note?: string;
  tags?: string[];
  createdAt: string;
}

export type PaymentStatus = 'paid' | 'partial' | 'pending';

export interface PaymentRecord {
  id: string;
  clientId: string;
  projectId: string;
  month: string;
  amountEarned: number;
  amountPaid: number;
  status: PaymentStatus;
  paidAt?: string;
  notes?: string;
}

export interface Settings {
  userName: string;
  currency: string;
  currencySymbol: string;
  defaultRate: number;
}

export interface AppState {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  logs: TimeLog[];
  payments: PaymentRecord[];
  activeClientId: string | null;
  settings: Settings;
  onboardingComplete: boolean;
  tags: string[];
}

export interface TaskWithEarnings extends Task {
  totalMinutes: number;
  totalEarned: number;
}

export interface ProjectWithTotals extends Project {
  tasks: TaskWithEarnings[];
  totalMinutes: number;
  totalEarned: number;
}

export interface MonthReportRow {
  project: Project;
  hours: string;
  earned: number;
  paid: number;
  pending: number;
  status: PaymentStatus;
  carriedOverFromMonth?: string;
}
