export interface GameSettings {
  music: boolean;
  sound: boolean;
  vibration: boolean;
  language: 'en' | 'es' | 'fr' | 'ja' | 'id' | 'ar';
}

export interface GameStats {
  gamesPlayed: number;
  bestTime: number; // in seconds
  totalPlayTime: number; // in seconds
  totalCoinsCollected: number;
  characterPlaycounts: Record<string, number>;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  isUnlocked: boolean;
  icon: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  trait: string;
  cost: number;
  color: string;
}

export interface GameState {
  highScore: number;
  coins: number;
  unlockedCharacters: string[];
  selectedCharacter: string;
  settings: GameSettings;
  stats: GameStats;
  achievements: string[];
}
