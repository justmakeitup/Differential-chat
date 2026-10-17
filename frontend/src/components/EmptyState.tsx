import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <div className="text-center py-16 px-4 rounded-3xl bg-obsidian-900/40 border border-white/5 max-w-md mx-auto my-8">
      <div className="w-14 h-14 rounded-2xl bg-obsidian-800/80 border border-gold-500/20 text-gold-400 flex items-center justify-center mx-auto shadow-inner-glow">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="mt-4 font-serif text-lg font-medium text-white">{title}</h3>
      <p className="mt-2 text-xs text-editorial-subtle leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-6 px-4 py-2 rounded-xl text-xs font-semibold bg-gold-500 hover:bg-gold-400 text-obsidian-950 shadow-gold-glow transition-all cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
