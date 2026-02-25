import { Outlet } from "react-router-dom";
import { Footer } from "../components/layout/Footer";
import { TopNav } from "../components/layout/TopNav";

export const AppShell = () => {
  return (
    <div className="app-shell">
      <TopNav />
      <main className="content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
