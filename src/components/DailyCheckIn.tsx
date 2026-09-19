import React, { useState } from 'react';
import {
  Smile,
  Meh,
  Frown,
  Heart,
  PhoneCall,
  MessageSquare,
  AlertTriangle,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MoodType, DailyCheckinRecord } from '../types';
import { getTodayDateString, parseAnyDateToISO } from '../utils/dates';
import { formatTelUrl, formatWhatsAppUrl } from '../utils/phone';
import { t } from '../i18n';

export const CHECKIN_THRESHOLDS = {
  CONSECUTIVE_LOW: 3,
  CONSECUTIVE_LOW_OR_SOSO: 5,
} as const;

/**
 * Checks whether the recent consecutive daily check-ins trigger a gentle family nudge.
 * Missing days reset the consecutive streak.
 */
export function evaluateCheckinNudge(checkins: DailyCheckinRecord[]): boolean {
  if (!checkins || checkins.length === 0) return false;

  // Sort by date ascending
  const sorted = [...checkins].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const latestDate = new Date(latest.date);

  // Check 3 consecutive 'low'
  let lowStreak = 0;
  let sosoOrLowStreak = 0;

  for (let i = 0; i < CHECKIN_THRESHOLDS.CONSECUTIVE_LOW_OR_SOSO; i++) {
    const targetDate = new Date(latestDate);
    targetDate.setDate(targetDate.getDate() - i);
    const targetStr = targetDate.toISOString().slice(0, 10);

    const record = sorted.find((r) => r.date === targetStr);
    if (!record) {
      // Gap day resets streak
      break;
    }

    if (record.mood === 'low') {
      lowStreak += 1;
      sosoOrLowStreak += 1;
    } else if (record.mood === 'soso') {
      sosoOrLowStreak += 1;
      if (i < CHECKIN_THRESHOLDS.CONSECUTIVE_LOW) {
        // low streak broken
        lowStreak = 0;
      }
    } else {
      // 'good' breaks both streaks
      break;
    }
  }

  if (lowStreak >= CHECKIN_THRESHOLDS.CONSECUTIVE_LOW) {
    return true;
  }
  if (sosoOrLowStreak >= CHECKIN_THRESHOLDS.CONSECUTIVE_LOW_OR_SOSO) {
    return true;
  }

  return false;
}

interface DailyCheckInProps {
  onOpenNotFeelingWell?: () => void;
  onAddContact?: () => void;
}

