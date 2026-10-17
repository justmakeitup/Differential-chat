import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`relative inline-flex items-center gap-2 p-2 rounded-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 group cursor-pointer ${
        isDark
          ? 'bg-obsidian-850/80 border border-white/10 text-gold-300 hover:border-gold-500/40 hover:bg-obsidian-800'
          : 'bg-white border border-slate-200 text-slate-700 hover:border-gold-500/50 hover:bg-slate-50 shadow-sm'
      } ${className}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <Sun
          className={`w-4 h-4 transition-all duration-500 transform ${
            isDark
              ? 'opacity-100 rotate-0 scale-100 text-gold-400'
              : 'opacity-0 -rotate-90 scale-0 text-amber-500 absolute'
          }`}
        />
        <Moon
          className={`w-4 h-4 transition-all duration-500 transform ${
            isDark
              ? 'opacity-0 rotate-90 scale-0 text-slate-400 absolute'
              : 'opacity-100 rotate-0 scale-100 text-indigo-600'
          }`}
        />
      </div>

      {showLabel && (
        <span className="text-xs font-mono tracking-wider uppercase select-none font-medium">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};
