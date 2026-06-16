import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/layouts/Sidebar';
import Navbar from '@/layouts/Navbar';
import NotificationCenter from '@/layouts/NotificationCenter';
import AnalyzeModal from '@/components/dashboard/AnalyzeModal';
import { useAuthStore } from '@/store/authStore';
import { useCompetitorStore } from '@/store/competitorStore';

import { useNotificationStore } from '@/store/notificationStore';
import { motion } from 'framer-motion';
import { useExecutionStore } from '@/store/executionStore';
import { useIntelStore } from '@/store/intelStore';
import { analyzeCompany } from '@/services/api';

import LogConsole from '@/components/dashboard/LogConsole';

const DashboardLayout = () => {
  const { token, user, initSync } = useAuthStore();
  const { fetchCompetitors } = useCompetitorStore();
  const { fetchNotifications, initWebSocket, closeWebSocket } = useNotificationStore();
  const location = useLocation();
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentStep: realStep, setStep, startExecution, stopExecution } = useExecutionStore();
  const { setScanReport } = useIntelStore(state => ({ setScanReport: (data: any) => useIntelStore.setState({ scanReport: data }) }));
  
  const progressSteps = [
    'Initializing AI Scout agents...',
    'Phase 1: Auditing official documentation...',
    'Phase 2: Intelligence domain expansion...',
    'Phase 3: Fact verification & Synthesis...',
    'Intelligence secured. Synchronizing console.'
  ];


  useEffect(() => {
    fetchNotifications();
    initWebSocket(); // Real-time notification uplink
    const cleanupSync = initSync(); // Real-time profile sync
    const interval = setInterval(fetchNotifications, 60000);

    const handleOnline = () => {
      initWebSocket();
    };
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(interval);
      if (cleanupSync) cleanupSync();
      closeWebSocket();
      window.removeEventListener('online', handleOnline);
    };
  }, [token, fetchNotifications, initWebSocket, initSync, closeWebSocket]);

  useEffect(() => {
    fetchCompetitors();
  }, [location.pathname, fetchCompetitors]);

  const handleAnalyze = async (company: { name: string, domain: string }, forceRefresh = false) => {
    setAnalyzeStatus('running');
    startExecution(progressSteps.length);
    
    // NOTE: Simulated progress is removed. 
    // The LogConsole now receives real-time "Phase X" signals via WebSockets
    // which automatically updates the executionStore steps.
    
    try {
      console.log(`Starting mission for ${company.name} (Force Refresh: ${forceRefresh})...`);
      const scanResult = await analyzeCompany(company, forceRefresh);
      
      // Critical Path Success
      setStep(progressSteps.length - 1);
      setAnalyzeStatus('completed');
      setScanReport(scanResult);
      stopExecution();
      
      // Non-blocking UI Refresh: Trigger full intelligence re-sync
      try {
        await Promise.all([
          fetchCompetitors(),
        ]);
        
        // Broadcast a custom event for other components to refresh
        window.dispatchEvent(new CustomEvent('intelligence-refresh'));
      } catch (refreshErr) {
        console.warn('Dashboard sync delayed:', refreshErr);
      }
    } catch (error: any) {
      console.error('Mission failed:', error);
      
      // Categorize error for better UX
      setAnalyzeStatus('error');
      setStep(0);
      stopExecution();
    }
  };

  const handleCloseModal = () => {
    setIsAnalyzeModalOpen(false);
    setTimeout(() => {
      setAnalyzeStatus('idle');
      setStep(0);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-black text-[#1D1D1F] dark:text-white font-sans selection:bg-[#0071E3]/20 overflow-x-hidden transition-colors duration-500">
      <Navbar 
        user={user} 
        onAnalyzeClick={() => setIsAnalyzeModalOpen(true)}
        onNotificationClick={() => setIsNotificationOpen(true)}
        onSearch={(q) => setSearchQuery(q)}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <NotificationCenter 
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      <div className="flex pt-20">
        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        
        <main className="flex-1 lg:ml-72 p-4 md:p-10 w-full overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-[1600px] mx-auto"
          >
            <Outlet context={{ searchQuery, setSearchQuery }} />
          </motion.div>
        </main>
      </div>

      <AnalyzeModal 
        isOpen={isAnalyzeModalOpen}
        onClose={handleCloseModal}
        onAnalyze={handleAnalyze}
        status={analyzeStatus}
        progressSteps={progressSteps}
        currentStep={realStep}
      />

      {/* Global Real-Time Telemetry Link */}
      <LogConsole />
    </div>
  );
};

export default DashboardLayout;
