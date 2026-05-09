import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Bell, ShieldCheck, User, LogOut, Check, Save, 
  Sparkles, AlertTriangle, Activity, Monitor, History,
  ExternalLink, Trash2, Smartphone, Globe, Lock,
  BarChart3, Clock, MapPin, Cpu, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { useAuthStore } from '@/store/authStore';
import { 
  getUserActivity, getUserSessions, revokeSession,
  getSavedReports, updateProfile as apiUpdateProfile
} from '@/services/api';
import { cn } from '@/utils/utils';
import { 
  AreaChart, Area, ResponsiveContainer 
} from 'recharts';

// Native date formatter for locale-aware display
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(date);
};

const SettingsPage = () => {
  const { user, logout, updateProfile, changePassword, fetchUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  
  // Real-time Data State
  const [activities, setActivities] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'intelligence' | 'activity'>('profile');

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    avatar_url: user?.avatar_url || ''
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Local state for preferences with persistence
  const [preferences, setPreferences] = useState(() => {
    const defaultPrefs = {
      emailAlerts: true,
      pushNotifications: false,
      marketingEmails: false,
      twoFactorAuth: true,
      sessionTimeout: true,
      scoutDepth: 'medium',
      llmProvider: 'ollama',
      scanWindow: 7,
      autoScan: true
    };
    return { ...defaultPrefs, ...(user?.preferences || {}) };
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [act, sess, reports] = await Promise.all([
          getUserActivity(),
          getUserSessions(),
          getSavedReports()
        ]);
        setActivities(act);
        setSessions(sess);
        setSavedReports(reports);
      } catch (err) {
        console.error('Failed to load profile intelligence', err);
      }
    };
    if (user) fetchData();
  }, [user]);

  // Derived usage data for chart
  const usageData = useMemo(() => {
    const counts: Record<string, number> = {};
    savedReports.forEach(r => {
      const date = new Date(r.generated_at).toLocaleDateString();
      counts[date] = (counts[date] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).slice(-7);
  }, [savedReports]);

  const handleToggle = (key: string) => {
    setPreferences((prev: any) => ({ ...prev, [key]: !prev[key] }));
    setSuccess(false);
  };

  const handleSelect = (key: string, value: any) => {
    setPreferences((prev: any) => ({ ...prev, [key]: value }));
    setSuccess(false);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUpdateError(null);
    try {
      // Direct call to updateProfile from authStore
      await updateProfile({ ...profileForm, preferences });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await fetchUser();
    } catch (err: any) {
      console.error('Profile update error:', err);
      setUpdateError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setUpdateError('New passwords do not match');
      return;
    }
    setLoading(true);
    setUpdateError(null);
    try {
      await changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      setSuccess(true);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setUpdateError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (id: string) => {
    try {
      await revokeSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Failed to revoke session', err);
    }
  };

  const saveGlobalSettings = async () => {
    setLoading(true);
    try {
      // Simplify to only update preferences to avoid scheduler endpoint issues if they exist
      await apiUpdateProfile({ preferences });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await fetchUser();
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto space-y-8 pb-32 p-6">
      {/* Premium Background Decor */}
      <div className="pointer-events-none absolute -top-60 left-0 w-[600px] h-[600px] bg-[#0071E3]/5 dark:bg-[#0071E3]/10 blur-[150px] animate-pulse" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#AF52DE]/5 dark:bg-[#AF52DE]/10 blur-[120px]" />

      {/* Header & Command Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[#E5E5EA] dark:border-white/10 pb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <h1 className="text-5xl font-black text-[#1D1D1F] dark:text-white tracking-tighter uppercase italic leading-none">
              Command <span className="text-[#0071E3]">Nexus</span>
            </h1>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active Link</span>
            </div>
          </div>
          <p className="text-[#6E6E73] dark:text-[#86868B] text-xl font-medium italic">
            Autonomous surveillance parameters & biometric profile management.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden xl:block">
            <p className="text-[10px] font-black text-[#86868B] uppercase tracking-[0.2em] mb-1">Last Protocol Pulse</p>
            <p className="text-sm font-black text-[#1D1D1F] dark:text-white italic">{formatDate(user?.last_login)}</p>
          </div>
          <Button 
            onClick={saveGlobalSettings} 
            disabled={loading}
            className={cn(
              "font-black uppercase tracking-widest text-[11px] h-14 px-12 transition-all rounded-full shadow-2xl backdrop-blur-md active:scale-95",
              success ? "bg-emerald-500 text-white shadow-emerald-500/40" : "bg-[#0071E3] text-white shadow-[#0071E3]/40"
            )}
          >
            {loading ? "SYNCING..." : success ? "PROTOCOLS SECURED" : "COMMIT CHANGES"}
          </Button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex flex-wrap bg-[#F5F5F7] dark:bg-white/5 p-2 rounded-[32px] w-fit border border-[#E5E5EA] dark:border-white/10 gap-2">
        {[
          { id: 'profile', icon: User, label: 'Identity' },
          { id: 'security', icon: ShieldCheck, label: 'Security' },
          { id: 'intelligence', icon: Sparkles, label: 'Intelligence' },
          { id: 'activity', icon: History, label: 'Archives' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-3 px-8 py-4 rounded-[24px] text-[11px] font-black uppercase tracking-widest transition-all duration-300",
              activeTab === tab.id 
                ? "bg-white dark:bg-[#1D1D1F] text-[#0071E3] shadow-apple border border-[#E5E5EA] dark:border-white/10" 
                : "text-[#86868B] hover:text-[#1D1D1F] dark:text-white"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Telemetry Column (1/3) */}
        <div className="lg:col-span-4 space-y-8">
          <SectionCard title="Agent Biometrics" icon={<User className="w-5 h-5 text-[#0071E3]" />}>
             <div className="flex flex-col items-center py-8 text-center space-y-8">
                 <div className="relative group">
                    <div className="w-40 h-40 rounded-[50px] bg-gradient-to-br from-[#0071E3] via-[#AF52DE] to-[#00c6ff] p-1 shadow-3xl transform group-hover:rotate-6 transition-transform duration-500">
                       <div className="w-full h-full rounded-[48px] bg-white dark:bg-[#1D1D1F] flex items-center justify-center overflow-hidden">
                          {user?.avatar_url ? (
                            <img src={user.avatar_url} alt="Agent" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-6xl font-black text-[#0071E3] uppercase italic">
                              {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                            </span>
                          )}
                       </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 bg-emerald-500 p-3 rounded-[20px] border-4 border-white dark:border-[#1D1D1F] shadow-xl">
                       <Zap className="w-5 h-5 text-white" />
                    </div>
                 </div>
                 
                 <div className="space-y-2">
                    <h3 className="text-3xl font-black text-[#1D1D1F] dark:text-white tracking-tighter uppercase italic leading-tight">
                      {user?.full_name || 'Anonymous Agent'}
                    </h3>
                    <div className="flex items-center justify-center gap-2">
                      <Globe className="w-3 h-3 text-[#86868B]" />
                      <p className="text-[11px] text-[#86868B] font-black uppercase tracking-[0.3em] italic">{user?.email}</p>
                    </div>
                 </div>

                 <div className="flex flex-wrap justify-center gap-3">
                    <div className="px-5 py-2.5 rounded-2xl bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] text-[10px] font-black uppercase tracking-widest italic">
                       ROLE: {user?.role?.toUpperCase() || 'USER'}
                    </div>
                 </div>
             </div>
             
             <div className="pt-8 border-t border-[#E5E5EA] dark:border-white/10 w-full space-y-4">
                <Button variant="outline" onClick={logout} className="w-full border-rose-500/30 text-rose-600 hover:bg-rose-500/10 font-black uppercase tracking-widest text-[11px] h-14 rounded-[24px] shadow-lg shadow-rose-500/5">
                   <LogOut className="w-4 h-4 mr-2" />
                   Terminate Connection
                </Button>
             </div>
          </SectionCard>

          <SectionCard title="Usage Telemetry" icon={<BarChart3 className="w-5 h-5 text-[#AF52DE]" />}>
             <div className="space-y-8">
                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-black text-[#86868B] uppercase tracking-widest mb-1">Monthly Cycle</p>
                        <p className="text-2xl font-black text-[#1D1D1F] dark:text-white tracking-tighter italic">
                          {savedReports.length} / 50 <span className="text-xs text-[#86868B] font-medium">Scans</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Efficiency</p>
                        <p className="text-lg font-black text-emerald-500 italic">94.2%</p>
                      </div>
                   </div>
                   <div className="h-3 w-full bg-[#F5F5F7] dark:bg-white/5 rounded-full overflow-hidden border border-[#E5E5EA] dark:border-white/10">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((savedReports.length / 50) * 100, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-[#0071E3] to-[#AF52DE] shadow-[0_0_15px_rgba(0,113,227,0.5)]" 
                      />
                   </div>
                </div>

                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={usageData}>
                      <defs>
                        <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0071E3" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0071E3" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="count" stroke="#0071E3" strokeWidth={3} fillOpacity={1} fill="url(#colorUsage)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 rounded-[24px] bg-[#F5F5F7] dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10">
                      <p className="text-[9px] font-black text-[#86868B] uppercase tracking-widest mb-1 italic">Saved Targets</p>
                      <p className="text-xl font-black text-[#1D1D1F] dark:text-white italic">{savedReports.length}</p>
                   </div>
                   <div className="p-4 rounded-[24px] bg-[#F5F5F7] dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10">
                      <p className="text-[9px] font-black text-[#86868B] uppercase tracking-widest mb-1 italic">Signals Fed</p>
                      <p className="text-xl font-black text-[#1D1D1F] dark:text-white italic">{activities.length * 12}</p>
                   </div>
                </div>
             </div>
          </SectionCard>
        </div>

        {/* Dynamic Content Center (2/3) */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <SectionCard title="Personal Credentials" icon={<User className="w-5 h-5 text-[#0071E3]" />}>
                  <form onSubmit={handleProfileUpdate} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <FormInput 
                          label="Legal Full Name"
                          value={profileForm.full_name}
                          onChange={(val) => setProfileForm({...profileForm, full_name: val})}
                          placeholder="Your identity"
                          icon={<User className="w-4 h-4" />}
                       />
                       <FormInput 
                          label="Intelligence Email"
                          value={profileForm.email}
                          onChange={(val) => setProfileForm({...profileForm, email: val})}
                          placeholder="scout@hq.ai"
                          icon={<Globe className="w-4 h-4" />}
                       />
                    </div>
                    <FormInput 
                       label="Avatar Identifier URI"
                       value={profileForm.avatar_url}
                       onChange={(val) => setProfileForm({...profileForm, avatar_url: val})}
                       placeholder="https://images.scoutiq.ai/avatar-123.jpg"
                       icon={<Monitor className="w-4 h-4" />}
                    />
                    {updateError && <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest italic flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {updateError}</p>}
                    <div className="flex justify-end">
                      <Button type="submit" disabled={loading} className="bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[11px] h-14 px-12 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95">
                         Update Identity
                      </Button>
                    </div>
                  </form>
                </SectionCard>

                <SectionCard title="Nexus Preferences" icon={<Settings className="w-5 h-5 text-[#AF52DE]" />}>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-8">
                        <SettingRow 
                           label="Email Intelligence"
                           description="Receive high-velocity briefings directly to your encrypted inbox."
                           checked={preferences.emailAlerts}
                           onToggle={() => handleToggle('emailAlerts')}
                        />
                        <SettingRow 
                           label="Real-time Pushes"
                           description="Instant browser telemetry for high-priority signal detections."
                           checked={preferences.pushNotifications}
                           onToggle={() => handleToggle('pushNotifications')}
                        />
                      </div>
                      <div className="space-y-8">
                        <SettingRow 
                           label="Autonomous Sweeps"
                           description="Enable background agents to sweep the target universe daily."
                           checked={preferences.autoScan}
                           onToggle={() => handleToggle('autoScan')}
                        />
                        <SettingRow 
                           label="Security Persistence"
                           description="Maintain active intelligence links across temporal sessions."
                           checked={preferences.sessionTimeout}
                           onToggle={() => handleToggle('sessionTimeout')}
                        />
                      </div>
                   </div>
                </SectionCard>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <SectionCard title="Credential Rotation" icon={<Lock className="w-5 h-5 text-rose-500" />}>
                   <form onSubmit={handlePasswordChange} className="space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         <FormInput 
                            label="Current Secret"
                            type="password"
                            value={passwordForm.current_password}
                            onChange={(val) => setPasswordForm({...passwordForm, current_password: val})}
                            placeholder="••••••••"
                            icon={<ShieldCheck className="w-4 h-4" />}
                         />
                         <div className="space-y-6">
                            <FormInput 
                               label="New Secret"
                               type="password"
                               value={passwordForm.new_password}
                               onChange={(val) => setPasswordForm({...passwordForm, new_password: val})}
                               placeholder="••••••••"
                               icon={<Lock className="w-4 h-4" />}
                            />
                            <FormInput 
                               label="Verify Secret"
                               type="password"
                               value={passwordForm.confirm_password}
                               onChange={(val) => setPasswordForm({...passwordForm, confirm_password: val})}
                               placeholder="••••••••"
                               icon={<Check className="w-4 h-4" />}
                            />
                         </div>
                      </div>
                      {updateError && <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest italic flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {updateError}</p>}
                      <div className="flex justify-end">
                        <Button type="submit" disabled={loading} className="bg-rose-500 text-white font-black uppercase tracking-widest text-[11px] h-14 px-12 rounded-full shadow-2xl shadow-rose-500/30">
                           Rotate Credentials
                        </Button>
                      </div>
                   </form>
                </SectionCard>

                <SectionCard title="Active Protocol Sessions" icon={<Monitor className="w-5 h-5 text-[#0071E3]" />}>
                   <div className="space-y-4">
                      {sessions.length > 0 ? sessions.map(session => (
                        <div key={session.id} className="flex items-center justify-between p-8 rounded-[32px] bg-[#F5F5F7] dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 hover:shadow-xl transition-all duration-300">
                           <div className="flex items-center gap-6">
                              <div className="p-4 bg-white dark:bg-[#1D1D1F] rounded-[24px] border border-[#E5E5EA] dark:border-white/10 shadow-lg">
                                 {session.user_agent.includes('Mobile') ? <Smartphone className="w-6 h-6 text-[#0071E3]" /> : <Monitor className="w-6 h-6 text-[#0071E3]" />}
                              </div>
                              <div className="space-y-1">
                                 <div className="flex items-center gap-2">
                                   <p className="text-sm font-black text-[#1D1D1F] dark:text-white uppercase tracking-tighter italic">{session.ip_address}</p>
                                   <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-[8px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                                 </div>
                                 <div className="flex items-center gap-2 text-[#86868B]">
                                   <MapPin className="w-3 h-3" />
                                   <p className="text-[9px] font-medium truncate max-w-[250px] italic">{session.user_agent}</p>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-8">
                              <div className="text-right">
                                <p className="text-[9px] font-black text-[#86868B] uppercase tracking-widest mb-1 italic">Last Pulse</p>
                                <p className="text-xs font-black text-[#1D1D1F] dark:text-white italic">{formatDate(session.last_active)}</p>
                              </div>
                              <button 
                                onClick={() => handleRevokeSession(session.id)}
                                className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-[20px] transition-all border border-transparent hover:border-rose-500/20"
                              >
                                 <Trash2 className="w-5 h-5" />
                              </button>
                           </div>
                        </div>
                      )) : (
                        <div className="py-20 text-center space-y-4">
                           <Monitor className="w-12 h-12 text-[#86868B] mx-auto opacity-20" />
                           <p className="text-[11px] text-[#86868B] italic uppercase tracking-widest">No active secondary sessions detected.</p>
                        </div>
                      )}
                   </div>
                </SectionCard>
              </motion.div>
            )}

            {activeTab === 'intelligence' && (
              <motion.div
                key="intelligence"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <SectionCard title="Inference Engine Core" icon={<Cpu className="w-5 h-5 text-[#0071E3]" />}>
                   <div className="space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         <div className="space-y-4">
                            <label className="text-[11px] font-black text-[#86868B] uppercase tracking-[0.3em] italic">Active LLM Provider</label>
                            <div className="flex bg-[#F5F5F7] dark:bg-white/5 p-2 rounded-[28px] border border-[#E5E5EA] dark:border-white/10">
                               {['ollama', 'groq', 'gemini'].map((engine) => (
                                  <button
                                     key={engine}
                                     onClick={() => handleSelect('llmProvider', engine)}
                                     className={cn(
                                        "flex-1 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                        preferences.llmProvider === engine 
                                          ? "bg-white dark:bg-[#1D1D1F] text-[#0071E3] shadow-apple border border-[#E5E5EA] dark:border-white/10" 
                                          : "text-[#86868B] hover:text-[#1D1D1F] dark:text-white"
                                     )}
                                  >
                                     {engine}
                                  </button>
                               ))}
                            </div>
                         </div>
                         <div className="space-y-4">
                            <label className="text-[11px] font-black text-[#86868B] uppercase tracking-[0.3em] italic">Intelligence Depth</label>
                            <div className="flex bg-[#F5F5F7] dark:bg-white/5 p-2 rounded-[28px] border border-[#E5E5EA] dark:border-white/10">
                               {['low', 'medium', 'high'].map((depth) => (
                                  <button
                                     key={depth}
                                     onClick={() => handleSelect('scoutDepth', depth)}
                                     className={cn(
                                        "flex-1 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                        preferences.scoutDepth === depth 
                                          ? "bg-white dark:bg-[#1D1D1F] text-[#AF52DE] shadow-apple border border-[#E5E5EA] dark:border-white/10" 
                                          : "text-[#86868B] hover:text-[#1D1D1F] dark:text-white"
                                     )}
                                  >
                                     {depth}
                                  </button>
                               ))}
                            </div>
                         </div>
                      </div>
                      <div className="p-8 rounded-[32px] bg-[#AF52DE]/5 border border-[#AF52DE]/10 text-xs italic text-[#AF52DE] font-medium leading-relaxed">
                        Note: "High" intelligence depth utilizes advanced semantic cross-referencing which may increase inference latency by ~40%.
                      </div>
                   </div>
                </SectionCard>
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <SectionCard title="Protocol Log Stream" icon={<History className="w-5 h-5 text-[#AF52DE]" />}>
                   <div className="space-y-6 relative">
                      <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[#E5E5EA] via-[#AF52DE]/20 to-[#E5E5EA] dark:from-white/5 dark:via-[#AF52DE]/10 dark:to-white/5" />
                      {activities.length > 0 ? activities.map((activity, idx) => (
                        <div key={activity.id} className="relative pl-16 group">
                           <div className="absolute left-[26px] top-2 w-3 h-3 rounded-full bg-[#AF52DE] shadow-[0_0_15px_rgba(175,82,222,0.6)] group-hover:scale-125 transition-transform" />
                           <div className="p-8 rounded-[36px] bg-[#F5F5F7] dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 hover:border-[#AF52DE]/40 transition-all duration-500 hover:shadow-2xl">
                              <div className="flex items-center justify-between mb-3">
                                 <h4 className="text-sm font-black text-[#1D1D1F] dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
                                   <Activity className="w-4 h-4 text-[#AF52DE]" />
                                   {activity.action}
                                 </h4>
                                 <span className="text-[9px] font-black text-[#86868B] uppercase tracking-[0.2em] italic">
                                    {formatDate(activity.timestamp)}
                                 </span>
                              </div>
                              <p className="text-xs text-[#6E6E73] dark:text-[#86868B] font-medium leading-relaxed italic">
                                 {activity.target ? `Target Identified: ${activity.target}` : 'Operational telemetry pulse recorded at the system node.'}
                              </p>
                              {activity.metadata?.ip && (
                                <div className="mt-4 pt-4 border-t border-[#E5E5EA] dark:border-white/5 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                   <div className="flex items-center gap-2">
                                     <Globe className="w-3.5 h-3.5 text-[#AF52DE]" />
                                     <span className="text-[10px] font-mono font-bold text-[#AF52DE]">{activity.metadata.ip}</span>
                                   </div>
                                   <div className="flex items-center gap-2">
                                     <Smartphone className="w-3.5 h-3.5 text-[#86868B]" />
                                     <span className="text-[10px] text-[#86868B] font-medium truncate max-w-[200px]">{activity.metadata.agent}</span>
                                   </div>
                                </div>
                              )}
                           </div>
                        </div>
                      )) : (
                        <div className="py-20 text-center space-y-4">
                           <History className="w-12 h-12 text-[#86868B] mx-auto opacity-20" />
                           <p className="text-[11px] text-[#86868B] italic uppercase tracking-widest">Archive empty. No historical traces found.</p>
                        </div>
                      )}
                   </div>
                </SectionCard>

                <SectionCard title="Recent Intelligence Inventory" icon={<ExternalLink className="w-5 h-5 text-[#0071E3]" />}>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {savedReports.length > 0 ? savedReports.slice(0, 6).map(report => (
                        <div key={report.id} className="p-6 rounded-[32px] bg-[#F5F5F7] dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 hover:border-[#0071E3]/40 transition-all duration-300 group cursor-pointer hover:shadow-xl">
                           <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1D1D1F] flex items-center justify-center text-lg font-black text-[#0071E3] border border-[#E5E5EA] dark:border-white/10 shadow-sm group-hover:bg-[#0071E3] group-hover:text-white transition-all">
                                 {report.target_company.charAt(0)}
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-[#1D1D1F] dark:text-white uppercase tracking-tighter italic">{report.target_company}</h4>
                                <p className="text-[9px] font-black text-[#86868B] uppercase tracking-widest italic">{formatDate(report.generated_at)}</p>
                              </div>
                           </div>
                           <div className="flex items-center justify-between">
                             <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                                {report.total_valid_updates} Signals Extracted
                             </p>
                             <div className="p-2 rounded-lg bg-white dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-all">
                               <ExternalLink className="w-3 h-3 text-[#0071E3]" />
                             </div>
                           </div>
                        </div>
                      )) : (
                        <div className="col-span-2 py-10 text-center">
                           <p className="text-[11px] text-[#86868B] italic uppercase tracking-widest">Intelligence inventory is currently empty.</p>
                        </div>
                      )}
                   </div>
                </SectionCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Danger Zone Protocol */}
          <div className="mt-16 p-12 rounded-[50px] border border-rose-500/20 bg-rose-500/5 backdrop-blur-3xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[100px] -mr-32 -mt-32" />
             <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative">
                <div className="space-y-3 text-center md:text-left">
                   <h3 className="text-2xl font-black text-rose-500 uppercase italic tracking-tighter flex items-center justify-center md:justify-start gap-3">
                      <AlertTriangle className="w-8 h-8" /> Terminate Identity
                   </h3>
                   <p className="text-sm text-[#6E6E73] dark:text-[#86868B] max-w-lg leading-relaxed font-medium italic">
                      This protocol will permanently delete your intelligence profile, historical activity logs, and all saved surveillance reports. All active scan agents will be decommissioned.
                   </p>
                </div>
                <Button 
                   className="bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[11px] h-16 px-14 rounded-full shadow-3xl shadow-rose-500/40 transition-all hover:scale-105 active:scale-95"
                >
                   Execute Delete
                </Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-components ---

const SectionCard = ({ title, icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
   <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="p-12 rounded-[56px] border border-[#E5E5EA] dark:border-white/10 bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-3xl space-y-10 shadow-apple shadow-sm hover:shadow-2xl transition-all duration-700"
   >
      <div className="flex items-center gap-5 pb-8 border-b border-[#F5F5F7] dark:border-white/5">
         <div className="p-4 rounded-[24px] bg-[#F5F5F7] dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 shadow-inner">
            {icon}
         </div>
         <h2 className="text-2xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">{title}</h2>
      </div>
      {children}
   </motion.div>
);

const FormInput = ({ label, value, onChange, placeholder, icon, type = "text" }: { label: string, value: string, onChange: (val: string) => void, placeholder: string, icon?: any, type?: string }) => (
   <div className="space-y-4">
      <label className="text-[11px] font-black text-[#86868B] uppercase tracking-[0.4em] italic flex items-center gap-2">
         {icon} {label}
      </label>
      <input 
         type={type}
         value={value}
         onChange={(e) => onChange(e.target.value)}
         className="w-full bg-[#F5F5F7] dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 rounded-[28px] px-8 py-5 text-base font-bold text-[#1D1D1F] dark:text-white outline-none focus:ring-4 focus:ring-[#0071E3]/20 focus:border-[#0071E3] transition-all"
         placeholder={placeholder}
      />
   </div>
);

const SettingRow = ({ label, description, checked, onToggle }: { label: string, description: string, checked: boolean, onToggle: () => void }) => (
   <div className="flex items-start justify-between gap-8 py-2 group">
      <div className="space-y-2">
         <h3 className="text-base font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter group-hover:text-[#0071E3] transition-colors">{label}</h3>
         <p className="text-[11px] text-[#6E6E73] dark:text-[#86868B] max-w-sm leading-relaxed font-medium italic">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} className="data-[state=checked]:bg-[#0071E3] scale-125" />
   </div>
);

export default SettingsPage;
