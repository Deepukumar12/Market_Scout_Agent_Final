import { useState, useEffect } from 'react';
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
  BarChart3,
  Sun,
  Moon
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

// Real-time analytics simulation (for charts)
const generateLiveStats = () => [
  { name: '00:00', requests: 400 + Math.random() * 100, errors: 24, latency: 120 },
  { name: '04:00', requests: 300 + Math.random() * 100, errors: 13, latency: 150 },
  { name: '08:00', requests: 900 + Math.random() * 200, errors: 45, latency: 180 },
  { name: '12:00', requests: 1200 + Math.random() * 300, errors: 21, latency: 110 },
  { name: '16:00', requests: 1500 + Math.random() * 400, errors: 67, latency: 140 },
  { name: '20:00', requests: 1100 + Math.random() * 200, errors: 32, latency: 130 },
  { name: '23:59', requests: 600 + Math.random() * 100, errors: 18, latency: 105 },
];

const StatCard = ({ title, value, change, icon: Icon, trend, color = 'indigo' }: any) => {
  const colorMap: any = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
    rose: 'from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/20',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20',
  };

  return (
    <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 min-h-[140px]">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorMap[color]} blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorMap[color]} border shadow-inner`}>
          <Icon className="w-6 h-6" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
            trend === 'up' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            {trend === 'up' ? <TrendingUp size={10} /> : <TrendingUp size={10} className="rotate-180" />}
            {change}
          </div>
        )}
      </div>
      
      <div className="relative z-10">
        <h3 className="text-[var(--text-secondary)] text-[10px] font-bold tracking-widest uppercase mb-1">{title}</h3>
        <p className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{value || '---'}</p>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [stats, setStats] = useState<any>(null);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(generateLiveStats());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const fetchData = async () => {
    try {
      const [systemStats, compList] = await Promise.all([
        platformClient.getSystemStats(),
        platformClient.getCompetitors()
      ]);
      setStats(systemStats);
      setCompetitors(compList);
      setChartData(generateLiveStats());
    } catch (err) {
      console.error("Failed to fetch live admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} glass-card border-r-0 border-white/5 transition-all duration-500 ease-in-out flex flex-col z-30`}>
        <div className="p-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 group cursor-pointer shrink-0">
            <Shield className="text-white w-7 h-7 group-hover:scale-110 transition-transform" />
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-xl tracking-tight truncate text-[var(--text-primary)]">Market Scout</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-bold">Admin Command</span>
            </div>
          )}
        </div>

        <nav className="flex-1 px-6 mt-8 space-y-3 overflow-y-auto custom-scrollbar">
          {[
            { id: 'overview', icon: Activity, label: 'Global Intel' },
            { id: 'workers', icon: Cpu, label: 'Compute Nodes' },
            { id: 'logs', icon: Terminal, label: 'System Logs' },
            { id: 'database', icon: Database, label: 'Data Clusters' },
            { id: 'security', icon: Lock, label: 'Encrypted Vault' },
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
              <item.icon size={22} className={activeTab === item.id ? 'text-white' : 'group-hover:text-indigo-400 transition-colors shrink-0'} />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              {activeTab === item.id && isSidebarOpen && <ChevronRight size={16} className="ml-auto opacity-50" />}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 mt-auto">
          <div className={`flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 ${!isSidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[2px] shrink-0">
               <div className="w-full h-full rounded-full bg-[var(--bg-primary)] flex items-center justify-center text-xs font-bold text-[var(--text-primary)]">AD</div>
            </div>
            {isSidebarOpen && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate text-[var(--text-primary)]">Root Admin</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wider">Level 10</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Abstract Background Gradients */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
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
              <h1 className="text-2xl font-bold tracking-tight premium-gradient-text capitalize">{activeTab.replace('-', ' ')}</h1>
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-[0.2em] font-bold">Real-time Feed</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group hidden xl:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-indigo-400 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search surveillance..." 
                className="bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-6 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all placeholder:text-[var(--text-secondary)] font-medium text-[var(--text-primary)]"
              />
            </div>
            
            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="p-3 glass-card rounded-xl text-[var(--text-secondary)] hover:text-indigo-400 transition-all"
              >
                {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
              </button>

               <button className="relative p-3 glass-card rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all hover:glow-indigo">
                <Bell size={22} />
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[var(--bg-primary)] animate-pulse" />
              </button>
              
              <div className="flex flex-col items-end hidden sm:flex">
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-[10px] font-bold border border-emerald-500/20 uppercase tracking-widest">
                  <Zap size={12} className="animate-bounce shrink-0" />
                  Sync Live
                </div>
                <span className="text-[9px] text-[var(--text-secondary)] mt-1 font-bold">Uptime: 100%</span>
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
                  color="indigo"
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
                  value="12ms" 
                  change="-4ms" 
                  icon={Zap} 
                  trend="up" 
                  color="rose" 
                />
              </div>

              {/* Gauges Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="glass-card p-8 rounded-3xl flex flex-col items-center">
                  <h3 className="font-bold text-lg mb-6 self-start text-[var(--text-primary)]">Operational Pulse</h3>
                  <div className="flex justify-around w-full gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
                    <Gauge value={stats?.cpu_usage || 24} label="CPU Load" color="#6366f1" />
                    <Gauge value={stats?.memory_usage || 58} label="Memory" color="#8b5cf6" />
                    <Gauge value={stats?.success_rate || 98} label="Success" color="#10b981" />
                  </div>
                </div>
                
                <div className="lg:col-span-2 glass-card p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between overflow-hidden relative min-h-[180px]">
                  <div className="relative z-10 w-full sm:w-auto">
                    <h3 className="font-bold text-xl mb-2 text-[var(--text-primary)]">Autonomous Agent Status</h3>
                    <p className="text-[var(--text-secondary)] text-sm max-w-md">Processing {stats?.active_tasks || 0} active surveillance tasks with 100% accuracy.</p>
                    <div className="flex flex-wrap gap-4 mt-6">
                      <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                        Queue: Optimal
                      </div>
                      <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                        Accuracy: 100%
                      </div>
                    </div>
                  </div>
                  <div className="absolute right-[-20px] top-[-20px] opacity-5 sm:opacity-10 pointer-events-none">
                    <Cpu size={200} className="text-indigo-500" />
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card p-8 rounded-3xl min-h-[400px]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                    <div>
                      <h3 className="font-bold text-xl mb-1 text-[var(--text-primary)]">Global Surveillance Traffic</h3>
                      <p className="text-xs text-[var(--text-secondary)] font-medium">Real-time throughput across all active nodes</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                       <button className="flex-1 sm:flex-none bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-xs font-bold transition-all text-[var(--text-primary)]">Export</button>
                       <select className="flex-1 sm:flex-none bg-indigo-600 border-none rounded-xl text-xs font-bold px-4 py-2 text-white focus:ring-2 focus:ring-indigo-400 cursor-pointer shadow-lg shadow-indigo-600/20 outline-none">
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
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" vertical={false} />
                        <XAxis dataKey="name" stroke="#475569" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="#475569" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
                            border: '1px solid var(--glass-border)', 
                            borderRadius: '16px', 
                            backdropFilter: 'blur(10px)', 
                            boxShadow: 'var(--card-shadow)' 
                          }}
                          itemStyle={{ color: 'var(--text-primary)', fontWeight: 700 }}
                          cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
                        />
                        <Area type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRequests)" animationDuration={1000} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-card p-8 rounded-3xl flex flex-col min-h-[400px]">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold text-xl text-[var(--text-primary)]">Critical Alerts</h3>
                    <BarChart3 size={18} className="text-[var(--text-secondary)]" />
                  </div>
                  <div className="space-y-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {[
                      { type: 'warning', msg: 'Anomalous traffic on Node-04', time: '2m ago', priority: 'High' },
                      { type: 'error', msg: 'Redis cache fragmentation @ 84%', time: '15m ago', priority: 'Critical' },
                      { type: 'info', msg: 'New credential rotation complete', time: '1h ago', priority: 'Low' },
                      { type: 'warning', msg: 'AI rate limit hit (SerpApi)', time: '3h ago', priority: 'High' },
                    ].map((alert, i) => (
                      <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5 cursor-pointer">
                        <div className={`p-3 rounded-xl h-fit shadow-lg shrink-0 ${
                          alert.type === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          alert.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                          <AlertTriangle size={18} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex justify-between items-center mb-1">
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${
                               alert.priority === 'Critical' ? 'text-rose-400' : 'text-[var(--text-secondary)]'
                            }`}>{alert.priority}</span>
                            <span className="text-[10px] text-[var(--text-secondary)] font-bold">{alert.time}</span>
                          </div>
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{alert.msg}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-all border border-white/5 uppercase tracking-widest">
                    Clear Secure Logs
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="glass-card rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5">
                  <div>
                    <h3 className="font-bold text-xl mb-1 text-[var(--text-primary)]">Surveillance Targets</h3>
                    <p className="text-xs text-[var(--text-secondary)] font-medium">Monitoring {competitors.length} intelligence streams</p>
                  </div>
                  <button 
                    onClick={fetchData}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                  >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Sync Intel
                  </button>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left min-w-[700px]">
                    <thead className="bg-black/5 text-[var(--text-secondary)] text-[10px] uppercase tracking-[0.2em] font-bold">
                      <tr>
                        <th className="px-8 py-5">Node Name</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5">Accuracy</th>
                        <th className="px-8 py-5">Last Scanned</th>
                        <th className="px-8 py-5">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {competitors.length > 0 ? competitors.map((row, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform shrink-0">
                                <Globe size={16} />
                              </div>
                              <span className="font-bold text-[var(--text-primary)]">{row.name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${
                              row.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              row.status === 'error' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                              'bg-slate-500/10 text-slate-400 border-white/5'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 w-20 bg-white/5 rounded-full overflow-hidden">
                                   <div className="h-full bg-emerald-500 rounded-full" style={{ width: row.success_rate || '100%' }} />
                                </div>
                                <span className="font-mono text-[10px] text-[var(--text-secondary)]">100%</span>
                             </div>
                          </td>
                          <td className="px-8 py-6 text-[var(--text-secondary)] font-medium">{row.last_scanned || 'Ready'}</td>
                          <td className="px-8 py-6 text-right">
                            <button 
                              onClick={() => platformClient.triggerScan(row.id)}
                              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-indigo-600 hover:text-white text-indigo-400 text-xs font-bold transition-all border border-white/5 whitespace-nowrap"
                            >
                              Scan Now
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-8 py-20 text-center">
                            <div className="flex flex-col items-center gap-4">
                               <RefreshCw size={40} className="text-[var(--text-secondary)] animate-spin opacity-20" />
                               <p className="text-[var(--text-secondary)] font-bold uppercase tracking-widest text-[10px]">Awaiting Intel Feed...</p>
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
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
