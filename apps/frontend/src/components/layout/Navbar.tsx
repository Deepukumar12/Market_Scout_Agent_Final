import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Plus, LogOut, Settings, Shield, ChevronDown, LayoutGrid, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { getCompanySuggestions } from '@/services/api';

interface NavbarProps {
  onAnalyzeClick: () => void;
  onNotificationClick: () => void;
  onSearch: (query: string) => void;
  onMenuClick: () => void;
  user: any;
}

const Navbar: React.FC<NavbarProps> = ({ onAnalyzeClick, onNotificationClick, onSearch, onMenuClick, user }) => {
  const { unreadCount } = useNotificationStore();
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [searchVal, setSearchVal] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Auto-fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchVal.trim()) {
        setSuggestions([]);
        return;
      }
      setIsSearching(true);
      try {
        const results = await getCompanySuggestions(searchVal.trim());
        setSuggestions(results);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchVal]);

  // Handle Search Keyboard
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      if (focusedIndex >= 0 && suggestions[focusedIndex]) {
        onSearch(suggestions[focusedIndex]);
        setSearchVal(suggestions[focusedIndex]);
        setShowSuggestions(false);
      } else {
        onSearch(searchVal);
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
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
    <header className="h-20 fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-8">
      <div className="flex items-center gap-12 flex-1">
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl hover:bg-muted text-foreground transition-colors"
          >
            <LayoutGrid size={24} />
          </button>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <div className="w-4 h-4 bg-background rounded-sm rotate-45" />
            </div>
            <span className="hidden sm:inline text-xl font-black text-foreground tracking-tighter uppercase italic leading-none">Market <span className="text-accent-foreground">Scout</span></span>
          </motion.div>
        </div>

        <div className="relative max-w-md w-full group" ref={searchRef}>
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search & Analyze Competitor..."
            value={searchVal}
            onChange={(e) => {
                setSearchVal(e.target.value);
                setShowSuggestions(true);
                setFocusedIndex(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleSearchKeyDown}
            className="w-full bg-muted border border-transparent focus:border-primary focus:bg-background rounded-xl py-2.5 pl-11 pr-10 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground"
          />

          {isSearching && (
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <Loader2 size={14} className="text-primary animate-spin" />
            </div>
          )}

          <AnimatePresence>
            {showSuggestions && searchVal.trim() && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl border border-border shadow-2xl overflow-hidden z-[100]"
                >
                    <div className="p-2">
                        <p className="px-3 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Intelligent Suggestions</p>
                        {suggestions.map((s, i) => (
                            <button
                                key={s}
                                onClick={() => {
                                    setSearchVal(s);
                                    onSearch(s);
                                    setShowSuggestions(false);
                                    // If search suggests a new company, maybe we should trigger analyze too?
                                    // For now, just search filters the dashboard
                                }}
                                onMouseEnter={() => setFocusedIndex(i)}
                                className={cn(
                                    "w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between group",
                                    i === focusedIndex ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
                                )}
                            >
                                <span>
                                    {s.split(new RegExp(`(${searchVal})`, 'gi')).map((part, index) => 
                                        part.toLowerCase() === searchVal.toLowerCase() 
                                            ? <span key={index} className={cn("underline decoration-primary/30 underline-offset-4", i === focusedIndex ? "text-white" : "text-primary")}>{part}</span> 
                                            : <span key={index}>{part}</span>
                                    )}
                                </span>
                                <ChevronRight size={14} className={cn("transition-transform", i === focusedIndex ? "translate-x-0" : "-translate-x-2 opacity-0")} />
                            </button>
                        ))}
                        {suggestions.length === 0 && searchVal.trim() && !isSearching && (
                            <div className="px-3 py-6 text-center">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic mb-1">No Intelligence Match</p>
                                <p className="text-[8px] font-medium text-muted-foreground/60 italic uppercase tracking-tighter">Enter full name to force scan</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button 
          onClick={onAnalyzeClick}
          className="hidden md:flex bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 h-11 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95 gap-2"
        >
          <Plus size={16} strokeWidth={3} />
          Analyze Company
        </Button>

        <div className="flex items-center gap-2 pl-4 border-l border-border relative">
          <ThemeToggle />
          <button 
            onClick={onNotificationClick}
            className="p-2.5 rounded-full hover:bg-muted text-muted-foreground transition-colors relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-red-500 rounded-full border-2 border-background text-[8px] font-black text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 pl-1 pr-3 rounded-full hover:bg-muted border border-transparent hover:border-border transition-all"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {user?.full_name?.[0] || 'U'}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-sm font-bold text-foreground">
                  {user?.full_name?.split(' ')[0] || 'Member'}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Intelligence Agent</span>
              </div>
              <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", isProfileOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 mt-3 w-56 bg-popover/95 backdrop-blur-2xl rounded-2xl border border-border shadow-2xl overflow-hidden shadow-black/10 py-2"
                >
                  <div className="px-4 py-3 border-b border-border mb-2">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Session Identity</p>
                    <p className="text-sm font-bold text-foreground truncate">{user?.email || 'user@marketscout.ai'}</p>
                  </div>

                  <button 
                    onClick={() => { navigate('/dashboard/settings'); setIsProfileOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <Settings size={16} className="text-muted-foreground" />
                    Settings
                  </button>

                  <button 
                    onClick={() => { navigate('/dashboard/risk'); setIsProfileOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <Shield size={16} className="text-muted-foreground" />
                    Security Audit
                  </button>

                  <div className="h-px bg-muted my-2" />

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
