import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ListChecks, Utensils } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Loading } from "../../components/ui/Loading";
import { getPlannedDaysThisWeek } from "../planner/plannerService";

export const DashboardPage = () => {
  const [plannedDays, setPlannedDays] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const count = await getPlannedDaysThisWeek();
        if (!active) return;
        setPlannedDays(count);
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
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Track this week and jump quickly into your workflow.</p>
      </div>

      <Card>
        <div className="section-head">
          <h2>This week</h2>
          <span className="badge">Summary</span>
        </div>
        {loading ? <Loading label="Loading weekly summary..." /> : null}
        {error ? <p className="error-text">{error}</p> : null}
        {!loading && !error ? <p>{plannedDays} day(s) currently planned.</p> : null}
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
