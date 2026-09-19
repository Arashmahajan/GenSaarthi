import React, { useState, useEffect } from 'react';
import { Calendar, X, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { parseAnyDateToISO, getTodayDateString } from '../../utils/dates';
import { t } from '../../i18n';

interface ConfirmAddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    title?: string;
    dueDate?: string;
    dueTime?: string;
    note?: string;
  };
  onSuccess: (title: string) => void;
}

export const ConfirmAddReminderModal: React.FC<ConfirmAddReminderModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) => {
  const { settings, addReminder } = useApp();
  const lang = settings.language;

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      const parsed = parseAnyDateToISO(initialData?.dueDate);
      setDueDate(parsed || initialData?.dueDate || getTodayDateString());
      setDueTime(initialData?.dueTime || '');
      setNote(initialData?.note || '');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const normalizedDate = parseAnyDateToISO(dueDate) || dueDate.trim();

    addReminder({
      title: title.trim(),
      dueDate: normalizedDate,
      dueTime: dueTime.trim() || undefined,
      note: note.trim() || '',
      isCompleted: false,
    });

    onSuccess(title.trim());
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-reminder-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full p-6 border border-stone-200 dark:border-stone-700 shadow-xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center space-x-3 text-amber-700 dark:text-amber-400">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <h2 id="confirm-reminder-title" className="text-xl font-bold text-stone-900 dark:text-stone-100">
              {t('confirmAddReminderTitle', lang)}
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

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
              {t('remTitleLabel', lang)} *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 text-base"
              placeholder="e.g., Pay Electricity Bill"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
                {t('remDateLabel', lang)} *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
                {t('remTimeLabel', lang)}
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 text-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
              {t('remNoteLabel', lang)}
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 text-base resize-none"
              placeholder="e.g., Amount ₹1,736, pay via electricity portal"
            />
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
              <span>{t('remConfirmButton', lang)}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
