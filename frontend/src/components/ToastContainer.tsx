import React from 'react';
import { useToast } from '../context/ToastContext';
import { CheckCircle2, AlertTriangle, Info, Sparkles, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const isGold = toast.type === 'gold';
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border backdrop-blur-xl shadow-2xl flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-4 duration-300 ${
              isGold
                ? 'bg-obsidian-900/95 border-gold-500/40 text-gold-200 shadow-gold-glow'
                : isSuccess
                ? 'bg-obsidian-900/95 border-emerald-500/40 text-emerald-200'
                : isError
                ? 'bg-obsidian-900/95 border-rose-500/40 text-rose-200'
                : 'bg-obsidian-900/95 border-electric-500/30 text-slate-200 shadow-electric-glow'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isGold && <Sparkles className="w-5 h-5 text-gold-400" />}
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isError && <AlertTriangle className="w-5 h-5 text-rose-400" />}
              {!isGold && !isSuccess && !isError && <Info className="w-5 h-5 text-electric-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold tracking-wide text-white font-serif">{toast.title}</h4>
              {toast.message && (
                <p className="mt-0.5 text-xs text-editorial-subtle leading-relaxed break-words">
                  {toast.message}
                </p>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
