import React, { useState } from 'react';
import {
  Pill,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Trash2,
  CalendarDays,
  Package,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { DoseSlot, FoodTiming, MedicineItem } from '../types';
import { VoiceSpeakerButton } from './VoiceSpeakerButton';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';
import { getTodayDateString, getCurrentWeekDays } from '../utils/dates';
import { ConfirmAddMedicineModal } from './modals/ConfirmAddMedicineModal';

export const MedicineReminder: React.FC = () => {
  const {
    settings,
    medicines,
    deleteMedicine,
    doseLog,
    markDoseTaken,
    undoDoseTaken,
    loadDemo,
    isDemo,
  } = useApp();
  const lang = settings.language;
  const todayStr = getTodayDateString();
  const weekDays = getCurrentWeekDays();

  const [activeTiming, setActiveTiming] = useState<'all' | DoseSlot>('all');
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refillMed, setRefillMed] = useState<MedicineItem | null>(null);
  const [refillCount, setRefillCount] = useState<number>(30);
  const [deleteConfirmMed, setDeleteConfirmMed] = useState<MedicineItem | null>(null);

  // Filter medicines by timing slot
  const filteredMedicines = medicines.filter((m) => {
    if (activeTiming === 'all') return true;
    return m.timing === activeTiming;
  });

  const getSpokenOverview = () => {
    if (medicines.length === 0) {
      return lang === 'hi'
        ? 'आपकी सूची में अभी कोई दवा नहीं है।'
        : 'You have no medicines scheduled yet.';
    }

    const takenCount = medicines.filter((m) => !!doseLog[m.id]?.[todayStr]?.[m.timing]).length;
    if (lang === 'hi') {
      return `आज आपके पास कुल ${medicines.length} दवाइयां हैं। आपने ${takenCount} दवा ले ली है।`;
    }
    return `You have ${medicines.length} medicines scheduled today. You have taken ${takenCount} so far.`;
  };

  const handleRefillConfirm = () => {
    if (refillMed && refillCount > 0) {
      refillMed.remainingPills = (refillMed.remainingPills || 0) + refillCount;
      refillMed.initialPills = (refillMed.initialPills || 0) + refillCount;
      setRefillMed(null);
    }
  };

  return (
    <div id="medicine-reminder-section" className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-800 dark:text-amber-300">
              <Pill className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 font-heading">
              {t('medicinesTab', lang)}
            </h1>
          </div>
          <p className="text-stone-700 dark:text-stone-300 text-base leading-relaxed">
            {t('confirmMedicineNote', lang)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <VoiceSpeakerButton
            textToSpeak={getSpokenOverview()}
            lang={lang === 'hi' ? 'hi-IN' : 'en-IN'}
            speechRate={settings.speechRate}
            size="md"
          />
          <button
            id="open-add-medicine-btn"
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-base transition-colors shadow-xs flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <Plus className="w-5 h-5" />
            <span>{t('addMedicineBtn', lang)}</span>
          </button>
        </div>
      </div>

      {/* View Mode Toggle & Timing Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex rounded-2xl border border-stone-300 dark:border-stone-700 p-1 bg-stone-100 dark:bg-stone-800/80">
          <button
            type="button"
            onClick={() => setViewMode('today')}
            className={`flex-1 min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              viewMode === 'today'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            {t('todayDoses', lang)}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={`flex-1 min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              viewMode === 'week'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            {t('weeklyRecord', lang)}
          </button>
        </div>

        {/* Slot filter */}
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'morning', 'afternoon', 'evening', 'night'] as const).map((slot) => {
            const labels = {
              all: lang === 'hi' ? 'सभी' : 'All',
              morning: lang === 'hi' ? 'सुबह' : 'Morning',
              afternoon: lang === 'hi' ? 'दोपहर' : 'Afternoon',
              evening: lang === 'hi' ? 'शाम' : 'Evening',
              night: lang === 'hi' ? 'रात' : 'Night',
            };
            return (
              <button
                key={slot}
                type="button"
                onClick={() => setActiveTiming(slot)}
                className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  activeTiming === slot
                    ? 'bg-amber-600 border-amber-600 text-white'
                    : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
                }`}
              >
                {labels[slot]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {medicines.length === 0 ? (
        /* Empty state (Requirement 1: Friendly empty state that invites an action) */
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Pill className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
            {t('noMedicinesYet', lang)}
          </h2>
          <p className="text-stone-600 dark:text-stone-400 text-sm max-w-md mx-auto leading-relaxed">
            {lang === 'hi'
              ? 'दवा का नाम, समय और भोजन के निर्देश जोड़ें ताकि सारथी आपको याद दिला सके।'
              : 'Keep track of daily doses and get friendly reminders so you never miss a dose.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="min-h-[48px] px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-base transition-colors shadow-sm"
            >
              {t('addMedicineBtn', lang)}
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
      ) : viewMode === 'today' ? (
        /* Today's Schedule List */
        <div className="space-y-4">
          {filteredMedicines.map((med) => {
            const doseEntry = doseLog[med.id]?.[todayStr]?.[med.timing];
            const isTaken = !!doseEntry;
            const hasPillCount = med.remainingPills !== null && med.remainingPills !== undefined;
            const isRunningLow = hasPillCount && med.remainingPills! <= 5;

            return (
              <div
                key={med.id}
                className={`border rounded-3xl p-5 sm:p-6 transition-all shadow-xs bg-white dark:bg-stone-900 ${
                  isTaken
                    ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20'
                    : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 font-heading">
                        {med.name}
                      </h3>
                      {med.isSample && (
                        <span className="text-xs bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-full font-bold">
                          {t('demoBadge', lang)}
                        </span>
                      )}
                      <span className="text-xs bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 px-2.5 py-0.5 rounded-full font-medium">
                        {med.dosage}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-stone-700 dark:text-stone-300">
                      <span className="flex items-center space-x-1 font-medium">
                        <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                        <span>{med.timeLabel || med.timing}</span>
                      </span>

                      {med.withFood && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 font-medium">
                          {med.withFood === 'after_food'
                            ? t('medFoodAfter', lang)
                            : med.withFood === 'before_food'
                            ? t('medFoodBefore', lang)
                            : med.withFood === 'with_food'
                            ? t('medFoodWith', lang)
                            : t('medFoodAnytime', lang)}
                        </span>
                      )}

                      {/* Pill count badge ONLY if count was provided */}
                      {hasPillCount && (
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-md font-bold ${
                            isRunningLow
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          {t('pillsRemaining', lang, { count: med.remainingPills! })}
                        </span>
                      )}
                    </div>

                    {/* Running low warning (<= 5 pills) */}
                    {isRunningLow && (
                      <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between gap-2 text-xs font-semibold text-rose-900 dark:text-rose-200">
                        <div className="flex items-center space-x-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                          <span>{t('runningLowWarning', lang, { count: med.remainingPills! })}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRefillMed(med)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0"
                        >
                          Refill
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mark taken / Undo Dose Actions */}
                  <div className="flex items-center space-x-3 shrink-0">
                    {isTaken ? (
                      <div className="flex items-center space-x-2">
                        <div className="px-3.5 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 text-sm font-semibold flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                          <span>
                            {t('doseTakenAt', lang)} {doseEntry?.takenAt}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => undoDoseTaken(med.id, med.timing)}
                          className="min-h-[48px] min-w-[48px] px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold flex items-center justify-center space-x-1"
                          title={t('undoDose', lang)}
                          aria-label={t('undoDose', lang)}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{t('undoDose', lang)}</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => markDoseTaken(med.id, med.timing)}
                        className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base transition-colors shadow-xs flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>{t('markTaken', lang)}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmMed(med)}
                      className="min-h-[48px] min-w-[48px] flex items-center justify-center text-stone-400 hover:text-rose-600 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      title={t('delete', lang)}
                      aria-label={`${t('delete', lang)} ${med.name}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Week View derived from doseLog (Requirement 3) */
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs overflow-x-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              {t('weeklyRecord', lang)}
            </h2>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              Mon - Sun Schedule
            </span>
          </div>

          <div className="min-w-[600px] space-y-4">
            {/* Day Headers */}
            <div className="grid grid-cols-8 gap-2 text-center text-xs font-bold text-stone-600 dark:text-stone-400 pb-2 border-b border-stone-200 dark:border-stone-800">
              <div className="text-left font-bold text-stone-800 dark:text-stone-200">Medicine</div>
              {weekDays.map((day) => (
                <div
                  key={day.dateStr}
                  className={`py-1 rounded-lg ${
                    day.isToday
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 font-extrabold'
                      : ''
                  }`}
                >
                  <div>{lang === 'hi' ? day.dayNameHi : day.dayNameEn}</div>
                  <div className="text-[11px] text-stone-500">{day.dayNum}</div>
                </div>
              ))}
            </div>

            {/* Rows for each medicine */}
            {medicines.map((med) => (
              <div
                key={med.id}
                className="grid grid-cols-8 gap-2 items-center text-center py-2.5 border-b border-stone-100 dark:border-stone-800/60"
              >
                <div className="text-left text-sm font-semibold text-stone-900 dark:text-stone-100 truncate pr-2">
                  <div className="truncate">{med.name}</div>
                  <div className="text-[11px] text-stone-500 font-normal">{med.timing}</div>
                </div>

                {weekDays.map((day) => {
                  const isDoseTaken = !!doseLog[med.id]?.[day.dateStr]?.[med.timing];

                  if (day.isToday) {
                    return (
                      <div key={day.dateStr} className="flex justify-center">
                        {isDoseTaken ? (
                          <div
                            className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center"
                            title="Taken today"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => markDoseTaken(med.id, med.timing)}
                            className="w-8 h-8 rounded-full border-2 border-amber-500 hover:bg-amber-50 text-amber-800 flex items-center justify-center text-xs font-bold"
                            title="Click to mark taken"
                          >
                            ○
                          </button>
                        )}
                      </div>
                    );
                  }

                  if (day.isPast) {
                    return (
                      <div key={day.dateStr} className="flex justify-center">
                        {isDoseTaken ? (
                          <div
                            className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center"
                            title="Taken"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <div
                            className="w-7 h-7 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center text-xs font-bold"
                            title="Not taken"
                          >
                            —
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Future days
                  return (
                    <div key={day.dateStr} className="flex justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-stone-200 dark:bg-stone-700" />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Medicine Modal */}
      <ConfirmAddMedicineModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {}}
      />

      {/* Refill Modal */}
      {refillMed && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-sm w-full p-6 border border-stone-200 dark:border-stone-700 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              Refill {refillMed.name}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Enter number of pills added to your strip or bottle:
            </p>
            <input
              type="number"
              min="1"
              max="500"
              value={refillCount}
              onChange={(e) => setRefillCount(parseInt(e.target.value, 10) || 0)}
              className="w-full min-h-[48px] px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold text-lg"
            />
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRefillMed(null)}
                className="min-h-[48px] px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-medium"
              >
                {t('cancel', lang)}
              </button>
              <button
                type="button"
                onClick={handleRefillConfirm}
                className="min-h-[48px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {t('confirm', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmMed && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-sm w-full p-6 border border-stone-200 dark:border-stone-700 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              {lang === 'hi' ? 'दवा हटाएं?' : 'Delete Medicine?'}
            </h3>
            <p className="text-sm text-stone-700 dark:text-stone-300">
              {lang === 'hi'
                ? `क्या आप "${deleteConfirmMed.name}" को अपनी सूची से हटाना चाहते हैं?`
                : `Are you sure you want to remove "${deleteConfirmMed.name}" from your medicine tracker?`}
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmMed(null)}
                className="min-h-[48px] px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-medium"
              >
                {t('cancel', lang)}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteMedicine(deleteConfirmMed.id);
                  setDeleteConfirmMed(null);
                }}
                className="min-h-[48px] px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {t('delete', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
