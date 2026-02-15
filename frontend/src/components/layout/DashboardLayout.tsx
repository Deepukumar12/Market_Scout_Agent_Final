
import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import CommandPalette from '@/components/layout/CommandPalette';
import { Button } from '@/components/ui/button';
import { Search, Bell, User, Settings as SettingsIcon, Command, Loader2, ArrowRight, Plus, Menu, X } from 'lucide-react';
import LogConsole from '@/features/dashboard/LogConsole';
import NotificationCenter from '@/components/layout/NotificationCenter';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const DashboardLayout = () => {
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  // searchRef and inputRef can be removed if not used, but let's keep ref for button focus just in case
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close menu on navigation
  useEffect(() => {
    setIsMenuOpen(false);
  }, [navigate]);

  return (
    <div className="flex w-full h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans">
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Sidebar - Responsive */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 w-72",
        isMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar onClose={() => setIsMenuOpen(false)} />
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>
      
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {/* Topbar */}
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 border-b border-white/5 bg-[#020617]/60 backdrop-blur-3xl sticky top-0 z-30">
          <div className="flex items-center gap-6 flex-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden w-12 h-12 rounded-2xl hover:bg-white/5 border border-white/5"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <button 
                ref={searchButtonRef}
                onClick={() => setIsCommandOpen(true)}
                className="relative group max-w-xl w-full text-left"
            >
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
              </div>
              <div className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium text-slate-400 hover:text-white hover:border-blue-500/40 hover:bg-[#020617]/60 transition-all backdrop-blur-xl flex items-center justify-between">
                  <span>Search competitors, reports...</span>
                  <div className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[9px] text-slate-500 font-mono hidden sm:flex items-center gap-1">
                     <Command className="w-2.5 h-2.5" /> K
                  </div>
              </div>
             </button>
          </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsNotificationsOpen(true)}
              className="w-12 h-12 rounded-2xl hover:bg-white/5 border border-white/5 relative group transition-all active:scale-95"
            >
              <Bell className="h-5 w-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#020617] shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl hover:bg-white/5 border border-white/5 active:scale-95 transition-all">
              <SettingsIcon className="h-5 w-5 text-slate-500 hover:text-white transition-colors" />
            </Button>
          </div>
          
          <div className="flex items-center gap-5 pl-8 border-l border-white/10 h-10">
              <div className="flex flex-col items-end hidden lg:flex">
                  <span className="text-sm font-semibold text-white tracking-tight leading-tight">
                      {user?.full_name || 'User'}
                  </span>
                  <span className="text-[10px] font-medium text-slate-600 flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      Online
                  </span>
              </div>
              <motion.div 
                 whileHover={{ scale: 1.1, rotate: 5 }}
                 onClick={() => navigate('/dashboard/settings')}
                 className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-[1px] shadow-2xl shadow-blue-500/20 cursor-pointer border border-white/10"
              >
                <div className="w-full h-full rounded-2xl bg-[#020617] flex items-center justify-center text-xs font-bold text-blue-400">
                    {user?.full_name ? getInitials(user.full_name) : <User className="h-5 w-5" />}
                </div>
              </motion.div>
          </div>
        </div>
      </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <Outlet />
          </motion.div>
          
          {/* Global UI Overlays */}
          <LogConsole />
          <CommandPalette open={isCommandOpen} setOpen={setIsCommandOpen} />
          <NotificationCenter 
            isOpen={isNotificationsOpen} 
            onClose={() => setIsNotificationsOpen(false)} 
          />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
