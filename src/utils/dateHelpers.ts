import {
  format,
  startOfWeek,
  addDays,
  isToday,
  isFuture,
  parseISO,
} from 'date-fns';

export function getCurrentWeekDays(referenceDate: Date): Date[] {
  const monday = startOfWeek(referenceDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatDisplayDate(dateStr: string): string {
  return format(parseISO(dateStr), 'EEE, MMM d');
}

export function formatMonthLabel(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(parseInt(year), parseInt(m) - 1, 1);
  return format(date, 'MMM yyyy');
}

export function getPast6Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(format(d, 'yyyy-MM'));
  }
  return months;
}

export function isFutureDay(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d > today;
}

export function isDayToday(date: Date): boolean {
  return isToday(date);
}

export function currentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}
