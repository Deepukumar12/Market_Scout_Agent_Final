import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-between w-14 h-8 px-1.5 rounded-full bg-[#F5F5F7] dark:bg-[#3A3A3C] border border-[#E5E5EA] dark:border-[#48484A] transition-colors overflow-hidden group"
      aria-label="Toggle theme"
    >
      <motion.div
        animate={{ x: theme === 'dark' ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="z-10 w-5 h-5 rounded-full bg-white dark:bg-[#1D1D1F] shadow-apple-sm flex items-center justify-center border border-[#E5E5EA] dark:border-[#48484A]"
      >
        {theme === 'light' ? (
          <Sun size={12} className="text-amber-500" strokeWidth={3} />
        ) : (
          <Moon size={12} className="text-indigo-400" strokeWidth={3} />
        )}
      </motion.div>
      
      <div className="absolute inset-0 flex items-center justify-between px-2 text-[#86868B]">
        <Sun size={10} className={theme === 'dark' ? 'opacity-100' : 'opacity-0'} />
        <Moon size={10} className={theme === 'light' ? 'opacity-100' : 'opacity-0'} />
      </div>
    </button>
  );
};

export default ThemeToggle;
