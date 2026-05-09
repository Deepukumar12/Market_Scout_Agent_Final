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
import { analyzeCompany } from '@/services/api';

const DashboardLayout = () => {
  const { user } = useAuthStore();
  const { fetchCompetitors } = useCompetitorStore();
  const { fetchNotifications, initWebSocket } = useNotificationStore();
  const location = useLocation();
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentStep: realStep, setStep, startExecution, stopExecution } = useExecutionStore();
  
  const progressSteps = [
    'Initializing AI Scout agents...',
    'Searching technical repositories...',
    'Scraping latest feature releases...',
    'Analyzing competitive edge...',
    'Generating intelligence report...'
  ];


  useEffect(() => {
    fetchNotifications();
    initWebSocket(); // Real-time notification uplink
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications, initWebSocket]);

  useEffect(() => {
    fetchCompetitors();
  }, [location.pathname, fetchCompetitors]);

  const handleAnalyze = async (company: { name: string, domain: string }) => {
    setAnalyzeStatus('running');
    startExecution(progressSteps.length);
    
    // Simulate progress while the API call is running
    const progressInterval = setInterval(() => {
      setStep((prev: number) => {
        // Stop simulation at 80% to let real completion signal take over
        if (prev < progressSteps.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 4500); 
    
    try {
      console.log(`Starting mission for ${company.name}...`);
      await analyzeCompany(company);
      
      // Critical Path Success
      clearInterval(progressInterval);
      setStep(progressSteps.length - 1);
      setAnalyzeStatus('completed');
      stopExecution();
      
      // Non-blocking UI Refresh: Trigger full intelligence re-sync
      try {
        await Promise.all([
          fetchCompetitors(),
          // Use window access or store state if needed, but for now we ensure 
          // that the primary competitor list is refreshed.
          // Note: Full dashboard refresh happens via these store calls
        ]);
        
        // Broadcast a custom event for other components to refresh
        window.dispatchEvent(new CustomEvent('intelligence-refresh'));
      } catch (refreshErr) {
        console.warn('Dashboard sync delayed:', refreshErr);
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error('Mission failed:', error);
      
      // Categorize error for better UX
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
      if (isTimeout) {
         setAnalyzeStatus('error');
         // We could add a specific 'timeout' state if needed
      } else {
         setAnalyzeStatus('error');
      }
      
      setStep(0);
      stopExecution();
    } finally {
      clearInterval(progressInterval);
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
    </div>
  );
};

export default DashboardLayout;
