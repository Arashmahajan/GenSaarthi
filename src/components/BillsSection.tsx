import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Calendar,
  RotateCcw,
  Check,
  CalendarPlus,
} from 'lucide-react';
import { GeneralReminder, StructuredBill } from '../types';
import { useApp } from '../context/AppContext';
import { formatRupee, parseAmountValue } from '../lib/money';
import { getTodayDateString, formatDisplayDate } from '../utils/dates';
import { buildIcsCalendar, downloadIcsFile, slugifyTitle } from '../lib/ics';
import { AddBillModal } from './modals/AddBillModal';
import { t } from '../i18n';

interface BillsSectionProps {
  onAddBill?: () => void;
  compact?: boolean; // For home dashboard summary
}

export const BillsSection: React.FC<BillsSectionProps> = ({ compact = false }) => {
  const { settings, reminders, updateReminder } = useApp();
  const lang = settings.language;
  const todayStr = getTodayDateString();
  const currentYearMonth = todayStr.slice(0, 7); // "YYYY-MM"

  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [showPaidSection, setShowPaidSection] = useState(false);
  const [undoToast, setUndoToast] = useState<{ billTitle: string; reminderId: string; wasPaid: boolean } | null>(null);

  // Filter reminders that have structured bill data OR were identified as bills
  const billsThisMonth = useMemo(() => {
    return reminders.filter((r) => {
      // Must have r.bill or dueDate in this month with bill indicator
      if (!r.dueDate) return false;
      const remMonth = r.dueDate.slice(0, 7);
      const isBill = !!r.bill || r.title.toLowerCase().includes('bill') || r.title.toLowerCase().includes('बिल');
      return isBill && remMonth === currentYearMonth;
    });
  }, [reminders, currentYearMonth]);

  // Compute groupings and totals
  const { dueSoonList, laterList, overdueList, paidList, totalDue, totalCount, unpaidCount } = useMemo(() => {
    const dueSoon: GeneralReminder[] = [];
    const later: GeneralReminder[] = [];
    const overdue: GeneralReminder[] = [];
    const paid: GeneralReminder[] = [];

    let sumDue = 0;
    let unpaid = 0;

    const todayDate = new Date(todayStr);
    const in7Days = new Date(todayDate);
    in7Days.setDate(in7Days.getDate() + 7);
    const in7DaysStr = in7Days.toISOString().slice(0, 10);

    billsThisMonth.forEach((r) => {
      const isPaid = r.bill?.paid ?? r.isCompleted;
      const billAmount = r.bill?.amountValue ?? parseAmountValue(r.bill?.amountText || '');

      if (isPaid) {
        paid.push(r);
      } else {
        unpaid += 1;
        if (billAmount !== null) {
          sumDue += billAmount;
        }

        if (r.dueDate! < todayStr) {
          overdue.push(r);
        } else if (r.dueDate! <= in7DaysStr) {
          dueSoon.push(r);
        } else {
          later.push(r);
        }
      }
    });

    // Sort overdue by date ascending
    overdue.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    // Sort upcoming by date ascending
    dueSoon.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    later.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

    return {
      dueSoonList: dueSoon,
      laterList: later,
      overdueList: overdue,
      paidList: paid,
      totalDue: sumDue,
      totalCount: billsThisMonth.length,
      unpaidCount: unpaid,
    };
  }, [billsThisMonth, todayStr]);

  const toggleBillPaid = (r: GeneralReminder) => {
    const currentPaid = r.bill?.paid ?? r.isCompleted;
    const nextPaid = !currentPaid;

    const updatedBill: StructuredBill = r.bill
      ? { ...r.bill, paid: nextPaid }
      : {
          amountText: '',
          amountValue: null,
          dueDate: r.dueDate || todayStr,
          paid: nextPaid,
          sourceTitle: r.title,
        };

    updateReminder(r.id, {
      isCompleted: nextPaid,
      completedAt: nextPaid ? new Date().toISOString() : null,
      bill: updatedBill,
    });

    setUndoToast({
      billTitle: r.title,
      reminderId: r.id,
      wasPaid: currentPaid,
    });
    setTimeout(() => {
      setUndoToast((prev) => (prev?.reminderId === r.id ? null : prev));
    }, 6000);
  };

  const handleUndo = () => {
    if (!undoToast) return;
    const r = reminders.find((rem) => rem.id === undoToast.reminderId);
    if (r) {
      const restoredBill: StructuredBill = r.bill
        ? { ...r.bill, paid: undoToast.wasPaid }
        : {
            amountText: '',
            amountValue: null,
            dueDate: r.dueDate || todayStr,
            paid: undoToast.wasPaid,
            sourceTitle: r.title,
          };

      updateReminder(r.id, {
        isCompleted: undoToast.wasPaid,
        completedAt: undoToast.wasPaid ? new Date().toISOString() : null,
        bill: restoredBill,
      });
    }
    setUndoToast(null);
  };

  const handleExportBillIcs = (r: GeneralReminder) => {
    const icsContent = buildIcsCalendar([
      {
        id: r.id,
        title: r.title,
        description: r.bill?.amountText
          ? `${lang === 'hi' ? 'राशि' : 'Amount'}: ${r.bill.amountText}`
          : r.note,
        date: r.dueDate,
        time: r.dueTime || '10:00',
        category: 'bill',
      },
    ]);
    downloadIcsFile(`saarthi-bill-${slugifyTitle(r.title)}.ics`, icsContent);
  };

  // If compact (Home dashboard): only show if bills exist
  if (compact) {
    if (billsThisMonth.length === 0) return null;

    return (
      <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-stone-900 dark:text-stone-100">
            <Receipt className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold font-heading">{t('billsThisMonth', lang)}</h2>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200">
            {unpaidCount} {t('unpaidBills', lang)}
          </span>
        </div>

        <p className="text-base text-stone-700 dark:text-stone-300 font-medium">
          {t('totalDueThisMonth', lang, {
            amount: formatRupee(totalDue),
            total: totalCount,
            unpaid: unpaidCount,
          })}
        </p>

        {dueSoonList.length > 0 && (
          <div className="pt-2 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block">
              {t('billsDueSoon', lang)}
            </span>
            {dueSoonList.slice(0, 2).map((b) => (
              <div
                key={b.id}
                className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-stone-900 dark:text-stone-100 block text-base">
                    {b.title}
                  </span>
                  <span className="text-xs text-stone-600 dark:text-stone-400">
                    {formatDisplayDate(b.dueDate, lang)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-amber-900 dark:text-amber-200 block text-base">
                    {b.bill?.amountText || (b.bill?.amountValue ? formatRupee(b.bill.amountValue) : '')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full view for Reminders screen
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
      {/* Undo Toast */}
      {undoToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-4 text-base font-semibold animate-in fade-in"
        >
          <span>
            {undoToast.wasPaid
              ? lang === 'hi'
                ? `"${undoToast.billTitle}" को फिर से देय चिह्नित किया गया।`
                : `"${undoToast.billTitle}" marked as unpaid.`
              : lang === 'hi'
              ? `"${undoToast.billTitle}" को भुगतान किया हुआ चिह्नित किया गया।`
              : `"${undoToast.billTitle}" marked as paid.`}
          </span>
          <button
            type="button"
            onClick={handleUndo}
            className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm inline-flex items-center space-x-1 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('undo', lang)}</span>
          </button>
        </div>
      )}

      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5 text-stone-900 dark:text-stone-100">
            <Receipt className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl sm:text-2xl font-bold font-heading">{t('billsThisMonth', lang)}</h2>
          </div>
          <p className="text-stone-700 dark:text-stone-300 text-base">
            {t('totalDueThisMonth', lang, {
              amount: formatRupee(totalDue),
              total: totalCount,
              unpaid: unpaidCount,
            })}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddBillOpen(true)}
          className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-base transition-colors shadow-xs flex items-center space-x-2 shrink-0 self-start sm:self-center"
        >
          <Plus className="w-5 h-5" />
          <span>{t('addBillBtn', lang)}</span>
        </button>
      </div>

      {billsThisMonth.length === 0 ? (
        <div className="text-center py-6 space-y-2 text-stone-600 dark:text-stone-400">
          <p className="text-base">{t('noBillsThisMonth', lang)}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Overdue Bills */}
          {overdueList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-lg font-bold">
                  {t('billsOverdue', lang)} ({overdueList.length})
                </h3>
              </div>
              <div className="space-y-3">
                {overdueList.map((bill) => (
                  <BillCard
                    key={bill.id}
                    reminder={bill}
                    lang={lang}
                    isOverdue={true}
                    onTogglePaid={() => toggleBillPaid(bill)}
                    onExportIcs={() => handleExportBillIcs(bill)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 2. Due Soon (Next 7 days) */}
          {dueSoonList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-300">
                <Clock className="w-5 h-5" />
                <h3 className="text-lg font-bold">
                  {t('billsDueSoon', lang)} ({dueSoonList.length})
                </h3>
              </div>
              <div className="space-y-3">
                {dueSoonList.map((bill) => (
                  <BillCard
                    key={bill.id}
                    reminder={bill}
                    lang={lang}
                    onTogglePaid={() => toggleBillPaid(bill)}
                    onExportIcs={() => handleExportBillIcs(bill)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 3. Later This Month */}
          {laterList.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                {t('billsLaterThisMonth', lang)} ({laterList.length})
              </h3>
              <div className="space-y-3">
                {laterList.map((bill) => (
                  <BillCard
                    key={bill.id}
                    reminder={bill}
                    lang={lang}
                    onTogglePaid={() => toggleBillPaid(bill)}
                    onExportIcs={() => handleExportBillIcs(bill)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 4. Collapsed Paid This Month */}
          {paidList.length > 0 && (
            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-3">
              <button
                type="button"
                onClick={() => setShowPaidSection(!showPaidSection)}
                className="w-full min-h-[48px] p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-between text-left transition-colors font-bold text-base text-stone-700 dark:text-stone-300"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>
                    {t('billsPaidThisMonth', lang)} ({paidList.length})
                  </span>
                </div>
                {showPaidSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {showPaidSection && (
                <div className="space-y-3 opacity-80 pt-1">
                  {paidList.map((bill) => (
                    <BillCard
                      key={bill.id}
                      reminder={bill}
                      lang={lang}
                      isPaid={true}
                      onTogglePaid={() => toggleBillPaid(bill)}
                      onExportIcs={() => handleExportBillIcs(bill)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Bill Modal */}
      <AddBillModal
        isOpen={isAddBillOpen}
        onClose={() => setIsAddBillOpen(false)}
      />
    </div>
  );
};

interface BillCardProps {
  reminder: GeneralReminder;
  lang: 'en' | 'hi';
  isOverdue?: boolean;
  isPaid?: boolean;
  onTogglePaid: () => void;
  onExportIcs: () => void;
}

const BillCard: React.FC<BillCardProps> = ({
  reminder,
  lang,
  isOverdue,
  isPaid,
  onTogglePaid,
  onExportIcs,
}) => {
  const displayAmount =
    reminder.bill?.amountText ||
    (reminder.bill?.amountValue ? formatRupee(reminder.bill.amountValue) : '');

  return (
    <div
      className={`border rounded-2xl p-4 sm:p-5 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isPaid
          ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 opacity-80'
          : isOverdue
          ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40'
          : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/50'
      }`}
    >
      <div className="space-y-1.5">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <span
            className={`text-lg font-bold text-stone-900 dark:text-stone-100 ${
              isPaid ? 'line-through text-stone-500' : ''
            }`}
          >
            {reminder.title}
          </span>

          {displayAmount && (
            <span className="text-base font-extrabold px-3 py-0.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
              {displayAmount}
            </span>
          )}

          {isPaid && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('paidBadge', lang)}</span>
            </span>
          )}

          {isOverdue && !isPaid && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 font-bold border border-rose-300 dark:border-rose-800">
              {t('overdue', lang)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 dark:text-stone-400 font-medium">
          {reminder.dueDate && (
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
              <span>
                {t('billDueDateLabel', lang)}: {formatDisplayDate(reminder.dueDate, lang)}
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
        {/* Export to Calendar */}
        <button
          type="button"
          onClick={onExportIcs}
          className="min-h-[48px] px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold text-sm inline-flex items-center space-x-1.5 transition-colors"
          title={t('exportToCalendar', lang)}
          aria-label={`${t('exportToCalendar', lang)} for ${reminder.title}`}
        >
          <CalendarPlus className="w-4 h-4 text-amber-600" />
          <span className="hidden sm:inline">.ics</span>
        </button>

        {/* Mark paid toggle button */}
        <button
          type="button"
          onClick={onTogglePaid}
          className={`min-h-[48px] px-5 py-2 rounded-xl font-bold text-base transition-colors shadow-xs inline-flex items-center space-x-2 ${
            isPaid
              ? 'border-2 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              : 'bg-emerald-700 hover:bg-emerald-800 text-white'
          }`}
        >
          {isPaid ? (
            <>
              <RotateCcw className="w-4 h-4" />
              <span>{t('markUnpaid', lang)}</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>{t('markPaid', lang)}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
