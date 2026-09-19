import React, { useState } from 'react';
import { Pill, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';
import { MedicineReminder } from './MedicineReminder';
import { RemindersManager } from './RemindersManager';

export const RemindersAndMedicines: React.FC = () => {
  const { settings } = useApp();
  const lang = settings.language;
  const [subTab, setSubTab] = useState<'medicines' | 'reminders'>('medicines');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Segmented Tabs */}
      <div className="flex bg-stone-100 dark:bg-stone-800 p-1.5 rounded-2xl border border-stone-200 dark:border-stone-700 max-w-md mx-auto">
        <button
          type="button"
          onClick={() => setSubTab('medicines')}
          className={`flex-1 min-h-[48px] px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all ${
            subTab === 'medicines'
              ? 'bg-white dark:bg-stone-900 text-amber-900 dark:text-amber-300 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <Pill className="w-4 h-4 shrink-0" />
          <span>{t('medicinesTab', lang)}</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('reminders')}
          className={`flex-1 min-h-[48px] px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all ${
            subTab === 'reminders'
              ? 'bg-white dark:bg-stone-900 text-amber-900 dark:text-amber-300 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          <span>{t('remindersTab', lang)}</span>
        </button>
      </div>

      {/* Render selected component */}
      {subTab === 'medicines' ? <MedicineReminder /> : <RemindersManager />}
    </div>
  );
};
