
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import './index.css';
import LandingPage from './features/landing/LandingPage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardPage from '@/features/dashboard/DashboardPage';
import CompetitorsPage from '@/features/dashboard/CompetitorsPage';
import ReportsPage from '@/features/dashboard/ReportsPage';
import AnalyticsPage from '@/features/dashboard/AnalyticsPage';
import RiskPage from '@/features/dashboard/RiskPage';
import SettingsPage from '@/features/dashboard/SettingsPage';
import AddCompetitorPage from '@/features/dashboard/AddCompetitorPage';
import IntelligenceReportPage from '@/features/dashboard/IntelligenceReportPage';
import { AuthLayout } from '@/features/auth/AuthLayout';
import { LoginForm } from '@/features/auth/LoginForm';
import { RegisterForm } from '@/features/auth/RegisterForm';
import { useAuthStore } from '@/store/authStore';

const App = () => {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <Outlet />;
};

const ProtectedDashboard = () => {
  const { token, loading } = useAuthStore();
  
  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-[#030711] text-white">Loading...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <LandingPage />,
      },
      {
        path: "/login",
        element: <AuthLayout />,
        children: [{ index: true, element: <LoginForm /> }]
      },
      {
        path: "/register",
        element: <AuthLayout />,
        children: [{ index: true, element: <RegisterForm /> }]
      },
      {
        path: "/dashboard",
        element: <ProtectedDashboard />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: "add-competitor",
            element: <AddCompetitorPage />,
          },
          {
            path: "competitors",
            element: <CompetitorsPage />,
          },
          {
            path: "competitors/:id/report",
            element: <IntelligenceReportPage />,
          },
          {
            path: "reports",
            element: <ReportsPage />,
          },
          {
            path: "analytics",
            element: <AnalyticsPage />,
          },
          {
            path: "risk",
            element: <RiskPage />,
          },
          {
            path: "settings",
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
