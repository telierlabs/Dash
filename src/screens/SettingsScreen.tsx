import React from 'react';
import { ChevronLeft, Volume2, VolumeX, Smartphone, Globe } from 'lucide-react';

interface Settings {
  music: boolean;
  sound: boolean;
  vibration: boolean;
  language: 'en' | 'es' | 'fr' | 'ja';
}

interface Props {
  t: (key: string) => string;
  settings: Settings;
  onToggleMusic: () => void;
  onToggleSound: () => void;
  onToggleVibration: () => void;
  onSetLanguage: (lang: 'en' | 'es' | 'fr' | 'ja') => void;
  onReset: () => void;
  onBack: () => void;
}

export default function SettingsScreen({ t, settings, onToggleMusic, onToggleSound, onToggleVibration, onSetLanguage, onReset, onBack }: Props) {
  return (
    <div className="absolute inset-0 flex flex-col bg-[#F7F8FA] p-6">
      <div className="flex items-center justify-between mb-4 mt-2">
        <button onClick={onBack} className="p-1.5 bg-white border border-[#E5E7EB] rounded-full shadow-sm text-gray-700">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-black font-mono tracking-tight text-gray-900">{t('settings').toUpperCase()}</h3>
        <div className="w-8" />
      </div>

      <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
        <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            {settings.music ? <Volume2 className="w-5 h-5 text-gray-800" /> : <VolumeX className="w-5 h-5 text-[#64748B]" />}
            <span className="text-sm font-bold font-mono text-gray-800">{t('music')}</span>
          </div>
          <button
            onClick={onToggleMusic}
            className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors ${settings.music ? 'bg-gray-900 justify-end' : 'bg-gray-300 justify-start'}`}
          >
            <div className="w-4 h-4 bg-white rounded-full shadow-md" />
          </button>
        </div>

        <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-gray-800" />
            <span className="text-sm font-bold font-mono text-gray-800">{t('soundFX')}</span>
          </div>
          <button
            onClick={onToggleSound}
            className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors ${settings.sound ? 'bg-gray-900 justify-end' : 'bg-gray-300 justify-start'}`}
          >
            <div className="w-4 h-4 bg-white rounded-full shadow-md" />
          </button>
        </div>

        <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-gray-800" />
            <span className="text-sm font-bold font-mono text-gray-800">{t('vibration')}</span>
          </div>
          <button
            onClick={onToggleVibration}
            className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors ${settings.vibration ? 'bg-gray-900 justify-end' : 'bg-gray-300 justify-start'}`}
          >
            <div className="w-4 h-4 bg-white rounded-full shadow-md" />
          </button>
        </div>

        <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl flex flex-col gap-2.5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-800">
            <Globe className="w-5 h-5" />
            <span className="text-sm font-bold font-mono">{t('language')}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {(['en', 'es', 'fr', 'ja'] as const).map(lang => (
              <button
                key={lang}
                onClick={() => onSetLanguage(lang)}
                className={`py-2 text-xs font-bold font-mono rounded-lg border transition-colors ${settings.language === lang ? 'bg-gray-900 border-gray-900 text-white shadow-sm' : 'bg-[#F7F8FA] border-[#E5E7EB] text-[#64748B] hover:bg-gray-100'}`}
              >
                {lang === 'en' ? 'English' : lang === 'es' ? 'Español' : lang === 'fr' ? 'Français' : '日本語'}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onReset}
          className="w-full py-3.5 mt-4 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold font-mono tracking-wide uppercase transition-colors shadow-2xs"
        >
          {t('resetProgress')}
        </button>
      </div>
    </div>
  );
}
