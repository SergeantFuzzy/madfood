import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Loading } from "../../components/ui/Loading";
import { Modal } from "../../components/ui/Modal";
import { Recipe, WeeklyPlan } from "../../lib/dbTypes";
import { addMonths, format, getMonth, getYear, startOfMonth, subMonths } from "../../lib/date";
import { listRecipes } from "../recipes/recipesService";
import { CalendarMonth } from "./calendar/CalendarMonth";
import { listPlansForMonth, savePlanForDay } from "./plannerService";

const monthOptions = Array.from({ length: 12 }, (_, index) => index);
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 11 }, (_, index) => currentYear - 5 + index);

const parsePlannerDateParam = (value: string | null): Date | null => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  const isValid = parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
  return isValid ? parsed : null;
};

export const PlannerPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedDateParam = searchParams.get("date");
  const [monthDate, setMonthDate] = useState<Date>(startOfMonth(new Date()));
  const [plans, setPlans] = useState<WeeklyPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [mealName, setMealName] = useState("");
  const [requestedPlannerDate, setRequestedPlannerDate] = useState<Date | null>(null);

  const plansByDate = useMemo<Record<string, WeeklyPlan>>(() => {
    return plans.reduce<Record<string, WeeklyPlan>>((acc, item) => {
      acc[item.planned_date] = item;
      return acc;
    }, {});
  }, [plans]);

  const plannedDaysCount = useMemo(
    () => plans.filter((item) => Boolean(item.meal_name) || Boolean(item.recipe_id)).length,
    [plans]
  );

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [plansData, recipesData] = await Promise.all([listPlansForMonth(monthDate), listRecipes()]);
      setPlans(plansData);
      setRecipes(recipesData);
    } catch (err) {
      const value = err as { message?: string };
      setError(value.message ?? "Failed to load planner data");
    } finally {
      setLoading(false);
    }
  };

  const openDayModal = (date: Date) => {
    const iso = format(date, "yyyy-MM-dd");
    const existing = plansByDate[iso];

    setSelectedDate(date);
    setSelectedRecipeId(existing?.recipe_id ?? "");
    setMealName(existing?.meal_name ?? "");
  };

  useEffect(() => {
    refreshData();
  }, [monthDate]);

  useEffect(() => {
    const parsedDate = parsePlannerDateParam(requestedDateParam);
    if (!parsedDate) return;

    setRequestedPlannerDate(parsedDate);
    setMonthDate(startOfMonth(parsedDate));
  }, [requestedDateParam]);

  const closeDayModal = () => {
    setSelectedDate(null);
    setSelectedRecipeId("");
    setMealName("");
  };

  useEffect(() => {
    if (!requestedPlannerDate || loading) return;

    openDayModal(requestedPlannerDate);
    setRequestedPlannerDate(null);

    if (searchParams.has("date")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("date");
      setSearchParams(nextParams, { replace: true });
    }
  }, [loading, requestedPlannerDate, searchParams, setSearchParams, plansByDate]);

  const clearSelectedDayValues = () => {
    setSelectedRecipeId("");
    setMealName("");
  };

  const onSaveDay = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedDate) return;

    setSaving(true);
    setError(null);

    try {
      const selectedRecipe = recipes.find((recipe) => recipe.id === selectedRecipeId);
      const resolvedMealName = mealName.trim() || selectedRecipe?.title || null;

      await savePlanForDay({
        planned_date: format(selectedDate, "yyyy-MM-dd"),
        meal_name: resolvedMealName,
        recipe_id: selectedRecipeId || null
      });

      closeDayModal();
      await refreshData();
    } catch (err) {
      const value = err as { message?: string };
      setError(value.message ?? "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const onChangeMonth = (month: number) => {
    setMonthDate((prev) => {
      const next = new Date(prev);
      next.setMonth(month);
      return startOfMonth(next);
    });
  };

  const onChangeYear = (year: number) => {
    setMonthDate((prev) => {
      const next = new Date(prev);
      next.setFullYear(year);
      return startOfMonth(next);
    });
  };

  return (
    <div className="container stack">
      <div className="page-header">
        <h1 className="page-title">Planner</h1>
        <p className="page-subtitle">Plan one meal slot per day in a monthly calendar.</p>
      </div>

      <Card>
        <div className="section-head">
          <div className="inline-row">
            <Button variant="secondary" onClick={() => setMonthDate((prev) => subMonths(prev, 1))}>
              Previous
            </Button>
            <h2>{format(monthDate, "MMMM yyyy")}</h2>
            <span className="badge">
              {plannedDaysCount} planned day{plannedDaysCount === 1 ? "" : "s"}
            </span>
            <Button variant="secondary" onClick={() => setMonthDate((prev) => addMonths(prev, 1))}>
              Next
            </Button>
          </div>

          <div className="inline-row">
            <label className="field min-w-150">
              <span className="field-label">Month</span>
              <select className="select" value={getMonth(monthDate)} onChange={(event) => onChangeMonth(Number(event.target.value))}>
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {format(new Date(2024, month, 1), "MMMM")}
                  </option>
                ))}
              </select>
            </label>

            <label className="field min-w-120">
              <span className="field-label">Year</span>
              <select className="select" value={getYear(monthDate)} onChange={(event) => onChangeYear(Number(event.target.value))}>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <p className="muted mb-05">Tap a day to add, edit, or clear your meal plan.</p>

        {loading ? <Loading label="Loading calendar..." /> : null}
        {error ? <p className="error-text">{error}</p> : null}
        {!loading ? <CalendarMonth monthDate={monthDate} plansByDate={plansByDate} onSelectDay={openDayModal} /> : null}
      </Card>

      <Modal
        open={Boolean(selectedDate)}
        title={selectedDate ? `Plan for ${format(selectedDate, "EEEE, MMM d")}` : "Plan day"}
        onClose={closeDayModal}
        footer={
          <>
            <Button variant="secondary" onClick={closeDayModal} type="button">
              Cancel
            </Button>
            <Button variant="secondary" onClick={clearSelectedDayValues} type="button">
              Clear fields
            </Button>
            <Button loading={saving} type="submit" form="save-day-form">
              Save day
            </Button>
          </>
        }
      >
        <form id="save-day-form" className="stack" onSubmit={onSaveDay}>
          <label className="field">
            <span className="field-label">Recipe (optional)</span>
            <select className="select" value={selectedRecipeId} onChange={(event) => setSelectedRecipeId(event.target.value)}>
              <option value="">No recipe selected</option>
              {recipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.title}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">Meal name</span>
            <input
              className="input"
              value={mealName}
              onChange={(event) => setMealName(event.target.value)}
              placeholder="Quick entry, e.g. Chicken Bowl"
            />
            <span className="help-text">Leave empty to use selected recipe title, or clear all fields to remove plan.</span>
          </label>
        </form>
      </Modal>
    </div>
  );
};
