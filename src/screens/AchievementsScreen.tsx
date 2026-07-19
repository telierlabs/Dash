import React from 'react';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import { ACHIEVEMENTS_DATA } from '../translations';

interface Props {
  t: (key: string) => string;
  completedAchievements: string[];
  onBack: () => void;
}

export default function AchievementsScreen({ t, completedAchievements, onBack }: Props) {
  return (
    <div className="absolute inset-0 flex flex-col bg-[#F7F8FA] p-6">
      <div className="flex items-center justify-between mb-4 mt-2">
        <button onClick={onBack} className="p-1.5 bg-white border border-[#E5E7EB] rounded-full shadow-sm text-gray-700">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-black font-mono tracking-tight text-gray-900">{t('achievements').toUpperCase()}</h3>
        <div className="w-8" />
      </div>

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
    </div>
  );
}
