import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import NotificationCenter from '@/components/layout/NotificationCenter';
import AnalyzeModal from '@/components/dashboard/AnalyzeModal';
import { useAuthStore } from '@/store/authStore';
import { useCompetitorStore } from '@/store/competitorStore';

import { useNotificationStore } from '@/store/notificationStore';
import { useIntelStore } from '@/store/intelStore';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeCompany } from '@/services/api';

const DashboardLayout = () => {
  const { user } = useAuthStore();
  const { refreshAllData } = useIntelStore();
  const { fetchCompetitors } = useCompetitorStore();
  const { fetchNotifications } = useNotificationStore();
  const location = useLocation();
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const progressSteps = [
    'Initializing AI Scout agents...',
    'Searching technical repositories...',
    'Scraping latest feature releases...',
    'Analyzing competitive edge...',
    'Generating intelligence report...'
  ];

  // Global Real-Time Synchronization Engine
  useEffect(() => {
    // Initial fetch
    refreshAllData(searchQuery);
    fetchNotifications();

    // High-frequency polling for "Real-Time" feel (10 seconds)
    const interval = setInterval(() => {
        refreshAllData(searchQuery);
        fetchNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }, [refreshAllData, fetchNotifications, searchQuery]);

  useEffect(() => {
    fetchCompetitors();
  }, [location.pathname, fetchCompetitors]);

  const handleAnalyze = async (company: string) => {
    setAnalyzeStatus('running');
    setCurrentStep(0);
    setLiveLogs([]);
    
    // 🌐 WebSocket Connection for real-time intelligence feed
    const token = localStorage.getItem('scoutiq_token');
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/v1/ws/logs?token=${token}`);
    
    ws.onmessage = (event) => {
      const message = event.data;
      setLiveLogs(prev => [...prev, message].slice(-5)); // Keep last 5 logs for cleaner UI
      
      // Map message categories to progress steps
      if (message.includes('Phase 1')) setCurrentStep(0);
      else if (message.includes('Phase 2')) setCurrentStep(1);
      else if (message.includes('Phase 3')) setCurrentStep(2);
      else if (message.includes('Phase 4')) setCurrentStep(3);
      else if (message.includes('operation successful')) setCurrentStep(4);
    };

    try {
      await analyzeCompany(company);
      ws.close();
      setCurrentStep(progressSteps.length - 1);
      setAnalyzeStatus('completed');
      fetchCompetitors();
    } catch (error) {
      ws.close();
      setAnalyzeStatus('error');
    }
  };

  const handleCloseModal = () => {
    setIsAnalyzeModalOpen(false);
    setTimeout(() => {
      setAnalyzeStatus('idle');
      setCurrentStep(0);
      setLiveLogs([]);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-background text-[#1D1D1F] dark:text-foreground font-sans selection:bg-[#0071E3]/20 overflow-x-hidden">
      <Navbar 
        user={user} 
        onAnalyzeClick={() => setIsAnalyzeModalOpen(true)}
        onNotificationClick={() => setIsNotificationOpen(true)}
        onSearch={(q) => setSearchQuery(q)}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <NotificationCenter 
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      <div className="flex pt-20 relative">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
            />
          )}
        </AnimatePresence>

        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <main className="flex-1 lg:ml-72 p-6 md:p-10 w-full overflow-hidden">
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
        currentStep={currentStep}
        liveLogs={liveLogs}
      />
    </div>
  );
};

export default DashboardLayout;
