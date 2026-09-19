import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Clock,
  AlertCircle,
  Repeat,
  CalendarCheck,
  X,
} from 'lucide-react';
import { GeneralReminder, Language } from '../types';
import { VoiceSpeakerButton } from './VoiceSpeakerButton';

interface RemindersManagerProps {
  language: Language;
  onNavigateToCheck?: () => void;
}

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const RemindersManager: React.FC<RemindersManagerProps> = ({ language }) => {
  const todayStr = getLocalDateString();

  const [reminders, setReminders] = useState<GeneralReminder[]>(() => {
    const saved = localStorage.getItem('saarthi_reminders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.warn('Could not parse saarthi_reminders');
      }
    }
    return [];
  });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState(todayStr);
  const [newDueTime, setNewDueTime] = useState('10:00');
  const [newRecurrence, setNewRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [newNote, setNewNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('saarthi_reminders', JSON.stringify(reminders));
  }, [reminders]);

  const handleToggleComplete = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextCompleted = !r.isCompleted;

          // If recurring and being marked complete, advance due date
          if (nextCompleted && r.recurrence && r.recurrence !== 'none' && r.dueDate) {
            const currentD = new Date(r.dueDate);
            if (r.recurrence === 'daily') {
              currentD.setDate(currentD.getDate() + 1);
            } else if (r.recurrence === 'weekly') {
              currentD.setDate(currentD.getDate() + 7);
            } else if (r.recurrence === 'monthly') {
              currentD.setMonth(currentD.getMonth() + 1);
            }
            const nextDue = getLocalDateString(currentD);
            return {
              ...r,
              dueDate: nextDue,
              isCompleted: false, // reset for next cycle
              completedAt: new Date().toISOString(),
            };
          }

          return {
            ...r,
            isCompleted: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : null,
          };
        }
        return r;
      })
    );
  };

  const handleDelete = (id: string, title: string) => {
    const confirmDelete = window.confirm(
      language === 'hi'
        ? `क्या आप रिमाइंडर "${title}" को हटाना चाहते हैं?`
        : `Delete reminder "${title}"?`
    );
    if (confirmDelete) {
      setReminders((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const titleTrimmed = newTitle.trim();
    if (!titleTrimmed) {
      setFormError('Please enter a reminder title.');
      return;
    }

    // Check for duplicate pending reminders
    const isDuplicate = reminders.some(
      (r) => !r.isCompleted && r.title.toLowerCase() === titleTrimmed.toLowerCase()
    );
    if (isDuplicate) {
      setFormError('A pending reminder with this exact title already exists.');
      return;
    }

    const newReminder: GeneralReminder = {
      id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: titleTrimmed,
      dueDate: newDueDate.trim() || null,
      dueTime: newDueTime.trim() || null,
      recurrence: newRecurrence,
      note: newNote.trim(),
      isCompleted: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    setReminders([newReminder, ...reminders]);
    setNewTitle('');
    setNewDueDate(todayStr);
    setNewDueTime('10:00');
    setNewRecurrence('none');
    setNewNote('');
    setIsAddOpen(false);
  };

  // Sort reminders: pending first, ordered chronologically by due date & time, then completed
  const sortedReminders = useMemo(() => {
    return [...reminders].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      // If both pending or both completed, compare dates
      if (a.dueDate && b.dueDate) {
        const dateCompare = a.dueDate.localeCompare(b.dueDate);
        if (dateCompare !== 0) return dateCompare;
        const timeA = a.dueTime || '00:00';
        const timeB = b.dueTime || '00:00';
        return timeA.localeCompare(timeB);
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [reminders]);

  const pendingCount = reminders.filter((r) => !r.isCompleted).length;
  const completedCount = reminders.filter((r) => r.isCompleted).length;

  const firstPending = sortedReminders.find((r) => !r.isCompleted);
  const spokenSummary = `You have ${pendingCount} pending reminders. ${
    firstPending
      ? `Next reminder is: ${firstPending.title}, due ${firstPending.dueDate || 'soon'}.`
      : 'All reminders are completed. Wonderful!'
  }`;

  return (
    <div id="reminders-manager-section" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-50 via-stone-50 to-orange-50 border border-amber-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs uppercase tracking-wide">
              <Calendar className="w-4 h-4 text-amber-700" />
              <span>याददाश्त साथी • Daily & Bill Reminders</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 font-heading">
              {language === 'hi' ? 'महत्वपूर्ण काम और बिल रिमाइंडर' : 'My Daily & Bill Reminders'}
            </h2>
            <p className="text-stone-600 text-base max-w-2xl leading-relaxed">
              {language === 'hi'
                ? 'बिजली बिल की अंतिम तारीख, डॉक्टर की अपॉइंटमेंट या बैंक का काम—सारथी समय पर याद रखेगा।'
                : 'Keep track of utility bills, doctor visits, pension deadlines, and family events without stress.'}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            {reminders.length > 0 && (
              <VoiceSpeakerButton textToSpeak={spokenSummary} label="Listen / सुनें" size="md" />
            )}
            <button
              id="add-reminder-btn"
              type="button"
              onClick={() => {
                setIsAddOpen(true);
                setFormError(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold text-sm shadow-md transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'hi' ? 'रिमाइंडर जोड़ें' : 'Add Reminder'}</span>
            </button>
          </div>
        </div>

        {/* Counter */}
        <div className="mt-4 pt-3 border-t border-amber-200/80 flex items-center gap-2 text-sm text-stone-700">
          <span className="font-bold text-stone-900">{pendingCount}</span>
          <span>pending reminders</span>
          <span className="text-stone-400">•</span>
          <span>{completedCount} completed</span>
        </div>
      </div>

      {/* Add Reminder Modal / Form */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-amber-600" />
                <span>Add a New Reminder</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAdd} className="space-y-3.5 text-sm">
              <div>
                <label htmlFor="rem-title" className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Reminder Title *
                </label>
                <input
                  id="rem-title"
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Electricity Bill, Dr. Sharma Appointment, Gas cylinder booking"
                  className="w-full p-3 rounded-xl border border-stone-300 text-base focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="rem-due-date" className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Due Date (तारीख)
                  </label>
                  <input
                    id="rem-due-date"
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="rem-due-time" className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Time (समय)
                  </label>
                  <input
                    id="rem-due-time"
                    type="time"
                    value={newDueTime}
                    onChange={(e) => setNewDueTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="rem-recurrence" className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Repeat Routine (पुनरावृत्ति):
                </label>
                <select
                  id="rem-recurrence"
                  value={newRecurrence}
                  onChange={(e) => setNewRecurrence(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-sm focus:border-amber-500 focus:outline-none"
                >
                  <option value="none">One-time only (सिर्फ एक बार)</option>
                  <option value="daily">Every day (रोजाना)</option>
                  <option value="weekly">Every week (हर हफ्ते)</option>
                  <option value="monthly">Every month (हर महीने - जैसे बिजली/गैस बिल)</option>
                </select>
              </div>

              <div>
                <label htmlFor="rem-note" className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Helpful Note or Instruction:
                </label>
                <textarea
                  id="rem-note"
                  rows={2}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="e.g. Carry Aadhaar Card and previous receipt..."
                  className="w-full p-3 rounded-xl border border-stone-300 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-stone-600 font-semibold hover:bg-stone-100 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs text-xs"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reminders List */}
      <div className="space-y-3">
        {sortedReminders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-stone-200 p-6 space-y-3">
            <Calendar className="w-12 h-12 text-stone-300 mx-auto" />
            <div className="space-y-1">
              <p className="text-stone-700 text-base font-bold">No reminders added yet.</p>
              <p className="text-stone-400 text-sm">
                Tap "Add Reminder" above to set dates for utility bills, doctor visits, or life certificates.
              </p>
            </div>
          </div>
        ) : (
          sortedReminders.map((r) => {
            const isOverdue = !r.isCompleted && r.dueDate && r.dueDate < todayStr;
            const isToday = !r.isCompleted && r.dueDate === todayStr;

            return (
              <div
                key={r.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  r.isCompleted
                    ? 'bg-stone-50 border-stone-200 opacity-60'
                    : isOverdue
                    ? 'bg-rose-50/50 border-rose-300 shadow-xs'
                    : isToday
                    ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                    : 'bg-white border-stone-200 hover:border-amber-300 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(r.id)}
                    className="mt-1 text-stone-400 hover:text-emerald-600 transition-colors focus:outline-none"
                    title={r.isCompleted ? 'Mark pending' : 'Mark completed'}
                  >
                    {r.isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-stone-400 hover:text-stone-600" />
                    )}
                  </button>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-base sm:text-lg font-bold text-stone-900 ${
                          r.isCompleted ? 'line-through text-stone-500' : ''
                        }`}
                      >
                        {r.title}
                      </h4>
                      {isOverdue && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                          Overdue (तारीख निकल गई)
                        </span>
                      )}
                      {isToday && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          Due Today (आज का काम)
                        </span>
                      )}
                      {r.recurrence && r.recurrence !== 'none' && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 flex items-center gap-1 border border-stone-200">
                          <Repeat className="w-3 h-3 text-stone-500" />
                          <span>{r.recurrence}</span>
                        </span>
                      )}
                    </div>

                    {r.dueDate && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-stone-600">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>
                          {r.dueDate} {r.dueTime ? `at ${r.dueTime}` : ''}
                        </span>
                      </div>
                    )}

                    {r.note && (
                      <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{r.note}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id, r.title)}
                    className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Delete reminder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
