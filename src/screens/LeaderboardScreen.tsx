import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface Props {
  t: (key: string) => string;
  highScore: number;
  formatTime: (s: number) => string;
  onBack: () => void;
}

export default function LeaderboardScreen({ t, highScore, formatTime, onBack }: Props) {
  const entries = [
    { rank: 1, name: 'DinoDasher_99', time: 145.2, animal: '🦖' },
    { rank: 2, name: 'SpeedyRabbit', time: 92.5, animal: '🐰' },
    { rank: 3, name: 'PandaExpress', time: 78.4, animal: '🐼' },
    { rank: 4, name: 'YOU', time: highScore, animal: '🐰', isUser: true },
    { rank: 5, name: 'SuperFox', time: 48.1, animal: '🦊' },
    { rank: 6, name: 'KingPenguin', time: 32.0, animal: '🐧' }
  ].sort((a, b) => b.time - a.time);

  return (
    <div className="absolute inset-0 flex flex-col bg-[#F7F8FA] p-6">
      <div className="flex items-center justify-between mb-4 mt-2">
        <button onClick={onBack} className="p-1.5 bg-white border border-[#E5E7EB] rounded-full shadow-sm text-gray-700">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-black font-mono tracking-tight text-gray-900">{t('leaderboard').toUpperCase()}</h3>
        <div className="w-8" />
      </div>

      <span className="text-[10px] text-gray-500 font-mono text-center mb-3.5 uppercase tracking-wide">
        {t('onlineLeaderboard')}
      </span>

      <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
        {entries.map((entry, idx) => (
          <div
            key={idx}
            className={`p-3 border rounded-xl flex items-center justify-between shadow-2xs ${entry.isUser ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-[#E5E7EB]'}`}
          >
            <div className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-mono ${entry.isUser ? 'bg-indigo-600 text-white' : (idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-[#F7F8FA] text-gray-500')}`}>
                {idx + 1}
              </span>
              <span className="text-lg">{entry.animal}</span>
              <span className={`text-xs font-mono font-bold ${entry.isUser ? 'text-indigo-900' : 'text-gray-900'}`}>
                {entry.name}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-gray-800">
              {formatTime(entry.time)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
