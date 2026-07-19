import React from 'react';
import { motion } from 'motion/react';
import { Play, Award, BarChart2, Trophy, Coins, Settings as SettingsIcon } from 'lucide-react';

interface Props {
  t: (key: string) => string;
  highScore: number;
  coins: number;
  formatTime: (s: number) => string;
  onPlay: () => void;
  onNav: (screen: 'characters' | 'achievements' | 'statistics' | 'leaderboard' | 'settings') => void;
}

export default function MenuScreen({ t, highScore, coins, formatTime, onPlay, onNav }: Props) {
  return (
    <motion.div
      key="menu-screen"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="absolute inset-0 flex flex-col justify-between py-8 px-6 bg-[#F7F8FA]"
    >
      <div className="flex items-center justify-between w-full mt-4">
        <div className="flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-full px-3 py-1 shadow-sm">
          <Trophy className="w-4 h-4 text-gray-900" />
          <span className="text-xs font-mono font-bold text-gray-900">{formatTime(highScore)}</span>
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-full px-3 py-1 shadow-sm">
          <Coins className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-xs font-mono font-bold text-gray-900">{coins}</span>
        </div>
      </div>

      <div className="flex flex-col items-center my-6">
        <h2 className="text-6xl font-black tracking-tighter text-gray-900 font-mono">DASH</h2>
        <span className="text-[11px] uppercase tracking-widest text-gray-500 mt-1 font-mono font-semibold">Survive and Slay</span>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-3.5 max-w-xs mx-auto w-full">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onPlay}
          className="w-full py-4 bg-[#111827] hover:bg-gray-800 text-white rounded-2xl flex items-center justify-center gap-3 shadow-md border-2 border-gray-900 group"
        >
          <Play className="w-6 h-6 fill-white text-white group-hover:scale-110 transition-transform" />
          <span className="text-xl font-bold font-mono tracking-wide uppercase">{t('play')}</span>
        </motion.button>

        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onNav('characters')}
            className="py-3 bg-white border border-[#E5E7EB] rounded-xl flex flex-col items-center gap-1 shadow-sm text-gray-800"
          >
            <span className="text-2xl">🦁</span>
            <span className="text-xs font-bold font-mono uppercase">{t('characters')}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onNav('achievements')}
            className="py-3 bg-white border border-[#E5E7EB] rounded-xl flex flex-col items-center gap-1 shadow-sm text-gray-800"
          >
            <Award className="w-6 h-6 text-indigo-500" />
            <span className="text-xs font-bold font-mono uppercase">{t('achievements')}</span>
          </motion.button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onNav('statistics')}
            className="py-3 bg-white border border-[#E5E7EB] rounded-xl flex flex-col items-center gap-1 shadow-sm text-gray-800"
          >
            <BarChart2 className="w-6 h-6 text-[#111827]" />
            <span className="text-xs font-bold font-mono uppercase">{t('statistics')}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onNav('leaderboard')}
            className="py-3 bg-white border border-[#E5E7EB] rounded-xl flex flex-col items-center gap-1 shadow-sm text-gray-800"
          >
            <Trophy className="w-6 h-6 text-amber-500" />
            <span className="text-xs font-bold font-mono uppercase">{t('leaderboard')}</span>
          </motion.button>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onNav('settings')}
          className="w-full py-2.5 bg-white border border-[#E5E7EB] rounded-xl flex items-center justify-center gap-2 shadow-sm text-gray-700"
        >
          <SettingsIcon className="w-4 h-4" />
          <span className="text-xs font-bold font-mono uppercase">{t('settings')}</span>
        </motion.button>
      </div>

      <div className="w-full flex justify-center text-[10px] text-[#64748B] font-mono mt-2">
        v1.2.0 • Android Responsive Design
      </div>
    </motion.div>
  );
}
