import { WeeklyPlan } from "../../../lib/dbTypes";
import { format } from "../../../lib/date";
import { buildMonthGrid, weekdayLabels } from "./calendarUtils";

interface CalendarMonthProps {
  monthDate: Date;
  plansByDate: Record<string, WeeklyPlan>;
  onSelectDay: (date: Date) => void;
}

export const CalendarMonth = ({ monthDate, plansByDate, onSelectDay }: CalendarMonthProps) => {
  const cells = buildMonthGrid(monthDate);
  const monthCells = cells.filter((cell) => cell.inMonth);

  const getPlanLabel = (plan?: WeeklyPlan) => {
    if (plan?.meal_name?.trim()) return plan.meal_name;
    if (plan?.recipe_id) return "Recipe selected";
    return "No meal planned";
  };

  return (
    <div className="calendar-wrap">
      <div className="calendar-desktop">
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
            const hasPlan = Boolean(plan?.meal_name) || Boolean(plan?.recipe_id);

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
                {hasPlan ? <span className="calendar-plan-chip">{getPlanLabel(plan)}</span> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="calendar-mobile-list" aria-label={`${format(monthDate, "MMMM yyyy")} meal plan`}>
        {monthCells.map((cell) => {
          const plan = plansByDate[cell.iso];
          const hasPlan = Boolean(plan?.meal_name) || Boolean(plan?.recipe_id);

          return (
            <button
              key={cell.iso}
              type="button"
              className={["calendar-mobile-row", hasPlan ? "calendar-mobile-row-filled" : ""].join(" ").trim()}
              onClick={() => onSelectDay(cell.date)}
            >
              <span className="calendar-mobile-row-head">
                <span className="calendar-mobile-date">{format(cell.date, "EEE, MMM d")}</span>
                {cell.isToday ? <span className="calendar-mobile-today">Today</span> : null}
              </span>
              <span className={["calendar-mobile-meal", hasPlan ? "calendar-mobile-meal-filled" : ""].join(" ").trim()}>
                {getPlanLabel(plan)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
