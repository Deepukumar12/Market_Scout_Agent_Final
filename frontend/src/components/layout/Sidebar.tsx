import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  LayoutDashboard, 
  Users, 
  FileText, 
  Sparkles, 
  Settings,
  TrendingUp,
  Smile,
  Globe,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, LayoutGroup } from 'framer-motion';

const menuGroups = [
  {
    label: 'Main',
    items: [
      { icon: LayoutDashboard, text: 'Overview', path: '/dashboard' },
      { icon: BarChart3, text: 'Analytics', path: '/dashboard/analytics' },
      { icon: Globe, text: 'Target Universe', path: '/dashboard/target-universe' },
    ]
  },
  {
    label: 'Intelligence',
    items: [
      { icon: Sparkles, text: 'AI Insights', path: '/dashboard/ai-suggestion' },
      { icon: TrendingUp, text: 'Predictive', path: '/dashboard/predictive-analytics' },
      { icon: Smile, text: 'Sentiment', path: '/dashboard/sentiment-analysis' },
      { icon: ShieldAlert, text: 'Risk Audit', path: '/dashboard/risk' },
    ]
  },
  {
    label: 'Management',
    items: [
      { icon: Users, text: 'Competitors', path: '/dashboard/competitors' },
      { icon: FileText, text: 'Reports', path: '/dashboard/reports' },
      { icon: Users, text: 'Add New', path: '/dashboard/add-competitor' },
    ]
  },
  {
    label: 'System',
    items: [
      { icon: Settings, text: 'Settings', path: '/dashboard/settings' },
    ]
  }
];

import ThemeToggle from './ThemeToggle';

const Sidebar: React.FC<{ isOpen?: boolean, onClose?: () => void }> = ({ isOpen, onClose }) => {
  return (
    <aside className={cn(
      "w-72 h-screen bg-white dark:bg-[#0A0A0B] border-r border-[#E5E5EA] dark:border-white/5 pt-24 pb-12 flex flex-col fixed left-0 top-0 z-40 transition-all duration-300",
      isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    )}>
      <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar relative">
        <LayoutGroup>
          {menuGroups.map((group) => (
            <div key={group.label} className="space-y-2">
              <h4 className="px-4 text-[10px] font-black text-[#52525B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] italic">
                {group.label}
              </h4>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/dashboard'}
                    onClick={onClose}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group relative",
                      isActive 
                        ? "bg-[#0071E3]/10 text-[#0071E3] font-bold" 
                        : "text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-white/5"
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.div 
                            layoutId="active-nav"
                            className="absolute left-0 w-1 h-5 bg-[#0071E3] rounded-r-full"
                          />
                        )}
                        <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={cn(isActive ? "text-[#0071E3]" : "text-current opacity-70")} />
                        <span className="text-[14px]">{item.text}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </LayoutGroup>
      </nav>

      <div className="px-6 mt-auto space-y-4">
        <div className="p-6 rounded-3xl bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-white/10 flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] mb-1 italic">System</p>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#34C759] shadow-[0_0_8px_rgba(52,199,89,0.5)]" />
                <span className="text-sm font-bold text-[#1D1D1F] dark:text-white">Active</span>
             </div>
           </div>
           <ThemeToggle />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
