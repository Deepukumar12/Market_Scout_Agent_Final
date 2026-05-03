import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getCompanySuggestions } from '@/services/api';

interface AnalyzeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (company: string) => Promise<void>;
  status: 'idle' | 'running' | 'completed' | 'error';
  progressSteps: string[];
  currentStep: number;
  liveLogs?: string[];
}

const POPULAR_COMPANIES = [
  "Apple", "Amazon", "Alphabet", "Anthropic", "Adobe", "AMD", "Airbnb", "Atlassian",
  "Meta", "Microsoft", "Mistral", "Netflix", "Nvidia", "Notion", "OpenAI",
  "Google", "Github", "Gitlab", "Stripe", "SpaceX", "Slack", "Shopify", "Snowflake",
  "Tesla", "TikTok", "Uber", "Vercel", "Zoom", "IIT Bombay", "IBM", "Intel",
  "Oracle", "Salesforce", "Samsung", "Sony", "Spotify", "Square", "Snap", "Splunk",
  "Palantir", "Pinterest", "Plaid", "Perplexity", "Qualcomm", "Reddit", "Roblox",
  "Databricks", "Datadog", "DigitalOcean", "Discord", "Docker"
];

const AnalyzeModal: React.FC<AnalyzeModalProps> = ({ 
  isOpen, 
  onClose, 
  onAnalyze, 
  status,
  progressSteps,
  currentStep,
  liveLogs = []
}) => {
  const [company, setCompany] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!company.trim() || company.trim().length < 2) {
        setDynamicSuggestions([]);
        setIsSearching(false);
        return;
      }
      
      setIsSearching(true);
      try {
        const results = await getCompanySuggestions(company.trim());
        setDynamicSuggestions(results.filter((c: string) => c.toLowerCase() !== company.trim().toLowerCase()));
      } catch (e) {
        console.error("Suggestion fetch error:", e);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [company]);

  const filteredSuggestions = dynamicSuggestions;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < filteredSuggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      setCompany(filteredSuggestions[focusedIndex]);
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
      onAnalyze(company);
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
            className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-[#1D1D1F]">Analyze New Company</h2>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-[#F5F5F7] text-[#6E6E73] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {status === 'idle' ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                      <Search size={20} className="text-[#6E6E73] group-focus-within:text-[#0071E3] transition-colors" />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter company name (e.g. OpenAI)"
                      value={company}
                      onChange={(e) => {
                        setCompany(e.target.value);
                        setShowSuggestions(true);
                        setFocusedIndex(-1);
                      }}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="w-full bg-[#F5F5F7] border border-transparent focus:border-[#0071E3] focus:bg-white rounded-2xl py-5 pl-14 pr-6 text-[#1D1D1F] text-lg font-medium outline-none transition-all"
                      autoFocus
                    />
                    
                    <AnimatePresence>
                      {showSuggestions && filteredSuggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-64 overflow-y-auto"
                        >
                          {filteredSuggestions.map((suggestion, index) => (
                            <button
                              key={suggestion}
                              type="button"
                              onMouseEnter={() => setFocusedIndex(index)}
                              onClick={() => {
                                setCompany(suggestion);
                                setShowSuggestions(false);
                                setFocusedIndex(-1);
                              }}
                              className={`w-full text-left px-6 py-3 font-medium transition-colors border-b border-gray-50 last:border-0 ${index === focusedIndex ? 'bg-[#F5F5F7] text-[#0071E3]' : 'hover:bg-[#F5F5F7] text-[#1D1D1F]'}`}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      disabled={!company.trim()}
                      className="w-full h-16 rounded-2xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-lg font-bold shadow-lg shadow-[#0071E3]/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
                    >
                      Analyze Company
                      <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
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
                          <div className="w-6 h-6 border-2 border-[#E5E5EA] rounded-full" />
                        )}
                        <span className={cn(
                          "text-base font-semibold",
                          index === currentStep ? "text-[#1D1D1F]" : "text-[#6E6E73]"
                        )}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>

                  {status === 'running' && liveLogs.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-6 p-4 bg-[#1D1D1F] rounded-2xl font-mono text-[11px] space-y-1.5 overflow-hidden"
                    >
                      {liveLogs.map((log, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-[#34C759] shrink-0">➜</span>
                          <span className="text-gray-400 break-all">{log}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {status === 'completed' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="pt-6"
                    >
                      <Button 
                        onClick={onClose}
                        className="w-full h-14 rounded-2xl bg-[#34C759] hover:bg-[#2FB350] text-white font-bold"
                      >
                        View Full Report
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
            
            <div className="bg-[#F5F5F7] rounded-b-[32px] p-6 text-center">
              <p className="text-sm text-[#6E6E73] font-medium">
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

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
