import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="rounded-2xl bg-obsidian-900/60 border border-white/5 p-4 animate-pulse space-y-3">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-obsidian-800" />
      <div className="space-y-1.5 flex-1">
        <div className="w-28 h-3.5 bg-obsidian-800 rounded" />
        <div className="w-20 h-2.5 bg-obsidian-800/60 rounded" />
      </div>
    </div>
    <div className="w-full h-56 bg-obsidian-800/80 rounded-xl" />
    <div className="w-3/4 h-3 bg-obsidian-800 rounded" />
    <div className="w-1/2 h-3 bg-obsidian-800/60 rounded" />
  </div>
);

export const ProfileSkeleton: React.FC = () => (
  <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
    <div className="w-full h-48 bg-obsidian-800/60 rounded-3xl" />
    <div className="px-6 flex items-end gap-6 -mt-16">
      <div className="w-28 h-28 rounded-2xl bg-obsidian-800 border-4 border-obsidian-950" />
      <div className="space-y-2 pb-2">
        <div className="w-40 h-5 bg-obsidian-800 rounded" />
        <div className="w-24 h-3 bg-obsidian-800/60 rounded" />
      </div>
    </div>
    <div className="px-6 space-y-3">
      <div className="w-full h-3 bg-obsidian-800 rounded" />
      <div className="w-4/5 h-3 bg-obsidian-800 rounded" />
    </div>
  </div>
);
