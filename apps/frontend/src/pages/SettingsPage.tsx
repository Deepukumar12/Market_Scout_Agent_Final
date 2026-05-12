import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Settings, ShieldCheck, User, LogOut, Check,
  Sparkles, AlertTriangle, Activity, Monitor, History,
  ExternalLink, Trash2, Smartphone, Globe, Lock,
  BarChart3, MapPin, Cpu, Zap, Camera, RotateCw,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { useAuthStore } from '@/store/authStore';
import {
  getUserActivity, getUserSessions, revokeSession,
  getSavedReports, updateProfile as apiUpdateProfile,
  uploadAvatar, getSchedulerConfig, updateSchedulerConfig
} from '@/services/api';
import { cn } from '@/utils/utils';

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
  const navigate = useNavigate();
  const location = useLocation();
  
  // 1. Core State Hooks
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'intelligence' | 'activity' | 'system'>('profile');
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['profile', 'security', 'intelligence', 'activity', 'system'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [location]);

  const [schedulerConfig, setSchedulerConfig] = useState({ interval_unit: 'days', interval_value: 7, email_enabled: false });

  // 2. Real-time Data Store
  const [activities, setActivities] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [savedReports, setSavedReports] = useState<any[]>([]);

  // 3. Form States
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    avatar_url: '',
    bio: '',
    company: '',
    location: '',
    job_title: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [preferences, setPreferences] = useState<any>({
    emailAlerts: true,
    pushNotifications: false,
    marketingEmails: false,
    twoFactorAuth: true,
    sessionTimeout: true,
    scoutDepth: 'medium',
    llmProvider: 'ollama',
    scanWindow: 7,
    autoScan: true
  });

  // 4. Intelligence Sync Effects
  const fetchTelemetry = useCallback(async () => {
    try {
      const [act, sess, reports] = await Promise.all([
        getUserActivity(),
        getUserSessions(),
        getSavedReports()
      ]);
      setActivities(act || []);
      setSessions(sess || []);
      setSavedReports(reports || []);
      
      if (user?.role === 'admin') {
        getSchedulerConfig()
          .then(setSchedulerConfig)
          .catch(e => console.warn('Scheduler access restricted:', e));
      }
    } catch (err) {
      console.error('Telemetry sync failed:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        email: user.email || '',
        avatar_url: user.avatar_url || '',
        bio: user.bio || '',
        company: user.company || '',
        location: user.location || '',
        job_title: user.job_title || ''
      });
      setPreferences((prev: any) => ({ ...prev, ...(user.preferences || {}) }));
      setIsDirty(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTelemetry();
      
      // Real-time synchronization
      window.addEventListener('intelligence-refresh', fetchTelemetry);
      const interval = setInterval(fetchTelemetry, 30000);
      
      return () => {
        window.removeEventListener('intelligence-refresh', fetchTelemetry);
        clearInterval(interval);
      };
    }
  }, [user, fetchTelemetry]);

  const handleForceRefresh = async () => {
    setLoading(true);
    try {
      await fetchUser();
      const [act, sess, reports] = await Promise.all([
        getUserActivity(),
        getUserSessions(),
        getSavedReports()
      ]);
      setActivities(act || []);
      setSessions(sess || []);
      setSavedReports(reports || []);
    } catch (err) {
      console.error('Manual re-sync failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: string) => {
    setPreferences((prev: any) => ({ ...prev, [key]: !prev[key] }));
    setSuccess(false);
    setIsDirty(true);
  };

  const handleSelect = (key: string, value: any) => {
    setPreferences((prev: any) => ({ ...prev, [key]: value }));
    setSuccess(false);
    setIsDirty(true);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveGlobalSettings();
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      await uploadAvatar(file);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await fetchUser();
    } catch (err) {
      console.error('Avatar upload failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'CRITICAL: This will permanently delete your account and ALL data. Confirm?'
    );
    if (!confirmed) return;
    setLoading(true);
    try {
      const { deleteAccount: purgeAccount } = useAuthStore.getState();
      await purgeAccount();
      navigate('/login', { replace: true });
    } catch (err: any) {
      setUpdateError(err?.response?.data?.detail || 'Account deletion failed');
    } finally {
      setLoading(false);
    }
  };

  const saveGlobalSettings = async () => {
    setLoading(true);
    setUpdateError(null);
    try {
      await updateProfile({ ...profileForm, preferences });
      if (user?.role === 'admin' && activeTab === 'system') {
        await updateSchedulerConfig(schedulerConfig as any);
      }
      setSuccess(true);
      setIsDirty(false);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err: any) {
      const { parseError } = await import('@/utils/errorParser');
      setUpdateError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFE] dark:bg-[#050505] -mx-8 -mt-8 selection:bg-blue-600 selection:text-white flex flex-col">
      {/* Premium Apple-style Header */}
      <header className="h-20 bg-white/50 dark:bg-black/50 backdrop-blur-3xl border-b border-[#F0F0F3] dark:border-white/5 flex items-center justify-between px-10 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Settings size={18} className="text-white" />
             </div>
             <h1 className="text-xl font-black tracking-tighter uppercase italic dark:text-white">Command <span className="text-blue-600">Nexus.</span></h1>
          </div>
          <div className="w-px h-6 bg-[#E5E5EA] dark:bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#86868B]">Protocol Active</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <AnimatePresence>
            {isDirty && !success && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600"
              >
                <AlertTriangle size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Unsaved Protocols</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button
            onClick={saveGlobalSettings}
            disabled={loading}
            className={cn(
              "h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl active:scale-95",
              success ? "bg-emerald-500 text-white shadow-emerald-500/20" : 
              isDirty ? "bg-blue-600 text-white shadow-blue-600/40" : 
              "bg-white dark:bg-white/5 text-[#1D1D1F] dark:text-white border border-[#F0F0F3] dark:border-white/5"
            )}
          >
            {loading ? <RotateCw size={14} className="animate-spin" /> : 
             success ? "✓ Protocols Updated" : 
             "Commit Changes"}
          </Button>

          <Button
            variant="outline"
            onClick={handleForceRefresh}
            className="h-12 w-12 rounded-2xl border-[#F0F0F3] dark:border-white/5 flex items-center justify-center p-0"
          >
            <RotateCw size={16} className={cn(loading && "animate-spin")} />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation Sidebar */}
        <aside className="w-80 border-r border-[#F0F0F3] dark:border-white/5 p-8 bg-white/30 dark:bg-black/30 backdrop-blur-3xl overflow-y-auto">
          <div className="space-y-12">
            <div>
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#86868B] mb-6 px-4">Core Console</p>
               <nav className="space-y-2">
                 {[
                   { id: 'profile', icon: User, label: 'Agent Identity', desc: 'Core Biometrics' },
                   { id: 'intelligence', icon: Sparkles, label: 'AI Neural Link', desc: 'Neural Parameters' },
                   { id: 'security', icon: Lock, label: 'Cyber Defense', desc: 'Access Keys' },
                   { id: 'activity', icon: History, label: 'Operational Logs', desc: 'Historical Traces' },
                   ...(user?.role === 'admin' ? [{ id: 'system', icon: Cpu, label: 'Global Nexus', desc: 'System Core' }] : [])
                 ].map(tab => (
                   <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={cn(
                       "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group",
                       activeTab === tab.id
                         ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30"
                         : "text-[#1D1D1F] dark:text-[#86868B] hover:bg-white dark:hover:bg-white/5"
                     )}
                   >
                     <div className={cn(
                       "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                       activeTab === tab.id ? "bg-white/20" : "bg-[#F5F5F7] dark:bg-white/5 group-hover:scale-110"
                     )}>
                       <tab.icon size={20} />
                     </div>
                     <div className="text-left">
                       <p className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">{tab.label}</p>
                       <p className={cn("text-[9px] font-medium italic opacity-60", activeTab === tab.id ? "text-white" : "text-[#86868B]")}>{tab.desc}</p>
                     </div>
                   </button>
                 ))}
               </nav>
            </div>

            {/* Premium Usage Widget */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-400 text-white shadow-2xl relative overflow-hidden group">
               <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Usage Telemetry</p>
                  <p className="text-3xl font-black tracking-tighter italic mb-4">{savedReports.length} <span className="text-sm font-medium opacity-70">/ 50 Scans</span></p>
                  <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(savedReports.length / 50) * 100}%` }}
                        className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                     />
                  </div>
               </div>
               <Activity size={80} className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform" />
            </div>

            <button 
              onClick={logout}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all group border border-transparent hover:border-rose-500/20"
            >
               <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center group-hover:scale-110 transition-all">
                  <LogOut size={20} />
               </div>
               <div className="text-left">
                  <p className="text-[11px] font-black uppercase tracking-widest leading-none">Terminate Link</p>
                  <p className="text-[9px] font-medium italic text-rose-500/60">Secure Session Exit</p>
               </div>
            </button>
          </div>
        </aside>

        {/* Dynamic Content Center */}
        <main className="flex-1 overflow-y-auto p-12 bg-white/10 dark:bg-black/10">
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                  <div className="flex items-center justify-between mb-8">
                      <div>
                         <h2 className="text-5xl font-black tracking-tighter uppercase italic dark:text-white">Agent <span className="text-blue-600">Identity.</span></h2>
                         <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#86868B] mt-2">Biometric Data & Identity Management</p>
                      </div>
                      <div className="relative group">
                         <div className="w-28 h-28 rounded-[36px] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-1 shadow-2xl">
                            <div className="w-full h-full rounded-[32px] bg-white dark:bg-[#1D1D1F] flex items-center justify-center overflow-hidden">
                               {user?.avatar_url ? (
                                 <img src={user.avatar_url.startsWith('http') ? user.avatar_url : `http://localhost:8000${user.avatar_url}`} className="w-full h-full object-cover" />
                               ) : (
                                 <span className="text-4xl font-black text-blue-600 italic">{user?.full_name?.charAt(0) || 'A'}</span>
                               )}
                            </div>
                         </div>
                         <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-[36px] cursor-pointer transition-opacity">
                            <Camera size={28} className="text-white" />
                            <input type="file" className="hidden" onChange={handleAvatarUpload} />
                         </label>
                      </div>
                  </div>

                  <SectionCard title="Operational Identity" icon={<Shield size={20} className="text-blue-600" />}>
                     <form onSubmit={handleProfileUpdate} className="space-y-10">
                       <div className="grid grid-cols-2 gap-10">
                          <FormInput label="Full Identity" value={profileForm.full_name} onChange={(v) => { setProfileForm({...profileForm, full_name: v}); setIsDirty(true); }} placeholder="Full Name" icon={<User size={14} />} />
                          <FormInput label="Strategic Email" value={profileForm.email} onChange={(v) => { setProfileForm({...profileForm, email: v}); setIsDirty(true); }} placeholder="email@scout.ai" icon={<Globe size={14} />} />
                       </div>
                       <div className="grid grid-cols-2 gap-10">
                          <FormInput label="Headquarters" value={profileForm.company} onChange={(v) => { setProfileForm({...profileForm, company: v}); setIsDirty(true); }} placeholder="Strategic HQ" icon={<MapPin size={14} />} />
                          <FormInput label="Intelligence Role" value={profileForm.job_title} onChange={(v) => { setProfileForm({...profileForm, job_title: v}); setIsDirty(true); }} placeholder="Lead Agent" icon={<Cpu size={14} />} />
                       </div>
                       <div className="space-y-4">
                          <label className="text-[11px] font-black uppercase tracking-[0.3em] text-[#86868B] italic">Agent Dossier / Mission Background</label>
                          <textarea 
                            value={profileForm.bio}
                            onChange={(e) => { setProfileForm({...profileForm, bio: e.target.value}); setIsDirty(true); }}
                            className="w-full h-40 bg-[#F5F5F7] dark:bg-white/5 border border-[#F0F0F3] dark:border-white/5 rounded-3xl p-6 text-base font-bold dark:text-white outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600/30 transition-all resize-none"
                            placeholder="Operational background summary..."
                          />
                       </div>
                     </form>
                  </SectionCard>

                  <SectionCard title="Uplink Protocols" icon={<Sparkles size={20} className="text-purple-600" />}>
                     <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-8">
                           <SettingRow label="Mission Briefings" desc="Daily intelligence reports to your inbox." checked={preferences.emailAlerts} onToggle={() => handleToggle('emailAlerts')} />
                           <SettingRow label="Signal Pushes" desc="Instant real-time intercept notifications." checked={preferences.pushNotifications} onToggle={() => handleToggle('pushNotifications')} />
                        </div>
                        <div className="space-y-8">
                           <SettingRow label="Autonomous Sweeps" desc="Background agent monitoring for technical shifts." checked={preferences.autoScan} onToggle={() => handleToggle('autoScan')} />
                           <SettingRow label="Biometric Persistence" desc="Maintain long-term encrypted session traces." checked={preferences.sessionTimeout} onToggle={() => handleToggle('sessionTimeout')} />
                        </div>
                     </div>
                  </SectionCard>
                </motion.div>
              )}

              {activeTab === 'intelligence' && (
                <motion.div
                  key="intelligence"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                   <div>
                      <h2 className="text-5xl font-black tracking-tighter uppercase italic dark:text-white">Neural <span className="text-indigo-600">Parameters.</span></h2>
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#86868B] mt-2">LLM Inference Depth & Surveillance Calibration</p>
                   </div>

                   <SectionCard title="Inference Engine Core" icon={<Cpu size={20} className="text-indigo-600" />}>
                     <div className="space-y-12">
                        <div className="grid grid-cols-2 gap-12">
                           <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#86868B]">Active LLM Protocol</label>
                              <div className="flex p-1.5 bg-[#F5F5F7] dark:bg-white/5 rounded-2xl border border-[#F0F0F3] dark:border-white/5">
                                 {['ollama', 'groq', 'gemini'].map(engine => (
                                   <button
                                     key={engine}
                                     onClick={() => handleSelect('llmProvider', engine)}
                                     className={cn(
                                       "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                       preferences.llmProvider === engine ? "bg-white dark:bg-[#1D1D1F] text-blue-600 shadow-lg" : "text-[#86868B]"
                                     )}
                                   >{engine}</button>
                                 ))}
                              </div>
                           </div>
                           <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#86868B]">Intelligence Depth</label>
                              <div className="flex p-1.5 bg-[#F5F5F7] dark:bg-white/5 rounded-2xl border border-[#F0F0F3] dark:border-white/5">
                                 {['low', 'medium', 'high'].map(depth => (
                                   <button
                                     key={depth}
                                     onClick={() => handleSelect('scoutDepth', depth)}
                                     className={cn(
                                       "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                       preferences.scoutDepth === depth ? "bg-white dark:bg-[#1D1D1F] text-purple-600 shadow-lg" : "text-[#86868B]"
                                     )}
                                   >{depth}</button>
                                 ))}
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#86868B]">Surveillance Cycle Window</label>
                              <span className="text-sm font-black text-blue-600 italic">{preferences.scanWindow} Days</span>
                           </div>
                           <input 
                             type="range" 
                             min="1" max="30" 
                             value={preferences.scanWindow}
                             onChange={(e) => handleSelect('scanWindow', parseInt(e.target.value))}
                             className="w-full h-2 bg-[#F5F5F7] dark:bg-white/5 rounded-full appearance-none cursor-pointer accent-blue-600"
                           />
                        </div>
                     </div>
                   </SectionCard>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                   <div>
                      <h2 className="text-5xl font-black tracking-tighter uppercase italic dark:text-white">Cyber <span className="text-rose-500">Security.</span></h2>
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#86868B] mt-2">Credential Rotation & Biometric Session Control</p>
                   </div>

                   <SectionCard title="Secret Key Rotation" icon={<Lock size={20} className="text-rose-500" />}>
                      <form onSubmit={handlePasswordChange} className="space-y-10">
                         <div className="grid grid-cols-2 gap-10">
                            <FormInput label="Current Secret" type="password" value={passwordForm.current_password} onChange={(v) => setPasswordForm({...passwordForm, current_password: v})} placeholder="••••••••" icon={<ShieldCheck size={14} />} />
                            <div className="space-y-6">
                              <FormInput label="New Secret" type="password" value={passwordForm.new_password} onChange={(v) => setPasswordForm({...passwordForm, new_password: v})} placeholder="••••••••" icon={<Lock size={14} />} />
                              <FormInput label="Verify Secret" type="password" value={passwordForm.confirm_password} onChange={(v) => setPasswordForm({...passwordForm, confirm_password: v})} placeholder="••••••••" icon={<Check size={14} />} />
                            </div>
                         </div>
                         <div className="flex justify-end">
                            <Button type="submit" disabled={loading} className="h-14 px-12 rounded-2xl bg-rose-500 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-rose-500/20 active:scale-95">
                               Rotate Credentials
                            </Button>
                         </div>
                      </form>
                   </SectionCard>

                   <SectionCard title="Active Protocol Sessions" icon={<Monitor size={20} className="text-blue-600" />}>
                      <div className="space-y-4">
                         {sessions.map(session => (
                           <div key={session.id} className="flex items-center justify-between p-6 rounded-3xl bg-[#F5F5F7] dark:bg-white/5 border border-[#F0F0F3] dark:border-white/5 group hover:shadow-lg transition-all">
                              <div className="flex items-center gap-6">
                                 <div className="w-12 h-12 rounded-2xl bg-white dark:bg-black flex items-center justify-center shadow-md">
                                    {session.user_agent.includes('Mobile') ? <Smartphone size={24} className="text-blue-600" /> : <Monitor size={24} className="text-blue-600" />}
                                 </div>
                                 <div>
                                    <div className="flex items-center gap-2 mb-1">
                                       <p className="text-sm font-black italic uppercase tracking-tighter dark:text-white">{session.ip_address}</p>
                                       <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-[8px] font-black text-emerald-500 uppercase tracking-widest">Active Link</span>
                                    </div>
                                    <p className="text-[10px] text-[#86868B] italic truncate max-w-[200px]">{session.user_agent}</p>
                                 </div>
                              </div>
                              <button onClick={() => handleRevokeSession(session.id)} className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">
                                 <Trash2 size={20} />
                              </button>
                           </div>
                         ))}
                      </div>
                   </SectionCard>

                   <div className="p-12 rounded-[48px] bg-rose-500/5 border border-rose-500/10 flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="space-y-2">
                         <h3 className="text-2xl font-black text-rose-500 uppercase italic tracking-tighter flex items-center gap-3"><AlertTriangle size={28} /> Terminate Identity</h3>
                         <p className="text-sm text-[#86868B] max-w-lg font-medium italic">Deleting your identity will erase all archives, reports, and decommission all active surveillance agents.</p>
                      </div>
                      <Button onClick={handleDeleteAccount} className="h-16 px-12 rounded-full bg-rose-500 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-rose-500/30 hover:scale-105 transition-all">
                         Execute Delete
                      </Button>
                   </div>
                </motion.div>
              )}

              {activeTab === 'activity' && (
                <motion.div
                  key="activity"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                   <div>
                      <h2 className="text-5xl font-black tracking-tighter uppercase italic dark:text-white">Operational <span className="text-amber-500">Archives.</span></h2>
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#86868B] mt-2">Historical Pulse & Protocol Logs</p>
                   </div>

                   <SectionCard title="Protocol Stream" icon={<History size={20} className="text-amber-500" />}>
                      <div className="space-y-6 relative">
                         <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[#F0F0F3] via-amber-500/30 to-[#F0F0F3] dark:from-white/5 dark:via-amber-500/10 dark:to-white/5" />
                         {activities.map(activity => (
                           <div key={activity.id} className="relative pl-16 group">
                              <div className="absolute left-[26px] top-2 w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] group-hover:scale-150 transition-transform" />
                              <div className="p-8 rounded-[40px] bg-[#F5F5F7] dark:bg-white/5 border border-[#F0F0F3] dark:border-white/5 hover:border-amber-500/30 transition-all hover:shadow-xl">
                                 <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-black italic uppercase tracking-tighter dark:text-white flex items-center gap-3">
                                       <Zap size={14} className="text-amber-500" /> {activity.action}
                                    </h4>
                                    <span className="text-[10px] font-black text-[#86868B] uppercase tracking-widest">{formatDate(activity.timestamp)}</span>
                                 </div>
                                 <p className="text-xs text-[#86868B] font-medium italic">
                                     {activity.target ? `Target: ${activity.target}` : 
                                      activity.metadata && Object.keys(activity.metadata).length > 0 ? 
                                      `Intercept: ${JSON.stringify(activity.metadata).replace(/["{}]/g, '').replace(/:/g, ': ')}` : 
                                      'System pulse recorded.'}
                                  </p>
                              </div>
                           </div>
                         ))}
                      </div>
                   </SectionCard>
                </motion.div>
              )}

              {activeTab === 'system' && user?.role === 'admin' && (
                <motion.div
                  key="system"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                   <div>
                      <h2 className="text-5xl font-black tracking-tighter uppercase italic dark:text-white">Global <span className="text-blue-600">Scheduler.</span></h2>
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#86868B] mt-2">Administrative Surveillance Heartbeat</p>
                   </div>

                   <SectionCard title="Surveillance Pulse Configuration" icon={<Settings size={20} className="text-blue-600" />}>
                     <div className="space-y-12">
                        <div className="grid grid-cols-2 gap-12">
                           <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#86868B]">Cycle Unit</label>
                              <div className="flex p-1.5 bg-[#F5F5F7] dark:bg-white/5 rounded-2xl border border-[#F0F0F3] dark:border-white/5">
                                 {[
                                   { label: 'Minute', value: 'minutes' },
                                   { label: 'Hour', value: 'hours' },
                                   { label: 'Day', value: 'days' }
                                 ].map(unit => (
                                   <button
                                     key={unit.value}
                                     onClick={() => { setSchedulerConfig({...schedulerConfig, interval_unit: unit.value as any}); setIsDirty(true); }}
                                     className={cn(
                                       "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                       schedulerConfig.interval_unit === unit.value ? "bg-white dark:bg-[#1D1D1F] text-blue-600 shadow-lg" : "text-[#86868B]"
                                     )}
                                   >{unit.label}</button>
                                 ))}
                              </div>
                           </div>
                             <FormInput 
                               label="Interval Value" 
                               type="number" 
                               value={schedulerConfig.interval_value.toString()} 
                               onChange={(v) => { setSchedulerConfig({...schedulerConfig, interval_value: parseInt(v)}); setIsDirty(true); }} 
                               placeholder="7"
                               icon={<RotateCw size={14} />}
                             />
                          </div>
                          
                          <div className="pt-6 border-t border-[#F0F0F3] dark:border-white/5">
                             <SettingRow 
                                label="Email Dispatch" 
                                desc="Automatically send intelligence briefings to all active users upon scan completion." 
                                checked={schedulerConfig.email_enabled} 
                                onToggle={() => { setSchedulerConfig({...schedulerConfig, email_enabled: !schedulerConfig.email_enabled}); setIsDirty(true); }} 
                             />
                          </div>
                        <div className="p-8 rounded-[32px] bg-amber-500/5 border border-amber-500/10 text-amber-600 text-xs italic font-medium leading-relaxed">
                           Admin Note: These parameters control the global heartbeat of all intelligence agents platform-wide.
                        </div>
                     </div>
                   </SectionCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

// --- Refined Sub-components ---

const SectionCard = ({ title, icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
  <div className="p-10 rounded-[48px] bg-white/70 dark:bg-[#0A0A0C]/70 backdrop-blur-3xl border border-[#F0F0F3] dark:border-white/5 shadow-apple shadow-sm hover:shadow-2xl transition-all duration-500">
    <div className="flex items-center gap-4 mb-10 pb-6 border-b border-[#F0F0F3] dark:border-white/5">
       <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] dark:bg-white/5 flex items-center justify-center shadow-inner">
          {icon}
       </div>
       <h3 className="text-2xl font-black italic uppercase tracking-tighter dark:text-white">{title}</h3>
    </div>
    {children}
  </div>
);

const FormInput = ({ label, value, onChange, placeholder, icon, type = "text" }: { label: string, value: string, onChange: (val: string) => void, placeholder: string, icon?: any, type?: string }) => (
  <div className="space-y-4">
    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#86868B] italic flex items-center gap-2">
       {icon} {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#F5F5F7] dark:bg-white/5 border border-[#F0F0F3] dark:border-white/5 rounded-3xl px-8 py-5 text-base font-bold dark:text-white outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600/30 transition-all"
      placeholder={placeholder}
    />
  </div>
);

const SettingRow = ({ label, desc, checked, onToggle }: { label: string, desc: string, checked: boolean, onToggle: () => void }) => (
  <div className="flex items-center justify-between gap-6 group">
    <div className="space-y-1">
      <h4 className="text-sm font-black italic uppercase tracking-tighter dark:text-white group-hover:text-blue-600 transition-colors">{label}</h4>
      <p className="text-[10px] font-medium text-[#86868B] italic leading-relaxed">{desc}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onToggle} className="scale-125 data-[state=checked]:bg-blue-600" />
  </div>
);

export default SettingsPage;
