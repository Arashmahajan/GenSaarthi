import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, Heart, Sun, Loader2, Calendar, Pill, CheckSquare, Square } from 'lucide-react';
import { DayPlanResult, Language, GeneralReminder, MedicineItem } from '../types';
import { VoiceSpeakerButton } from './VoiceSpeakerButton';

interface PlanMyDayProps {
  language: Language;
}

const PRESET_ROUTINES = [
  {
    label: '🏡 Peaceful Day at Home',
    text: 'A quiet relaxing day at home with morning tea on the balcony, daily medicines, newspaper reading, and light evening walk.',
  },
  {
    label: '🩺 Doctor Appointment Day',
    text: 'Morning hospital appointment with doctor for routine blood pressure checkup, taking test reports, and pharmacy visit.',
  },
  {
    label: '🛕 Temple & Family Evening',
    text: 'Morning prayers, visit to the nearby temple with friends, afternoon rest, and evening tea with grandchildren.',
  },
];

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const PlanMyDay: React.FC<PlanMyDayProps> = ({ language }) => {
  const todayStr = getLocalDateString();

  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [planResult, setPlanResult] = useState<DayPlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Saved data from localStorage
  const [includeSavedData, setIncludeSavedData] = useState(true);
  const [savedReminders, setSavedReminders] = useState<GeneralReminder[]>([]);
  const [savedMedicines, setSavedMedicines] = useState<MedicineItem[]>([]);

  useEffect(() => {
    try {
      const remRaw = localStorage.getItem('saarthi_reminders');
      if (remRaw) {
        const parsed = JSON.parse(remRaw);
        if (Array.isArray(parsed)) {
          // Filter to pending reminders or reminders due today
          setSavedReminders(parsed.filter((r) => !r.isCompleted || r.dueDate === todayStr));
        }
      }
    } catch (e) {
      console.warn('Error reading reminders for PlanMyDay');
    }

    try {
      const medRaw = localStorage.getItem('saarthi_medicines');
      if (medRaw) {
        const parsed = JSON.parse(medRaw);
        if (Array.isArray(parsed)) {
          setSavedMedicines(parsed);
        }
      }
    } catch (e) {
      console.warn('Error reading medicines for PlanMyDay');
    }
  }, [todayStr]);

  const handlePlan = async (routineText?: string) => {
    const textToSubmit = routineText !== undefined ? routineText : notes;
    setIsLoading(true);
    setError(null);

    // Format reminders and medicines strings if checked
    let remindersToSend: string[] | undefined;
    let medicinesToSend: string[] | undefined;

    if (includeSavedData) {
      if (savedReminders.length > 0) {
        remindersToSend = savedReminders.map(
          (r) => `${r.title}${r.dueTime ? ` at ${r.dueTime}` : ''}${r.note ? ` - Note: ${r.note}` : ''}`
        );
      }
      if (savedMedicines.length > 0) {
        medicinesToSend = savedMedicines.map(
          (m) => `${m.name} (${m.dosage}) - ${m.timeLabel} (${m.withFood.replace('_', ' ')})`
        );
      }
    }

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routinesOrNotes: textToSubmit.trim() || undefined,
          language: language === 'hi' ? 'hi' : 'en',
          savedReminders: remindersToSend,
          scheduledMedicines: medicinesToSend,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error?.message || 'Failed to generate daily plan.');
      }

      const data: DayPlanResult = await res.json();
      setPlanResult(data);
    } catch (err: any) {
      console.error(err);
      // Clear stale plan result so user isn't misled by outdated schedule
      setPlanResult(null);
      setError(
        language === 'hi'
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
      text += `Here is your peaceful schedule: `;
      for (const item of plan.schedule) {
        text += `At ${item.time}, ${item.activity}. `;
      }
    }
    if (plan.wellnessNote) {
      text += `Thought for today: ${plan.wellnessNote}`;
    }
    return text;
  };

  return (
    <div id="plan-my-day-section" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-stone-100 border border-amber-200 rounded-3xl p-6 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs uppercase tracking-wide">
            <Sun className="w-4 h-4 text-amber-700" />
            <span>दिनचर्या साथी • Calm Senior Day Planner</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 font-heading">
            {language === 'hi' ? 'आज का दिन शांति से प्लान करें' : 'Plan a Calm & Unhurried Day'}
          </h2>
          <p className="text-stone-600 text-base max-w-2xl leading-relaxed">
            {language === 'hi'
              ? 'बिना किसी तनाव के अपनी दिनचर्या बनाएं—समय पर नाश्ता, दवा, धूप में बैठना और परिवार के साथ समय।'
              : 'Tell Saarthi what you have in mind today, or choose a preset routine. We will create a gentle, balanced schedule for you.'}
          </p>
        </div>

        {/* Preset Routine Chips */}
        <div className="mt-5 pt-4 border-t border-amber-200">
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-2">
            Quick Routines (Click to generate plan):
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_ROUTINES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setNotes(preset.text);
                  handlePlan(preset.text);
                }}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-xs font-bold text-stone-800 shadow-xs transition-transform active:scale-95"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Card */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
        <label htmlFor="plan-notes-input" className="block text-base font-bold text-stone-900">
          {language === 'hi'
            ? 'आज के आपके क्या विचार या काम हैं?'
            : 'Any specific activities, doctor visits, or preferences for today?'}
        </label>
        <textarea
          id="plan-notes-input"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Morning walk in the park, doctor checkup at 11 AM, grandchildren visiting in evening..."
          className="w-full p-4 rounded-2xl border border-stone-300 text-stone-800 text-base focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none"
        />

        {/* Integration of Saved Reminders & Medicines Toggle */}
        {(savedReminders.length > 0 || savedMedicines.length > 0) && (
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold uppercase tracking-wide text-stone-600 block">
                Saved Profile Data:
              </span>
              <p className="text-sm font-semibold text-stone-800 flex items-center gap-2 flex-wrap">
                {savedReminders.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>{savedReminders.length} saved tasks</span>
                  </span>
                )}
                {savedReminders.length > 0 && savedMedicines.length > 0 && <span>•</span>}
                {savedMedicines.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Pill className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{savedMedicines.length} scheduled medicines</span>
                  </span>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIncludeSavedData(!includeSavedData)}
              className="inline-flex items-center gap-2 text-xs font-bold text-stone-800 hover:text-stone-950 self-start sm:self-center"
            >
              {includeSavedData ? (
                <CheckSquare className="w-5 h-5 text-amber-600" />
              ) : (
                <Square className="w-5 h-5 text-stone-400" />
              )}
              <span>Include saved tasks & medicines in plan</span>
            </button>
          </div>
        )}

        <div className="flex justify-end">
          <button
            id="generate-plan-btn"
            type="button"
            disabled={isLoading}
            onClick={() => handlePlan()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 text-white font-bold rounded-2xl shadow-md transition-transform active:scale-95 text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating calm schedule...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>{language === 'hi' ? 'दिनचर्या बनाएं' : 'Create My Schedule'}</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
            {error}
          </div>
        )}
      </div>

      {/* Plan Result */}
      {planResult && (
        <div
          id="day-plan-result"
          className="bg-white border-2 border-amber-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-stone-900 font-heading">
                {planResult.greeting}
              </h3>
              <p className="text-stone-600 text-base mt-1">{planResult.summary}</p>
            </div>
            <VoiceSpeakerButton
              textToSpeak={getSpokenPlan(planResult)}
              label="Listen / सुनें"
              size="md"
            />
          </div>

          {/* Schedule Slots */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Your Daily Rhythm:
            </h4>
            <div className="space-y-3">
              {planResult.schedule.map((slot, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-amber-50/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs shrink-0 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      <span>{slot.time}</span>
                    </div>
                    <div>
                      <span className="text-base font-bold text-stone-900 block">
                        {slot.activity}
                      </span>
                      {slot.tip && (
                        <span className="text-xs text-stone-500 block mt-0.5">💡 {slot.tip}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Wellness Note */}
          {planResult.wellnessNote && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3">
              <Heart className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 block mb-0.5">
                  Peaceful Thought:
                </span>
                <p className="text-sm sm:text-base font-medium leading-relaxed italic">
                  "{planResult.wellnessNote}"
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
