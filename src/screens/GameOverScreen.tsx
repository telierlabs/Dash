import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Coins, Tv, RotateCcw } from 'lucide-react';

interface Props {
  t: (key: string) => string;
  runTime: number;
  runCoins: number;
  highScore: number;
  isNewRecord: boolean;
  isDailyClaimed: boolean;
  formatTime: (s: number) => string;
  onClaimDaily: () => void;
  onWatchAd: () => void;
  onRetry: () => void;
  onNav: (screen: 'characters' | 'menu') => void;
}

export default function GameOverScreen({
  t, runTime, runCoins, highScore, isNewRecord, isDailyClaimed, formatTime,
  onClaimDaily, onWatchAd, onRetry, onNav
}: Props) {
  return (
    <motion.div
      key="gameover-screen"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col justify-between py-8 px-6 bg-[#F7F8FA]"
    >
      <div className="flex flex-col items-center mt-6 gap-1">
        <span className="text-xs tracking-widest text-[#64748B] uppercase font-mono">{t('gameOver')}</span>
        <h3 className="text-4xl font-black tracking-tight text-gray-900 font-mono uppercase">{t('youSurvived')}</h3>
        <div className="text-5xl font-black font-mono text-indigo-600 mt-2 tracking-wide">
          {formatTime(runTime)}
        </div>

        {isNewRecord && (
          <motion.div
            initial={{ scale: 0.8, rotate: -3 }}
            animate={{ scale: [0.8, 1.1, 1.0], rotate: [-3, 3, -2] }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="bg-indigo-100 border border-indigo-200 text-indigo-700 text-[10px] font-bold font-mono px-3 py-1 rounded-full uppercase flex items-center gap-1 mt-1"
          >
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>{t('newRecord')}</span>
          </motion.div>
        )}
      </div>

      <div className="flex flex-col gap-4 max-w-xs mx-auto w-full my-4">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 flex flex-col gap-3.5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-[#64748B]">
            <span>{t('highScore')}</span>
            <span className="text-gray-900">{formatTime(highScore)}</span>
          </div>
          <div className="w-full h-px bg-[#E5E7EB]" />
          <div className="flex items-center justify-between text-xs font-mono font-bold text-[#64748B]">
            <span>{t('coins')} Collected</span>
            <span className="text-amber-500 flex items-center gap-1 font-black">
              +{runCoins} <Coins className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 flex flex-col gap-2.5 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm">📅</span>
            <span className="text-xs font-bold font-mono text-gray-900 uppercase tracking-tight">{t('dailyChallenge')}</span>
          </div>
          <span className="text-[10px] text-[#64748B] font-mono leading-normal font-medium">
            {t('dailyDesc')}
          </span>
          <div className="mt-1">
            {highScore >= 45 ? (
              <button
                onClick={onClaimDaily}
                disabled={isDailyClaimed}
                className={`w-full py-1.5 text-[10px] font-bold font-mono rounded-lg border transition-colors ${isDailyClaimed ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-700 shadow-sm'}`}
              >
                {isDailyClaimed ? 'CLAIMED ✓' : 'CLAIM +50 🪙'}
              </button>
            ) : (
              <div className="w-full py-1.5 bg-[#F7F8FA] border border-[#E5E7EB] text-center text-[10px] font-bold font-mono rounded-lg text-gray-400">
                SURVIVE 45s TO UNLOCK (BEST: {formatTime(highScore)})
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onWatchAd}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 border border-amber-600 text-white rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors text-xs font-bold font-mono tracking-wide uppercase"
        >
          <Tv className="w-4 h-4 shrink-0" />
          <span>{t('rewardedAd')}</span>
        </button>
      </div>

      <div className="flex flex-col gap-2.5 max-w-xs mx-auto w-full">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl flex items-center justify-center gap-2 shadow-md border-2 border-gray-900"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm font-bold font-mono uppercase">{t('retry')}</span>
        </motion.button>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => onNav('characters')}
            className="py-2.5 bg-white border border-[#E5E7EB] text-gray-800 hover:bg-gray-50 text-xs font-bold font-mono rounded-xl shadow-xs uppercase tracking-wide"
          >
            {t('characters')}
          </button>
          <button
            onClick={() => onNav('menu')}
            className="py-2.5 bg-white border border-[#E5E7EB] text-gray-800 hover:bg-gray-50 text-xs font-bold font-mono rounded-xl shadow-xs uppercase tracking-wide"
          >
            {t('home')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
