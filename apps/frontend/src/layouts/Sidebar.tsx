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

const menuItems = [
  { icon: LayoutDashboard, text: 'Dashboard', path: '/dashboard' },
  { icon: BarChart3, text: 'Analytics', path: '/dashboard/analytics' },
  { icon: Users, text: 'Competitors', path: '/dashboard/competitors' },
  { icon: FileText, text: 'Reports', path: '/dashboard/reports' },
  { icon: Sparkles, text: 'Insights', path: '/dashboard/ai-suggestion' },
  { icon: TrendingUp, text: 'Predictive', path: '/dashboard/predictive-analytics' },
  { icon: Smile, text: 'Sentiment', path: '/dashboard/sentiment-analysis' },
  { icon: Globe, text: 'Target Universe', path: '/dashboard/target-universe' },
  { icon: ShieldAlert, text: 'Risk', path: '/dashboard/risk' },
  { icon: Users, text: 'Add Competitor', path: '/dashboard/add-competitor' },
  { icon: Settings, text: 'Settings', path: '/dashboard/settings' },
];

import ThemeToggle from './ThemeToggle';

const Sidebar: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  return (
    <aside className="w-72 h-screen bg-white/80 dark:bg-[#1D1D1F]/80 backdrop-blur-xl border-r border-[#E5E5EA] dark:border-white/10 pt-24 pb-12 flex flex-col fixed left-0 top-0 z-40">
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            onClick={onClose}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group relative",
              isActive 
                ? "bg-[#0071E3] text-white shadow-apple-blue font-bold" 
                : "text-[#6E6E73] dark:text-[#86868B] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E]"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[15px]">{item.text}</span>
              </>
            )}
          </NavLink>
        ))}
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
