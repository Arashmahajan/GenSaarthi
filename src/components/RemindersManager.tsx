import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Clock,
  AlertCircle,
  Bell,
  BellRing,
  Sparkles,
  CalendarCheck,
  RotateCcw,
  CalendarPlus,
  FileText,
} from 'lucide-react';
import { GeneralReminder } from '../types';
import { VoiceSpeakerButton } from './VoiceSpeakerButton';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';
import { getTodayDateString, formatDisplayDate, formatDisplayTime } from '../utils/dates';
import { buildIcsCalendar, downloadIcsFile, slugifyTitle } from '../lib/ics';
import { ConfirmAddReminderModal } from './modals/ConfirmAddReminderModal';
import { BillsSection } from './BillsSection';
import { DoctorVisitPrepModal } from './DoctorVisitPrepModal';

export const RemindersManager: React.FC = () => {
  const {
    settings,
    reminders,
    deleteReminder,
    toggleReminderDone,
    notificationStatus,
    requestAlerts,
    setActiveTab,
    loadDemo,
    isDemo,
    isDoctorVisitOpen,
    setIsDoctorVisitOpen,
  } = useApp();

  const lang = settings.language;
  const todayStr = getTodayDateString();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteConfirmRem, setDeleteConfirmRem] = useState<GeneralReminder | null>(null);

  // Categorize and sort reminders (Requirement 4)
  // 1. Overdue: incomplete and dueDate < todayStr
  // 2. Due today / upcoming with date: sorted soonest first
  // 3. No date: upcoming
  // 4. Completed: sorted by completion time
  const { overdueList, pendingWithDateList, noDateList, completedList } = useMemo(() => {
    const overdue: GeneralReminder[] = [];
    const pendingWithDate: GeneralReminder[] = [];
    const noDate: GeneralReminder[] = [];
    const completed: GeneralReminder[] = [];

    reminders.forEach((r) => {
      if (r.isCompleted) {
        completed.push(r);
      } else if (!r.dueDate) {
        noDate.push(r);
      } else if (r.dueDate < todayStr) {
        overdue.push(r);
      } else {
        pendingWithDate.push(r);
      }
    });

    // Sort overdue by date ascending (oldest overdue first)
    overdue.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

    // Sort upcoming by date ascending (soonest first)
    pendingWithDate.sort((a, b) => {
      const cmp = (a.dueDate || '').localeCompare(b.dueDate || '');
      if (cmp !== 0) return cmp;
      return (a.dueTime || '').localeCompare(b.dueTime || '');
    });

    return {
      overdueList: overdue,
      pendingWithDateList: pendingWithDate,
      noDateList: noDate,
      completedList: completed,
    };
  }, [reminders, todayStr]);

  const handleExportAllIcs = () => {
    const activeWithDate = reminders.filter((r) => !r.isCompleted && r.dueDate);
    if (activeWithDate.length === 0) {
      alert(
        lang === 'hi'
          ? 'कैलेंडर में जोड़ने के लिए कोई दिनांक वाला सक्रिय रिमाइंडर नहीं मिला।'
          : 'No active reminders with due dates found to export.'
      );
      return;
    }
    const ics = buildIcsCalendar(
      activeWithDate.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.note,
        date: r.dueDate,
        time: r.dueTime || '10:00',
        category: r.bill ? 'bill' : 'reminder',
      }))
    );
    downloadIcsFile(`saarthi-reminders-${todayStr}.ics`, ics);
  };

  const getSpokenSummary = () => {
    const totalActive = overdueList.length + pendingWithDateList.length + noDateList.length;
    if (totalActive === 0) {
      return lang === 'hi'
        ? 'आपके पास कोई लंबित रिमाइंडर नहीं है।'
        : 'You have no pending reminders scheduled.';
    }

    if (lang === 'hi') {
      let str = `आपके पास ${totalActive} सक्रिय रिमाइंडर हैं।`;
      if (overdueList.length > 0) {
        str += ` ध्यान दें: ${overdueList.length} रिमाइंडर का समय बीत चुका है।`;
      }
      return str;
    }

    let str = `You have ${totalActive} active reminders.`;
    if (overdueList.length > 0) {
      str += ` Note: ${overdueList.length} reminders are overdue.`;
    }
    return str;
  };

  return (
    <div id="reminders-manager-section" className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-800 dark:text-amber-300">
              <Calendar className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 font-heading">
              {t('remindersTab', lang)}
            </h1>
          </div>
          <p className="text-stone-700 dark:text-stone-300 text-base leading-relaxed">
            {lang === 'hi'
              ? 'बिजली बिल, डॉक्टर की भेंट, बैंक कार्य और दैनिक कामों का ध्यान रखें।'
              : 'Keep track of electricity bills, clinic appointments, and family errands.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <VoiceSpeakerButton
            textToSpeak={getSpokenSummary()}
            lang={lang === 'hi' ? 'hi-IN' : 'en-IN'}
            speechRate={settings.speechRate}
            size="md"
          />

          <button
            type="button"
            onClick={handleExportAllIcs}
            className="min-h-[48px] px-3.5 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-200 font-bold text-sm border border-stone-300 dark:border-stone-700 flex items-center space-x-2 transition-colors"
            title={t('exportAllActiveReminders', lang)}
          >
            <CalendarPlus className="w-4 h-4 text-amber-600" />
            <span>{t('exportAllActiveReminders', lang)}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDoctorVisitOpen(true)}
            className="min-h-[48px] px-3.5 py-2.5 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-950 dark:bg-teal-950/40 dark:hover:bg-teal-900/50 dark:text-teal-200 font-bold text-sm border border-teal-300 dark:border-teal-800 flex items-center space-x-2 transition-colors"
          >
            <FileText className="w-4 h-4 text-teal-700 dark:text-teal-400" />
            <span>{t('prepDoctorVisit', lang)}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('plan')}
            className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-950 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 dark:text-amber-200 font-bold text-sm border border-amber-300 dark:border-amber-800 flex items-center space-x-2 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span>{t('planDayBtn', lang)}</span>
          </button>

          <button
            id="open-add-reminder-btn"
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-base transition-colors shadow-xs flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <Plus className="w-5 h-5" />
            <span>{t('addReminderBtn', lang)}</span>
          </button>
        </div>
      </div>

      {/* Browser Notification Banner (Requirement 4) */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-800 dark:text-amber-300 shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {t('alertsTitle', lang)}
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              {notificationStatus === 'granted'
                ? t('alertsEnabled', lang)
                : notificationStatus === 'denied'
                ? t('alertsDenied', lang)
                : notificationStatus === 'unsupported'
                ? t('alertsUnsupported', lang)
                : lang === 'hi'
                ? 'समय पर आवाज़ और स्क्रीन सूचनाएं पाने के लिए अलर्ट चालू करें।'
                : 'Receive gentle sound & screen alerts while using the app.'}
            </p>
          </div>
        </div>

        {notificationStatus === 'default' && (
          <button
            type="button"
            onClick={requestAlerts}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-xs shrink-0 self-start sm:self-center"
          >
            {t('turnOnAlerts', lang)}
          </button>
        )}
      </div>

      {/* Feature 7: Bills This Month */}
      <BillsSection />

      {/* Reminders List */}
      {reminders.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
            <CalendarCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
            {t('noRemindersYet', lang)}
          </h2>
          <p className="text-stone-600 dark:text-stone-400 text-sm max-w-md mx-auto leading-relaxed">
            {lang === 'hi'
              ? 'बिल भुगतान, डॉक्टर का समय, या कोई भी ज़रूरी काम जोड़ने के लिए नीचे टैप करें।'
              : 'Add bills, doctor appointments, or daily tasks to receive gentle, clear reminders.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="min-h-[48px] px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-base transition-colors shadow-sm"
            >
              {t('addReminderBtn', lang)}
            </button>
            {!isDemo && (
              <button
                type="button"
                onClick={loadDemo}
                className="min-h-[48px] px-5 py-3 rounded-2xl border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold text-sm transition-colors"
              >
                {t('loadDemoData', lang)}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overdue Section (Grouped at top with red badge) */}
          {overdueList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400">
                <AlertCircle className="w-5 h-5" />
                <h2 className="text-lg font-bold">
                  {t('overdue', lang)} ({overdueList.length})
                </h2>
              </div>

              <div className="space-y-3">
                {overdueList.map((rem) => (
                  <ReminderCard
                    key={rem.id}
                    reminder={rem}
                    lang={lang}
                    isOverdue={true}
                    onToggle={() => toggleReminderDone(rem.id)}
                    onDelete={() => setDeleteConfirmRem(rem)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming & Due Today Section */}
          {pendingWithDateList.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                {t('activeReminders', lang)} ({pendingWithDateList.length})
              </h2>

              <div className="space-y-3">
                {pendingWithDateList.map((rem) => (
                  <ReminderCard
                    key={rem.id}
                    reminder={rem}
                    lang={lang}
                    isToday={rem.dueDate === todayStr}
                    onToggle={() => toggleReminderDone(rem.id)}
                    onDelete={() => setDeleteConfirmRem(rem)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Reminders with No Date */}
          {noDateList.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                {t('upcoming', lang)} ({noDateList.length})
              </h2>

              <div className="space-y-3">
                {noDateList.map((rem) => (
                  <ReminderCard
                    key={rem.id}
                    reminder={rem}
                    lang={lang}
                    onToggle={() => toggleReminderDone(rem.id)}
                    onDelete={() => setDeleteConfirmRem(rem)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Reminders */}
          {completedList.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-stone-200 dark:border-stone-800">
              <h2 className="text-base font-bold text-stone-600 dark:text-stone-400">
                {t('completedReminders', lang)} ({completedList.length})
              </h2>

              <div className="space-y-2 opacity-80">
                {completedList.map((rem) => (
                  <ReminderCard
                    key={rem.id}
                    reminder={rem}
                    lang={lang}
                    onToggle={() => toggleReminderDone(rem.id)}
                    onDelete={() => setDeleteConfirmRem(rem)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Reminder Modal */}
      <ConfirmAddReminderModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => {}}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmRem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-sm w-full p-6 border border-stone-200 dark:border-stone-700 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              {lang === 'hi' ? 'रिमाइंडर हटाएं?' : 'Delete Reminder?'}
            </h3>
            <p className="text-sm text-stone-700 dark:text-stone-300">
              {lang === 'hi'
                ? `क्या आप रिमाइंडर "${deleteConfirmRem.title}" को हटाना चाहते हैं?`
                : `Are you sure you want to remove reminder "${deleteConfirmRem.title}"?`}
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmRem(null)}
                className="min-h-[48px] px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-medium"
              >
                {t('cancel', lang)}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteReminder(deleteConfirmRem.id);
                  setDeleteConfirmRem(null);
                }}
                className="min-h-[48px] px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {t('delete', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature 5: Doctor Visit Prep Modal */}
      <DoctorVisitPrepModal
        isOpen={isDoctorVisitOpen}
        onClose={() => setIsDoctorVisitOpen(false)}
      />
    </div>
  );
};

interface ReminderCardProps {
  reminder: GeneralReminder;
  lang: 'en' | 'hi';
  isOverdue?: boolean;
  isToday?: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  lang,
  isOverdue,
  isToday,
  onToggle,
  onDelete,
}) => {
  return (
    <div
      className={`border rounded-2xl p-4 sm:p-5 transition-all shadow-xs bg-white dark:bg-stone-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        reminder.isCompleted
          ? 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 line-through opacity-70'
          : isOverdue
          ? 'border-rose-300 dark:border-rose-800 bg-rose-50/30'
          : isToday
          ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20'
          : 'border-stone-200 dark:border-stone-800'
      }`}
    >
      <div className="flex items-start space-x-3">
        <button
          type="button"
          onClick={onToggle}
          className="min-h-[48px] min-w-[48px] flex items-center justify-center text-stone-400 hover:text-emerald-600 transition-colors shrink-0"
          title={reminder.isCompleted ? t('markIncomplete', lang) : t('markCompleted', lang)}
          aria-label={reminder.isCompleted ? t('markIncomplete', lang) : t('markCompleted', lang)}
        >
          {reminder.isCompleted ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          ) : (
            <Circle className="w-6 h-6 text-stone-400 hover:text-emerald-600" />
          )}
        </button>

        <div className="space-y-1">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span
              className={`text-base font-bold text-stone-900 dark:text-stone-100 ${
                reminder.isCompleted ? 'line-through text-stone-500' : ''
              }`}
            >
              {reminder.title}
            </span>

            {isOverdue && !reminder.isCompleted && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 font-bold border border-rose-300 dark:border-rose-800">
                {t('overdue', lang)}
              </span>
            )}

            {isToday && !reminder.isCompleted && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-bold border border-amber-300 dark:border-amber-800">
                {t('dueToday', lang)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 dark:text-stone-400 font-medium">
            {reminder.dueDate && (
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                <span>{formatDisplayDate(reminder.dueDate, lang)}</span>
              </span>
            )}

            {reminder.dueTime && (
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                <span>{formatDisplayTime(reminder.dueTime)}</span>
              </span>
            )}
          </div>

          {reminder.note && (
            <p className="text-xs text-stone-700 dark:text-stone-300 mt-1">
              {reminder.note}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 shrink-0 self-end sm:self-center">
        {reminder.dueDate && (
          <button
            type="button"
            onClick={() => {
              const ics = buildIcsCalendar([
                {
                  id: reminder.id,
                  title: reminder.title,
                  description: reminder.note,
                  date: reminder.dueDate,
                  time: reminder.dueTime || '10:00',
                  category: reminder.bill ? 'bill' : 'reminder',
                },
              ]);
              downloadIcsFile(`saarthi-reminder-${slugifyTitle(reminder.title)}.ics`, ics);
            }}
            className="min-h-[48px] px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold text-xs inline-flex items-center space-x-1.5 transition-colors"
            title={t('exportToCalendar', lang)}
            aria-label={`${t('exportToCalendar', lang)} for ${reminder.title}`}
          >
            <CalendarPlus className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">.ics</span>
          </button>
        )}

        <button
          type="button"
          onClick={onDelete}
          className="min-h-[48px] min-w-[48px] flex items-center justify-center text-stone-400 hover:text-rose-600 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          title={t('delete', lang)}
          aria-label={`${t('delete', lang)} ${reminder.title}`}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
