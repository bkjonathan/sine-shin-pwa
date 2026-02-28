import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

import { LiquidLayout } from "./components/layout/LiquidLayout";
import { Spinner } from "@/components/ui/spinner";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { StaffPage } from "./pages/StaffPage";
import { CustomersPage } from "./pages/CustomersPage";
import { OrdersPage } from "./pages/OrdersPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const ProtectedRoute = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="liquid-page flex min-h-screen items-center justify-center">
        <div className="glass-panel-strong flex items-center gap-3 px-5 py-4">
          <Spinner className="text-primary size-5" />
          <span className="text-sm font-medium">Loading workspace...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<LiquidLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
