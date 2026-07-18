/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Settings as SettingsIcon,
  BarChart2,
  Award,
  Trophy,
  Volume2,
  VolumeX,
  Smartphone,
  RotateCcw,
  Home,
  ChevronLeft,
  Coins,
  Lock,
  Unlock,
  CheckCircle2,
  Pause,
  Clock,
  Sparkles,
  Tv,
  Info,
  Globe
} from 'lucide-react';
import { SoundEngine } from './sound';
import { TRANSLATIONS, ACHIEVEMENTS_DATA, CHARACTERS_DATA } from './translations';
import GameCanvas from './components/GameCanvas';

// Initial Game State schemas
const DEFAULT_SETTINGS = {
  music: true,
  sound: true,
  vibration: true,
  language: 'en' as 'en' | 'es' | 'fr' | 'ja'
};

const DEFAULT_STATS = {
  gamesPlayed: 0,
  bestTime: 0,
  totalPlayTime: 0,
  totalCoinsCollected: 0,
  characterPlaycounts: {
    rabbit: 0,
    dino: 0,
    fox: 0,
    panda: 0,
    penguin: 0
  } as Record<string, number>
};

export default function App() {
  // Screens state: 'loading' | 'menu' | 'characters' | 'statistics' | 'settings' | 'achievements' | 'leaderboard' | 'playing' | 'gameover'
  const [screen, setScreen] = useState<'loading' | 'menu' | 'characters' | 'statistics' | 'settings' | 'achievements' | 'leaderboard' | 'playing' | 'gameover'>('loading');
  
  // Game state
  const [highScore, setHighScore] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [unlockedCharacters, setUnlockedCharacters] = useState<string[]>(['rabbit']);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('rabbit');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [completedAchievements, setCompletedAchievements] = useState<string[]>([]);
  
  // Run states
  const [isPaused, setIsPaused] = useState(false);
  const [runTime, setRunTime] = useState(0);
  const [runCoins, setRunCoins] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [isDailyClaimed, setIsDailyClaimed] = useState(false);

  // Simulated Watch Ad State
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);

  // Confetti particles for epic win/unlock moments
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; color: string; scale: number; rotation: number }>>([]);

  // Mock status bar clock state
  const [currentTimeStr, setCurrentTimeStr] = useState('08:00');

  // Load game saves from LocalStorage on mount
  useEffect(() => {
    try {
      const savedHighScore = localStorage.getItem('dash_highscore');
      const savedCoins = localStorage.getItem('dash_coins');
      const savedUnlocked = localStorage.getItem('dash_unlocked_chars');
      const savedSelected = localStorage.getItem('dash_selected_char');
      const savedSettings = localStorage.getItem('dash_settings');
      const savedStats = localStorage.getItem('dash_stats');
      const savedAchievements = localStorage.getItem('dash_achievements');
      const savedDailyClaimed = localStorage.getItem('dash_daily_claimed');

      if (savedHighScore) setHighScore(parseFloat(savedHighScore));
      if (savedCoins) setCoins(parseInt(savedCoins));
      if (savedUnlocked) setUnlockedCharacters(JSON.parse(savedUnlocked));
      if (savedSelected) setSelectedCharacter(savedSelected);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        SoundEngine.setMute(!parsedSettings.music, !parsedSettings.sound);
      } else {
        SoundEngine.setMute(!DEFAULT_SETTINGS.music, !DEFAULT_SETTINGS.sound);
      }
      if (savedStats) setStats(JSON.parse(savedStats));
      if (savedAchievements) setCompletedAchievements(JSON.parse(savedAchievements));
      if (savedDailyClaimed) setIsDailyClaimed(savedDailyClaimed === 'true');
    } catch (e) {
      console.warn("Could not load local storage", e);
    }
  }, []);

  // Sync background music state with screen changing
  useEffect(() => {
    if (screen === 'playing') {
      SoundEngine.startBGM();
    } else {
      SoundEngine.stopBGM();
    }
  }, [screen]);

  // Dynamic system clock in mockup phone status bar
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      let hrs = date.getHours();
      let mins = date.getMinutes().toString().padStart(2, '0');
      let ampm = hrs >= 12 ? 'PM' : 'AM';
      let hoursMod = hrs % 12 || 12;
      setCurrentTimeStr(`${hoursMod}:${mins} ${ampm}`);
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 60000);
    return () => clearInterval(clockInterval);
  }, []);

  // Update in-run timers during active gameplay
  useEffect(() => {
    let playTimer: any;
    if (screen === 'playing' && !isPaused) {
      playTimer = setInterval(() => {
        setRunTime(prev => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(playTimer);
  }, [screen, isPaused]);

  // Helper localizer
  const t = (key: string) => {
    const lang = settings.language || 'en';
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  // Sound play wrappers with autoplay protection
  const playClick = () => {
    SoundEngine.playSFX('click');
  };

  const saveToStorage = (key: string, value: any) => {
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch (e) {
      console.warn("Storage sync failed", e);
    }
  };

  // Confetti triggering helper
  const triggerConfetti = () => {
    const colors = ['#88C0D0', '#81A1C1', '#B48EAD', '#A3BE8C', '#EBCB8B', '#D08770'];
    const particles = Array.from({ length: 40 }, (_, i) => ({
      id: Date.now() + i,
      x: 10 + Math.random() * 80, // % from left
      y: -10 - Math.random() * 30, // top start offset
      color: colors[Math.floor(Math.random() * colors.length)],
      scale: 0.5 + Math.random() * 0.8,
      rotation: Math.random() * 360
    }));
    setConfetti(particles);
    // Auto-clean confetti after animation
    setTimeout(() => setConfetti([]), 4000);
  };

  // Core gameplay handlers
  const onCoinCollected = () => {
    setRunCoins(prev => prev + 1);
  };

  const handleGameOver = (finalTime: number, finalCoins: number) => {
    // Round time to 2 decimals
    const survSeconds = Math.round(finalTime * 100) / 100;
    
    // Save state variables
    const newCoinsTotal = coins + finalCoins;
    setCoins(newCoinsTotal);
    saveToStorage('dash_coins', newCoinsTotal);

    let isNewBest = false;
    if (survSeconds > highScore) {
      setHighScore(survSeconds);
      saveToStorage('dash_highscore', survSeconds);
      isNewBest = true;
      setIsNewRecord(true);
      triggerConfetti();
    } else {
      setIsNewRecord(false);
    }

    // Update detailed statistics
    const updatedStats = { ...stats };
    updatedStats.gamesPlayed += 1;
    updatedStats.totalPlayTime += survSeconds;
    updatedStats.totalCoinsCollected += finalCoins;
    updatedStats.characterPlaycounts = updatedStats.characterPlaycounts || { rabbit: 0, dino: 0, fox: 0, panda: 0, penguin: 0 };
    updatedStats.characterPlaycounts[selectedCharacter] = (updatedStats.characterPlaycounts[selectedCharacter] || 0) + 1;
    
    setStats(updatedStats);
    saveToStorage('dash_stats', updatedStats);

    // Audit and unlock any newly earned achievements!
    checkAchievements(updatedStats, newCoinsTotal);

    setScreen('gameover');
  };

  const checkAchievements = (currentStats: typeof stats, totalCoins: number) => {
    const unlocked = [...completedAchievements];
    
    if (currentStats.gamesPlayed >= 1 && !unlocked.includes('first_run')) {
      unlocked.push('first_run');
    }
    if (currentStats.bestTime >= 30 && !unlocked.includes('marathon')) {
      unlocked.push('marathon');
    }
    if (currentStats.bestTime >= 60 && !unlocked.includes('survivor')) {
      unlocked.push('survivor');
    }
    if (totalCoins >= 100 && !unlocked.includes('coin_collector')) {
      unlocked.push('coin_collector');
    }
    if (unlockedCharacters.length >= 2 && !unlocked.includes('unlocker')) {
      unlocked.push('unlocker');
    }

    if (unlocked.length > completedAchievements.length) {
      setCompletedAchievements(unlocked);
      saveToStorage('dash_achievements', unlocked);
    }
  };

  const handleStartGame = () => {
    SoundEngine.init();
    SoundEngine.playSFX('click');
    setRunTime(0);
    setRunCoins(0);
    setIsPaused(false);
    setScreen('playing');
  };

  // Unlocking characters
  const handleUnlockCharacter = (id: string, cost: number) => {
    SoundEngine.init();
    if (coins >= cost) {
      const updatedUnlocked = [...unlockedCharacters, id];
      const updatedCoins = coins - cost;
      
      setCoins(updatedCoins);
      setUnlockedCharacters(updatedUnlocked);
      
      saveToStorage('dash_coins', updatedCoins);
      saveToStorage('dash_unlocked_chars', updatedUnlocked);
      
      SoundEngine.playSFX('unlock');
      triggerConfetti();

      // Audit achievements on character unlock count
      const updatedStats = { ...stats };
      checkAchievements(updatedStats, updatedCoins);
    } else {
      // Shaking buzz or negative audio cue
      SoundEngine.playSFX('hit');
    }
  };

  const handleSelectCharacter = (id: string) => {
    SoundEngine.playSFX('click');
    setSelectedCharacter(id);
    saveToStorage('dash_selected_char', id);
  };

  // Rewarded Ad Simulation
  const handleWatchAd = () => {
    SoundEngine.init();
    SoundEngine.playSFX('click');
    setIsWatchingAd(true);
    setAdCountdown(5);

    const timer = setInterval(() => {
      setAdCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsWatchingAd(false);
          const bonusCoins = coins + 50;
          setCoins(bonusCoins);
          saveToStorage('dash_coins', bonusCoins);
          SoundEngine.playSFX('unlock');
          triggerConfetti();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const claimDailyChallenge = () => {
    SoundEngine.init();
    if (highScore >= 45 && !isDailyClaimed) {
      const bonusCoins = coins + 50;
      setCoins(bonusCoins);
      saveToStorage('dash_coins', bonusCoins);
      setIsDailyClaimed(true);
      saveToStorage('dash_daily_claimed', 'true');
      SoundEngine.playSFX('unlock');
      triggerConfetti();
    }
  };

  const handleResetProgress = () => {
    SoundEngine.playSFX('click');
    const confirm = window.confirm(t('resetWarning'));
    if (confirm) {
      setHighScore(0);
      setCoins(0);
      setUnlockedCharacters(['rabbit']);
      setSelectedCharacter('rabbit');
      setSettings(DEFAULT_SETTINGS);
      setStats(DEFAULT_STATS);
      setCompletedAchievements([]);
      setIsDailyClaimed(false);

      localStorage.removeItem('dash_highscore');
      localStorage.removeItem('dash_coins');
      localStorage.removeItem('dash_unlocked_chars');
      localStorage.removeItem('dash_selected_char');
      localStorage.removeItem('dash_settings');
      localStorage.removeItem('dash_stats');
      localStorage.removeItem('dash_achievements');
      localStorage.removeItem('dash_daily_claimed');
      
      SoundEngine.setMute(!DEFAULT_SETTINGS.music, !DEFAULT_SETTINGS.sound);
      setScreen('menu');
    }
  };

  // Utility to format clock displays
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    const ms = Math.floor((secs % 1) * 100).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatDetailedTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Calculated Favorite Character
  const getFavoriteCharacter = () => {
    const pcounts = stats.characterPlaycounts || {};
    let fav = 'rabbit';
    let max = 0;
    Object.entries(pcounts).forEach(([char, count]) => {
      const numCount = count as number;
      if (numCount > max) {
        max = numCount;
        fav = char;
      }
    });
    return CHARACTERS_DATA.find(c => c.id === fav)?.name || 'Rabbit';
  };

  return (
    <div className="min-h-screen w-full bg-[#E5E7EB] flex items-center justify-center font-sans overflow-hidden py-4 sm:py-8 px-4 relative">
      
      {/* Decorative desktop scene elements behind device frame */}
      <div className="absolute top-10 left-10 w-48 h-48 bg-white/40 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-white/30 rounded-full blur-3xl pointer-events-none" />

      {/* 9:16 Mobile Device Frame Mockup wrapper */}
      <div className="aspect-[9/16] w-full max-w-[420px] max-h-[850px] bg-[#F7F8FA] rounded-[36px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] border-8 border-gray-900 overflow-hidden flex flex-col relative">
        
        {/* Mock Status Bar */}
        <div className="w-full h-9 bg-white/70 backdrop-blur-md flex items-center justify-between px-6 select-none z-50 text-[#111827] text-xs font-semibold font-mono">
          <span>{currentTimeStr}</span>
          {/* Dynamic Speaker notch on mockup */}
          <div className="w-20 h-4 bg-gray-900 rounded-b-xl absolute left-1/2 -translate-x-1/2 top-0" />
          <div className="flex items-center gap-1.5">
            {/* Battery Indicator */}
            <div className="flex items-center gap-0.5">
              <span>98%</span>
              <div className="w-5 h-2.5 border border-gray-800 rounded-sm p-0.5 flex items-center">
                <div className="h-full w-4/5 bg-gray-800 rounded-2xs" />
              </div>
            </div>
          </div>
        </div>

        {/* Content viewport spanning beneath mockup top bar */}
        <div className="flex-1 w-full overflow-hidden relative flex flex-col">
          <AnimatePresence mode="wait">
            
            {/* SCREEN: LOADING / TAP TO START */}
            {screen === 'loading' && (
              <motion.div
                key="loading-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col items-center justify-between py-12 px-6 z-40 bg-[#F7F8FA]"
                onClick={() => {
                  SoundEngine.init();
                  SoundEngine.playSFX('click');
                  setScreen('menu');
                }}
              >
                <div className="flex flex-col items-center mt-12 gap-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-10 h-10 text-gray-900 fill-gray-900" />
                    <h1 className="text-5xl font-black tracking-tight text-gray-900 select-none font-mono">DASH</h1>
                  </div>
                  <span className="text-xs tracking-widest text-[#64748B] uppercase font-mono">Endless Animal Runner</span>
                </div>

                {/* Animated vector character previews bouncing in a loop */}
                <div className="w-32 h-32 flex items-center justify-center bg-white border border-[#E5E7EB] rounded-full shadow-sm relative">
                  <motion.div
                    animate={{ y: [0, -25, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
                    className="text-5xl"
                  >
                    🐰
                  </motion.div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="absolute -bottom-1 -right-1 text-2xl bg-[#F7F8FA] p-1.5 rounded-full border border-[#E5E7EB]"
                  >
                    🪙
                  </motion.div>
                </div>

                <div className="flex flex-col items-center gap-4 w-full px-6">
                  <motion.div
                    animate={{ opacity: [0.4, 1.0, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="text-[#111827] text-md font-bold uppercase tracking-widest font-mono"
                  >
                    {t('tapToStart')}
                  </motion.div>
                  
                  {/* Miniature Developer Credit Line hidden inside simple, tidy styling */}
                  <span className="text-[10px] text-[#64748B] font-mono text-center">
                    Offline Optimized • 60 FPS Engine
                  </span>
                </div>
              </motion.div>
            )}

            {/* SCREEN: MAIN MENU */}
            {screen === 'menu' && (
              <motion.div
                key="menu-screen"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="absolute inset-0 flex flex-col justify-between py-8 px-6 bg-[#F7F8FA]"
              >
                {/* Header Profile Info bar */}
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

                {/* Main Logo Graphic */}
                <div className="flex flex-col items-center my-6">
                  <h2 className="text-6xl font-black tracking-tighter text-gray-900 font-mono">DASH</h2>
                  <span className="text-[11px] uppercase tracking-widest text-gray-500 mt-1 font-mono font-semibold">Survive and Slay</span>
                </div>

                {/* Navigation menu cards list */}
                <div className="flex-1 flex flex-col justify-center gap-3.5 max-w-xs mx-auto w-full">
                  
                  {/* PLAY BUTTON (Accent and pulsing animation) */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartGame}
                    className="w-full py-4 bg-[#111827] hover:bg-gray-800 text-white rounded-2xl flex items-center justify-center gap-3 shadow-md border-2 border-gray-900 group"
                  >
                    <Play className="w-6 h-6 fill-white text-white group-hover:scale-110 transition-transform" />
                    <span className="text-xl font-bold font-mono tracking-wide uppercase">{t('play')}</span>
                  </motion.button>

                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { playClick(); setScreen('characters'); }}
                      className="py-3 bg-white border border-[#E5E7EB] rounded-xl flex flex-col items-center gap-1 shadow-sm text-gray-800"
                    >
                      <span className="text-2xl">🦁</span>
                      <span className="text-xs font-bold font-mono uppercase">{t('characters')}</span>
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { playClick(); setScreen('achievements'); }}
                      className="py-3 bg-white border border-[#E5E7EB] rounded-xl flex flex-col items-center gap-1 shadow-sm text-gray-800"
                    >
                      <Award className="w-6 h-6 text-indigo-500" />
                      <span className="text-xs font-bold font-mono uppercase">{t('achievements')}</span>
                    </motion.button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { playClick(); setScreen('statistics'); }}
                      className="py-3 bg-white border border-[#E5E7EB] rounded-xl flex flex-col items-center gap-1 shadow-sm text-gray-800"
                    >
                      <BarChart2 className="w-6 h-6 text-[#111827]" />
                      <span className="text-xs font-bold font-mono uppercase">{t('statistics')}</span>
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { playClick(); setScreen('leaderboard'); }}
                      className="py-3 bg-white border border-[#E5E7EB] rounded-xl flex flex-col items-center gap-1 shadow-sm text-gray-800"
                    >
                      <Trophy className="w-6 h-6 text-amber-500" />
                      <span className="text-xs font-bold font-mono uppercase">{t('leaderboard')}</span>
                    </motion.button>
                  </div>

                  {/* Settings Icon strip */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { playClick(); setScreen('settings'); }}
                    className="w-full py-2.5 bg-white border border-[#E5E7EB] rounded-xl flex items-center justify-center gap-2 shadow-sm text-gray-700"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    <span className="text-xs font-bold font-mono uppercase">{t('settings')}</span>
                  </motion.button>

                </div>

                {/* Tiny bottom decor banner */}
                <div className="w-full flex justify-center text-[10px] text-[#64748B] font-mono mt-2">
                  v1.2.0 • Android Responsive Design
                </div>
              </motion.div>
            )}

            {/* SCREEN: CHARACTER SELECTION */}
            {screen === 'characters' && (
              <motion.div
                key="characters-screen"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="absolute inset-0 flex flex-col bg-[#F7F8FA] p-6"
              >
                {/* Custom Page Header */}
                <div className="flex items-center justify-between mb-4 mt-2">
                  <button
                    onClick={() => { playClick(); setScreen('menu'); }}
                    className="p-1.5 bg-white border border-[#E5E7EB] rounded-full shadow-sm text-gray-700"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-black font-mono tracking-tight text-gray-900">{t('characters').toUpperCase()}</h3>
                  <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] rounded-full px-3 py-1 shadow-sm">
                    <Coins className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-mono font-bold text-gray-900">{coins}</span>
                  </div>
                </div>

                {/* Character Scrollable Showcase cards */}
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 scrollbar-thin">
                  {CHARACTERS_DATA.map(char => {
                    const isUnlocked = unlockedCharacters.includes(char.id);
                    const isSelected = selectedCharacter === char.id;
                    const emoji = char.id === 'rabbit' ? '🐰' : char.id === 'dino' ? '🦖' : char.id === 'fox' ? '🦊' : char.id === 'panda' ? '🐼' : '🐧';

                    return (
                      <div
                        key={char.id}
                        className={`p-4 bg-white border rounded-2xl flex flex-col gap-3 relative shadow-sm transition-all duration-300 ${isSelected ? 'border-2 border-gray-900' : 'border-[#E5E7EB]'}`}
                      >
                        {/* Selected badge overlay */}
                        {isSelected && (
                          <span className="absolute top-3 right-3 text-[10px] bg-gray-900 text-white font-bold font-mono px-2 py-0.5 rounded-full uppercase tracking-wide">
                            {t('selected')}
                          </span>
                        )}

                        <div className="flex items-center gap-4">
                          {/* Large visual preview container */}
                          <div
                            className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl shadow-inner"
                            style={{ backgroundColor: `${char.color}30` }}
                          >
                            <span className={isUnlocked ? '' : 'blur-xs'}>{emoji}</span>
                          </div>

                          <div className="flex-1 flex flex-col">
                            <span className="text-base font-bold font-mono text-gray-900 flex items-center gap-2">
                              {char.name}
                              {!isUnlocked && <Lock className="w-3.5 h-3.5 text-[#64748B]" />}
                            </span>
                            <span className="text-xs text-gray-500 font-mono mt-0.5 leading-relaxed">
                              {t(char.descKey)}
                            </span>
                          </div>
                        </div>

                        {/* Trait breakdown */}
                        <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-2 flex items-start gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-yellow-500 mt-0.5 shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold font-mono text-[#64748B] uppercase">{t('trait')}</span>
                            <span className="text-[11px] font-mono font-semibold text-gray-700 leading-tight">
                              {t(char.traitKey)}
                            </span>
                          </div>
                        </div>

                        {/* Action select/unlock buttons */}
                        <div className="w-full">
                          {isUnlocked ? (
                            isSelected ? (
                              <div className="w-full py-1.5 bg-[#D8DEE9]/55 text-center text-xs font-bold font-mono rounded-lg border border-[#E5E7EB] text-[#64748B]">
                                SELECTED
                              </div>
                            ) : (
                              <button
                                onClick={() => handleSelectCharacter(char.id)}
                                className="w-full py-1.5 bg-white border border-gray-900 hover:bg-gray-50 text-gray-900 text-xs font-bold font-mono rounded-lg transition-colors"
                              >
                                {t('select')}
                              </button>
                            )
                          ) : (
                            <button
                              onClick={() => handleUnlockCharacter(char.id, char.cost)}
                              disabled={coins < char.cost}
                              className={`w-full py-2 text-xs font-bold font-mono rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm ${coins >= char.cost ? 'bg-amber-500 hover:bg-amber-600 text-white border border-amber-600' : 'bg-gray-100 text-[#64748B] border border-gray-200 cursor-not-allowed'}`}
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>{t('unlock').toUpperCase()} ({char.cost} 🪙)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* SCREEN: ACHIEVEMENTS */}
            {screen === 'achievements' && (
              <motion.div
                key="achievements-screen"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="absolute inset-0 flex flex-col bg-[#F7F8FA] p-6"
              >
                <div className="flex items-center justify-between mb-4 mt-2">
                  <button
                    onClick={() => { playClick(); setScreen('menu'); }}
                    className="p-1.5 bg-white border border-[#E5E7EB] rounded-full shadow-sm text-gray-700"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-black font-mono tracking-tight text-gray-900">{t('achievements').toUpperCase()}</h3>
                  <div className="w-8" />
                </div>

                {/* Achievements List */}
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
                  {ACHIEVEMENTS_DATA.map(ach => {
                    const isCompleted = completedAchievements.includes(ach.id);
                    
                    return (
                      <div
                        key={ach.id}
                        className={`p-3.5 bg-white border rounded-xl flex items-start gap-3.5 shadow-sm transition-all ${isCompleted ? 'border-2 border-indigo-400' : 'border-[#E5E7EB]'}`}
                      >
                        <div className="text-3xl bg-[#F7F8FA] border border-[#E5E7EB] p-2.5 rounded-xl">
                          {isCompleted ? ach.icon : '🔒'}
                        </div>
                        <div className="flex-1 flex flex-col">
                          <span className="text-sm font-bold font-mono text-gray-900 flex items-center justify-between">
                            {ach.nameEn}
                            {isCompleted && <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />}
                          </span>
                          <span className="text-xs text-[#64748B] font-mono mt-0.5 leading-normal">
                            {ach.descEn}
                          </span>
                          
                          {/* Mini Progress tracker */}
                          <div className="w-full bg-[#F7F8FA] h-2 rounded-full mt-2 overflow-hidden border border-[#E5E7EB]">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-indigo-500' : 'bg-gray-300'}`}
                              style={{ width: isCompleted ? '100%' : '0%' }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* SCREEN: STATISTICS */}
            {screen === 'statistics' && (
              <motion.div
                key="stats-screen"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="absolute inset-0 flex flex-col bg-[#F7F8FA] p-6"
              >
                <div className="flex items-center justify-between mb-4 mt-2">
                  <button
                    onClick={() => { playClick(); setScreen('menu'); }}
                    className="p-1.5 bg-white border border-[#E5E7EB] rounded-full shadow-sm text-gray-700"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-black font-mono tracking-tight text-gray-900">{t('statistics').toUpperCase()}</h3>
                  <div className="w-8" />
                </div>

                {/* Grid cards of local stats */}
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
                      <span className="text-2xl font-black font-mono mt-1 text-gray-900">{getFavoriteCharacter()}</span>
                    </div>
                    <span className="text-3xl bg-[#F7F8FA] p-2.5 rounded-xl">❤️</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SCREEN: SETTINGS */}
            {screen === 'settings' && (
              <motion.div
                key="settings-screen"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="absolute inset-0 flex flex-col bg-[#F7F8FA] p-6"
              >
                <div className="flex items-center justify-between mb-4 mt-2">
                  <button
                    onClick={() => { playClick(); setScreen('menu'); }}
                    className="p-1.5 bg-white border border-[#E5E7EB] rounded-full shadow-sm text-gray-700"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-black font-mono tracking-tight text-gray-900">{t('settings').toUpperCase()}</h3>
                  <div className="w-8" />
                </div>

                {/* Settings Toggle list */}
                <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                  {/* Music Toggle */}
                  <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      {settings.music ? <Volume2 className="w-5 h-5 text-gray-800" /> : <VolumeX className="w-5 h-5 text-[#64748B]" />}
                      <span className="text-sm font-bold font-mono text-gray-800">{t('music')}</span>
                    </div>
                    <button
                      onClick={() => {
                        const newSettings = { ...settings, music: !settings.music };
                        setSettings(newSettings);
                        saveToStorage('dash_settings', newSettings);
                        SoundEngine.setMute(!newSettings.music, !newSettings.sound);
                        SoundEngine.playSFX('click');
                      }}
                      className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors ${settings.music ? 'bg-gray-900 justify-end' : 'bg-gray-300 justify-start'}`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-md" />
                    </button>
                  </div>

                  {/* Sound Toggle */}
                  <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-5 h-5 text-gray-800" />
                      <span className="text-sm font-bold font-mono text-gray-800">{t('soundFX')}</span>
                    </div>
                    <button
                      onClick={() => {
                        const newSettings = { ...settings, sound: !settings.sound };
                        setSettings(newSettings);
                        saveToStorage('dash_settings', newSettings);
                        SoundEngine.setMute(!newSettings.music, !newSettings.sound);
                        SoundEngine.playSFX('click');
                      }}
                      className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors ${settings.sound ? 'bg-gray-900 justify-end' : 'bg-gray-300 justify-start'}`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-md" />
                    </button>
                  </div>

                  {/* Screen Shake (Vibration) Toggle */}
                  <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gray-800" />
                      <span className="text-sm font-bold font-mono text-gray-800">{t('vibration')}</span>
                    </div>
                    <button
                      onClick={() => {
                        const newSettings = { ...settings, vibration: !settings.vibration };
                        setSettings(newSettings);
                        saveToStorage('dash_settings', newSettings);
                        SoundEngine.playSFX('click');
                      }}
                      className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors ${settings.vibration ? 'bg-gray-900 justify-end' : 'bg-gray-300 justify-start'}`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-md" />
                    </button>
                  </div>

                  {/* Language Selector */}
                  <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl flex flex-col gap-2.5 shadow-sm">
                    <div className="flex items-center gap-3 text-gray-800">
                      <Globe className="w-5 h-5" />
                      <span className="text-sm font-bold font-mono">{t('language')}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {['en', 'es', 'fr', 'ja'].map(lang => (
                        <button
                          key={lang}
                          onClick={() => {
                            const newSettings = { ...settings, language: lang as any };
                            setSettings(newSettings);
                            saveToStorage('dash_settings', newSettings);
                            SoundEngine.playSFX('click');
                          }}
                          className={`py-2 text-xs font-bold font-mono rounded-lg border transition-colors ${settings.language === lang ? 'bg-gray-900 border-gray-900 text-white shadow-sm' : 'bg-[#F7F8FA] border-[#E5E7EB] text-[#64748B] hover:bg-gray-100'}`}
                        >
                          {lang === 'en' ? 'English' : lang === 'es' ? 'Español' : lang === 'fr' ? 'Français' : '日本語'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reset Game button */}
                  <button
                    onClick={handleResetProgress}
                    className="w-full py-3.5 mt-4 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold font-mono tracking-wide uppercase transition-colors shadow-2xs"
                  >
                    {t('resetProgress')}
                  </button>
                </div>
              </motion.div>
            )}

            {/* SCREEN: MOCK WORLD LEADERBOARD */}
            {screen === 'leaderboard' && (
              <motion.div
                key="leaderboard-screen"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="absolute inset-0 flex flex-col bg-[#F7F8FA] p-6"
              >
                <div className="flex items-center justify-between mb-4 mt-2">
                  <button
                    onClick={() => { playClick(); setScreen('menu'); }}
                    className="p-1.5 bg-white border border-[#E5E7EB] rounded-full shadow-sm text-gray-700"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-black font-mono tracking-tight text-gray-900">{t('leaderboard').toUpperCase()}</h3>
                  <div className="w-8" />
                </div>

                <span className="text-[10px] text-gray-500 font-mono text-center mb-3.5 uppercase tracking-wide">
                  {t('onlineLeaderboard')}
                </span>

                {/* Simulated Leaderboard entries listing */}
                <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
                  {[
                    { rank: 1, name: 'DinoDasher_99', time: 145.2, animal: '🦖' },
                    { rank: 2, name: 'SpeedyRabbit', time: 92.5, animal: '🐰' },
                    { rank: 3, name: 'PandaExpress', time: 78.4, animal: '🐼' },
                    // In-game dynamic injection of user's personal highscore!
                    { rank: 4, name: 'YOU', time: highScore, animal: '🐰', isUser: true },
                    { rank: 5, name: 'SuperFox', time: 48.1, animal: '🦊' },
                    { rank: 6, name: 'KingPenguin', time: 32.0, animal: '🐧' }
                  ]
                    .sort((a, b) => b.time - a.time)
                    .map((entry, idx) => (
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
              </motion.div>
            )}

            {/* SCREEN: GAMEPLAY ACTIVE VIEW */}
            {screen === 'playing' && (
              <motion.div
                key="playing-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col z-30"
              >
                {/* Embedded Canvas Engine */}
                <div className="absolute inset-0">
                  <GameCanvas
                    isPlaying={screen === 'playing'}
                    isPaused={isPaused}
                    selectedCharacter={selectedCharacter}
                    onGameOver={handleGameOver}
                    onCoinCollected={onCoinCollected}
                    vibrationEnabled={settings.vibration}
                  />
                </div>

                {/* Floating Game HUD overlays */}
                <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none z-40">
                  {/* Left Side: Survival Timer */}
                  <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-[#E5E7EB] rounded-full px-4 py-1.5 shadow-sm pointer-events-auto">
                    <Clock className="w-4 h-4 text-gray-800" />
                    <span className="text-sm font-mono font-black text-gray-800">{formatTime(runTime)}</span>
                  </div>

                  {/* Middle notch placeholder / coin indicator */}
                  <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md border border-[#E5E7EB] rounded-full px-3 py-1.5 shadow-sm pointer-events-auto">
                    <Coins className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-mono font-black text-gray-800">{runCoins}</span>
                  </div>

                  {/* Right Side: Pause controls */}
                  <button
                    onClick={() => { SoundEngine.playSFX('click'); setIsPaused(!isPaused); }}
                    className="p-2 bg-white/80 backdrop-blur-md border border-[#E5E7EB] rounded-full shadow-sm text-gray-800 hover:bg-white pointer-events-auto transition-colors"
                  >
                    <Pause className="w-4 h-4 fill-gray-800" />
                  </button>
                </div>

                {/* Swipe Guidance Helper overlaid quietly on bottom area of screen */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] bg-white/50 backdrop-blur-xs px-3 py-1 rounded-full border border-white/20 select-none text-gray-700 text-center font-mono tracking-wide pointer-events-none">
                  TAP to Jump • SWIPE DOWN to Slide
                </div>

                {/* PAUSED BANNER OVERLAY */}
                {isPaused && (
                  <div className="absolute inset-0 bg-[#F7F8FA]/85 backdrop-blur-xs flex flex-col items-center justify-center gap-6 z-50">
                    <h4 className="text-3xl font-black font-mono text-gray-900 uppercase tracking-widest">PAUSED</h4>
                    
                    <div className="flex items-center gap-3.5">
                      <button
                        onClick={() => { SoundEngine.playSFX('click'); setIsPaused(false); }}
                        className="py-3 px-6 bg-gray-900 hover:bg-gray-800 text-white font-bold font-mono text-xs rounded-xl shadow-md uppercase tracking-wider"
                      >
                        Resume
                      </button>
                      <button
                        onClick={() => { SoundEngine.playSFX('click'); setScreen('menu'); }}
                        className="py-3 px-6 bg-white border border-[#E5E7EB] text-gray-800 hover:bg-gray-50 font-bold font-mono text-xs rounded-xl shadow-xs uppercase tracking-wider"
                      >
                        Quit
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* SCREEN: GAME OVER */}
            {screen === 'gameover' && (
              <motion.div
                key="gameover-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col justify-between py-8 px-6 bg-[#F7F8FA]"
              >
                {/* Header record details */}
                <div className="flex flex-col items-center mt-6 gap-1">
                  <span className="text-xs tracking-widest text-[#64748B] uppercase font-mono">{t('gameOver')}</span>
                  <h3 className="text-4xl font-black tracking-tight text-gray-900 font-mono uppercase">{t('youSurvived')}</h3>
                  
                  {/* Epic timer result banner */}
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

                {/* Score parameters cards and reward options */}
                <div className="flex flex-col gap-4 max-w-xs mx-auto w-full my-4">
                  {/* Stats list overview */}
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

                  {/* BONUS: Daily Challenge module */}
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
                          onClick={claimDailyChallenge}
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

                  {/* BONUS: Rewarded Ad helper */}
                  <button
                    onClick={handleWatchAd}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 border border-amber-600 text-white rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors text-xs font-bold font-mono tracking-wide uppercase"
                  >
                    <Tv className="w-4 h-4 shrink-0" />
                    <span>{t('rewardedAd')}</span>
                  </button>
                </div>

                {/* Primary navigation retry buttons */}
                <div className="flex flex-col gap-2.5 max-w-xs mx-auto w-full">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartGame}
                    className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl flex items-center justify-center gap-2 shadow-md border-2 border-gray-900"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-sm font-bold font-mono uppercase">{t('retry')}</span>
                  </motion.button>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => { playClick(); setScreen('characters'); }}
                      className="py-2.5 bg-white border border-[#E5E7EB] text-gray-800 hover:bg-gray-50 text-xs font-bold font-mono rounded-xl shadow-xs uppercase tracking-wide"
                    >
                      {t('characters')}
                    </button>
                    <button
                      onClick={() => { playClick(); setScreen('menu'); }}
                      className="py-2.5 bg-white border border-[#E5E7EB] text-gray-800 hover:bg-gray-50 text-xs font-bold font-mono rounded-xl shadow-xs uppercase tracking-wide"
                    >
                      {t('home')}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Confetti Explosion Canvas Overlay */}
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {confetti.map(p => (
            <motion.div
              key={p.id}
              initial={{ x: `${p.x}%`, y: p.y, rotate: 0, opacity: 1 }}
              animate={{
                y: ['-10%', '110%'],
                x: [`${p.x}%`, `${p.x + (Math.random() - 0.5) * 20}%`],
                rotate: [0, p.rotation + 360],
                opacity: [1, 1, 0]
              }}
              transition={{ duration: 2.5 + Math.random() * 1.5, ease: 'linear' }}
              className="absolute text-xl"
              style={{ scale: p.scale }}
            >
              🎉
            </motion.div>
          ))}
        </div>

        {/* Simulated watch-ad visual clip block */}
        {isWatchingAd && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-6 z-50 p-6 select-none">
            <Tv className="w-16 h-16 text-amber-500 animate-bounce" />
            <div className="flex flex-col items-center gap-2">
              <span className="text-white text-sm font-bold font-mono uppercase tracking-widest">{t('watchingAd')}</span>
              <span className="text-xs text-gray-400 font-mono text-center">Sponsor: Dash 2 (Coming Soon)</span>
            </div>
            {/* Ad Countdown timer circle */}
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white font-mono font-bold text-lg">{adCountdown}</span>
            </div>
          </div>
        )}

        {/* Mock Phone Navigation Gestures Bottom Rail Bar */}
        <div className="w-full h-5 bg-white/70 backdrop-blur-md flex items-center justify-center select-none z-50 text-[#111827]">
          {/* Gesture pill */}
          <div className="w-32 h-1.5 bg-gray-900 rounded-full" />
        </div>

      </div>
    </div>
  );
}
