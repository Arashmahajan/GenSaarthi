import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle2, Circle, Trash2, Clock, AlertCircle } from 'lucide-react';
import { GeneralReminder, Language } from '../types';
import { VoiceSpeakerButton } from './VoiceSpeakerButton';

interface RemindersManagerProps {
  language: Language;
  onNavigateToCheck?: () => void;
}

const DEFAULT_INITIAL_REMINDERS: GeneralReminder[] = [
  {
    id: 'rem-1',
    title: 'Electricity Bill Payment',
    dueDate: '28th of this month',
    note: 'Pay via PhonePe / Electricity counter to avoid surcharge.',
    isCompleted: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rem-2',
    title: 'Dr. Sharma Clinic Blood Pressure Checkup',
    dueDate: 'Coming Saturday 10:30 AM',
    note: 'Take blood sugar & BP record diary along.',
    isCompleted: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rem-3',
    title: 'Jeevan Pramaan Life Certificate Submission',
    dueDate: 'November 30',
    note: 'Submit digital life certificate using Face RD App from home.',
    isCompleted: false,
    createdAt: new Date().toISOString(),
  },
];

export const RemindersManager: React.FC<RemindersManagerProps> = ({ language }) => {
  const [reminders, setReminders] = useState<GeneralReminder[]>(() => {
    const saved = localStorage.getItem('saarthi_reminders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_INITIAL_REMINDERS;
  });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    localStorage.setItem('saarthi_reminders', JSON.stringify(reminders));
  }, [reminders]);

  const handleToggleComplete = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isCompleted: !r.isCompleted } : r))
    );
  };

  const handleDelete = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newReminder: GeneralReminder = {
      id: `rem-${Date.now()}`,
      title: newTitle.trim(),
      dueDate: newDueDate.trim() || null,
      note: newNote.trim(),
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    setReminders([newReminder, ...reminders]);
    setNewTitle('');
    setNewDueDate('');
    setNewNote('');
    setIsAddOpen(false);
  };

  const pendingCount = reminders.filter((r) => !r.isCompleted).length;

  const spokenSummary = `You have ${pendingCount} pending reminders. ${
    pendingCount > 0
      ? `First reminder is: ${reminders.find((r) => !r.isCompleted)?.title}.`
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
            <VoiceSpeakerButton textToSpeak={spokenSummary} label="Listen / सुनें" size="md" />
            <button
              id="add-reminder-btn"
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold text-sm shadow-md transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Reminder</span>
            </button>
          </div>
        </div>

        {/* Counter */}
        <div className="mt-4 pt-3 border-t border-amber-200/80 flex items-center gap-2 text-sm text-stone-700">
          <span className="font-bold text-stone-900">{pendingCount}</span>
          <span>pending reminders</span>
          <span className="text-stone-400">•</span>
          <span>{reminders.filter((r) => r.isCompleted).length} completed</span>
        </div>
      </div>

      {/* Add Reminder Modal / Form */}
      {isAddOpen && (
        <form
          onSubmit={handleAdd}
          className="bg-white border-2 border-amber-300 rounded-3xl p-6 shadow-md space-y-4 animate-in fade-in"
        >
          <h3 className="text-lg font-bold text-stone-900">Add a New Reminder</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                placeholder="e.g. Water Bill, Gas cylinder booking, Doctor appointment"
                className="w-full p-3 rounded-xl border border-stone-300 text-base focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="rem-due-date" className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Due Date / Time
              </label>
              <input
                id="rem-due-date"
                type="text"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                placeholder="e.g. 25th October, Next Monday 11 AM"
                className="w-full p-3 rounded-xl border border-stone-300 text-base focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label htmlFor="rem-note" className="block text-xs font-bold text-stone-700 uppercase mb-1">
              Helpful Note
            </label>
            <textarea
              id="rem-note"
              rows={2}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Any details or steps to remember..."
              className="w-full p-3 rounded-xl border border-stone-300 text-base focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-stone-600 font-semibold hover:bg-stone-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs"
            >
              Save Reminder
            </button>
          </div>
        </form>
      )}

      {/* Reminders List */}
      <div className="space-y-3">
        {reminders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-stone-200 p-6">
            <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-600 text-base font-medium">No reminders added yet.</p>
            <p className="text-stone-400 text-sm mt-1">
              Tap "Add Reminder" or check a bill in the Check screen to add one automatically!
            </p>
          </div>
        ) : (
          reminders.map((r) => (
            <div
              key={r.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                r.isCompleted
                  ? 'bg-stone-50 border-stone-200 opacity-60'
                  : 'bg-white border-stone-200 hover:border-amber-300 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <button
                  type="button"
                  onClick={() => handleToggleComplete(r.id)}
                  className="mt-1 text-stone-400 hover:text-emerald-600 transition-colors"
                  title={r.isCompleted ? 'Mark pending' : 'Mark completed'}
                >
                  {r.isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <Circle className="w-6 h-6 text-stone-400 hover:text-stone-600" />
                  )}
                </button>
                <div className="space-y-1">
                  <h4
                    className={`text-base sm:text-lg font-bold text-stone-900 ${
                      r.isCompleted ? 'line-through text-stone-500' : ''
                    }`}
                  >
                    {r.title}
                  </h4>
                  {r.dueDate && (
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-amber-800">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{r.dueDate}</span>
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
                  onClick={() => handleDelete(r.id)}
                  className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Delete reminder"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
