import { motion } from 'framer-motion';
import { Settings, Bell, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SettingsPage = () => {
  return (
    <div className="relative max-w-4xl mx-auto space-y-8">
      <div className="pointer-events-none absolute -top-40 left-0 w-72 h-72 bg-cyan-500/10 blur-3xl" />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Console Settings</h1>
          <p className="text-sm text-gray-400">
            Lightweight, visual settings page. In production this would be wired to real preferences.
          </p>
        </div>
        <Settings className="w-6 h-6 text-gray-300" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SettingsCard
          icon={<User className="w-5 h-5 text-cyan-400" />}
          title="Profile"
          description="Name, role, and notification identity used in reports."
        />
        <SettingsCard
          icon={<Bell className="w-5 h-5 text-amber-400" />}
          title="Alerts"
          description="Control which events should trigger high-priority alerts."
        />
        <SettingsCard
          icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
          title="Security"
          description="Session behavior and device safety recommendations."
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-white/10 bg-black/70 p-6 flex items-center justify-between gap-4"
      >
        <div>
          <p className="text-xs text-cyan-300 font-mono mb-1">SESSION</p>
          <p className="text-sm text-gray-300">
            You are currently in a demo environment. Settings here are visual only.
          </p>
        </div>
        <Button variant="outline" className="border-white/20 text-gray-200 text-xs px-4 py-2">
          Reset demo state
        </Button>
      </motion.div>
    </div>
  );
};

const SettingsCard = ({
  icon,
  title,
  description,
}: {
  icon: JSX.Element;
  title: string;
  description: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="p-5 rounded-2xl border border-white/10 bg-white/5 flex items-start gap-3"
  >
    <div className="p-3 rounded-xl bg-black/60 border border-white/10">{icon}</div>
    <div>
      <h2 className="text-sm font-semibold mb-1">{title}</h2>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
  </motion.div>
);

export default SettingsPage;

