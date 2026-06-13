import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2, CheckCircle2, ChevronRight, AlertCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { searchCompanies } from '@/services/api';
import { cn } from '@/utils/utils';

interface CompanySuggestion {
  name: string;
  domain: string;
  logo: string;
  industry?: string;
  country?: string;
  employee_count?: number;
  source?: string;
}

interface AnalyzeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (suggestion: CompanySuggestion, forceRefresh?: boolean) => Promise<void>;
  status: 'idle' | 'running' | 'completed' | 'error';
  progressSteps: string[];
  currentStep: number;
}

const AnalyzeModal: React.FC<AnalyzeModalProps> = ({ 
  isOpen, 
  onClose, 
  onAnalyze, 
  status,
  progressSteps,
  currentStep
}) => {
  const [company, setCompany] = useState('');
  const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);

  const isPromptInjection = (input: string) => {
    const patterns = [
      /ignore previous/i,
      /you are/i,
      /which model/i,
      /who are you/i,
      /list files/i,
      /delete/i,
      /drop table/i,
      /<script/i,
      /system/i,
      /admin/i
    ];
    return patterns.some(p => p.test(input));
  };

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (company.trim().length >= 1 && showSuggestions) {
        setIsSearching(true);
        try {
          const results = await searchCompanies(company);
          setSuggestions(results);
        } catch (error) {
          console.error('Search failed:', error);
          setSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 200); // Faster debounce for real-time feel

    return () => clearTimeout(timer);
  }, [company, showSuggestions]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      const selected = suggestions[focusedIndex];
      setCompany(selected.name);
      setShowSuggestions(false);
      setFocusedIndex(-1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setFocusedIndex(-1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (company.trim()) {
      const selected = suggestions.find(s => s.name === company) || { name: company, domain: '', logo: '' };
      onAnalyze(selected, forceRefresh);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
            <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-xl bg-white dark:bg-[#1C1C1E] rounded-[32px] shadow-2xl border border-transparent dark:border-white/10"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-[#1D1D1F] dark:text-white">Analyze New Company</h2>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-[#F5F5F7] dark:hover:bg-white/10 text-[#6E6E73] dark:text-[#86868B] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {status === 'idle' ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                      {isSearching ? (
                        <Loader2 size={20} className="text-[#0071E3] animate-spin" />
                      ) : (
                        <Search size={20} className="text-[#6E6E73] group-focus-within:text-[#0071E3] transition-colors" />
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Search global companies (e.g. Apple, Stripe, Curd Rice...)"
                      value={company}
                      onChange={(e) => {
                        setCompany(e.target.value);
                        setShowSuggestions(true);
                        setFocusedIndex(-1);
                      }}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className={cn(
                        "w-full bg-[#F5F5F7] dark:bg-[#2C2C2E] border-2 rounded-2xl py-5 pl-14 pr-6 text-[#1D1D1F] dark:text-white text-lg font-medium outline-none transition-all placeholder:text-[#6E6E73] dark:placeholder:text-[#86868B]",
                        isPromptInjection(company) ? "border-rose-500 bg-rose-50 dark:bg-rose-500/5" : "border-transparent focus:border-[#0071E3] focus:bg-white dark:focus:bg-[#1D1D1F]"
                      )}
                      autoFocus
                    />
                    
                    <AnimatePresence>
                      {isPromptInjection(company) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-2 mt-3"
                        >
                          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest italic">
                            <Shield size={12} />
                            Security Alert: Input resembles a system command or prompt injection.
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <AnimatePresence>
                      {showSuggestions && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-10 w-full mt-2 bg-white dark:bg-[#2C2C2E] rounded-xl shadow-xl border border-gray-100 dark:border-white/10 max-h-80 overflow-y-auto overflow-x-hidden"
                        >
                          {isSearching && suggestions.length === 0 && (
                            <div className="p-12 text-center">
                              <Loader2 size={32} className="text-[#0071E3] animate-spin mx-auto mb-4" />
                              <p className="text-sm font-bold text-[#1D1D1F] dark:text-white uppercase tracking-widest italic">Scanning Global Network...</p>
                            </div>
                          )}
                          
                          {!isSearching && company.trim() && suggestions.length === 0 && (
                            <div className="p-12 text-center">
                              <Search size={32} className="text-[#6E6E73] mx-auto mb-4 opacity-20" />
                              <p className="text-sm font-bold text-[#1D1D1F] dark:text-white uppercase tracking-widest italic">No Organizations Found</p>
                              <p className="text-xs text-[#6E6E73] mt-2 italic">Try a broader keyword or partial name.</p>
                            </div>
                          )}

                          {suggestions.map((suggestion, index) => (
                            <button
                              key={`${suggestion.domain}-${index}`}
                              type="button"
                              onMouseEnter={() => setFocusedIndex(index)}
                              onClick={() => {
                                setCompany(suggestion.name);
                                setShowSuggestions(false);
                                setFocusedIndex(-1);
                              }}
                              className={`w-full text-left px-6 py-4 transition-colors border-b border-gray-50 dark:border-white/5 last:border-0 flex items-center gap-4 ${index === focusedIndex ? 'bg-[#F5F5F7] dark:bg-white/5' : 'hover:bg-[#F5F5F7] dark:hover:bg-white/5'}`}
                            >
                              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-[#0071E3]/20 flex items-center justify-center text-blue-600 dark:text-[#0071E3] font-black uppercase overflow-hidden shrink-0">
                                {suggestion.name[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div className={`font-bold truncate ${index === focusedIndex ? 'text-[#0071E3]' : 'text-[#1D1D1F] dark:text-white'}`}>
                                    {suggestion.name}
                                  </div>
                                  {suggestion.source && (
                                    <span className="text-[8px] font-black text-[#6E6E73] dark:text-[#86868B] uppercase tracking-[0.2em] opacity-40 italic">
                                      via {suggestion.source}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-[#6E6E73] dark:text-[#86868B] truncate font-medium">
                                    {suggestion.domain}
                                  </span>
                                  {suggestion.industry && (
                                    <>
                                      <span className="text-[#E5E5EA] dark:text-white/10">•</span>
                                      <span className="text-[10px] font-bold text-[#0071E3] uppercase tracking-tighter italic">{suggestion.industry}</span>
                                    </>
                                  )}
                                  {suggestion.country && (
                                    <>
                                      <span className="text-[#E5E5EA] dark:text-white/10">•</span>
                                      <span className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-widest">{suggestion.country}</span>
                                    </>
                                  )}
                                  {suggestion.employee_count && (
                                    <>
                                      <span className="text-[#E5E5EA] dark:text-white/10">•</span>
                                      <span className="text-[10px] font-bold text-[#34C759] uppercase tracking-widest">{suggestion.employee_count.toLocaleString()}+ Staff</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <ChevronRight size={16} className={`shrink-0 ${index === focusedIndex ? 'text-[#0071E3]' : 'text-gray-300 dark:text-gray-600'}`} />
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="flex items-center gap-3 px-2 mt-4">
                      <input 
                        type="checkbox" 
                        id="forceRefresh"
                        checked={forceRefresh}
                        onChange={(e) => setForceRefresh(e.target.checked)}
                        className="w-5 h-5 rounded-lg border-[#E5E5EA] dark:border-white/10 bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#0071E3] focus:ring-[#0071E3] transition-all cursor-pointer"
                      />
                      <label htmlFor="forceRefresh" className="text-sm font-bold text-[#6E6E73] dark:text-[#86868B] cursor-pointer select-none uppercase tracking-widest italic">
                        Force Deep Refresh <span className="text-[10px] opacity-40">(Bypass 24h Cache)</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      disabled={!company.trim() || isPromptInjection(company)}
                      className="w-full h-16 rounded-2xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-lg font-bold shadow-lg shadow-[#0071E3]/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
                    >
                      Analyze Company
                      <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <div className="flex items-center justify-center gap-2 mt-4 opacity-40">
                      <Shield size={12} className="text-blue-600" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#86868B] italic">Secured by Enterprise AI Guardrail</span>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-8 py-4">
                  <div className="relative h-2 w-full bg-[#F5F5F7] rounded-full overflow-hidden">
                    <motion.div 
                      className="absolute inset-y-0 left-0 bg-[#0071E3]"
                      initial={{ width: '0%' }}
                      animate={{ width: status === 'completed' ? '100%' : `${((currentStep + 1) / progressSteps.length) * 100}%` }}
                    />
                  </div>
                  
                  {status === 'error' ? (
                    <div className="p-10 text-center space-y-6">
                      <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500">
                        <AlertCircle size={40} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">System Error</h3>
                        <p className="text-sm text-[#86868B] font-medium leading-relaxed">
                          The intelligence pipeline encountered an anomaly while synthesizing data. Please verify your connection or try a different company.
                        </p>
                      </div>
                      <Button 
                        onClick={() => {
                          onAnalyze({ name: company, domain: '', logo: '' });
                        }}
                        className="w-full h-14 rounded-2xl bg-[#0071E3] text-white font-bold"
                      >
                        Retry Mission
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {progressSteps.map((step, index) => (
                        <div 
                          key={index}
                          className={cn(
                            "flex items-center gap-4 transition-opacity",
                            index > currentStep ? "opacity-30" : "opacity-100"
                          )}
                        >
                          {status === 'completed' || index < currentStep ? (
                            <CheckCircle2 size={24} className="text-[#34C759]" />
                          ) : index === currentStep ? (
                            <Loader2 size={24} className="text-[#0071E3] animate-spin" />
                          ) : (
                            <div className="w-6 h-6 border-2 border-[#E5E5EA] dark:border-white/10 rounded-full" />
                          )}
                          <span className={cn(
                            "text-base font-bold italic tracking-tight uppercase",
                            index === currentStep ? "text-[#1D1D1F] dark:text-white" : "text-[#6E6E73] dark:text-[#86868B]"
                          )}>
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {status === 'completed' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="pt-6 space-y-4"
                    >
                      <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0">
                          <CheckCircle2 size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1D1D1F] dark:text-white">Intelligence Secured</p>
                          <p className="text-xs text-[#86868B]">A new technical report has been generated for {company}.</p>
                        </div>
                      </div>
                      <Button 
                        onClick={onClose}
                        className="w-full h-14 rounded-2xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-bold"
                      >
                        Access Command Center
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
            
            <div className="bg-[#F5F5F7] dark:bg-white/5 rounded-b-[32px] p-6 text-center">
              <p className="text-sm text-[#6E6E73] dark:text-[#86868B] font-medium">
                Our AI agents are scanning thousands of technical sources in real-time.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AnalyzeModal;

