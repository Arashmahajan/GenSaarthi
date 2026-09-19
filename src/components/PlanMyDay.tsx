import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  Heart,
  Sun,
  Loader2,
  Calendar,
  Pill,
  CheckCircle2,
} from 'lucide-react';
import { DayPlanResult } from '../types';
import { VoiceSpeakerButton } from './VoiceSpeakerButton';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';
import { getTodayDateString } from '../utils/dates';

export const PlanMyDay: React.FC = () => {
  const { settings, medicines, reminders, doseLog } = useApp();
  const lang = settings.language;
  const userName = settings.userName;
  const todayStr = getTodayDateString();

  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [planResult, setPlanResult] = useState<DayPlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Active reminders for today (or pending)
  const pendingReminders = reminders.filter(
    (r) => !r.isCompleted && (!r.dueDate || r.dueDate <= todayStr)
  );

  const handlePlan = async (routineText?: string) => {
    const textToSubmit = routineText !== undefined ? routineText : notes;
    setIsLoading(true);
    setError(null);

    // Format reminders and medicines strings
    const remindersToSend = pendingReminders.map(
      (r) => `${r.title}${r.dueTime ? ` at ${r.dueTime}` : ''}${r.note ? ` (${r.note})` : ''}`
    );
    const medicinesToSend = medicines.map(
      (m) => `${m.name} (${m.dosage}) - ${m.timeLabel || m.timing} (${m.withFood.replace('_', ' ')})`
    );

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routinesOrNotes: textToSubmit.trim() || undefined,
          language: lang,
          userName: userName || undefined,
          savedReminders: remindersToSend.length > 0 ? remindersToSend : undefined,
          scheduledMedicines: medicinesToSend.length > 0 ? medicinesToSend : undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error?.message || 'Failed to generate daily plan.');
      }

      const data: DayPlanResult = await res.json();
      setPlanResult(data);
    } catch (err: unknown) {
      console.error(err);
      setPlanResult(null);
      setError(
        lang === 'hi'
          ? 'आज का शेड्यूल बनाने में समस्या आई। कृपया दोबारा प्रयास करें।'
          : 'Could not create day plan right now. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getSpokenPlan = (plan: DayPlanResult) => {
    let text = `${plan.greeting}. ${plan.summary}. `;
    if (plan.schedule && plan.schedule.length > 0) {
      text += lang === 'hi' ? 'यहाँ आपकी शांत दिनचर्या है: ' : 'Here is your peaceful schedule: ';
      for (const item of plan.schedule) {
        text += `${item.time} - ${item.activity}. `;
      }
    }
    if (plan.wellnessNote) {
      text += `${lang === 'hi' ? 'आज का विचार' : 'Thought for today'}: ${plan.wellnessNote}`;
    }
    return text;
  };

  return (
    <div id="plan-my-day-section" className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-800 dark:text-amber-300">
              <Sun className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 font-heading">
              {t('planDayTitle', lang)}
            </h1>
          </div>
          <p className="text-stone-700 dark:text-stone-300 text-base leading-relaxed">
            {t('planDaySubtitle', lang)}
          </p>
        </div>

        {planResult && (
          <VoiceSpeakerButton
            textToSpeak={getSpokenPlan(planResult)}
            lang={lang === 'hi' ? 'hi-IN' : 'en-IN'}
            speechRate={settings.speechRate}
            size="md"
          />
        )}
      </div>

      {/* Merged Data Summary Box (Requirement 5: tells user what it included) */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
          {lang === 'hi' ? 'आज की योजना में क्या शामिल है:' : "What's automatically included for today:"}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Medicines card */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2">
            <div className="flex items-center space-x-2 text-stone-800 dark:text-stone-200 font-bold text-sm">
              <Pill className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                {lang === 'hi'
                  ? `दवाइयां (${medicines.length} तय)`
                  : `Medicines (${medicines.length} scheduled)`}
              </span>
            </div>
            {medicines.length > 0 ? (
              <ul className="text-xs text-stone-600 dark:text-stone-400 space-y-1">
                {medicines.map((m) => (
                  <li key={m.id} className="flex items-center justify-between">
                    <span>{m.name} ({m.dosage})</span>
                    <span className="font-semibold">{m.timing}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-stone-500 italic">
                {lang === 'hi' ? 'कोई दवा दर्ज नहीं है।' : 'No medicines tracked yet.'}
              </p>
            )}
          </div>

          {/* Reminders card */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2">
            <div className="flex items-center space-x-2 text-stone-800 dark:text-stone-200 font-bold text-sm">
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>
                {lang === 'hi'
                  ? `रिमाइंडर (${pendingReminders.length} सक्रिय)`
                  : `Reminders (${pendingReminders.length} active)`}
              </span>
            </div>
            {pendingReminders.length > 0 ? (
              <ul className="text-xs text-stone-600 dark:text-stone-400 space-y-1">
                {pendingReminders.map((r) => (
                  <li key={r.id} className="flex items-center justify-between">
                    <span className="truncate">{r.title}</span>
                    <span className="font-semibold">{r.dueTime || r.dueDate || 'Today'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-stone-500 italic">
                {lang === 'hi' ? 'कोई सक्रिय रिमाइंडर नहीं है।' : 'No pending reminders for today.'}
              </p>
            )}
          </div>
        </div>

        {/* Optional Extra Notes */}
        <div className="space-y-2 pt-2">
          <label htmlFor="plan-notes-input" className="block text-sm font-semibold text-stone-900 dark:text-stone-100">
            {lang === 'hi' ? 'आज की कोई विशेष योजना या मुलाकात (वैकल्पिक):' : 'Any special plan or visit today? (Optional):'}
          </label>
          <input
            id="plan-notes-input"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              lang === 'hi'
                ? 'जैसे: शाम 5 बजे पोते आएंगे, या मंदिर जाना है'
                : 'e.g., Grandchildren visiting at 5 PM, or temple visit in evening'
            }
            className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none placeholder:text-stone-400"
          />
        </div>

        <button
          id="generate-plan-btn"
          type="button"
          disabled={isLoading}
          onClick={() => handlePlan()}
          className="w-full min-h-[48px] px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 dark:disabled:bg-stone-800 text-white font-bold rounded-2xl shadow-xs transition-colors text-base flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{lang === 'hi' ? 'दिनचर्या तैयार हो रही है...' : 'Creating schedule...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>{t('planDayBtn', lang)}</span>
            </>
          )}
        </button>

        {error && (
          <p className="text-sm text-rose-600 dark:text-rose-400 font-semibold text-center">
            {error}
          </p>
        )}
      </div>

      {/* Generated Schedule Result Card */}
      {planResult && (
        <div className="bg-white dark:bg-stone-900 border-2 border-amber-200 dark:border-amber-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs animate-in fade-in duration-300">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 font-heading">
              {planResult.greeting}
            </h2>
            <p className="text-stone-700 dark:text-stone-300 text-base leading-relaxed">
              {planResult.summary}
            </p>
          </div>

          {/* Schedule Timeline */}
          {planResult.schedule && planResult.schedule.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {lang === 'hi' ? 'आज की समय-सारणी:' : "Today's Timeline:"}
              </h3>
              <div className="space-y-2.5">
                {planResult.schedule.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 flex items-start space-x-3.5"
                  >
                    <div className="min-w-[85px] sm:min-w-[100px] text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center space-x-1.5 pt-0.5">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.time}</span>
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <div className="text-base font-semibold text-stone-900 dark:text-stone-100">
                        {item.activity}
                      </div>
                      {item.notes && (
                        <div className="text-xs text-stone-600 dark:text-stone-400">
                          {item.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wellness Note */}
          {planResult.wellnessNote && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 text-sm font-medium flex items-start space-x-2.5">
              <Heart className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-amber-900 dark:text-amber-300 mb-0.5">
                  {lang === 'hi' ? 'आज का विचार:' : 'Thought for today:'}
                </strong>
                <span>{planResult.wellnessNote}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
