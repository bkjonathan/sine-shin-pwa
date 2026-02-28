import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";

import { LiquidLayout } from "./components/layout/LiquidLayout";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { StaffStageAssignmentPage } from "./pages/StaffStageAssignmentPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const Placeholder = ({ title }: { title: string }) => (
  <div className="mx-auto max-w-3xl">
    <Card className="glass-panel border-white/60">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          This module is queued for the same liquid-glass shadcn treatment.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        Core navigation, typography, spacing, and component styling now follow the
        updated design language.
      </CardContent>
    </Card>
  </div>
);

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
              <Route path="manufacturing" element={<StaffStageAssignmentPage />} />
              <Route path="staff" element={<Placeholder title="Staff Directory" />} />
              <Route
                path="invoices"
                element={<Placeholder title="Invoices & Finance" />}
              />
              <Route path="settings" element={<Placeholder title="Configuration" />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
