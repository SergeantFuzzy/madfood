import { ReactElement } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import { Loading } from "../components/ui/Loading";
import { LoginPage } from "../features/auth/LoginPage";
import { ResetPasswordPage } from "../features/auth/ResetPasswordPage";
import { UpdatePasswordPage } from "../features/auth/UpdatePasswordPage";
import { useAuth } from "../features/auth/AuthContext";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { FavoritesPage } from "../features/favorites/FavoritesPage";
import { PantryPage } from "../features/pantry/PantryPage";
import { PlannerPage } from "../features/planner/PlannerPage";
import { RecipesPage } from "../features/recipes/RecipesPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { ShoppingListsPage } from "../features/shopping/ShoppingListsPage";
import { AppShell } from "./AppShell";

const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container">
        <Loading label="Checking session..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container">
        <Loading label="Loading MadFood..." />
      </div>
    );
  }

  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
};

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <AppShell />,
      children: [
        { index: true, element: <RootRedirect /> },
        { path: "login", element: <LoginPage /> },
        { path: "reset-password", element: <ResetPasswordPage /> },
        { path: "update-password", element: <UpdatePasswordPage /> },
        {
          path: "dashboard",
          element: (
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: "favorites",
          element: (
            <ProtectedRoute>
              <FavoritesPage />
            </ProtectedRoute>
          )
        },
        {
          path: "pantry",
          element: (
            <ProtectedRoute>
              <PantryPage />
            </ProtectedRoute>
          )
        },
        {
          path: "planner",
          element: (
            <ProtectedRoute>
              <PlannerPage />
            </ProtectedRoute>
          )
        },
        {
          path: "recipes",
          element: (
            <ProtectedRoute>
              <RecipesPage />
            </ProtectedRoute>
          )
        },
        {
          path: "shopping-lists",
          element: (
            <ProtectedRoute>
              <ShoppingListsPage />
            </ProtectedRoute>
          )
        },
        {
          path: "settings",
          element: (
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          )
        },
        { path: "*", element: <Navigate to="/" replace /> }
      ]
    }
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" }
);
