import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Plus, LogOut, Settings, Shield, ChevronDown, Menu, Moon, Sun, Zap, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/utils';
import { getCompetitors } from '@/services/api';
import { useCompetitorStore } from '@/store/competitorStore';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-8 rounded-full p-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-[#0071E3]/30 transition-all overflow-hidden flex items-center group shadow-inner"
    >
      <motion.div
        animate={{ 
          x: theme === 'dark' ? 24 : 0,
          backgroundColor: theme === 'dark' ? '#0071E3' : '#FFFFFF'
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg relative z-10"
      >
        <AnimatePresence mode="wait" initial={false}>
          {theme === 'dark' ? (
            <motion.div
              key="moon"
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              <Moon size={12} className="text-white fill-current" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              <Sun size={12} className="text-[#F5A623] fill-current" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <div className="absolute inset-0 flex justify-between px-2 items-center opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity">
        <Sun size={12} className={theme === 'light' ? 'invisible' : ''} />
        <Moon size={12} className={theme === 'dark' ? 'invisible' : ''} />
      </div>
    </button>
  );
};

const getAvatarSrc = (url: string | null | undefined) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = import.meta.env.VITE_API_URL || '';
  return `${baseUrl.replace(/\/$/, '')}${url}`;
};

interface NavbarProps {
  onAnalyzeClick: () => void;
  onNotificationClick: () => void;
  onSearch: (query: string) => void;
  user: any;
  onMobileMenuToggle?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onAnalyzeClick, onNotificationClick, onSearch, user, onMobileMenuToggle }) => {
  const { unreadCount } = useNotificationStore();
  const { logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchQuery, setLocalSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const { competitors, selectedCompetitorId, setSelectedCompetitorId, fetchCompetitors } = useCompetitorStore();
  
  useEffect(() => {
    fetchCompetitors();
  }, []);
  useEffect(() => {
    const fetchResults = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }
      setIsSearching(true);
      setShowResults(true);
      try {
        const data = await getCompetitors(searchQuery);
        setSearchResults(data.slice(0, 10));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(fetchResults, 200);
    return () => clearTimeout(debounce);
  }, [searchQuery]);


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-20 fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-[#E5E5EA] dark:border-white/10 flex items-center justify-between px-8">
      <div className="flex items-center gap-4 lg:gap-12 flex-1">
        {onMobileMenuToggle && (
          <button onClick={onMobileMenuToggle} className="lg:hidden p-2 -ml-2 text-[#1D1D1F] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-lg">
            <Menu size={24} />
          </button>
        )}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 cursor-pointer font-sans"
          onClick={() => navigate('/dashboard')}
        >
          <div className="w-10 h-10 bg-[#0071E3] rounded-xl flex items-center justify-center shadow-lg shadow-[#0071E3]/20 overflow-hidden text-white">
            <Zap size={24} className="fill-current" />
          </div>
          <span className="text-2xl font-black text-[#1D1D1F] dark:text-white tracking-tighter uppercase italic leading-none">SCOUTFORGE<span className="text-blue-600">AI</span></span>
        </motion.div>

        {competitors.length > 0 && (
          <div className="relative group/target hidden lg:block">
            <select
              value={selectedCompetitorId || ''}
              onChange={(e) => setSelectedCompetitorId(e.target.value || null)}
              className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-[#0071E3]/30 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#1D1D1F] dark:text-white outline-none cursor-pointer appearance-none pr-8 select-none transition-all shadow-sm"
            >
              {competitors.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id} className="bg-white dark:bg-[#1D1D1F] text-[#1D1D1F] dark:text-white">
                  TARGET: {c.name.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#86868B]">
              <ChevronDown size={12} />
            </div>
          </div>
        )}

        <div className="relative max-w-md w-full group hidden md:block" ref={searchRef}>
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
            <Search size={18} className="text-[#6E6E73] dark:text-[#86868B] group-focus-within:text-[#0071E3] transition-colors" />
          </div>
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search competitor..."
              value={searchQuery}
              onChange={(e) => {
                setLocalSearchQuery(e.target.value);
                onSearch(e.target.value);
              }}
              onFocus={() => searchQuery && setShowResults(true)}
              className="w-full bg-[#F5F5F7] dark:bg-white/5 border border-transparent focus:border-[#0071E3] focus:bg-white dark:focus:bg-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-[#1D1D1F] dark:text-white outline-none transition-all placeholder:text-[#6E6E73] dark:placeholder:text-[#86868B] shadow-sm"
            />
            {isSearching && (
              <div className="absolute right-4 top-3">
                <div className="w-4 h-4 border-2 border-[#0071E3]/20 border-t-[#0071E3] rounded-full animate-spin" />
              </div>
            )}
            
            <AnimatePresence>
              {showResults && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 right-0 mt-2 bg-white/95 dark:bg-[#1D1D1F]/95 backdrop-blur-2xl rounded-2xl border border-[#E5E5EA] dark:border-white/10 shadow-2xl overflow-hidden z-[100] py-2"
                >
                  {searchResults.length > 0 ? (
                    searchResults.map((result: any) => (
                      <button
                        key={result.id || result._id}
                        onClick={() => {
                          onSearch(result.name);
                          setLocalSearchQuery(result.name);
                          setShowResults(false);
                          navigate('/dashboard/competitors');
                        }}
                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-[#F5F5F7] dark:hover:bg-white/5 transition-colors text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3] font-black italic uppercase text-[10px]">
                          {result.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1D1D1F] dark:text-white group-hover:text-[#0071E3] transition-colors">
                            {(() => {
                              const name = result.name;
                              const index = name.toLowerCase().indexOf(searchQuery.toLowerCase());
                              if (index !== -1) {
                                return (
                                  <>
                                    {name.slice(0, index)}
                                    <span className="text-[#0071E3] font-black">{name.slice(index, index + searchQuery.length)}</span>
                                    {name.slice(index + searchQuery.length)}
                                  </>
                                );
                              }
                              return name;
                            })()}
                          </p>
                          <p className="text-[10px] text-[#86868B] dark:text-[#A1A1A6] font-mono truncate max-w-[200px]">{result.url}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <p className="text-xs text-[#86868B] dark:text-[#A1A1A6] font-medium italic">No matches found for "{searchQuery}"</p>
                    </div>
                  )}
                  <div className="px-4 py-2 border-t border-[#F5F5F7] dark:border-white/5 mt-1">
                    <button 
                       onClick={() => { setShowResults(false); navigate('/dashboard/competitors'); }}
                       className="text-[9px] font-black uppercase tracking-widest text-[#0071E3] hover:text-blue-700 transition-colors"
                    >
                      View All Entities
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button 
          onClick={onAnalyzeClick}
          className="hidden md:flex bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl px-6 h-11 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#0071E3]/20 transition-all active:scale-95 gap-2"
        >
          <Plus size={16} strokeWidth={3} />
          Analyze Company
        </Button>

        <ThemeToggle />

        <div className="flex items-center gap-2 pl-4 border-l border-[#E5E5EA] dark:border-white/10 relative">
          <button 
            onClick={onNotificationClick}
            className="p-2.5 rounded-full hover:bg-[#F5F5F7] dark:hover:bg-white/5 text-[#6E6E73] dark:text-[#A1A1A6] transition-colors relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-black text-[8px] font-black text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 pl-1 pr-3 rounded-full hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] border border-transparent hover:border-[#E5E5EA] dark:hover:border-white/10 transition-all"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-[#0071E3] to-[#00c6ff] rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm overflow-hidden">
                {user?.avatar_url ? (
                  <img 
                    src={getAvatarSrc(user.avatar_url)} 
                    alt="User Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={16} />
                )}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-sm font-bold text-[#1D1D1F] dark:text-white">
                  {user?.full_name?.split(' ')[0] || 'Member'}
                </span>
                <span className="text-[10px] text-[#86868B] dark:text-[#A1A1A6] font-medium uppercase tracking-tighter">Intelligence Agent</span>
              </div>
              <ChevronDown size={14} className={cn("text-[#86868B] transition-transform", isProfileOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 mt-3 w-56 bg-white/95 dark:bg-black/95 backdrop-blur-2xl rounded-2xl border border-[#E5E5EA] dark:border-white/10 shadow-2xl overflow-hidden shadow-black/10 py-2"
                >
                  <div className="px-4 py-3 border-b border-[#F5F5F7] dark:border-white/5 mb-2">
                    <p className="text-xs font-black uppercase tracking-widest text-[#86868B] dark:text-[#A1A1A6] mb-1">Session Identity</p>
                    <p className="text-sm font-bold text-[#1D1D1F] dark:text-white truncate">{user?.email || 'user@marketscout.ai'}</p>
                  </div>

                  <button 
                    onClick={() => { navigate('/dashboard/settings'); setIsProfileOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#1D1D1F] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-white/5 transition-colors text-left"
                  >
                    <Settings size={16} className="text-[#6E6E73] dark:text-[#86868B]" />
                    Settings
                  </button>

                  <button 
                    onClick={() => { navigate('/dashboard/risk'); setIsProfileOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#1D1D1F] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-white/5 transition-colors text-left"
                  >
                    <Shield size={16} className="text-[#6E6E73] dark:text-[#86868B]" />
                    Security Audit
                  </button>

                  <div className="h-px bg-[#F5F5F7] dark:bg-white/5 my-2" />

                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
