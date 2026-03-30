
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
import TargetUniversePage from '@/features/dashboard/TargetUniversePage';
import AddCompetitorPage from '@/features/dashboard/AddCompetitorPage';
import IntelligenceReportPage from '@/features/dashboard/IntelligenceReportPage';
import PredictiveAnalyticsPage from '@/features/dashboard/PredictiveAnalyticsPage';
import SentimentAnalysisPage from '@/features/dashboard/SentimentAnalysisPage';
import AiSuggestionPage from '@/features/dashboard/AiSuggestionPage';
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
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F5F5F7] text-[#1D1D1F]">
        <div className="w-12 h-12 border-4 border-[#0071E3]/20 border-t-[#0071E3] rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest italic opacity-50">Calibrating Console...</p>
      </div>
    );
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
            path: "predictive-analytics",
            element: <PredictiveAnalyticsPage />,
          },
          {
            path: "sentiment-analysis",
            element: <SentimentAnalysisPage />,
          },
          {
            path: "competitors",
            element: <CompetitorsPage />,
          },
          {
            path: "target-universe",
            element: <TargetUniversePage />,
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
          {
            path: "ai-suggestion",
            element: <AiSuggestionPage />,
          },
        ],
      },
    ],
  },
]);

import { ThemeProvider } from '@/context/ThemeContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>,
);
