
import { cn } from '@/lib/utils';
import { 
  Users, BarChart3, FileText, Settings, 
  ShieldAlert, LogOut, Heart, Sparkles,
  ChevronRight, LayoutDashboard, BrainCircuit, Activity, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

type NavItemConfig = {
  label: string;
  icon: any;
  to: string;
  category?: string;
};

const Sidebar = ({ onClose }: { onClose?: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();
  // const [hoveredIndex, setHoveredIndex] = useState<number | null>(null); // Removed unused state

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems: NavItemConfig[] = [
    { label: 'Overview', icon: LayoutDashboard, to: '/dashboard', category: 'General' },
    { label: 'AI Strategy', icon: Sparkles, to: '/dashboard/ai-suggestion', category: 'General' },
    { label: 'Predictive Analytics', icon: BrainCircuit, to: '/dashboard/predictive-analytics', category: 'Intelligence' },
    { label: 'Market Sentiment', icon: Heart, to: '/dashboard/sentiment-analysis', category: 'Intelligence' },
    { label: 'Market Watchlist', icon: Users, to: '/dashboard/target-universe', category: 'Network' },
    { label: 'Intelligence Reports', icon: FileText, to: '/dashboard/reports', category: 'Assets' },
    { label: 'Signal Metrics', icon: BarChart3, to: '/dashboard/analytics', category: 'Stats' },
    { label: 'Risk Assessment', icon: ShieldAlert, to: '/dashboard/risk', category: 'Security' },
  ];

  const isActive = (to: string) => {
    if (to === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(to);
  };

  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-72 h-full bg-[#0B0F19] border-r border-[#1E293B] flex flex-col relative z-20 group/sidebar"
    >
      
      <div className="p-8 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div 
            className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20"
          >
            <Activity className="w-5 h-5 text-white" />
          </motion.div>
          <div className="flex flex-col text-left">
            <span className="text-lg font-bold tracking-tight text-white leading-none">Scout<span className="text-blue-500">IQ</span></span>
            <span className="text-[11px] text-slate-400 font-medium">Market Intelligence</span>
          </div>
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose} 
          className="lg:hidden text-slate-500 hover:text-white"
        >
          <X size={20} />
        </Button>
      </div>

      <div className="flex-1 px-4 overflow-y-auto custom-scrollbar space-y-8 scroll-smooth pb-10">
        {['General', 'Intelligence', 'Network', 'Assets', 'Stats', 'Security'].map((cat) => (
          <div key={cat} className="space-y-1">
            <h3 className="px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{cat}</h3>
            {navItems.filter(item => item.category === cat).map((item) => (
              <NavItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                active={isActive(item.to)}
                onClick={() => navigate(item.to)}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="p-4 mt-auto border-t border-[#1E293B] space-y-1">
        <NavItem
          icon={Settings}
          label="Settings"
          active={isActive('/dashboard/settings')}
          onClick={() => navigate('/dashboard/settings')}
        />
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-2xl h-12 transition-all group border border-transparent hover:border-rose-500/10"
        >
          <LogOut size={16} className="mr-3 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[11px] font-bold uppercase tracking-wider">Sign Out</span>
        </Button>
      </div>
    </motion.div>
  );
};

const NavItem = ({
  icon: Icon,
  label,
  active = false,
  onClick,
  onHover,
  onLeave
}: {
  icon: any;
  label: string;
  active?: boolean;
  onClick?: () => void;
  onHover?: () => void;
  onLeave?: () => void;
}) => {
  return (
    <motion.div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      whileHover={{ x: 4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Button
        type="button"
        onClick={onClick}
        variant="ghost"
        className={cn(
          'w-full justify-start transition-all duration-200 rounded-lg px-3 h-10 relative overflow-hidden group',
          active
            ? 'bg-blue-500/10 text-blue-400 font-medium'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        )}
      >        <div className={cn(
          "w-5 h-5 flex items-center justify-center mr-3 transition-colors",
          active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
        )}>
          <Icon size={18} />
        </div>
        
        <span className="text-sm font-medium relative z-10 transition-colors">
          {label}
        </span>
        
        {label.includes('Futures') && (
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="ml-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </motion.div>
        )}

        {active && (
          <motion.div 
            layoutId="active-indicator"
            className="ml-auto w-1 h-5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
          />
        )}
        
        {!active && (
          <ChevronRight className="ml-auto w-4 h-4 text-slate-700 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
        )}
      </Button>
    </motion.div>
  );
};

export default Sidebar;
