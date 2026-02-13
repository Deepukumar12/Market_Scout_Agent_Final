
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Search, Bell, User } from 'lucide-react';
import LogConsole from '@/features/dashboard/LogConsole';
import { useAuthStore } from '@/store/authStore';

const DashboardLayout = () => {
  const { user } = useAuthStore();
  
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="flex w-full h-screen bg-black text-white">
      <Sidebar />
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 glass-panel">
          <div className="relative w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search intelligence..." 
              className="w-full bg-black/50 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-gray-300 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="hover:bg-white/10">
              <Bell className="h-5 w-5 text-gray-400" />
            </Button>
            
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                <div className="flex flex-col items-end hidden md:flex">
                    <span className="text-sm font-medium text-white">
                        {user?.full_name || 'User'}
                    </span>
                    <span className="text-xs text-gray-400">
                        {user?.email || ''}
                    </span>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 border border-white/20 flex items-center justify-center text-sm font-bold shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                    {user?.full_name ? getInitials(user.full_name) : <User className="h-4 w-4" />}
                </div>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/10 via-black to-black pointer-events-none"></div>
          <Outlet />
          <LogConsole />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