export const DailyCheckIn: React.FC<DailyCheckInProps> = ({
  onOpenNotFeelingWell,
  onAddContact,
}) => {
  const {
    settings,
    checkins,
    recordCheckin,
    isCheckinEnabled,
    checkinNudgeDismissedDate,
    dismissCheckinNudge,
    contacts,
  } = useApp();

  const lang = settings.language;
  const todayStr = getTodayDateString();
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isCheckinEnabled) return null;

  const todayRecord = checkins.find((c) => c.date === todayStr);
  const currentMood = todayRecord?.mood;

  const handleMoodSelect = (mood: MoodType) => {
    recordCheckin(mood);
    const isUpdate = !!todayRecord;
    setFeedback(isUpdate ? t('moodUpdated', lang) : t('moodRecorded', lang));
    setTimeout(() => setFeedback(null), 3000);
  };

  // 7-day strip calculation (last 7 days including today)
  const last7Days: Array<{ dateStr: string; dayName: string; record?: DailyCheckinRecord }> = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayName = d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', {
      weekday: 'short',
    });
    const record = checkins.find((c) => c.date === dateStr);
    last7Days.push({ dateStr, dayName, record });
  }

  const shouldNudge =
    evaluateCheckinNudge(checkins) && checkinNudgeDismissedDate !== todayStr;

  const primaryContact = contacts.find((c) => c.isPrimary) || contacts[0];

  return (
    <div
      id="daily-checkin-card"
      className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 font-heading">
              {t('howAreYouToday', lang)}
            </h2>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-base font-semibold flex items-center space-x-2 animate-in fade-in"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 3 Large Mood Buttons with Icon and Word */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {/* Good */}
        <button
          type="button"
          onClick={() => handleMoodSelect('good')}
          aria-pressed={currentMood === 'good'}
          className={`min-h-[64px] p-3 sm:p-4 rounded-2xl border-2 font-bold text-base sm:text-lg flex flex-col sm:flex-row items-center justify-center gap-2 transition-all ${
            currentMood === 'good'
              ? 'border-emerald-600 bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-100 shadow-xs scale-[1.02]'
              : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200'
          }`}
        >
          <Smile className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{t('moodGood', lang)}</span>
        </button>

        {/* So-so */}
        <button
          type="button"
          onClick={() => handleMoodSelect('soso')}
          aria-pressed={currentMood === 'soso'}
          className={`min-h-[64px] p-3 sm:p-4 rounded-2xl border-2 font-bold text-base sm:text-lg flex flex-col sm:flex-row items-center justify-center gap-2 transition-all ${
            currentMood === 'soso'
              ? 'border-amber-600 bg-amber-100/80 dark:bg-amber-950/70 text-amber-950 dark:text-amber-100 shadow-xs scale-[1.02]'
              : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200'
          }`}
        >
          <Meh className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>{t('moodSoso', lang)}</span>
        </button>

        {/* Not good */}
        <button
          type="button"
          onClick={() => handleMoodSelect('low')}
          aria-pressed={currentMood === 'low'}
          className={`min-h-[64px] p-3 sm:p-4 rounded-2xl border-2 font-bold text-base sm:text-lg flex flex-col sm:flex-row items-center justify-center gap-2 transition-all ${
            currentMood === 'low'
              ? 'border-rose-600 bg-rose-100/80 dark:bg-rose-950/70 text-rose-950 dark:text-rose-100 shadow-xs scale-[1.02]'
              : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200'
          }`}
        >
          <Frown className="w-6 h-6 sm:w-7 sm:h-7 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{t('moodLow', lang)}</span>
        </button>
      </div>

      {/* If "Not good" answered today: show gentle health & emergency advice */}
      {currentMood === 'low' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-3 animate-in fade-in">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-rose-950 dark:text-rose-200">
              {t('unwellAdviceTitle', lang)}
            </h3>
            <p className="text-stone-700 dark:text-stone-300 text-base">
              {t('unwellAdviceText', lang)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {onOpenNotFeelingWell && (
              <button
                type="button"
                onClick={onOpenNotFeelingWell}
                className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-base shadow-xs transition-colors"
              >
                {t('notFeelingWellBtn', lang)}
              </button>
            )}
            <a
              href={formatTelUrl('112')}
              className="min-h-[48px] inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-base shadow-xs transition-colors"
            >
              <PhoneCall className="w-5 h-5" />
              <span>{t('call112', lang)}</span>
            </a>
          </div>
        </div>
      )}

      {/* Gentle Nudge after 3 low days or 5 low/soso days */}
      {shouldNudge && (
        <div
          role="region"
          aria-label="Family check-in suggestion"
          className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 space-y-3 animate-in fade-in"
        >
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-amber-950 dark:text-amber-100">
              {t('checkinNudgeTitle', lang)}
            </h3>
            <p className="text-stone-800 dark:text-stone-200 text-base">
              {t('checkinNudgeSubtitle', lang)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {primaryContact ? (
              <>
                <a
                  href={formatTelUrl(primaryContact.phone)}
                  className="min-h-[48px] inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-base shadow-xs transition-colors"
                >
                  <PhoneCall className="w-5 h-5" />
                  <span>{t('callContactNamed', lang, { name: primaryContact.name })}</span>
                </a>
                <a
                  href={formatWhatsAppUrl(
                    primaryContact.phone,
                    lang === 'hi'
                      ? 'नमस्ते, आपसे कुछ देर बात करने का मन था।'
                      : 'Hello, was hoping to catch up and talk for a bit.'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[48px] inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base shadow-xs transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>{t('messageContact', lang, { name: primaryContact.name })}</span>
                </a>
              </>
            ) : (
              onAddContact && (
                <button
                  type="button"
                  onClick={onAddContact}
                  className="min-h-[48px] inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-base shadow-xs transition-colors"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>{t('addContactPrompt', lang)}</span>
                </button>
              )
            )}

            <button
              type="button"
              onClick={dismissCheckinNudge}
              className="min-h-[48px] px-5 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold text-base transition-colors"
            >
              {t('notNow', lang)}
            </button>
          </div>
        </div>
      )}

      {/* 7-day strip (icon + text, e.g. "Sun: Good") */}
      <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 block mb-2.5">
          {lang === 'hi' ? 'पिछले 7 दिनों का चेक-इन' : 'Past 7 Days'}
        </span>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
          {last7Days.map(({ dateStr, dayName, record }) => {
            const mood = record?.mood;
            const isToday = dateStr === todayStr;

            return (
              <div
                key={dateStr}
                className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-colors ${
                  isToday
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 font-bold'
                    : 'border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-800/70'
                }`}
              >
                <span className="text-xs text-stone-600 dark:text-stone-400">{dayName}</span>
                <div>
                  {mood === 'good' ? (
                    <Smile className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : mood === 'soso' ? (
                    <Meh className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  ) : mood === 'low' ? (
                    <Frown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-dashed border-stone-300 dark:border-stone-600" />
                  )}
                </div>
                <span className="text-[11px] font-medium text-stone-700 dark:text-stone-300 truncate max-w-full">
                  {mood === 'good'
                    ? t('moodGood', lang)
                    : mood === 'soso'
                    ? t('moodSoso', lang)
                    : mood === 'low'
                    ? t('moodLow', lang)
                    : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
