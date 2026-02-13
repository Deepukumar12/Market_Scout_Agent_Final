
import { cn } from '@/lib/utils';
import { Home, Users, BarChart3, FileText, Settings, ShieldAlert, LogOut, TrendingUp, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

type NavItemConfig = {
  label: string;
  icon: JSX.Element;
  to: string;
  extraClass?: string;
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems: NavItemConfig[] = [
    { label: 'Overview', icon: <Home size={20} />, to: '/dashboard' },
    { 
        label: 'Predictive Analytics', 
        icon: <TrendingUp size={20} className="text-purple-400" />, 
        to: '/dashboard/predictive-analytics',
        extraClass: "hover:shadow-[0_0_15px_rgba(192,132,252,0.4)] transition-all duration-300 border border-purple-500/10 hover:border-purple-500/40 relative overflow-hidden"
    },
    { 
        label: 'Sentiment Analysis', 
        icon: <Heart size={20} className="text-pink-400" />, 
        to: '/dashboard/sentiment-analysis',
        extraClass: "hover:bg-gradient-to-r hover:from-pink-900/20 hover:to-transparent border border-pink-500/10 hover:border-pink-500/40"
    },
    { label: 'Competitors', icon: <Users size={20} />, to: '/dashboard/competitors' },
    { label: 'Reports', icon: <FileText size={20} />, to: '/dashboard/reports' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, to: '/dashboard/analytics' },
    { label: 'Risk Analysis', icon: <ShieldAlert size={20} />, to: '/dashboard/risk' },
  ];

  const settingsItem: NavItemConfig = {
    label: 'Settings',
    icon: <Settings size={20} />,
    to: '/dashboard/settings',
  };

  const isActive = (to: string) => {
    if (to === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(to);
  };

  return (
    <div className="w-64 h-full bg-black border-r border-white/10 flex flex-col p-4">
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
          <span className="text-cyan-400 font-bold">Q</span>
        </div>
        <span className="text-xl font-bold tracking-tighter text-white">SCOUTIQ</span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            active={isActive(item.to)}
            onClick={() => navigate(item.to)}
            extraClass={item.extraClass}
          />
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-white/10 space-y-2">
        <NavItem
          icon={settingsItem.icon}
          label={settingsItem.label}
          active={isActive(settingsItem.to)}
          onClick={() => navigate(settingsItem.to)}
        />
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-900/20"
        >
          <LogOut size={20} className="mr-2" /> Logout
        </Button>
      </div>
    </div>
  );
};

const NavItem = ({
  icon,
  label,
  active = false,
  onClick,
  extraClass = '',
}: {
  icon: JSX.Element;
  label: string;
  active?: boolean;
  onClick?: () => void;
  extraClass?: string;
}) => {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant="ghost"
      className={cn(
        'w-full justify-start transition-all duration-200 rounded-xl px-3',
        active
          ? 'bg-cyan-900/40 text-cyan-300 border-r-2 border-cyan-500 shadow-[0_0_18px_rgba(6,182,212,0.4)]'
          : 'text-gray-400 hover:text-white hover:bg-white/5',
        extraClass
      )}
    >
      <span className="mr-3">{icon}</span>
      {label}
      {label.includes('Predictive') && (
        <Sparkles className="ml-auto w-3 h-3 text-purple-400 animate-pulse" />
      )}
    </Button>
  );
};

export default Sidebar;
