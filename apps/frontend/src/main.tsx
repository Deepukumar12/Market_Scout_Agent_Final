import React, { useEffect, Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import './index.css';

// Layouts - Kept as standard imports for immediate rendering of shell
import DashboardLayout from '@/layouts/DashboardLayout';
import { AuthLayout } from '@/layouts/AuthLayout';

// Store & Context
import { useAuthStore } from '@/store/authStore';
import { ThemeProvider } from '@/context/ThemeContext';

// Pages - Optimized with Route-Based Lazy Loading
const LandingPage = lazy(() => import('./pages/LandingPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CompetitorsPage = lazy(() => import('./pages/CompetitorsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const RiskPage = lazy(() => import('./pages/RiskPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const TargetUniversePage = lazy(() => import('./pages/TargetUniversePage'));
const AddCompetitorPage = lazy(() => import('./pages/AddCompetitorPage'));
const PredictiveAnalyticsPage = lazy(() => import('./pages/PredictiveAnalyticsPage'));
const SentimentAnalysisPage = lazy(() => import('./pages/SentimentAnalysisPage'));
const AiSuggestionPage = lazy(() => import('./pages/AiSuggestionPage'));
const ErrorPage = lazy(() => import('./pages/ErrorPage'));

// Components
const LoginForm = lazy(() => import('@/components/auth/LoginForm').then(m => ({ default: m.LoginForm })));
const RegisterForm = lazy(() => import('@/components/auth/RegisterForm').then(m => ({ default: m.RegisterForm })));

// Loading Component for Suspense
const GlobalLoader = () => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F5F5F7] text-[#1D1D1F] dark:text-white">
    <div className="w-12 h-12 border-4 border-[#0071E3]/20 border-t-[#0071E3] rounded-full animate-spin mb-4" />
    <p className="text-[10px] font-black uppercase tracking-widest italic opacity-50">Calibrating Console...</p>
  </div>
);

const App = () => {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Suspense fallback={<GlobalLoader />}>
      <Outlet />
    </Suspense>
  );
};

const ProtectedDashboard = () => {
  const { token, loading } = useAuthStore();
  
  if (loading) return <GlobalLoader />;
  if (!token) return <Navigate to="/login" replace />;

  return <DashboardLayout />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <Suspense fallback={<GlobalLoader />}><ErrorPage /></Suspense>,
    children: [
      {
        index: true,
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
        errorElement: <Suspense fallback={<GlobalLoader />}><ErrorPage /></Suspense>,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "add-competitor", element: <AddCompetitorPage /> },
          { path: "predictive-analytics", element: <PredictiveAnalyticsPage /> },
          { path: "sentiment-analysis", element: <SentimentAnalysisPage /> },
          { path: "competitors", element: <CompetitorsPage /> },
          { path: "target-universe", element: <TargetUniversePage /> },
          { path: "analytics", element: <AnalyticsPage /> },
          { path: "risk", element: <RiskPage /> },
          { path: "settings", element: <SettingsPage /> },
          { path: "ai-suggestion", element: <AiSuggestionPage /> },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>,
);
