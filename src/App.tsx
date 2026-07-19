/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SoundEngine } from './sound';
import { TRANSLATIONS, CHARACTERS_DATA } from './translations';
import { formatTime, formatDetailedTime } from './utils/format';

import LoadingScreen from './screens/LoadingScreen';
import MenuScreen from './screens/MenuScreen';
import CharactersScreen from './screens/CharactersScreen';
import AchievementsScreen from './screens/AchievementsScreen';
import StatisticsScreen from './screens/StatisticsScreen';
import SettingsScreen from './screens/SettingsScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import PlayingScreen from './screens/PlayingScreen';
import GameOverScreen from './screens/GameOverScreen';

const DEFAULT_SETTINGS = {
  music: true,
  sound: true,
  vibration: true,
  language: 'en' as 'en' | 'es' | 'fr' | 'ja' | 'id' | 'ar'
};

const DEFAULT_STATS = {
  gamesPlayed: 0,
  bestTime: 0,
  totalPlayTime: 0,
  totalCoinsCollected: 0,
  characterPlaycounts: {
    rabbit: 0, dino: 0, fox: 0, panda: 0, penguin: 0
  } as Record<string, number>
};

type Screen = 'loading' | 'menu' | 'characters' | 'statistics' | 'settings' | 'achievements' | 'leaderboard' | 'playing' | 'gameover';

