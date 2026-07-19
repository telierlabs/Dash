import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface Stats {
  gamesPlayed: number;
  totalPlayTime: number;
  totalCoinsCollected: number;
}

interface Props {
  t: (key: string) => string;
  stats: Stats;
  highScore: number;
  formatTime: (s: number) => string;
  formatDetailedTime: (s: number) => string;
  favoriteCharacter: string;
  onBack: () => void;
}

export default function StatisticsScreen({ t, stats, highScore, formatTime, formatDetailedTime, favoriteCharacter, onBack }: Props) {
  return (
    <div className="absolute inset-0 flex flex-col bg-[#F7F8FA] p-6">
      <div className="flex items-center justify-between mb-4 mt-2">
        <button onClick={onBack} className="p-1.5 bg-white border border-[#E5E7EB] rounded-full shadow-sm text-gray-700">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-black font-mono tracking-tight text-gray-900">{t('statistics').toUpperCase()}</h3>
        <div className="w-8" />
      </div>

      <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto">
        <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold font-mono text-[#64748B] uppercase">{t('gamesPlayed')}</span>
            <span className="text-2xl font-black font-mono mt-1 text-[#111827]">{stats.gamesPlayed}</span>
          </div>
          <span className="text-3xl bg-[#F7F8FA] p-2.5 rounded-xl">🎮</span>
        </div>

        <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold font-mono text-[#64748B] uppercase">{t('bestTime')}</span>
            <span className="text-2xl font-black font-mono mt-1 text-[#111827]">{formatTime(highScore)}</span>
          </div>
          <span className="text-3xl bg-[#F7F8FA] p-2.5 rounded-xl">⏱️</span>
        </div>

        <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold font-mono text-[#64748B] uppercase">{t('totalCoins')}</span>
            <span className="text-2xl font-black font-mono mt-1 text-[#111827]">{stats.totalCoinsCollected}</span>
          </div>
          <span className="text-3xl bg-[#F7F8FA] p-2.5 rounded-xl">🪙</span>
        </div>

        <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold font-mono text-[#64748B] uppercase">{t('totalPlayTime')}</span>
            <span className="text-2xl font-black font-mono mt-1 text-[#111827]">{formatDetailedTime(stats.totalPlayTime)}</span>
          </div>
          <span className="text-3xl bg-[#F7F8FA] p-2.5 rounded-xl">⏳</span>
        </div>

        <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold font-mono text-[#64748B] uppercase">{t('favChar')}</span>
            <span className="text-2xl font-black font-mono mt-1 text-gray-900">{favoriteCharacter}</span>
          </div>
          <span className="text-3xl bg-[#F7F8FA] p-2.5 rounded-xl">❤️</span>
        </div>
      </div>
    </div>
  );
}
