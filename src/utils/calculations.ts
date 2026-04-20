import { TimeLog, Task, PaymentRecord, PaymentStatus } from '../context/types';

export function calculateLogEarnings(log: TimeLog, task: Task): number {
  if (task.paymentType === 'non-billable') return 0;
  if (task.paymentType === 'fixed') return task.rate;
  return parseFloat(((log.durationMinutes / 60) * task.rate).toFixed(2));
}

export function taskTotalEarnings(taskId: string, logs: TimeLog[], tasks: Task[]): number {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return 0;
  return logs
    .filter(l => l.taskId === taskId)
    .reduce((sum, log) => sum + calculateLogEarnings(log, task), 0);
}

export function minutesToDisplay(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function parseDuration(input: string): number | null {
  const hourMatch = input.match(/(\d+)\s*h/i);
  const minuteMatch = input.match(/(\d+)\s*m/i);
  const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
  const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
  if (hours === 0 && minutes === 0) return null;
  return hours * 60 + minutes;
}

export function formatMoney(amount: number, symbol = '$'): string {
  if (amount % 1 === 0) return `${symbol}${amount}`;
  return `${symbol}${amount.toFixed(2)}`;
}

export function getMonthSummary(
  clientId: string,
  month: string,
  logs: TimeLog[],
  tasks: Task[],
  payments: PaymentRecord[]
): { earned: number; paid: number; pending: number } {
  const monthLogs = logs.filter(
    l => l.clientId === clientId && l.date.startsWith(month)
  );
  const earned = monthLogs.reduce((sum, log) => {
    const task = tasks.find(t => t.id === log.taskId);
    if (!task) return sum;
    return sum + calculateLogEarnings(log, task);
  }, 0);

  const monthPayments = payments.filter(
    p => p.clientId === clientId && p.month === month
  );
  const paid = monthPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const pending = Math.max(0, earned - paid);

  return { earned, paid, pending };
}

export function getRolloverPayments(
  clientId: string,
  beforeMonth: string,
  payments: PaymentRecord[]
): PaymentRecord[] {
  return payments.filter(
    p =>
      p.clientId === clientId &&
      p.month < beforeMonth &&
      p.status !== 'paid' &&
      p.amountEarned - p.amountPaid > 0
  );
}

export function derivePaymentStatus(earned: number, paid: number): PaymentStatus {
  if (paid <= 0) return 'pending';
  if (paid >= earned) return 'paid';
  return 'partial';
}
