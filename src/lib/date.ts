const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const shortMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const shortWeekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pad = (value: number) => String(value).padStart(2, "0");

export const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

export const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

export const addMonths = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
};

export const subMonths = (date: Date, amount: number) => addMonths(date, -amount);

export const getMonth = (date: Date) => date.getMonth();

export const getYear = (date: Date) => date.getFullYear();

export const isSameMonth = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();

export const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();

export const eachDayOfInterval = ({ start, end }: { start: Date; end: Date }) => {
  const days: Date[] = [];
  const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const limit = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (current <= limit) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
};

export const startOfWeek = (date: Date, options?: { weekStartsOn?: number }) => {
  const weekStartsOn = options?.weekStartsOn ?? 0;
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const shift = (next.getDay() - weekStartsOn + 7) % 7;
  next.setDate(next.getDate() - shift);
  return next;
};

export const endOfWeek = (date: Date, options?: { weekStartsOn?: number }) => {
  const start = startOfWeek(date, options);
  const next = new Date(start);
  next.setDate(start.getDate() + 6);
  return next;
};

export const format = (date: Date, pattern: string) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const weekday = date.getDay();

  switch (pattern) {
    case "yyyy-MM-dd":
      return `${year}-${pad(month + 1)}-${pad(day)}`;
    case "MMMM yyyy":
      return `${monthNames[month]} ${year}`;
    case "MMMM":
      return monthNames[month];
    case "EEEE, MMM d":
      return `${weekdayNames[weekday]}, ${shortMonthNames[month]} ${day}`;
    case "EEE, MMM d":
      return `${shortWeekdayNames[weekday]}, ${shortMonthNames[month]} ${day}`;
    case "d":
      return String(day);
    default:
      return date.toISOString();
  }
};
