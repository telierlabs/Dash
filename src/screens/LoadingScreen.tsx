import React from 'react';
import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';

interface Props {
  t: (key: string) => string;
  onStart: () => void;
}

export default function LoadingScreen({ t, onStart }: Props) {
  return (
    <motion.div
      key="loading-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 flex flex-col items-center justify-between py-12 px-6 z-40 bg-[#F7F8FA]"
      onClick={onStart}
    >
      <div className="flex flex-col items-center mt-12 gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-10 h-10 text-gray-900 fill-gray-900" />
          <h1 className="text-5xl font-black tracking-tight text-gray-900 select-none font-mono">DASH</h1>
        </div>
        <span className="text-xs tracking-widest text-[#64748B] uppercase font-mono">Endless Animal Runner</span>
      </div>

      <div className="w-32 h-32 flex items-center justify-center bg-white border border-[#E5E7EB] rounded-full shadow-sm relative">
        <motion.div
          animate={{ y: [0, -25, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
          className="text-5xl"
        >
          🐰
        </motion.div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
          className="absolute -bottom-1 -right-1 text-2xl bg-[#F7F8FA] p-1.5 rounded-full border border-[#E5E7EB]"
        >
          🪙
        </motion.div>
      </div>

      <div className="flex flex-col items-center gap-4 w-full px-6">
        <motion.div
          animate={{ opacity: [0.4, 1.0, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          className="text-[#111827] text-md font-bold uppercase tracking-widest font-mono"
        >
          {t('tapToStart')}
        </motion.div>
        <span className="text-[10px] text-[#64748B] font-mono text-center">
          Offline Optimized • 60 FPS Engine
        </span>
      </div>
    </motion.div>
  );
}
