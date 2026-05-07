import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import NotificationCenter from '@/components/layout/NotificationCenter';
import AnalyzeModal from '@/components/dashboard/AnalyzeModal';
import { useAuthStore } from '@/store/authStore';
import { useCompetitorStore } from '@/store/competitorStore';

import { useNotificationStore } from '@/store/notificationStore';
import { motion } from 'framer-motion';
import { analyzeCompany } from '@/services/api';

const DashboardLayout = () => {
  const { user } = useAuthStore();
  const { fetchCompetitors } = useCompetitorStore();
  const { fetchNotifications } = useNotificationStore();
  const location = useLocation();
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  const progressSteps = [
    'Initializing AI Scout agents...',
    'Searching technical repositories...',
    'Scraping latest feature releases...',
    'Analyzing competitive edge...',
    'Generating intelligence report...'
  ];

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Ensure competitor list is available globally
  useEffect(() => {
    fetchCompetitors();
  }, [location.pathname, fetchCompetitors]);

  const handleAnalyze = async (company: string) => {
    setAnalyzeStatus('running');
    setCurrentStep(0);
    
    // Simulate progress for UX
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev < progressSteps.length - 1 ? prev + 1 : prev));
    }, 2000);

    try {
      await analyzeCompany(company);
      clearInterval(interval);
      setCurrentStep(progressSteps.length - 1);
      setAnalyzeStatus('completed');
      fetchCompetitors(); // Refresh list
    } catch (error) {
      clearInterval(interval);
      setAnalyzeStatus('error');
    }
  };

  const handleCloseModal = () => {
    setIsAnalyzeModalOpen(false);
    // Reset status after a delay so the animation finishes
    setTimeout(() => {
      setAnalyzeStatus('idle');
      setCurrentStep(0);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-background text-[#1D1D1F] dark:text-foreground font-sans selection:bg-[#0071E3]/20 overflow-x-hidden">
      <Navbar 
        user={user} 
        onAnalyzeClick={() => setIsAnalyzeModalOpen(true)}
        onNotificationClick={() => setIsNotificationOpen(true)}
        onSearch={(q) => setSearchQuery(q)}
      />

      <NotificationCenter 
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      <div className="flex pt-20">
        <Sidebar />
        
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
      />
    </div>
  );
};

export default DashboardLayout;
