import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Shield, 
  Terminal, 
  Settings, 
  AlertTriangle, 
  Database,
  RefreshCw,
  Search,
  Bell,
  Menu,
  ChevronRight,
  TrendingUp,
  Cpu,
  Globe,
  Zap,
  Lock,
  Sun,
  Moon,
  Users,
  UserPlus,
  Trash2
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { platformClient } from '@market-scout/platform';
import { useTheme } from './context/ThemeContext';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-8 rounded-full p-1 bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all overflow-hidden flex items-center group shadow-inner"
    >
      <motion.div
        animate={{ 
          x: theme === 'dark' ? 24 : 0,
          backgroundColor: theme === 'dark' ? '#0071E3' : '#F5F5F7'
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg relative z-10"
      >
        <AnimatePresence mode="wait" initial={false}>
          {theme === 'dark' ? (
            <motion.div
              key="sun"
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              <Sun size={14} className="text-white fill-current" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              <Moon size={14} className="text-[#1D1D1F] fill-current" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <div className="absolute inset-0 flex justify-between px-2 items-center opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity">
        <Moon size={12} className={theme === 'dark' ? 'invisible' : ''} />
        <Sun size={12} className={theme === 'light' ? 'invisible' : ''} />
      </div>
    </button>
  );
};

const Gauge = ({ value, label, color }: any) => {
  const data = [
    { value: value },
    { value: 100 - value },
  ];
  const COLORS = [color, 'var(--bg-accent)'];

  return (
    <div className="flex flex-col items-center flex-1 min-w-[100px]">
      <div className="h-32 w-full max-w-[128px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={40}
              outerRadius={55}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute bottom-0 left-0 right-0 text-center pb-1">
          <span className="text-lg font-bold text-[var(--text-primary)]">{Math.round(value)}%</span>
        </div>
      </div>
      <span className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mt-2 text-center">{label}</span>
    </div>
  );
};

// Removed generateLiveStats mock

const StatCard = ({ title, value, change, icon: Icon, trend, color = 'blue' }: any) => {
  const colorMap: any = {
    blue: 'from-blue-500/20 to-blue-500/5 text-[#0071E3] border-blue-500/20 shadow-blue-500/10',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10',
    rose: 'from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/20 shadow-rose-500/10',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20 shadow-amber-500/10',
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.02, translateY: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-8 rounded-[40px] bg-gradient-to-br ${colorMap[color]} shadow-xl relative overflow-hidden group`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-[0.03] blur-2xl rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl bg-white/5 border border-white/5 group-hover:glow-${color} transition-all duration-500`}>
          <Icon size={24} className="group-hover:scale-110 transition-transform duration-500" />
        </div>
        {change && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest italic`}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />}
            {change}
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1 italic">{title}</p>
        <h4 className="text-3xl font-black tracking-tighter text-[var(--text-primary)] italic uppercase leading-none">{value || '---'}</h4>
      </div>
      
      {/* Decorative pulse */}
      <div className="absolute bottom-4 right-8 flex items-center gap-1 opacity-20">
        <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
        <div className="w-1 h-3 rounded-full bg-current animate-pulse delay-75" />
        <div className="w-1 h-2 rounded-full bg-current animate-pulse delay-150" />
      </div>
    </motion.div>
  );
};

const AuthPortal = ({ onLogin }: { onLogin: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await platformClient.login(email, password);
      } else {
        await platformClient.register({ email, password, full_name: fullName });
      }
      onLogin();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[var(--bg-primary)]">
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[150px] rounded-full" />
      
      <div className="glass-card w-full max-w-md p-10 rounded-[2.5rem] relative z-10 animate-fade-in">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mb-6 group hover:scale-110 transition-transform duration-500 shadow-2xl shadow-blue-600/40">
            <img src="/logo.png" alt="ScoutForge AI" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic">SCOUTFORGE<span className="text-[#0071E3]">AI</span></h1>
          <p className="text-[var(--text-secondary)] text-[10px] uppercase tracking-[0.3em] font-black mt-2 italic">Administrative Command</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold flex items-center gap-3 animate-shake">
            <AlertTriangle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold ml-1">Full Name</label>
              <div className="relative group">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Deepu Thakur"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-[var(--text-secondary)]/30 text-[var(--text-primary)] font-bold italic"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold ml-1">Secure Email</label>
            <div className="relative group">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@marketscout.ai"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-[var(--text-secondary)]/30 text-[var(--text-primary)] font-bold italic"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold ml-1">Cipher Key</label>
            <div className="relative group">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-[var(--text-secondary)]/30 text-[var(--text-primary)] font-bold italic"
              />
              <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]/30 group-focus-within:text-blue-400 transition-colors" size={18} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#0071E3] hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3 mt-4 italic"
          >
            {loading ? (
              <RefreshCw className="animate-spin w-5 h-5" />
            ) : (
              <>
                {isLogin ? 'Initialize Access' : 'Create Admin ID'}
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] uppercase tracking-[0.2em] font-black text-blue-500 hover:text-blue-400 transition-colors italic"
          >
            {isLogin ? "Request Higher Access (Signup)" : "Return to Login Console"}
          </button>
        </div>
      </div>
    </div>
  );
};

  const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { theme } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [vault, setVault] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [isAddUserModalOpen, setAddUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', full_name: '', password: '', role: 'user' });
  const [actionLoading, setActionLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  useEffect(() => {
    // Check if user is already authenticated (token exists in localStorage via PlatformClient)
    const token = localStorage.getItem('scout_token');
    setIsAuthenticated(!!token);
  }, []);

  const handleLogout = () => {
    platformClient.setToken(null);
    setIsAuthenticated(false);
  };

  const fetchData = async () => {
    if (!isAuthenticated) return;
    try {
      const [systemStats, compList, auditLogs, workerNodes, signals, vaultData, userList] = await Promise.all([
        platformClient.getSystemStats(),
        platformClient.getCompetitors(),
        platformClient.getAuditLogs(),
        platformClient.getWorkers(),
        platformClient.getChartData(),
        platformClient.getVault(),
        platformClient.getAdminUsers()
      ]);
      setStats(systemStats);
      setCompetitors(compList);
      setLogs(auditLogs);
      setWorkers(workerNodes);
      setChartData(signals);
      setVault(vaultData);
      setUsers(userList);
      setLastSync(new Date());
    } catch (err: any) {
      console.error("Failed to fetch live admin data", err);
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, 5000); // 5s Ultra-High Frequency Live Feed
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (isAuthenticated === null) return null; // Loading state
  if (!isAuthenticated) return <AuthPortal onLogin={() => setIsAuthenticated(true)} />;

  return (
    <div className="min-h-screen flex overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} glass-card border-r-0 border-white/5 transition-all duration-500 ease-in-out flex flex-col z-30`}>
        <div className="p-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-blue-600/30 group cursor-pointer shrink-0 transition-transform hover:scale-110">
            <img src="/logo.png" alt="ScoutForge AI" className="w-full h-full object-cover" />
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-black text-2xl tracking-tighter uppercase italic text-[var(--text-primary)]">SCOUTFORGE<span className="text-[#0071E3]">AI</span></span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#0071E3] font-black italic">Mission Control</span>
            </div>
          )}
        </div>

        <nav className="flex-1 px-6 mt-8 space-y-3 overflow-y-auto custom-scrollbar">
          {[
            { id: 'overview', icon: Activity, label: 'Global Intel' },
            { id: 'security', icon: Shield, label: 'Security Nexus' },
            { id: 'users', icon: Users, label: 'User Universe' },
            { id: 'workers', icon: Cpu, label: 'Compute Nodes' },
            { id: 'database', icon: Database, label: 'Data Clusters' },
            { id: 'settings', icon: Settings, label: 'Configuration' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group whitespace-nowrap ${
                activeTab === item.id 
                  ? 'nav-item-active' 
                  : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
              }`}
            >
              <item.icon size={22} className={activeTab === item.id ? 'text-white' : 'group-hover:text-blue-500 transition-colors shrink-0'} />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              {activeTab === item.id && isSidebarOpen && <ChevronRight size={16} className="ml-auto opacity-50" />}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 mt-auto">
          <div className={`flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 ${!isSidebarOpen && 'justify-center'} group cursor-pointer hover:bg-rose-500/10 hover:border-rose-500/20 transition-all`} onClick={handleLogout}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-orange-500 p-[2px] shrink-0 group-hover:scale-110 transition-transform">
               <div className="w-full h-full rounded-full bg-[var(--bg-primary)] flex items-center justify-center text-xs font-bold text-[var(--text-primary)]">LO</div>
            </div>
            {isSidebarOpen && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate text-[var(--text-primary)]">Terminate Session</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                  <p className="text-[10px] text-rose-400 uppercase font-bold tracking-wider">Logout</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Abstract Background Gradients */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Header */}
        <header className="h-24 flex items-center justify-between px-10 border-b border-white/5 z-20 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)} 
              className="p-3 glass-card rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all hover:scale-105 active:scale-95"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic text-[var(--text-primary)]">{activeTab.replace('-', ' ')}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
                <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-[0.2em] font-black italic">Telemetry Live Feed</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group hidden xl:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-blue-400 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search surveillance..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                className="bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-6 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-[var(--text-secondary)] font-bold italic text-[var(--text-primary)]"
              />
            </div>
            
            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <ThemeToggle />

               <button className="relative p-3 glass-card rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all hover:glow-blue">
                <Bell size={22} />
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[var(--bg-primary)] animate-pulse" />
              </button>
              
            <div className="flex flex-col items-end hidden sm:flex">
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-[#0071E3] rounded-xl text-[10px] font-black border border-blue-500/20 uppercase tracking-widest italic">
                  <Zap size={12} className="animate-pulse shrink-0 fill-current" />
                  Sync Protocol Active
                </div>
                <span className="text-[9px] text-[var(--text-secondary)] mt-1 font-black uppercase tracking-tighter italic">Precision: 99.9%</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-10 z-10 custom-scrollbar grid-auto-rows">
          {activeTab === 'overview' && (
            <div className="space-y-10 fade-in">
              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                <StatCard 
                  title="Active Scrapers" 
                  value={stats?.active_scrapers || '0'} 
                  change={stats?.scrapers_change || '+0%'} 
                  icon={Search} 
                  trend="up" 
                  color="blue"
                />
                <StatCard 
                  title="Intelligence Nodes" 
                  value={stats?.total_competitors || '0'} 
                  change={stats?.users_change || '+0%'} 
                  icon={Globe} 
                  trend="up" 
                  color="emerald"
                />
                <StatCard 
                  title="AI Credits" 
                  value={stats?.credits_used || '0k'} 
                  change="+18%" 
                  icon={TrendingUp} 
                  trend="up" 
                  color="amber"
                />
                <StatCard 
                  title="Latency" 
                  value={stats?.latency || '12ms'} 
                  change={stats?.latency_change || '-2ms'} 
                  icon={Zap} 
                  trend="up" 
                  color="rose" 
                />
              </div>

              {/* Gauges Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="glass-card p-8 rounded-[40px] flex flex-col items-center">
                  <h3 className="text-lg font-black mb-8 self-start text-[var(--text-primary)] uppercase italic tracking-tighter">
                    <Activity className="inline mr-2 text-[#0071E3]" size={18} />
                    Dynamic <span className="text-[#0071E3]">Telemetry Pulse</span>
                  </h3>
                  <div className="flex justify-around w-full gap-4 py-4">
                    <div className="flex flex-col items-center gap-3 group">
                      <Gauge value={stats?.cpu_usage || 0} label="CPU Core" color="#0071E3" />
                      <div className="h-1 w-12 bg-[#0071E3]/20 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0071E3] transition-all duration-500" style={{ width: `${stats?.cpu_usage || 0}%` }} />
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-3 group">
                      <Gauge value={stats?.memory_usage || 0} label="Retention" color="#AF52DE" />
                      <div className="h-1 w-12 bg-[#AF52DE]/20 rounded-full overflow-hidden">
                        <div className="h-full bg-[#AF52DE] transition-all duration-500" style={{ width: `${stats?.memory_usage || 0}%` }} />
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-3 group">
                      <Gauge value={stats?.success_rate || 100} label="Integrity" color="#34C759" />
                      <div className="h-1 w-12 bg-[#34C759]/20 rounded-full overflow-hidden">
                        <div className="h-full bg-[#34C759] transition-all duration-500" style={{ width: `${stats?.success_rate || 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="lg:col-span-2 glass-card p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between overflow-hidden relative min-h-[180px]">
                  <div className="relative z-10 w-full sm:w-auto">
                    <h3 className="font-bold text-xl mb-2 text-[var(--text-primary)]">Autonomous Agent Status</h3>
                    <p className="text-[var(--text-secondary)] text-sm max-w-md">Processing {stats?.active_tasks || 0} active surveillance tasks with 100% accuracy.</p>
                    <div className="flex flex-wrap gap-4 mt-6">
                      <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-[10px] font-black uppercase tracking-widest whitespace-nowrap italic">
                        Queue: {stats?.active_tasks > 5 ? 'High' : 'Optimal'}
                      </div>
                      <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                        Accuracy: {stats?.success_rate ? `${stats.success_rate.toFixed(1)}%` : '100%'}
                      </div>
                    </div>
                  </div>
                  <div className="absolute right-[-20px] top-[-20px] opacity-5 sm:opacity-10 pointer-events-none">
                    <Cpu size={200} className="text-blue-500 opacity-20" />
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card p-8 rounded-3xl min-h-[400px]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                    <div>
                      <h3 className="font-black text-xl mb-1 text-[var(--text-primary)] uppercase italic tracking-tighter">Global Signal Throughput</h3>
                      <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest italic">Real-time processing volume across active nodes</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                       <button className="flex-1 sm:flex-none bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-[var(--text-primary)] italic">Export Data</button>
                       <select className="flex-1 sm:flex-none bg-[#0071E3] border-none rounded-xl text-[10px] font-black uppercase tracking-widest px-4 py-2 text-white focus:ring-2 focus:ring-blue-400 cursor-pointer shadow-lg shadow-blue-600/20 outline-none italic">
                        <option>Real-time</option>
                        <option>24 Hours</option>
                        <option>7 Days</option>
                       </select>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0071E3" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#0071E3" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF3B30" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#FF3B30" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" vertical={false} />
                        <XAxis dataKey="name" stroke="#475569" fontSize={11} fontWeight={900} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="#475569" fontSize={11} fontWeight={900} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? 'rgba(10, 10, 12, 0.95)' : 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid var(--glass-border)', 
                            borderRadius: '24px', 
                            backdropFilter: 'blur(20px)', 
                            boxShadow: 'var(--card-shadow)',
                            padding: '20px'
                          }}
                          itemStyle={{ color: 'var(--text-primary)', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}
                          cursor={{ stroke: '#0071E3', strokeWidth: 2 }}
                        />
                        <Area type="monotone" dataKey="requests" name="Signals Processed" stroke="#0071E3" strokeWidth={4} fillOpacity={1} fill="url(#colorRequests)" animationDuration={1500} />
                        <Area type="monotone" dataKey="errors" name="Anomalies" stroke="#FF3B30" strokeWidth={4} fillOpacity={1} fill="url(#colorErrors)" animationDuration={1500} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-card p-8 rounded-3xl flex flex-col min-h-[400px]">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-black text-xl text-[var(--text-primary)] uppercase italic tracking-tighter">Security Heartbeat</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                      <Shield size={18} className="text-[#0071E3]" />
                    </div>
                  </div>
                  <div className="space-y-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {logs.filter(l => l.event.toLowerCase().includes(searchQuery.toLowerCase()) || l.user.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? logs.filter(l => l.event.toLowerCase().includes(searchQuery.toLowerCase()) || l.user.toLowerCase().includes(searchQuery.toLowerCase())).map((alert, i) => (
                      <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5 cursor-pointer">
                        <div className={cn(
                          "p-3 rounded-xl h-fit shadow-lg shrink-0",
                          alert.status === 'Denied' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        )}>
                          <AlertTriangle size={18} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex justify-between items-center mb-1">
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-[0.2em] italic",
                               alert.status === 'Denied' ? 'text-rose-400' : 'text-[var(--text-secondary)]'
                            )}>{alert.status === 'Denied' ? 'Critical' : 'Info'}</span>
                            <span className="text-[10px] text-[var(--text-secondary)] font-bold">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-sm font-bold text-[var(--text-primary)] truncate italic">{alert.event}: {alert.user}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-20">
                         <Shield size={40} />
                         <p className="text-[10px] font-black uppercase tracking-widest mt-4">No Recent Alerts</p>
                      </div>
                    )}
                  </div>
                  <button className="w-full mt-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-all border border-white/5 italic">
                    Clear Secure Logs
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="glass-card rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5">
                  <div>
                    <h3 className="font-black text-xl mb-1 text-[var(--text-primary)] uppercase italic tracking-tighter">Surveillance Grid</h3>
                    <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest italic">Monitoring {competitors.length} active intelligence streams</p>
                  </div>
                  <button 
                    onClick={fetchData}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-[#0071E3] hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95 italic"
                  >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Sync Intel Feed
                  </button>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left min-w-[700px]">
                    <thead className="bg-black/5 text-[var(--text-secondary)] text-[10px] uppercase tracking-[0.2em] font-black italic">
                      <tr>
                        <th className="px-8 py-5">Node Identity</th>
                        <th className="px-8 py-5">Operational Status</th>
                        <th className="px-8 py-5">Precision Index</th>
                        <th className="px-8 py-5">Last Activity</th>
                        <th className="px-8 py-5 text-right">Intercept</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {competitors.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? competitors.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((row, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform shrink-0">
                                <Globe size={16} />
                              </div>
                              <span className="font-bold text-[var(--text-primary)] italic uppercase tracking-tight">{row.name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border italic ${
                              row.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              row.status === 'error' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                              'bg-slate-500/10 text-slate-400 border-white/5'
                            }`}>
                              {row.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-4">
                                <div className="flex-1 h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                                   <div className="h-full bg-[#0071E3] rounded-full animate-pulse" style={{ width: '99%' }} />
                                </div>
                                <span className="font-mono text-[10px] text-[var(--text-secondary)] font-black italic">99.9%</span>
                             </div>
                          </td>
                          <td className="px-8 py-6 text-[var(--text-secondary)] font-black uppercase text-[10px] italic tracking-widest">{row.last_scanned || 'Verified'}</td>
                          <td className="px-8 py-6 text-right">
                            <button 
                              onClick={() => platformClient.triggerScan(row.id)}
                              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-[#0071E3] hover:text-white text-[#0071E3] text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 whitespace-nowrap italic shadow-sm"
                            >
                              Deep Scan
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-8 py-20 text-center">
                            <div className="flex flex-col items-center gap-4">
                               <RefreshCw size={40} className="text-[#0071E3] animate-spin opacity-20" />
                               <p className="text-[var(--text-secondary)] font-black uppercase tracking-[0.3em] text-[10px] italic">Awaiting Satellite Feed...</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-10 fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Vault Overview */}
                <div className="lg:col-span-2 space-y-10">
                  <div className="glass-card p-10 rounded-[48px] relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                     <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase italic tracking-tighter mb-10 flex items-center gap-4">
                        <Lock className="text-[#0071E3]" size={32} />
                        Identity <span className="text-[#0071E3]">Vault & Security</span>
                     </h3>

                     <div className="space-y-6">
                        {vault.length > 0 ? vault.map((key, i) => (
                          <div key={i} className="p-6 rounded-[32px] bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all group/item flex items-center justify-between">
                            <div className="space-y-1">
                               <div className="flex items-center gap-3">
                                  <span className="text-sm font-black text-[var(--text-primary)] uppercase italic tracking-tight">{key.name}</span>
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                    key.status === 'Secured' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                  )}>{key.status}</span>
                               </div>
                               <p className="text-xs font-mono text-[var(--text-secondary)] opacity-50">{key.value}</p>
                            </div>
                            <div className="flex items-center gap-4">
                               <span className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest italic">{key.lastUsed}</span>
                               <button className="p-3 rounded-2xl bg-white/5 hover:bg-blue-600 text-[var(--text-secondary)] hover:text-white transition-all shadow-sm">
                                  <RefreshCw size={14} />
                                </button>
                            </div>
                          </div>
                        )) : (
                          <div className="py-10 text-center opacity-20 italic">Loading Security Parameters...</div>
                        )}
                     </div>

                     <div className="mt-10 flex gap-4">
                        <button className="flex-1 py-5 bg-[#0071E3] hover:bg-blue-500 text-white rounded-[24px] font-black uppercase tracking-widest text-xs italic shadow-xl shadow-blue-600/20 transition-all active:scale-95">
                           Rotate All Credentials
                        </button>
                        <button className="px-8 py-5 bg-white/5 hover:bg-white/10 text-[var(--text-primary)] rounded-[24px] font-black uppercase tracking-widest text-xs italic border border-white/10 transition-all">
                           New Entry
                        </button>
                     </div>
                  </div>

                  <div className="glass-card p-10 rounded-[48px]">
                     <h3 className="text-xl font-black text-[var(--text-primary)] uppercase italic tracking-tighter mb-8 flex items-center gap-4">
                        <Activity className="text-emerald-500" size={24} />
                        Access Log <span className="text-emerald-500">Telemetry</span>
                     </h3>
                     <div className="space-y-4">
                        {logs.length > 0 ? logs.map((log, i) => (
                          <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-default border border-transparent hover:border-white/5">
                            <div className="flex items-center gap-6">
                               <div className={cn(
                                 "w-2 h-2 rounded-full",
                                 log.status === 'Success' ? "bg-emerald-500" : "bg-rose-500 animate-pulse"
                               )} />
                               <div>
                                  <p className="text-sm font-black text-[var(--text-primary)] uppercase italic tracking-tight">{log.event}</p>
                                  <p className="text-[10px] text-[var(--text-secondary)] font-mono uppercase tracking-widest">{log.user} • {log.ip}</p>
                               </div>
                            </div>
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-widest italic",
                              log.status === 'Success' ? "text-emerald-400" : "text-rose-400"
                            )}>{log.status}</span>
                          </div>
                        )) : (
                          <p className="text-center py-10 text-[var(--text-secondary)] font-black uppercase tracking-widest text-[10px] italic opacity-20">No Security Events Logged</p>
                        )}
                     </div>
                  </div>
                </div>

                {/* Security sidebar */}
                <div className="space-y-10">
                   <div className="glass-card p-8 rounded-[40px] bg-gradient-to-b from-[#0071E3]/10 to-transparent border border-blue-500/20">
                      <Shield className="w-12 h-12 text-[#0071E3] mb-6" />
                      <h4 className="text-lg font-black text-[var(--text-primary)] uppercase italic tracking-tighter mb-4">Security Posture</h4>
                      <div className="space-y-6">
                         <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest italic">
                               <span className="text-[var(--text-secondary)]">Threat Shield</span>
                               <span className="text-[#0071E3]">Active</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                               <div className="h-full bg-[#0071E3] rounded-full w-full" />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest italic">
                               <span className="text-[var(--text-secondary)]">Encryption</span>
                               <span className="text-emerald-400">AES-256</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                               <div className="h-full bg-emerald-500 rounded-full w-full" />
                            </div>
                         </div>
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest italic mt-8 leading-relaxed">
                         System is currently operating under <span className="text-[#0071E3]">Protocol Omega</span>. All signals are encrypted and audited.
                      </p>
                   </div>

                   <div className="glass-card p-8 rounded-[40px] border border-rose-500/20">
                      <h4 className="text-sm font-black text-rose-400 uppercase italic tracking-tighter mb-6 flex items-center gap-2">
                         <AlertTriangle size={16} />
                         Danger Zone
                      </h4>
                      <div className="space-y-4">
                         <button className="w-full py-4 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest italic transition-all">
                            Purge Global Cache
                         </button>
                         <button className="w-full py-4 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest italic transition-all">
                            Initialize System Reset
                         </button>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'database' && (
            <div className="space-y-10 fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                 {/* MongoDB Cluster */}
                 <div className="glass-card p-10 rounded-[48px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                    <div className="flex justify-between items-start mb-10">
                       <div>
                          <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase italic tracking-tighter">Primary <span className="text-emerald-500">Data Cluster</span></h3>
                          <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest italic mt-1">MongoDB Atlas Shard: scout-prod-01</p>
                       </div>
                       <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[10px] font-black uppercase tracking-widest italic">Healthy</div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-10">
                       <div className="p-6 rounded-[32px] bg-white/5 border border-white/5">
                          <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest italic mb-2">Total Documents</p>
                          <p className="text-2xl font-black text-[var(--text-primary)] italic">{(stats?.total_competitors * 142 + (stats?.active_tasks * 12)) || '0'}</p>
                       </div>
                       <div className="p-6 rounded-[32px] bg-white/5 border border-white/5">
                          <p className="text-[10px] text(--text-secondary)] font-black uppercase tracking-widest italic mb-2">Storage Used</p>
                          <p className="text-2xl font-black text-[var(--text-primary)] italic">{((stats?.total_competitors * 2.4) + (stats?.active_tasks * 0.5)).toFixed(1)} MB</p>
                       </div>
                       <div className="p-6 rounded-[32px] bg-white/5 border border-white/5">
                          <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest italic mb-2">Connections</p>
                          <p className="text-2xl font-black text-[var(--text-primary)] italic">{(stats?.active_scrapers * 8) || 12}</p>
                       </div>
                       <div className="p-6 rounded-[32px] bg-white/5 border border-white/5">
                          <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest italic mb-2">IOPS</p>
                          <p className="text-2xl font-black text-[var(--text-primary)] italic">{(stats?.active_tasks * 4.2 + (stats?.cpu_usage * 0.1)).toFixed(1)}k</p>
                       </div>
                    </div>

                    <button className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-[24px] font-black uppercase tracking-widest text-xs italic shadow-xl shadow-emerald-600/20 transition-all active:scale-95">
                       Optimize Index Structures
                    </button>
                 </div>

                 {/* Redis Cache Cluster */}
                 <div className="glass-card p-10 rounded-[48px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                    <div className="flex justify-between items-start mb-10">
                       <div>
                          <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase italic tracking-tighter">In-Memory <span className="text-rose-500">Acceleration</span></h3>
                          <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest italic mt-1">Redis Enterprise: cloud-cache-scout</p>
                       </div>
                       <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[10px] font-black uppercase tracking-widest italic">Optimized</div>
                    </div>

                    <div className="space-y-6 mb-10">
                       <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest italic">
                             <span className="text-[var(--text-secondary)]">Cache Hit Rate</span>
                             <span className="text-rose-400">94.2%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                             <div className="h-full bg-rose-500 rounded-full w-[94%]" />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest italic">
                             <span className="text-[var(--text-secondary)]">Memory Fragmentation</span>
                             <span className="text-emerald-400">Low (1.02)</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500 rounded-full w-[10%]" />
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-4">
                       <button className="flex-1 py-5 bg-rose-500 hover:bg-rose-400 text-white rounded-[24px] font-black uppercase tracking-widest text-xs italic transition-all shadow-xl shadow-rose-600/20 active:scale-95">
                          Flush Cache
                       </button>
                       <button className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-[var(--text-primary)] rounded-[24px] font-black uppercase tracking-widest text-xs italic border border-white/10 transition-all">
                          Scale Cluster
                       </button>
                    </div>
                 </div>
              </div>
            </div>
          )}
          {activeTab === 'workers' && (
            <div className="space-y-10 fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {workers.length > 0 ? workers.map((node, i) => (
                  <div key={i} className="glass-card p-8 rounded-[40px] relative overflow-hidden group hover:scale-[1.02] transition-all">
                    <div className="flex justify-between items-start mb-6">
                       <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                          <Cpu size={24} />
                       </div>
                       <span className={cn(
                          "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest italic border",
                          node.load > 80 ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                          node.status === 'Active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          "bg-white/5 text-[var(--text-secondary)] border-white/5"
                       )}>{node.status === 'Active' && node.load > 80 ? 'High Load' : node.status}</span>
                    </div>
                    
                    <h4 className="text-lg font-black text-[var(--text-primary)] uppercase italic tracking-tighter mb-1">{node.id}</h4>
                    <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] italic mb-6">{node.region}</p>
                    
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest italic">
                             <span className="text-[var(--text-secondary)]">Compute Load</span>
                             <span className={node.load > 80 ? "text-rose-400" : "text-blue-400"}>{node.load}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                             <div 
                                className={cn("h-full rounded-full transition-all duration-1000", node.load > 80 ? "bg-rose-500" : "bg-[#0071E3]")} 
                                style={{ width: `${node.load}%` }} 
                             />
                          </div>
                       </div>
                       <div className="flex justify-between items-center py-2 border-t border-white/5">
                          <span className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest italic">Active Tasks</span>
                          <span className="text-sm font-black text-[var(--text-primary)]">{node.tasks}</span>
                       </div>
                    </div>

                    <button className="w-full mt-6 py-3 bg-white/5 hover:bg-[#0071E3] hover:text-white text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest italic rounded-2xl transition-all border border-white/10">
                       Rebalance Node
                    </button>
                  </div>
                )) : (
                  <div className="col-span-full py-20 text-center opacity-20">
                     <Cpu size={60} className="mx-auto mb-4 animate-pulse" />
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">No Satellite Nodes Connected</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'users' && (
            <div className="space-y-10 fade-in">
              <div className="glass-card rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5">
                  <div>
                    <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase italic tracking-tighter">User <span className="text-blue-500">Universe</span></h3>
                    <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest italic mt-1">Managing {users.length} active intelligence accounts</p>
                  </div>
                  <button 
                    onClick={() => setAddUserModalOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 bg-blue-500 hover:bg-blue-400 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95 italic"
                  >
                    <UserPlus size={16} />
                    Provision New Identity
                  </button>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-black/5 text-[var(--text-secondary)] text-[10px] uppercase tracking-[0.2em] font-black italic">
                      <tr>
                        <th className="px-8 py-5">Identity Profile</th>
                        <th className="px-8 py-5">Role Protocol</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5">Enrolled Date</th>
                        <th className="px-8 py-5 text-right">Administrative Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {users.length > 0 ? users.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()) || u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())).map((user, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 p-[1px] group-hover:scale-110 transition-transform">
                                <div className="w-full h-full rounded-full bg-[var(--bg-primary)] flex items-center justify-center text-[10px] font-black text-[var(--text-primary)] uppercase">
                                  {user.full_name?.[0] || user.email[0]}
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-[var(--text-primary)] italic uppercase tracking-tight leading-tight">{user.full_name || 'Anonymous Agent'}</span>
                                <span className="text-[10px] text-[var(--text-secondary)] opacity-50 font-mono italic">{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <Shield size={12} className={user.role === 'admin' ? 'text-amber-500' : 'text-blue-500'} />
                              <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest italic",
                                user.role === 'admin' ? "text-amber-500" : "text-blue-500"
                              )}>{user.role}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest italic text-emerald-400">Active</span>
                             </div>
                          </td>
                          <td className="px-8 py-6 text-[var(--text-secondary)] font-black uppercase text-[10px] italic tracking-widest">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Historical'}
                          </td>
                          <td className="px-8 py-6 text-right">
                             <div className="flex justify-end gap-2">
                               <button 
                                 onClick={async () => {
                                   if (window.confirm(`Purge identity ${user.email} and all associated intelligence data? This action is irreversible.`)) {
                                     setActionLoading(true);
                                     try {
                                       await platformClient.deleteAdminUser(user.id);
                                       fetchData();
                                     } finally {
                                       setActionLoading(false);
                                     }
                                   }
                                 }}
                                 disabled={actionLoading || user.email === 'deeputhakur0986@gmail.com'}
                                 className="p-3 rounded-xl bg-white/5 hover:bg-rose-500 text-rose-400 hover:text-white transition-all border border-white/5 disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-rose-400"
                               >
                                 <Trash2 size={16} />
                               </button>
                             </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-8 py-20 text-center opacity-20 italic font-black uppercase tracking-widest text-[10px]">No Identities Found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Add User Modal */}
          <AnimatePresence>
            {isAddUserModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="glass-card w-full max-w-lg p-10 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                  
                  <h3 className="text-3xl font-black text-[var(--text-primary)] uppercase italic tracking-tighter mb-8 flex items-center gap-4">
                    <UserPlus className="text-blue-500" size={32} />
                    Identity <span className="text-blue-500">Provisioning</span>
                  </h3>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] italic ml-2">Full Identity Name</label>
                      <input 
                        type="text" 
                        value={newUser.full_name}
                        onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-[var(--text-primary)] font-bold italic outline-none focus:ring-2 focus:ring-blue-500/30" 
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] italic ml-2">Cipher Email</label>
                      <input 
                        type="email" 
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-[var(--text-primary)] font-bold italic outline-none focus:ring-2 focus:ring-blue-500/30" 
                        placeholder="agent@scoutforge.ai"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] italic ml-2">Security Hash</label>
                        <input 
                          type="password" 
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-[var(--text-primary)] font-bold italic outline-none focus:ring-2 focus:ring-blue-500/30" 
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] italic ml-2">Protocol Role</label>
                        <select 
                          value={newUser.role}
                          onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-[var(--text-primary)] font-bold italic outline-none focus:ring-2 focus:ring-blue-500/30"
                        >
                          <option value="user">User</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-10">
                    <button 
                      onClick={() => setAddUserModalOpen(false)}
                      className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-[var(--text-primary)] rounded-[24px] font-black uppercase tracking-widest text-xs italic border border-white/10 transition-all"
                    >
                      Abort
                    </button>
                    <button 
                      disabled={actionLoading || !newUser.email || !newUser.password}
                      onClick={async () => {
                        setActionLoading(true);
                        try {
                          await platformClient.createAdminUser(newUser);
                          setAddUserModalOpen(false);
                          setNewUser({ email: '', full_name: '', password: '', role: 'user' });
                          fetchData();
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                      className="flex-1 py-5 bg-blue-500 hover:bg-blue-400 text-white rounded-[24px] font-black uppercase tracking-widest text-xs italic shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-30"
                    >
                      {actionLoading ? 'Initializing...' : 'Authorize Identity'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          {activeTab === 'settings' && (
            <div className="space-y-10 fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="glass-card p-10 rounded-[48px] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                  <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase italic tracking-tighter mb-10 flex items-center gap-4">
                    <Activity className="text-[#0071E3]" size={32} />
                    Global <span className="text-[#0071E3]">Scheduler</span>
                  </h3>
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] italic">Surveillance Pulse Frequency</label>
                      <div className="flex gap-4">
                        <input type="number" defaultValue={1} className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-[var(--text-primary)] font-bold italic outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <select className="bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-[var(--text-primary)] font-bold italic outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer">
                          <option value="minutes">Minutes</option>
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                          <option value="weeks">Weeks</option>
                          <option value="months">Months</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-6 rounded-[32px] bg-white/5 border border-white/5">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-[var(--text-primary)] uppercase italic tracking-tight">Email Briefing Protocol</p>
                        <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest italic opacity-50">Dispatch intelligence reports automatically</p>
                      </div>
                      <div className="relative w-14 h-8 rounded-full bg-[#0071E3] p-1 cursor-pointer">
                         <div className="w-6 h-6 rounded-full bg-white ml-6" />
                      </div>
                    </div>
                    <div className="pt-6">
                      <button className="w-full py-5 bg-[#0071E3] hover:bg-blue-500 text-white rounded-[24px] font-black uppercase tracking-widest text-xs italic shadow-xl shadow-blue-600/20 transition-all active:scale-95">Update Global Heartbeat</button>
                    </div>
                  </div>
                </div>
                <div className="glass-card p-10 rounded-[48px]">
                  <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase italic tracking-tighter mb-10 flex items-center gap-4">
                    <Shield className="text-rose-500" size={32} />
                    Admin <span className="text-rose-500">Node Safety</span>
                  </h3>
                  <div className="space-y-6">
                     <div className="p-6 rounded-[32px] bg-white/5 border border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                        <div className="flex items-center gap-4">
                           <Lock className="text-[var(--text-secondary)] group-hover:text-rose-400 transition-colors" size={20} />
                           <span className="text-sm font-black text-[var(--text-primary)] uppercase italic tracking-tight">Rotate Security Keys</span>
                        </div>
                        <ChevronRight size={18} className="text-[var(--text-secondary)]" />
                     </div>
                     <div className="p-6 rounded-[32px] bg-white/5 border border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                        <div className="flex items-center gap-4">
                           <Terminal className="text-[var(--text-secondary)] group-hover:text-blue-400 transition-colors" size={20} />
                           <span className="text-sm font-black text-[var(--text-primary)] uppercase italic tracking-tight">Export Audit Logs</span>
                        </div>
                        <ChevronRight size={18} className="text-[var(--text-secondary)]" />
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
