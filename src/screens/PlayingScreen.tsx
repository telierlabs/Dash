import React from 'react';
import { Clock, Coins, Pause } from 'lucide-react';
import { SoundEngine } from '../sound';
import GameCanvas from '../components/GameCanvas';

interface Props {
  selectedCharacter: string;
  isPaused: boolean;
  runTime: number;
  runCoins: number;
  vibrationEnabled: boolean;
  formatTime: (s: number) => string;
  onGameOver: (finalTime: number, finalCoins: number) => void;
  onCoinCollected: () => void;
  onTogglePause: () => void;
  onQuit: () => void;
}

export default function PlayingScreen({
  selectedCharacter, isPaused, runTime, runCoins, vibrationEnabled, formatTime,
  onGameOver, onCoinCollected, onTogglePause, onQuit
}: Props) {
  return (
    <div className="absolute inset-0 flex flex-col z-30">
      <div className="absolute inset-0">
        <GameCanvas
          isPlaying={true}
          isPaused={isPaused}
          selectedCharacter={selectedCharacter}
          onGameOver={onGameOver}
          onCoinCollected={onCoinCollected}
          vibrationEnabled={vibrationEnabled}
        />
      </div>

      <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none z-40">
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-[#E5E7EB] rounded-full px-4 py-1.5 shadow-sm pointer-events-auto">
          <Clock className="w-4 h-4 text-gray-800" />
          <span className="text-sm font-mono font-black text-gray-800">{formatTime(runTime)}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md border border-[#E5E7EB] rounded-full px-3 py-1.5 shadow-sm pointer-events-auto">
          <Coins className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-xs font-mono font-black text-gray-800">{runCoins}</span>
        </div>

        <button
          onClick={() => { SoundEngine.playSFX('click'); onTogglePause(); }}
          className="p-2 bg-white/80 backdrop-blur-md border border-[#E5E7EB] rounded-full shadow-sm text-gray-800 hover:bg-white pointer-events-auto transition-colors"
        >
          <Pause className="w-4 h-4 fill-gray-800" />
        </button>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] bg-white/50 backdrop-blur-xs px-3 py-1 rounded-full border border-white/20 select-none text-gray-700 text-center font-mono tracking-wide pointer-events-none">
        TAP to Jump • SWIPE DOWN to Slide
      </div>

      {isPaused && (
        <div className="absolute inset-0 bg-[#F7F8FA]/85 backdrop-blur-xs flex flex-col items-center justify-center gap-6 z-50">
          <h4 className="text-3xl font-black font-mono text-gray-900 uppercase tracking-widest">PAUSED</h4>
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => { SoundEngine.playSFX('click'); onTogglePause(); }}
              className="py-3 px-6 bg-gray-900 hover:bg-gray-800 text-white font-bold font-mono text-xs rounded-xl shadow-md uppercase tracking-wider"
            >
              Resume
            </button>
            <button
              onClick={() => { SoundEngine.playSFX('click'); onQuit(); }}
              className="py-3 px-6 bg-white border border-[#E5E7EB] text-gray-800 hover:bg-gray-50 font-bold font-mono text-xs rounded-xl shadow-xs uppercase tracking-wider"
            >
              Quit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
