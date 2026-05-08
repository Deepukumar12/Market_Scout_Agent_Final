import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Users, 
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
  Cpu
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// Mock data for live analytics (would be replaced by real API calls)
const analyticsData = [
  { name: '00:00', requests: 400, errors: 24, latency: 120 },
  { name: '04:00', requests: 300, errors: 13, latency: 150 },
  { name: '08:00', requests: 900, errors: 45, latency: 180 },
  { name: '12:00', requests: 1200, errors: 21, latency: 110 },
  { name: '16:00', requests: 1500, errors: 67, latency: 140 },
  { name: '20:00', requests: 1100, errors: 32, latency: 130 },
  { name: '23:59', requests: 600, errors: 18, latency: 105 },
];

import { platformClient } from '@market-scout/platform';

const StatCard = ({ title, value, change, icon: Icon, trend }: any) => (
  <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm hover:border-indigo-500/50 transition-all cursor-default">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-indigo-500/10 rounded-xl">
        <Icon className="w-6 h-6 text-indigo-400" />
      </div>
      {change && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
        }`}>
          {change}
        </span>
      )}
    </div>
    <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-white mt-1">{value || '---'}</p>
  </div>
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [systemStats, compList] = await Promise.all([
          platformClient.getSystemStats(),
          platformClient.getCompetitors()
        ]);
        setStats(systemStats);
        setCompetitors(compList);
      } catch (err) {
        console.error("Failed to fetch live admin data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Live update every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-200 flex">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} border-r border-slate-800 transition-all duration-300 flex flex-col`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Shield className="text-white w-6 h-6" />
          </div>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight">Market Scout</span>}
        </div>

        <nav className="flex-1 px-4 mt-6 space-y-2">
          {[
            { id: 'overview', icon: Activity, label: 'Overview' },
            { id: 'users', icon: Users, label: 'User Mgmt' },
            { id: 'workers', icon: Cpu, label: 'Worker Status' },
            { id: 'logs', icon: Terminal, label: 'Audit Logs' },
            { id: 'database', icon: Database, label: 'Data Sources' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500" />
            {isSidebarOpen && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">Admin User</p>
                <p className="text-xs text-slate-500 truncate">admin@marketscout.ai</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-8 bg-[#05070a]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-semibold capitalize">{activeTab.replace('-', ' ')}</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Search metrics, users, logs..." 
                className="bg-slate-900/50 border border-slate-800 rounded-xl py-2 pl-10 pr-4 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#05070a]" />
            </button>
            <div className="h-8 w-px bg-slate-800" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium border border-emerald-500/20">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Live System Stable
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Active Scrapers" 
                  value={stats?.active_scrapers || '24'} 
                  change={stats?.scrapers_change || '+12%'} 
                  icon={Search} 
                  trend="up" 
                />
                <StatCard 
                  title="Total Competitors" 
                  value={competitors.length} 
                  change={stats?.users_change || '+5.4%'} 
                  icon={Users} 
                  trend="up" 
                />
                <StatCard 
                  title="AI Credits Used" 
                  value={stats?.credits_used || '84.2k'} 
                  change="+18%" 
                  icon={TrendingUp} 
                  trend="up" 
                />
                <StatCard 
                  title="System Health" 
                  value={stats?.health || '99.9%'} 
                  change="-0.01%" 
                  icon={Activity} 
                  trend="down" 
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">System Traffic & Latency</h3>
                    <select className="bg-slate-800 border-none rounded-lg text-sm px-3 py-1.5 focus:ring-2 focus:ring-indigo-500">
                      <option>Last 24 Hours</option>
                      <option>Last 7 Days</option>
                    </select>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData}>
                        <defs>
                          <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                          itemStyle={{ color: '#f8fafc' }}
                        />
                        <Area type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRequests)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                  <h3 className="font-bold text-lg mb-6">Recent Alerts</h3>
                  <div className="space-y-4">
                    {[
                      { type: 'warning', msg: 'High latency in Worker-Node-4', time: '2m ago' },
                      { type: 'error', msg: 'Database connection spike', time: '15m ago' },
                      { type: 'info', msg: 'New admin login detected', time: '1h ago' },
                      { type: 'warning', msg: 'AI rate limit approaching', time: '3h ago' },
                    ].map((alert, i) => (
                      <div key={i} className="flex gap-4 p-3 rounded-xl hover:bg-slate-800/50 transition-colors group">
                        <div className={`p-2 rounded-lg h-fit ${
                          alert.type === 'error' ? 'bg-rose-500/10 text-rose-400' :
                          alert.type === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-indigo-500/10 text-indigo-400'
                        }`}>
                          <AlertTriangle size={16} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{alert.msg}</p>
                          <p className="text-xs text-slate-500">{alert.time}</p>
                        </div>
                        <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 self-center" />
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-6 py-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                    View All Alerts
                  </button>
                </div>
              </div>

              {/* Data Table Placeholder */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="font-bold text-lg">Active Intelligent Pipelines</h3>
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium transition-colors">
                    <RefreshCw size={14} />
                    Refresh
                  </button>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-medium">Pipeline Name</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Success Rate</th>
                      <th className="px-6 py-4 font-medium">Last Run</th>
                      <th className="px-6 py-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {competitors.length > 0 ? competitors.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-medium">{row.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            row.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                            row.status === 'error' ? 'bg-rose-500/10 text-rose-400' :
                            'bg-slate-500/10 text-slate-400'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-400">{row.success_rate || '100%'}</td>
                        <td className="px-6 py-4 text-slate-500">{row.last_scanned || 'Never'}</td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => platformClient.triggerScan(row.id)}
                            className="text-indigo-400 hover:text-indigo-300 font-medium"
                          >
                            Trigger Scan
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                          {loading ? 'Fetching real-time data...' : 'No active competitors found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
