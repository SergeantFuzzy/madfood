import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek
} from "date-fns";

export interface CalendarDayCell {
  date: Date;
  iso: string;
  inMonth: boolean;
  isToday: boolean;
}

export const buildMonthGrid = (monthDate: Date): CalendarDayCell[] => {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  return eachDayOfInterval({ start: gridStart, end: gridEnd }).map((date) => ({
    date,
    iso: format(date, "yyyy-MM-dd"),
    inMonth: isSameMonth(date, monthDate),
    isToday: isSameDay(date, new Date())
  }));
};

export const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
