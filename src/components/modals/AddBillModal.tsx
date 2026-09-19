import React, { useState } from 'react';
import { Receipt, X, Check, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { parseAmountValue, formatRupee } from '../../lib/money';
import { parseAnyDateToISO, getTodayDateString } from '../../utils/dates';
import { t } from '../../i18n';

interface AddBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (title: string) => void;
}

export const AddBillModal: React.FC<AddBillModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { settings, addReminder } = useApp();
  const lang = settings.language;

  const [title, setTitle] = useState('');
  const [amountText, setAmountText] = useState('');
  const [dueDate, setDueDate] = useState(getTodayDateString());
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError(
        lang === 'hi'
          ? 'कृपया बिल का नाम लिखें (जैसे बिजली बिल)।'
          : 'Please enter a bill title (e.g. Electricity bill).'
      );
      return;
    }

    const cleanAmount = amountText.trim();
    const parsedValue = parseAmountValue(cleanAmount);

    if (parsedValue !== null && parsedValue < 0) {
      setError(
        lang === 'hi'
          ? 'बिल की राशि शून्य से कम नहीं हो सकती।'
          : 'Bill amount cannot be negative.'
      );
      return;
    }

    const normalizedDate = parseAnyDateToISO(dueDate) || dueDate.trim();
    if (!normalizedDate) {
      setError(
        lang === 'hi' ? 'कृपया अंतिम देय तिथि चुनें।' : 'Please select a valid due date.'
      );
      return;
    }

    // Add structured bill reminder
    addReminder({
      title: cleanTitle,
      dueDate: normalizedDate,
      note: cleanAmount ? `Bill amount: ${cleanAmount}` : '',
      isCompleted: false,
      bill: {
        amountText: cleanAmount || (parsedValue !== null ? formatRupee(parsedValue) : ''),
        amountValue: parsedValue,
        dueDate: normalizedDate,
        paid: false,
        sourceTitle: cleanTitle,
      },
    });

    onSuccess?.(cleanTitle);
    setTitle('');
    setAmountText('');
    setDueDate(getTodayDateString());
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-bill-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-5 my-6">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center space-x-3 text-amber-700 dark:text-amber-400">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
            <h2 id="add-bill-modal-title" className="text-xl font-bold text-stone-900 dark:text-stone-100 font-heading">
              {t('addBillBtn', lang)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label={t('close', lang)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-base font-semibold flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="bill-title-input" className="block text-base font-semibold text-stone-800 dark:text-stone-200 mb-1">
              {t('billTitleLabel', lang)}
            </label>
            <input
              id="bill-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={lang === 'hi' ? 'उदा. बिजली बिल, पानी बिल' : 'e.g. Electricity bill, Water bill'}
              className="min-h-[52px] w-full px-4 py-3 rounded-2xl border-2 border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="bill-amount-input" className="block text-base font-semibold text-stone-800 dark:text-stone-200 mb-1">
              {t('billAmountLabel', lang)}
            </label>
            <input
              id="bill-amount-input"
              type="text"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
              placeholder={lang === 'hi' ? 'उदा. ₹1,450 या 1450' : 'e.g. ₹1,450 or 1450'}
              className="min-h-[52px] w-full px-4 py-3 rounded-2xl border-2 border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base"
            />
          </div>

          <div>
            <label htmlFor="bill-duedate-input" className="block text-base font-semibold text-stone-800 dark:text-stone-200 mb-1">
              {t('billDueDateLabel', lang)}
            </label>
            <input
              id="bill-duedate-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="min-h-[52px] w-full px-4 py-3 rounded-2xl border-2 border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] px-5 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-base hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              {t('cancel', lang)}
            </button>
            <button
              type="submit"
              className="min-h-[52px] px-7 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-base shadow-sm inline-flex items-center space-x-2 transition-colors"
            >
              <Check className="w-5 h-5" />
              <span>{t('save', lang)}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