export default function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [highScore, setHighScore] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [unlockedCharacters, setUnlockedCharacters] = useState<string[]>(['rabbit']);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('rabbit');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [completedAchievements, setCompletedAchievements] = useState<string[]>([]);

  const [isPaused, setIsPaused] = useState(false);
  const [runTime, setRunTime] = useState(0);
  const [runCoins, setRunCoins] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [isDailyClaimed, setIsDailyClaimed] = useState(false);

  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);

  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; color: string; scale: number; rotation: number }>>([]);

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
      console.warn('Could not load local storage', e);
    }
  }, []);

  useEffect(() => {
    if (screen === 'playing') {
      SoundEngine.startBGM();
    } else {
      SoundEngine.stopBGM();
    }
  }, [screen]);

  useEffect(() => {
    let playTimer: any;
    if (screen === 'playing' && !isPaused) {
      playTimer = setInterval(() => setRunTime(prev => prev + 0.1), 100);
    }
    return () => clearInterval(playTimer);
  }, [screen, isPaused]);

  const t = (key: string) => {
    const lang = settings.language || 'en';
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  const playClick = () => SoundEngine.playSFX('click');

  const saveToStorage = (key: string, value: any) => {
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch (e) {
      console.warn('Storage sync failed', e);
    }
  };

  const triggerConfetti = () => {
    const colors = ['#88C0D0', '#81A1C1', '#B48EAD', '#A3BE8C', '#EBCB8B', '#D08770'];
    const particles = Array.from({ length: 40 }, (_, i) => ({
      id: Date.now() + i,
      x: 10 + Math.random() * 80,
      y: -10 - Math.random() * 30,
      color: colors[Math.floor(Math.random() * colors.length)],
      scale: 0.5 + Math.random() * 0.8,
      rotation: Math.random() * 360
    }));
    setConfetti(particles);
    setTimeout(() => setConfetti([]), 4000);
  };

  const onCoinCollected = () => setRunCoins(prev => prev + 1);

  const checkAchievements = (currentStats: typeof stats, totalCoins: number) => {
    const unlocked = [...completedAchievements];
    if (currentStats.gamesPlayed >= 1 && !unlocked.includes('first_run')) unlocked.push('first_run');
    if (currentStats.bestTime >= 30 && !unlocked.includes('marathon')) unlocked.push('marathon');
    if (currentStats.bestTime >= 60 && !unlocked.includes('survivor')) unlocked.push('survivor');
    if (totalCoins >= 100 && !unlocked.includes('coin_collector')) unlocked.push('coin_collector');
    if (unlockedCharacters.length >= 2 && !unlocked.includes('unlocker')) unlocked.push('unlocker');

    if (unlocked.length > completedAchievements.length) {
      setCompletedAchievements(unlocked);
      saveToStorage('dash_achievements', unlocked);
    }
  };

  const handleGameOver = (finalTime: number, finalCoins: number) => {
    const survSeconds = Math.round(finalTime * 100) / 100;
    const newCoinsTotal = coins + finalCoins;
    setCoins(newCoinsTotal);
    saveToStorage('dash_coins', newCoinsTotal);

    if (survSeconds > highScore) {
      setHighScore(survSeconds);
      saveToStorage('dash_highscore', survSeconds);
      setIsNewRecord(true);
      triggerConfetti();
    } else {
      setIsNewRecord(false);
    }

    const updatedStats = { ...stats };
    updatedStats.gamesPlayed += 1;
    updatedStats.totalPlayTime += survSeconds;
    updatedStats.totalCoinsCollected += finalCoins;
    updatedStats.characterPlaycounts = updatedStats.characterPlaycounts || { rabbit: 0, dino: 0, fox: 0, panda: 0, penguin: 0 };
    updatedStats.characterPlaycounts[selectedCharacter] = (updatedStats.characterPlaycounts[selectedCharacter] || 0) + 1;

    setStats(updatedStats);
    saveToStorage('dash_stats', updatedStats);
    checkAchievements(updatedStats, newCoinsTotal);
    setScreen('gameover');
  };

  const handleStartGame = () => {
    SoundEngine.init();
    SoundEngine.playSFX('click');
    setRunTime(0);
    setRunCoins(0);
    setIsPaused(false);
    setScreen('playing');
  };

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
      checkAchievements(stats, updatedCoins);
    } else {
      SoundEngine.playSFX('hit');
    }
  };

  const handleSelectCharacter = (id: string) => {
    SoundEngine.playSFX('click');
    setSelectedCharacter(id);
    saveToStorage('dash_selected_char', id);
  };

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

      ['dash_highscore', 'dash_coins', 'dash_unlocked_chars', 'dash_selected_char', 'dash_settings', 'dash_stats', 'dash_achievements', 'dash_daily_claimed']
        .forEach(k => localStorage.removeItem(k));

      SoundEngine.setMute(!DEFAULT_SETTINGS.music, !DEFAULT_SETTINGS.sound);
      setScreen('menu');
    }
  };

  const getFavoriteCharacter = () => {
    const pcounts = stats.characterPlaycounts || {};
    let fav = 'rabbit';
    let max = 0;
    Object.entries(pcounts).forEach(([char, count]) => {
      const numCount = count as number;
      if (numCount > max) { max = numCount; fav = char; }
    });
    return CHARACTERS_DATA.find(c => c.id === fav)?.name || 'Rabbit';
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#F7F8FA] overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        {screen === 'loading' && (
          <LoadingScreen t={t} onStart={() => { SoundEngine.init(); SoundEngine.playSFX('click'); setScreen('menu'); }} />
        )}

        {screen === 'menu' && (
          <MenuScreen
            t={t}
            highScore={highScore}
            coins={coins}
            formatTime={formatTime}
            onPlay={handleStartGame}
            onNav={(s) => { playClick(); setScreen(s); }}
          />
        )}

        {screen === 'characters' && (
          <CharactersScreen
            t={t}
            coins={coins}
            unlockedCharacters={unlockedCharacters}
            selectedCharacter={selectedCharacter}
            onBack={() => { playClick(); setScreen('menu'); }}
            onSelect={handleSelectCharacter}
            onUnlock={handleUnlockCharacter}
          />
        )}

        {screen === 'achievements' && (
          <AchievementsScreen
            t={t}
            completedAchievements={completedAchievements}
            onBack={() => { playClick(); setScreen('menu'); }}
          />
        )}

        {screen === 'statistics' && (
          <StatisticsScreen
            t={t}
            stats={stats}
            highScore={highScore}
            formatTime={formatTime}
            formatDetailedTime={formatDetailedTime}
            favoriteCharacter={getFavoriteCharacter()}
            onBack={() => { playClick(); setScreen('menu'); }}
          />
        )}

        {screen === 'settings' && (
          <SettingsScreen
            t={t}
            settings={settings}
            onToggleMusic={() => {
              const newSettings = { ...settings, music: !settings.music };
              setSettings(newSettings);
              saveToStorage('dash_settings', newSettings);
              SoundEngine.setMute(!newSettings.music, !newSettings.sound);
              SoundEngine.playSFX('click');
            }}
            onToggleSound={() => {
              const newSettings = { ...settings, sound: !settings.sound };
              setSettings(newSettings);
              saveToStorage('dash_settings', newSettings);
              SoundEngine.setMute(!newSettings.music, !newSettings.sound);
              SoundEngine.playSFX('click');
            }}
            onToggleVibration={() => {
              const newSettings = { ...settings, vibration: !settings.vibration };
              setSettings(newSettings);
              saveToStorage('dash_settings', newSettings);
              SoundEngine.playSFX('click');
            }}
            onSetLanguage={(lang) => {
              const newSettings = { ...settings, language: lang };
              setSettings(newSettings);
              saveToStorage('dash_settings', newSettings);
              SoundEngine.playSFX('click');
            }}
            onReset={handleResetProgress}
            onBack={() => { playClick(); setScreen('menu'); }}
          />
        )}

        {screen === 'leaderboard' && (
          <LeaderboardScreen
            t={t}
            highScore={highScore}
            formatTime={formatTime}
            onBack={() => { playClick(); setScreen('menu'); }}
          />
        )}

        {screen === 'playing' && (
          <PlayingScreen
            selectedCharacter={selectedCharacter}
            isPaused={isPaused}
            runTime={runTime}
            runCoins={runCoins}
            vibrationEnabled={settings.vibration}
            formatTime={formatTime}
            onGameOver={handleGameOver}
            onCoinCollected={onCoinCollected}
            onTogglePause={() => setIsPaused(!isPaused)}
            onQuit={() => setScreen('menu')}
          />
        )}

        {screen === 'gameover' && (
          <GameOverScreen
            t={t}
            runTime={runTime}
            runCoins={runCoins}
            highScore={highScore}
            isNewRecord={isNewRecord}
            isDailyClaimed={isDailyClaimed}
            formatTime={formatTime}
            onClaimDaily={claimDailyChallenge}
            onWatchAd={handleWatchAd}
            onRetry={handleStartGame}
            onNav={(s) => { playClick(); setScreen(s); }}
          />
        )}
      </AnimatePresence>

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

      {isWatchingAd && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-6 z-50 p-6 select-none">
          <div className="flex flex-col items-center gap-2">
            <span className="text-white text-sm font-bold font-mono uppercase tracking-widest">{t('watchingAd')}</span>
            <span className="text-xs text-gray-400 font-mono text-center">Sponsor: Dash 2 (Coming Soon)</span>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-white font-mono font-bold text-lg">{adCountdown}</span>
          </div>
        </div>
      )}
    </div>
  );
    }
