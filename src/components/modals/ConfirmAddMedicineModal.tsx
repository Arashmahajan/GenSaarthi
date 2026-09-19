import React, { useState } from 'react';
import { Pill, AlertCircle, X, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DoseSlot, FoodTiming } from '../../types';
import { t } from '../../i18n';

interface ConfirmAddMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    name?: string;
    dosage?: string;
    timing?: DoseSlot;
    timeLabel?: string;
    withFood?: FoodTiming;
    purpose?: string;
  };
  onSuccess: (medName: string) => void;
}

export const ConfirmAddMedicineModal: React.FC<ConfirmAddMedicineModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) => {
  const { settings, addMedicine } = useApp();
  const lang = settings.language;

  const [name, setName] = useState(initialData?.name || '');
  const [dosage, setDosage] = useState(initialData?.dosage || '1 Tablet');
  const [timing, setTiming] = useState<DoseSlot>(initialData?.timing || 'morning');
  const [timeLabel, setTimeLabel] = useState(initialData?.timeLabel || '');
  const [withFood, setWithFood] = useState<FoodTiming>(initialData?.withFood || 'after_food');
  const [pillsCount, setPillsCount] = useState<string>('');
  const [purpose, setPurpose] = useState(initialData?.purpose || '');

  // Reset form whenever initialData changes upon open
  React.useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setDosage(initialData?.dosage || '1 Tablet');
      setTiming(initialData?.timing || 'morning');
      setTimeLabel(initialData?.timeLabel || '');
      setWithFood(initialData?.withFood || 'after_food');
      setPillsCount('');
      setPurpose(initialData?.purpose || '');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedCount = pillsCount.trim() !== '' ? parseInt(pillsCount.trim(), 10) : null;
    const finalPills = parsedCount !== null && !isNaN(parsedCount) && parsedCount >= 0 ? parsedCount : null;

    const slotLabels: Record<DoseSlot, string> = {
      morning: 'Morning (08:30 AM)',
      afternoon: 'Afternoon (01:30 PM)',
      evening: 'Evening (06:30 PM)',
      night: 'Bedtime (09:30 PM)',
    };

    addMedicine({
      name: name.trim(),
      dosage: dosage.trim() || '1 Tablet',
      timing,
      timeLabel: timeLabel.trim() || slotLabels[timing],
      withFood,
      purpose: purpose.trim() || '',
      remainingPills: finalPills,
      initialPills: finalPills,
      pillIconType: 'tablet',
      colorBadge: 'bg-amber-100 text-amber-900 border-amber-300',
    });

    onSuccess(name.trim());
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-medicine-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-lg w-full p-6 border border-stone-200 dark:border-stone-700 shadow-xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center space-x-3 text-amber-700 dark:text-amber-400">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center">
              <Pill className="w-6 h-6" />
            </div>
            <h2 id="confirm-medicine-title" className="text-xl font-bold text-stone-900 dark:text-stone-100">
              {t('confirmAddMedicineTitle', lang)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label={t('close', lang)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mandatory Doctor Advice Prominent Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-xl p-3.5 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-800 dark:text-amber-300 shrink-0 mt-0.5" />
          <p className="text-stone-800 dark:text-amber-100 font-semibold text-sm leading-snug">
            {t('confirmMedicineNote', lang)}
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
              {t('medNameLabel', lang)} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 text-base"
              placeholder="e.g., Telma 40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
                {t('medDosageLabel', lang)}
              </label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 text-base"
                placeholder="e.g., 1 tablet"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
                {t('medTimingLabel', lang)}
              </label>
              <select
                value={timing}
                onChange={(e) => setTiming(e.target.value as DoseSlot)}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 text-base"
              >
                <option value="morning">Morning (सुबह)</option>
                <option value="afternoon">Afternoon (दोपहर)</option>
                <option value="evening">Evening (शाम)</option>
                <option value="night">Night / Bedtime (रात)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
                {t('medFoodLabel', lang)}
              </label>
              <select
                value={withFood}
                onChange={(e) => setWithFood(e.target.value as FoodTiming)}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 text-base"
              >
                <option value="after_food">{t('medFoodAfter', lang)}</option>
                <option value="before_food">{t('medFoodBefore', lang)}</option>
                <option value="with_food">{t('medFoodWith', lang)}</option>
                <option value="anytime">{t('medFoodAnytime', lang)}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
                {t('medExactTimeLabel', lang)}
              </label>
              <input
                type="text"
                value={timeLabel}
                onChange={(e) => setTimeLabel(e.target.value)}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 text-base"
                placeholder="e.g., 08:30 AM"
              />
            </div>
          </div>

          {/* Optional Pills Count Field */}
          <div>
            <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
              {t('medPillsLabel', lang)}
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={pillsCount}
              onChange={(e) => setPillsCount(e.target.value)}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 text-base"
              placeholder="Leave empty if not tracking pill counts"
            />
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
              {t('medPillsHelp', lang)}
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] px-5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium text-base transition-colors"
            >
              {t('cancel', lang)}
            </button>
            <button
              type="submit"
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-base transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 inline-flex items-center space-x-2"
            >
              <Check className="w-5 h-5" />
              <span>{t('medConfirmButton', lang)}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
