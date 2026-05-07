
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import './index.css';
import LandingPage from './pages/LandingPage';
import DashboardLayout from '@/layouts/DashboardLayout';
import DashboardPage from '@/pages/DashboardPage';
import CompetitorsPage from '@/pages/CompetitorsPage';
import ReportsPage from '@/pages/ReportsPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import RiskPage from '@/pages/RiskPage';
import SettingsPage from '@/pages/SettingsPage';
import TargetUniversePage from '@/pages/TargetUniversePage';
import AddCompetitorPage from '@/pages/AddCompetitorPage';
import IntelligenceReportPage from '@/pages/IntelligenceReportPage';
import PredictiveAnalyticsPage from '@/pages/PredictiveAnalyticsPage';
import SentimentAnalysisPage from '@/pages/SentimentAnalysisPage';
import AiSuggestionPage from '@/pages/AiSuggestionPage';
import { AuthLayout } from '@/layouts/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
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
