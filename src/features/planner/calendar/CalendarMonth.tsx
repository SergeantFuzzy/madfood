import { format } from "date-fns";
import { WeeklyPlan } from "../../../lib/dbTypes";
import { buildMonthGrid, weekdayLabels } from "./calendarUtils";

interface CalendarMonthProps {
  monthDate: Date;
  plansByDate: Record<string, WeeklyPlan>;
  onSelectDay: (date: Date) => void;
}

export const CalendarMonth = ({ monthDate, plansByDate, onSelectDay }: CalendarMonthProps) => {
  const cells = buildMonthGrid(monthDate);

  return (
    <div className="calendar-wrap">
      <div className="calendar-weekdays">
        {weekdayLabels.map((label) => (
          <div className="calendar-weekday" key={label}>
            {label}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((cell) => {
          const plan = plansByDate[cell.iso];

          return (
            <button
              key={cell.iso}
              type="button"
              className={["calendar-cell", cell.inMonth ? "" : "calendar-cell-out"].join(" ").trim()}
              onClick={() => onSelectDay(cell.date)}
            >
              <span className={["calendar-day", cell.isToday ? "calendar-day-today" : ""].join(" ").trim()}>
                {format(cell.date, "d")}
              </span>
              {plan?.meal_name ? <span className="calendar-plan-chip">{plan.meal_name}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};
