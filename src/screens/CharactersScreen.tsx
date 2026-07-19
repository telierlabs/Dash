import React from 'react';
import { ChevronLeft, Coins, Lock, Unlock, Sparkles } from 'lucide-react';
import { CHARACTERS_DATA } from '../translations';

interface Props {
  t: (key: string) => string;
  coins: number;
  unlockedCharacters: string[];
  selectedCharacter: string;
  onBack: () => void;
  onSelect: (id: string) => void;
  onUnlock: (id: string, cost: number) => void;
}

export default function CharactersScreen({ t, coins, unlockedCharacters, selectedCharacter, onBack, onSelect, onUnlock }: Props) {
  return (
    <div className="absolute inset-0 flex flex-col bg-[#F7F8FA] p-6">
      <div className="flex items-center justify-between mb-4 mt-2">
        <button onClick={onBack} className="p-1.5 bg-white border border-[#E5E7EB] rounded-full shadow-sm text-gray-700">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-black font-mono tracking-tight text-gray-900">{t('characters').toUpperCase()}</h3>
        <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] rounded-full px-3 py-1 shadow-sm">
          <Coins className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-xs font-mono font-bold text-gray-900">{coins}</span>
        </div>
      </div>

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
              {isSelected && (
                <span className="absolute top-3 right-3 text-[10px] bg-gray-900 text-white font-bold font-mono px-2 py-0.5 rounded-full uppercase tracking-wide">
                  {t('selected')}
                </span>
              )}

              <div className="flex items-center gap-4">
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

              <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-2 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500 mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold font-mono text-[#64748B] uppercase">{t('trait')}</span>
                  <span className="text-[11px] font-mono font-semibold text-gray-700 leading-tight">
                    {t(char.traitKey)}
                  </span>
                </div>
              </div>

              <div className="w-full">
                {isUnlocked ? (
                  isSelected ? (
                    <div className="w-full py-1.5 bg-[#D8DEE9]/55 text-center text-xs font-bold font-mono rounded-lg border border-[#E5E7EB] text-[#64748B]">
                      SELECTED
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelect(char.id)}
                      className="w-full py-1.5 bg-white border border-gray-900 hover:bg-gray-50 text-gray-900 text-xs font-bold font-mono rounded-lg transition-colors"
                    >
                      {t('select')}
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => onUnlock(char.id, char.cost)}
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
    </div>
  );
}
