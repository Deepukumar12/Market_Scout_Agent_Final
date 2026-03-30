import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, ShieldCheck, User, LogOut, Check, Save, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { AnimatePresence } from 'framer-motion';

// Mock types for user preferences since we don't have a backend endpoint yet
interface UserPreferences {
  emailAlerts: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  twoFactorAuth: boolean;
  sessionTimeout: boolean;
  // New Project Features
  scoutDepth: 'high' | 'medium' | 'low';
  llmProvider: 'ollama' | 'groq' | 'gemini';
  scanWindow: 7 | 30 | 90;
  autoScan: boolean;
}

const SettingsPage = () => {
  const { user, logout, updateProfile, changePassword } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  
  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || ''
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // API Config State
  const [apiConfig, setApiConfig] = useState({
    geminiKey: '••••••••••••••••',
    groqKey: '••••••••••••••••',
    githubToken: '••••••••••••••••'
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Local state for preferences with persistence
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('scoutiq_preferences');
    return saved ? JSON.parse(saved) : {
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
  });

  const handleToggle = (key: keyof UserPreferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    setSuccess(false);
  };

  const handleSelect = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setSuccess(false);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUpdateError(null);
    try {
      await updateProfile(profileForm);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
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

  const saveSettings = async () => {
    setLoading(true);
    // Simulate API call and persist locally
    await new Promise(resolve => setTimeout(resolve, 1000));
    localStorage.setItem('scoutiq_preferences', JSON.stringify(preferences));
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="relative max-w-5xl mx-auto space-y-8 pb-20 p-6">
      {/* Background Decor */}
      <div className="pointer-events-none absolute -top-40 left-0 w-96 h-96 bg-[#0071E3]/5 dark:bg-[#0071E3]/10 blur-[100px]" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#1D1D1F] dark:text-white tracking-tight mb-2 flex items-center gap-3 uppercase italic leading-tight">
            <Settings className="w-8 h-8 text-[#0071E3]" />
            Console <span className="text-[#AF52DE]">Settings</span>
          </h1>
          <p className="text-[#6E6E73] dark:text-[#86868B] text-lg font-medium italic">
            Configure your autonomous surveillance parameters and security.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={saveSettings} 
            disabled={loading}
            className={cn(
              "font-black uppercase tracking-widest text-[10px] h-12 px-8 transition-all rounded-[20px] shadow-2xl backdrop-blur-md",
              success ? "bg-emerald-500/90 hover:bg-emerald-600 text-white shadow-emerald-500/30" : "bg-[#0071E3]/90 hover:bg-[#0077ED] text-white shadow-[#0071E3]/40"
            )}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                SYNCING...
              </span>
            ) : success ? (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                SECURED
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                COMMIT CHANGES
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Column */}
        <div className="lg:col-span-1 space-y-6">
          <SectionCard title="Profile Information" icon={<User className="w-5 h-5 text-[#0071E3]" />}>
             <div className="flex flex-col items-center py-6 text-center space-y-4">
                 <div className="w-24 h-24 rounded-full bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-white/10 flex items-center justify-center text-3xl font-black text-[#0071E3] shadow-inner uppercase italic">
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">{user?.full_name || 'User'}</h3>
                    <p className="text-[10px] text-[#86868B] dark:text-[#A1A1A6] font-mono uppercase tracking-[0.2em]">{user?.email}</p>
                 </div>
                 <div className="flex gap-2 pt-2">
                    <span className="px-3 py-1 rounded-full bg-[#0071E3]/10 border border-[#0071E3]/20 text-[10px] font-black text-[#0071E3] uppercase tracking-wider">
                       {user?.role || 'Intelligence Plan'}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                       <Check className="w-3 h-3" /> Verified
                    </span>
                 </div>
             </div>
             
             <div className="pt-6 border-t border-[#E5E5EA] dark:border-white/10 w-full space-y-4">
                <Button variant="outline" onClick={logout} className="w-full border-rose-500/30 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 font-black uppercase tracking-widest text-[10px] h-10 rounded-xl">
                   <LogOut className="w-4 h-4 mr-2" />
                   Sign Out
                </Button>
             </div>
          </SectionCard>

          {/* New Section: Surveillance Ops */}
          <SectionCard title="Surveillance Ops" icon={<Sparkles className="w-5 h-5 text-[#AF52DE]" />}>
            <div className="space-y-6">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] italic">Scan Window</label>
                  <div className="grid grid-cols-3 gap-2">
                     {[7, 30, 90].map(days => (
                        <button
                          key={days}
                          onClick={() => handleSelect('scanWindow', days)}
                          className={cn(
                            "py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                            preferences.scanWindow === days 
                              ? "bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] border-transparent shadow-apple" 
                              : "bg-transparent border-[#E5E5EA] dark:border-white/10 text-[#6E6E73] hover:text-[#1D1D1F] dark:hover:text-white"
                          )}
                        >
                          {days} Days
                        </button>
                     ))}
                  </div>
               </div>
               <SettingRow 
                  label="Autonomous Scanning"
                  description="Enable background agents to sweep the market daily without manual trigger."
                  checked={preferences.autoScan}
                  onToggle={() => handleToggle('autoScan')}
               />
            </div>
          </SectionCard>
        </div>

        {/* Settings Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* User Profile Update */}
          <SectionCard title="Update Profile" icon={<User className="w-5 h-5 text-[#0071E3]" />}>
             <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] italic">Full Name</label>
                      <input 
                        type="text"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                        className="w-full bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-[#1D1D1F] dark:text-white outline-none focus:ring-2 focus:ring-[#0071E3] transition-all"
                        placeholder="Your full name"
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] italic">Email Address</label>
                      <input 
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                        className="w-full bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-[#1D1D1F] dark:text-white outline-none focus:ring-2 focus:ring-[#0071E3] transition-all"
                        placeholder="Your email"
                      />
                   </div>
                </div>
                <Button type="submit" disabled={loading} className="w-fit bg-[#0071E3] hover:bg-[#0077ED] text-white font-black uppercase tracking-widest text-[10px] h-10 px-8 rounded-xl">
                   Update Profile
                </Button>
             </form>
          </SectionCard>

          {/* Password Change */}
          <SectionCard title="Change Password" icon={<ShieldCheck className="w-5 h-5 text-[#FF3B30]" />}>
             <form onSubmit={handlePasswordChange} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] italic">Current Password</label>
                      <input 
                        type="password"
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                        className="w-full bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-[#1D1D1F] dark:text-white outline-none focus:ring-2 focus:ring-[#0071E3] transition-all"
                        placeholder="••••••••"
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] italic">New Password</label>
                      <input 
                        type="password"
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                        className="w-full bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-[#1D1D1F] dark:text-white outline-none focus:ring-2 focus:ring-[#0071E3] transition-all"
                        placeholder="••••••••"
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] italic">Confirm New Password</label>
                      <input 
                        type="password"
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                        className="w-full bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-[#1D1D1F] dark:text-white outline-none focus:ring-2 focus:ring-[#0071E3] transition-all"
                        placeholder="••••••••"
                      />
                   </div>
                </div>
                {updateError && <p className="text-xs font-bold text-rose-500 italic uppercase tracking-wider">{updateError}</p>}
                <Button type="submit" disabled={loading} className="w-fit bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 font-black uppercase tracking-widest text-[10px] h-10 px-8 rounded-xl">
                   Change Password
                </Button>
             </form>
          </SectionCard>

          {/* New Section: Scout AI Core */}
          <SectionCard title="Scout AI Core" icon={<Settings className="w-5 h-5 text-[#0071E3]" />}>
             <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] italic">Model Intelligence</label>
                      <select 
                        value={preferences.llmProvider}
                        onChange={(e) => handleSelect('llmProvider', e.target.value)}
                        className="w-full bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-[#1D1D1F] dark:text-white outline-none focus:ring-2 focus:ring-[#0071E3] transition-all"
                      >
                         <option value="ollama">Ollama (Llama-3 Local)</option>
                         <option value="groq">Groq (Ultra Speed)</option>
                         <option value="gemini">Gemini 1.5</option>
                      </select>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] italic">Technical Depth</label>
                      <div className="flex bg-[#F5F5F7] dark:bg-[#2C2C2E] p-1 rounded-xl">
                         {['low', 'medium', 'high'].map((level) => (
                            <button
                               key={level}
                               onClick={() => handleSelect('scoutDepth', level)}
                               className={cn(
                                  "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                  preferences.scoutDepth === level 
                                    ? "bg-white dark:bg-[#1D1D1F] text-[#0071E3] shadow-apple-sm" 
                                    : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                               )}
                            >
                               {level}
                            </button>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0071E3]/5 border border-[#0071E3]/10 text-xs font-medium italic text-[#0071E3] leading-relaxed">
                   Note: Higher intelligence levels consume more processing tokens and increase scan latency by approximately 45%.
                </div>
             </div>
          </SectionCard>

          {/* Notifications */}
          <SectionCard title="Notification Preferences" icon={<Bell className="w-5 h-5 text-[#FF9500]" />}>
             <div className="space-y-6">
                <SettingRow 
                   label="Email Alerts"
                   description="Receive daily intelligence summaries and critical competitor updates."
                   checked={preferences.emailAlerts}
                   onToggle={() => handleToggle('emailAlerts')}
                />
                <SettingRow 
                   label="Push Notifications"
                   description="Get real-time browser alerts for high-priority market signals."
                   checked={preferences.pushNotifications}
                   onToggle={() => handleToggle('pushNotifications')}
                />
                <SettingRow 
                   label="Product Updates"
                   description="Receive news about new Scout Agent features and improvements."
                   checked={preferences.marketingEmails}
                   onToggle={() => handleToggle('marketingEmails')}
                />
             </div>
          </SectionCard>

          {/* Security */}
          <SectionCard title="Security & Privacy" icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}>
             <div className="space-y-6">
                <SettingRow 
                   label="Two-Factor Authentication"
                   description="Require an extra security step when logging in from a new device."
                   checked={preferences.twoFactorAuth}
                   onToggle={() => handleToggle('twoFactorAuth')}
                />
                <SettingRow 
                   label="Session Timeout"
                   description="Automatically log out after inactivity to protect your account."
                   checked={preferences.sessionTimeout}
                   onToggle={() => handleToggle('sessionTimeout')}
                />
             </div>
          </SectionCard>

          {/* API Keys Configuration */}
          <SectionCard title="API Configuration" icon={<ShieldCheck className="w-5 h-5 text-[#AF52DE]" />}>
             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] italic">Gemini API Key</label>
                      <input 
                        type="password"
                        value={apiConfig.geminiKey}
                        onChange={(e) => setApiConfig({...apiConfig, geminiKey: e.target.value})}
                        className="w-full bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-[#1D1D1F] dark:text-white outline-none focus:ring-2 focus:ring-[#0071E3] transition-all"
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] italic">Groq API Key</label>
                      <input 
                        type="password"
                        value={apiConfig.groqKey}
                        onChange={(e) => setApiConfig({...apiConfig, groqKey: e.target.value})}
                        className="w-full bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-[#1D1D1F] dark:text-white outline-none focus:ring-2 focus:ring-[#0071E3] transition-all"
                      />
                   </div>
                </div>
                <p className="text-[10px] text-[#6E6E73] dark:text-[#86868B] italic leading-relaxed">
                   API keys are encrypted at rest and never exposed in the browser console. Masked for your security.
                </p>
             </div>
          </SectionCard>

          {/* Danger Zone */}
          <SectionCard title="Danger Zone" icon={<AlertTriangle className="w-5 h-5 text-[#FF3B30]" />}>
             <div className="p-6 rounded-[32px] bg-rose-500/5 border border-rose-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1 text-center md:text-left">
                   <h3 className="text-sm font-black text-[#FF3B30] uppercase italic tracking-tighter">Deactivate Sentinel Account</h3>
                   <p className="text-xs text-[#6E6E73] dark:text-[#86868B] max-w-sm leading-relaxed font-medium italic">
                      Permanently delete your profile and all intelligence archives. This action is irreversible.
                   </p>
                </div>
                <Button 
                   onClick={() => setIsDeleteModalOpen(true)}
                   className="bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl shadow-lg shadow-rose-500/20"
                >
                   Delete Account
                </Button>
             </div>
          </SectionCard>

          {/* Session Data */}
          <div className="rounded-[40px] border border-[#E5E5EA] dark:border-white/10 bg-white/60 dark:bg-[#1D1D1F]/60 p-10 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-xl shadow-apple shadow-sm">
            <div>
               <p className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] mb-1">Session Protocol ID</p>
               <p className="text-sm text-[#1D1D1F] dark:text-white font-mono break-all font-bold tracking-tighter">
                  {user?.id || 'ANONYMOUS-SESSION'}
               </p>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] mb-1">Last Protocol Pulse</p>
                <p className="text-xl text-emerald-600 dark:text-emerald-400 font-black italic tracking-tighter">
                   {new Date().toLocaleTimeString('en-IN')}
                </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsDeleteModalOpen(false)}
               className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-md bg-white dark:bg-[#1D1D1F] rounded-[40px] p-12 border border-white/10 shadow-2xl overflow-hidden"
            >
               <div className="absolute -top-24 -right-24 w-64 h-64 bg-rose-500/10 blur-[80px]" />
               <div className="space-y-8 text-center">
                  <div className="w-20 h-20 bg-rose-500/10 rounded-[30px] flex items-center justify-center mx-auto border border-rose-500/20">
                     <AlertTriangle className="w-10 h-10 text-rose-500" />
                  </div>
                  <div className="space-y-4">
                     <h2 className="text-2xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">Confirm Deletion</h2>
                     <p className="text-sm text-[#6E6E73] dark:text-[#86868B] leading-relaxed font-medium italic">
                        Are you absolutely certain? This will wipe your entire competitive intelligence history, saved targets, and analytical reports.
                     </p>
                  </div>
                  <div className="flex flex-col gap-4 pt-4">
                     <Button 
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[10px] h-12 rounded-[20px]"
                     >
                        Cancel Protocol
                     </Button>
                     <Button 
                        variant="ghost"
                        className="text-rose-500 hover:bg-rose-500/10 font-black uppercase tracking-widest text-[10px] h-12 rounded-[20px]"
                     >
                        Confirm IRREVERSIBLE DELETION
                     </Button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Sub-components ---

const SectionCard = ({ title, icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
   <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="p-10 rounded-[40px] border border-[#E5E5EA] dark:border-white/10 bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl space-y-6 shadow-apple shadow-sm"
   >
      <div className="flex items-center gap-3 pb-4 border-b border-[#F5F5F7] dark:border-white/5">
         <div className="p-2 rounded-lg bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-white/10">
            {icon}
         </div>
         <h2 className="text-lg font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">{title}</h2>
      </div>
      {children}
   </motion.div>
);

const SettingRow = ({ label, description, checked, onToggle }: { label: string, description: string, checked: boolean, onToggle: () => void }) => (
   <div className="flex items-start justify-between gap-4 py-1">
      <div className="space-y-1">
         <h3 className="text-sm font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">{label}</h3>
         <p className="text-xs text-[#6E6E73] dark:text-[#86868B] max-w-sm leading-relaxed font-medium italic">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} className="data-[state=checked]:bg-[#0071E3]" />
   </div>
);

export default SettingsPage;

