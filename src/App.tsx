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
import { CustomersPage } from "./pages/CustomersPage";
import { CustomerFormPage } from "./pages/CustomerFormPage";
import { OrdersPage } from "./pages/OrdersPage";
import { OrderFormPage } from "./pages/OrderFormPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { ExpenseFormPage } from "./pages/ExpenseFormPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./components/theme-provider";
import { PwaInstallBanner } from "./components/pwa/PwaInstallBanner";

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
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="sine-shin-theme"
      disableTransitionOnChange
    >
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<LiquidLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="customers/new" element={<CustomerFormPage />} />
                <Route
                  path="customers/:customerId/edit"
                  element={<CustomerFormPage />}
                />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="orders/new" element={<OrderFormPage />} />
                <Route path="orders/:orderId/edit" element={<OrderFormPage />} />
                <Route path="expenses" element={<ExpensesPage />} />
                <Route path="expenses/new" element={<ExpenseFormPage />} />
                <Route
                  path="expenses/:expenseId/edit"
                  element={<ExpenseFormPage />}
                />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      <PwaInstallBanner />
    </ThemeProvider>
  );
}

export default App;
