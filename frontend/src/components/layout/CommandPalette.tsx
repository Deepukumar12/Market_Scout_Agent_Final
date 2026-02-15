
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Calculator, Command, FileText, 
  Settings, Users, Activity, Shield, Zap, 
  ArrowRight, LayoutDashboard, Globe
} from 'lucide-react';
import { useCompetitorStore } from '@/store/competitorStore';

const CommandPalette = ({ open, setOpen }: { open: boolean, setOpen: (o: boolean) => void }) => {
  const navigate = useNavigate();
  const { competitors } = useCompetitorStore();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Grouped Commands
  const groups = [
    {
      label: 'Navigation',
      items: [
        { id: 'dash', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', shortcut: 'D' },
        { id: 'reps', label: 'Reports', icon: FileText, path: '/dashboard/reports', shortcut: 'R' },
        { id: 'ana', label: 'Analytics', icon: Activity, path: '/dashboard/analytics', shortcut: 'A' },
        { id: 'risk', label: 'Risk Matrix', icon: Shield, path: '/dashboard/risk', shortcut: 'X' },
        { id: 'uni', label: 'Target Universe', icon: Globe, path: '/dashboard/target-universe', shortcut: 'U' },
      ]
    },
    {
      label: 'Competitors',
      items: competitors.map((c: any) => ({
        id: c._id || c.id,
        label: c.name,
        icon: Users,
        path: `/dashboard/competitors/${c._id || c.id}/report`,
        sub: c.industry || 'Tech'
      }))
    },
    {
      label: 'Actions',
      items: [
        { id: 'new', label: 'Add New Competitor', icon: Zap, path: '/dashboard/add-competitor', shortcut: 'N' },
        { id: 'sets', label: 'Global Settings', icon: Settings, path: '/dashboard/settings', shortcut: ',' },
      ]
    }
  ];

  // Filter items
  const filteredItems = groups.map(group => ({
    ...group,
    items: group.items.filter(item => 
      item.label.toLowerCase().includes(query.toLowerCase()) || 
      (item.sub && item.sub.toLowerCase().includes(query.toLowerCase()))
    )
  })).filter(group => group.items.length > 0);

  // Flatten for keyboard nav
  const flatItems = filteredItems.flatMap(g => g.items);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === 'Escape') setOpen(false);
      
      if (!open) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % flatItems.length);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + flatItems.length) % flatItems.length);
      }
      if (e.key === 'Enter' && flatItems[activeIndex]) {
        handleSelect(flatItems[activeIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, flatItems, activeIndex, navigate]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setActiveIndex(0);
      setQuery('');
    }
  }, [open]);

  const handleSelect = (item: any) => {
    navigate(item.path);
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-[#0b1221] border border-white/10 rounded-2xl shadow-2xl z-[101] overflow-hidden flex flex-col max-h-[60vh]"
          >
            {/* Header / Input */}
            <div className="flex items-center gap-4 p-4 border-b border-white/5">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-500 text-lg font-medium"
              />
              <div className="hidden md:flex items-center gap-1">
                <kbd className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-slate-400 font-mono">ESC</kbd>
              </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {flatItems.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <p className="text-sm">No results found.</p>
                </div>
              ) : (
                filteredItems.map((group, gIdx) => (
                  <div key={group.label} className="mb-4 last:mb-0">
                    <h4 className="px-3 py-2 text-[10px] uppercase font-bold text-slate-500 tracking-widest sticky top-0 bg-[#0b1221]/95 backdrop-blur z-10">
                      {group.label}
                    </h4>
                    <div className="space-y-1">
                      {group.items.map((item, idx) => {
                        const globalIndex = flatItems.indexOf(item);
                        const isActive = globalIndex === activeIndex;
                        
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setActiveIndex(globalIndex)}
                            className={`
                              flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition-colors group
                              ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-300 hover:bg-white/5'}
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-md ${isActive ? 'bg-white/20' : 'bg-white/5 border border-white/5'}`}>
                                <item.icon className="w-4 h-4" />
                              </div>
                              <div>
                                <div className={`text-sm font-medium ${isActive ? 'text-white' : 'text-slate-200'}`}>
                                  {item.label}
                                </div>
                                {item.sub && (
                                  <div className={`text-[10px] ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>
                                    {item.sub}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {item.shortcut && !query && (
                               <div className="flex items-center gap-1">
                                   <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                                       isActive ? 'bg-blue-500 border-blue-400 text-white' : 'bg-white/5 border-white/10 text-slate-500'
                                   }`}>
                                       {item.shortcut}
                                   </kbd>
                               </div>
                            )}
                            {isActive && !item.shortcut && (
                                <ArrowRight className="w-4 h-4 text-white animate-pulse" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Footer */}
            <div className="p-3 border-t border-white/5 bg-black/20 flex items-center justify-between text-[10px] text-slate-500">
               <div className="flex gap-4">
                   <span className="flex items-center gap-1"><Command className="w-3 h-3"/> + K to open</span>
                   <span className="flex items-center gap-1"><ArrowRight className="w-3 h-3"/> to select</span>
               </div>
               <div className="font-mono">MarketScout v4.2</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
