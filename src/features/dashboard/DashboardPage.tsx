import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Flower2, ListChecks, Utensils } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Loading } from "../../components/ui/Loading";
import { formatCurrency } from "../../lib/format";
import { useAuth } from "../auth/AuthContext";
import { getDailyMotivation } from "./dailyMotivation";
import {
  getCurrentWeekEstimatedMealCostTotal,
  getNextAvailablePlanningDateThisWeek,
  getNextPlannedMealThisWeek,
  getPlannedDaysThisWeek,
  type NextPlannedMealThisWeek
} from "../planner/plannerService";
import { getCurrentWeekSpendTotal } from "../shopping/shoppingService";

export const DashboardPage = () => {
  const { displayName } = useAuth();
  const today = new Date();
  const dailyMotivation = getDailyMotivation(today);
  const [plannedDays, setPlannedDays] = useState<number>(0);
  const [nextPlannedMeal, setNextPlannedMeal] = useState<NextPlannedMealThisWeek | null>(null);
  const [nextAvailablePlanningDate, setNextAvailablePlanningDate] = useState<string | null>(null);
  const [currentWeekSpend, setCurrentWeekSpend] = useState(0);
  const [currentWeekMealEstimate, setCurrentWeekMealEstimate] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatPlannedDate = (dateLabel: string) => {
    const [year, month, day] = dateLabel.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  };

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [count, nextMeal, nextAvailableDate, weekSpend, weekMealEstimate] = await Promise.all([
          getPlannedDaysThisWeek(),
          getNextPlannedMealThisWeek(),
          getNextAvailablePlanningDateThisWeek(),
          getCurrentWeekSpendTotal(),
          getCurrentWeekEstimatedMealCostTotal()
        ]);
        if (!active) return;
        setPlannedDays(count);
        setNextPlannedMeal(nextMeal);
        setNextAvailablePlanningDate(nextAvailableDate);
        setCurrentWeekSpend(weekSpend);
        setCurrentWeekMealEstimate(weekMealEstimate);
        setLastUpdatedAt(new Date());
      } catch (err) {
        const value = err as { message?: string };
        if (!active) return;
        setError(value.message ?? "Failed to load dashboard data");
      } finally {
        if (active) setLoading(false);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="container stack">
      <Card>
        <div className="section-head mb-05">
          <h2 className="daily-inspiration-title">
            <span className="flower-icon-wrap" aria-hidden="true">
              <Flower2 className="daily-inspiration-icon" size={16} />
            </span>
            Daily inspiration
          </h2>
          <span className="badge">Today</span>
        </div>
        <p className="muted mb-05">{today.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</p>
        <p className="motivation-quote">"{dailyMotivation.quote}"</p>
        <p className="motivation-statement">{dailyMotivation.encouragement}</p>
      </Card>

      <div className="page-header">
        <h1 className="page-title">{displayName ? `Welcome back, ${displayName}` : "Welcome back"}</h1>
        <p className="page-subtitle">Track this week and jump quickly into your workflow.</p>
      </div>

      <Card>
        <div className="section-head">
          <h2>This week</h2>
          <span className="badge">Summary</span>
        </div>
        {loading ? <Loading label="Loading weekly summary..." /> : null}
        {error ? <p className="error-text">{error}</p> : null}
        {!loading && !error ? <p className="mb-04">{plannedDays} day(s) currently planned.</p> : null}
        {!loading && !error ? <p className="mb-04">Current week spend: {formatCurrency(currentWeekSpend)}</p> : null}
        {!loading && !error ? <p className="mb-04">Estimated planned meal cost: {formatCurrency(currentWeekMealEstimate)}</p> : null}
        {!loading && !error ? (
          nextPlannedMeal ? (
            <p className="mb-055">
              Next planned meal: {nextPlannedMeal.mealName} ({formatPlannedDate(nextPlannedMeal.plannedDate)})
            </p>
          ) : (
            <p className="muted mb-055">Next planned meal: none yet this week.</p>
          )
        ) : null}
        {!loading && !error ? (
          <div className="inline-row">
            {!nextPlannedMeal ? (
              <Link to={nextAvailablePlanningDate ? `/planner?date=${nextAvailablePlanningDate}` : "/planner"} className="btn btn-primary text-none">
                Plan next meal
              </Link>
            ) : null}
            <Link to="/recipes" className="btn btn-secondary text-none">
              Go to recipes
            </Link>
            <Link to="/shopping-lists" className={["btn", nextPlannedMeal ? "btn-primary" : "btn-secondary", "text-none"].join(" ")}>
              View grocery list
            </Link>
          </div>
        ) : null}
        {!loading && !error && lastUpdatedAt ? (
          <p className="muted mt-055">
            Last updated {lastUpdatedAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })} at{" "}
            {lastUpdatedAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
          </p>
        ) : null}
      </Card>

      <div className="grid-3">
        <Link to="/planner" className="card text-none">
          <div className="inline-row mb-04">
            <CalendarDays size={18} />
            <h3>Plan meals</h3>
          </div>
          <p className="muted">Use the monthly calendar to assign meals by date.</p>
        </Link>

        <Link to="/recipes" className="card text-none">
          <div className="inline-row mb-04">
            <Utensils size={18} />
            <h3>Recipes</h3>
          </div>
          <p className="muted">Create and maintain your reusable recipe library.</p>
        </Link>

        <Link to="/shopping-lists" className="card text-none">
          <div className="inline-row mb-04">
            <ListChecks size={18} />
            <h3>Shopping Lists</h3>
          </div>
          <p className="muted">Build list totals from quantity and item price.</p>
        </Link>
      </div>
    </div>
  );
};
