import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, ShieldCheck, User, LogOut, Check, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

// Mock types for user preferences since we don't have a backend endpoint yet
interface UserPreferences {
  emailAlerts: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  twoFactorAuth: boolean;
  sessionTimeout: boolean;
}

const SettingsPage = () => {
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Local state for preferences
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailAlerts: true,
    pushNotifications: false,
    marketingEmails: false,
    twoFactorAuth: true,
    sessionTimeout: true
  });

  const handleToggle = (key: keyof UserPreferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    // Reset success state when changes are made
    setSuccess(false);
  };

  const saveSettings = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setSuccess(true);
    
    // Auto hide success message
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="relative max-w-5xl mx-auto space-y-8 pb-20 p-6">
      {/* Background Decor */}
      <div className="pointer-events-none absolute -top-40 left-0 w-96 h-96 bg-cyan-500/10 blur-[100px]" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8 text-cyan-400" />
            Console Settings
          </h1>
          <p className="text-slate-400 text-lg">
            Manage your account, notifications, and security preferences.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={saveSettings} 
            disabled={loading}
            className={cn(
              "font-bold transition-all",
              success ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-cyan-600 hover:bg-cyan-500 text-white"
            )}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : success ? (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Saved
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Column */}
        <div className="lg:col-span-1 space-y-6">
          <SectionCard title="Profile Information" icon={<User className="w-5 h-5 text-cyan-400" />}>
             <div className="flex flex-col items-center py-6 text-center space-y-4">
                 <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-cyan-500/20">
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-white">{user?.full_name || 'User'}</h3>
                    <p className="text-sm text-slate-400 font-mono">{user?.email}</p>
                 </div>
                 <div className="flex gap-2 pt-2">
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 uppercase tracking-wider">
                       {user?.role || 'Pro Plan'}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                       <Check className="w-3 h-3" /> Verified
                    </span>
                 </div>
             </div>
             
             <div className="pt-6 border-t border-white/5 w-full">
                <Button variant="outline" onClick={logout} className="w-full border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300">
                   <LogOut className="w-4 h-4 mr-2" />
                   Sign Out
                </Button>
             </div>
          </SectionCard>
        </div>

        {/* Settings Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Notifications */}
          <SectionCard title="Notification Preferences" icon={<Bell className="w-5 h-5 text-amber-400" />}>
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
                   description="Receive news about new ScoutIQ features and improvements."
                   checked={preferences.marketingEmails}
                   onToggle={() => handleToggle('marketingEmails')}
                />
             </div>
          </SectionCard>

          {/* Security */}
          <SectionCard title="Security & Privacy" icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}>
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

          {/* Session Data */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Session Info</p>
               <p className="text-sm text-slate-400 font-mono break-all">
                  ID: {user?.id || 'ANONYMOUS-SESSION'}
               </p>
            </div>
            <div className="text-right">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Last Active</p>
                <p className="text-sm text-emerald-400 font-mono">
                   {new Date().toLocaleTimeString()}
                </p>
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
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="p-6 rounded-3xl border border-[#1E293B] bg-[#0B0F19] space-y-6 shadow-xl"
   >
      <div className="flex items-center gap-3 pb-4 border-b border-white/5">
         <div className="p-2 rounded-lg bg-white/5 border border-white/5">
            {icon}
         </div>
         <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      {children}
   </motion.div>
);

const SettingRow = ({ label, description, checked, onToggle }: { label: string, description: string, checked: boolean, onToggle: () => void }) => (
   <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
         <h3 className="text-sm font-semibold text-white">{label}</h3>
         <p className="text-xs text-slate-400 max-w-sm leading-relaxed">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} className="data-[state=checked]:bg-cyan-600" />
   </div>
);

export default SettingsPage;

