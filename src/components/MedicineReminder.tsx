import React, { useState, useEffect } from 'react';
import { Pill, Clock, CheckCircle2, AlertCircle, Plus, Info, Sparkles, RefreshCw, X, HelpCircle, Loader2 } from 'lucide-react';
import { MedicineItem, Language } from '../types';
import { DEFAULT_MEDICINES } from '../data/saarthiData';
import { VoiceSpeakerButton } from './VoiceSpeakerButton';

interface MedicineReminderProps {
  language: Language;
}

export const MedicineReminder: React.FC<MedicineReminderProps> = ({ language }) => {
  const [medicines, setMedicines] = useState<MedicineItem[]>(() => {
    const saved = localStorage.getItem('saarthi_medicines');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_MEDICINES;
  });

  const [activeTiming, setActiveTiming] = useState<'all' | 'morning' | 'afternoon' | 'evening' | 'night'>('all');
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [explainingMed, setExplainingMed] = useState<MedicineItem | null>(null);
  const [medExplanation, setMedExplanation] = useState<any | null>(null);
  const [isExplainingLoading, setIsExplainingLoading] = useState(false);

  // Week history state: medicineId -> map of day indices (0=Mon, 6=Sun) to boolean
  const [weeklyAdherence, setWeeklyAdherence] = useState<Record<string, boolean[]>>(() => {
    const saved = localStorage.getItem('saarthi_med_weekly');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    // Default sample adherence for Mon-Sun
    return {
      'med-1': [true, true, true, true, true, false, false],
      'med-2': [true, true, true, true, false, false, false],
      'med-3': [true, true, true, true, true, true, false],
    };
  });

  useEffect(() => {
    localStorage.setItem('saarthi_med_weekly', JSON.stringify(weeklyAdherence));
  }, [weeklyAdherence]);

  const toggleWeekDay = (medId: string, dayIndex: number) => {
    setWeeklyAdherence((prev) => {
      const current = prev[medId] || [false, false, false, false, false, false, false];
      const updated = [...current];
      updated[dayIndex] = !updated[dayIndex];
      return { ...prev, [medId]: updated };
    });
  };

  // New medicine form state
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('1 Tablet');
  const [newMedTiming, setNewMedTiming] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  const [newMedFood, setNewMedFood] = useState<'after_food' | 'before_food' | 'with_food' | 'anytime'>('after_food');
  const [newMedPurpose, setNewMedPurpose] = useState('');
  const [newMedPillCount, setNewMedPillCount] = useState(30);

  useEffect(() => {
    localStorage.setItem('saarthi_medicines', JSON.stringify(medicines));
  }, [medicines]);

  const handleToggleTaken = (id: string) => {
    setMedicines((prev) =>
      prev.map((med) => {
        if (med.id === id) {
          const nowTaken = !med.takenToday;
          const timeString = new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          });
          return {
            ...med,
            takenToday: nowTaken,
            takenAt: nowTaken ? timeString : undefined,
            remainingPills: nowTaken ? Math.max(0, med.remainingPills - 1) : med.remainingPills + 1,
          };
        }
        return med;
      })
    );
  };

  const handleExplainMedicine = async (med: MedicineItem) => {
    setExplainingMed(med);
    setIsExplainingLoading(true);
    setMedExplanation(null);

    try {
      const response = await fetch('/api/medicine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineName: med.name,
          dosage: med.dosage,
          instructions: med.doctorNotes,
        }),
      });
      const data = await response.json();
      setMedExplanation(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExplainingLoading(false);
    }
  };

  const handleAddMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;

    const timeLabels = {
      morning: 'Morning (8:00 AM)',
      afternoon: 'Afternoon (1:30 PM)',
      evening: 'Evening (6:00 PM)',
      night: 'Night (9:00 PM)',
    };

    const newMed: MedicineItem = {
      id: `med-${Date.now()}`,
      name: newMedName,
      dosage: newMedDosage,
      timing: newMedTiming,
      timeLabel: timeLabels[newMedTiming],
      withFood: newMedFood,
      purpose: newMedPurpose || 'Prescribed by doctor for health wellness',
      takenToday: false,
      colorBadge: 'bg-amber-100 text-amber-800 border-amber-300',
      pillIconType: 'tablet',
      remainingPills: Number(newMedPillCount) || 30,
      doctorNotes: `Take ${newMedFood.replace('_', ' ')} with water.`,
    };

    setMedicines([...medicines, newMed]);
    setIsAddModalOpen(false);
    setNewMedName('');
    setNewMedPurpose('');
  };

  const filteredMedicines =
    activeTiming === 'all'
      ? medicines
      : medicines.filter((m) => m.timing === activeTiming);

  const takenCount = medicines.filter((m) => m.takenToday).length;
  const totalCount = medicines.length;

  const todaySummarySpoken = `Medicine summary for today: You have taken ${takenCount} out of ${totalCount} medicines. ${
    totalCount - takenCount > 0
      ? `${totalCount - takenCount} medicines are still remaining for today.`
      : 'All medicines taken. Shabash!'
  }`;

  return (
    <div id="medicine-reminder-section" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs uppercase tracking-wide">
              <Pill className="w-4 h-4 text-emerald-700" />
              <span>दवाई साथी • Daily Health & Pill Tracker</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 font-heading">
              Daily Medicines & Timely Routine
            </h2>
            <p className="text-stone-600 text-base max-w-2xl leading-relaxed">
              Never miss a dose or take the wrong pill. Tap <strong className="text-stone-800 font-semibold">"Maine Le Li"</strong> when taken. Saarthi keeps your loved ones stress-free.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <VoiceSpeakerButton
              textToSpeak={todaySummarySpoken}
              label="Today's Schedule / सुनें"
              size="md"
            />
            <button
              id="add-medicine-btn"
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-md transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medicine</span>
            </button>
          </div>
        </div>

        {/* Progress Tracker Card */}
        <div className="mt-5 pt-4 border-t border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {takenCount}/{totalCount}
            </div>
            <div>
              <span className="text-xs text-stone-600 uppercase font-semibold block">Today's Progress:</span>
              <span className="text-base font-extrabold text-stone-900">
                {takenCount === totalCount
                  ? '🎉 All medicines taken for today! Wonderful.'
                  : `${totalCount - takenCount} medicines pending for today`}
              </span>
            </div>
          </div>

          <div className="w-full sm:w-64 bg-emerald-200/70 h-3 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (takenCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* View Mode Switcher: Today's Schedule vs. Week View */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200">
        <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl">
          <button
            id="view-today-btn"
            type="button"
            onClick={() => setViewMode('today')}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              viewMode === 'today'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Today's Routine (आज)
          </button>
          <button
            id="view-week-btn"
            type="button"
            onClick={() => setViewMode('week')}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              viewMode === 'week'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Week View (पूरा सप्ताह)
          </button>
        </div>

        {viewMode === 'today' && (
          /* Time-of-Day Filter Chips */
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All', count: medicines.length },
              { id: 'morning', label: '🌅 Morning', count: medicines.filter((m) => m.timing === 'morning').length },
              { id: 'afternoon', label: '☀️ Afternoon', count: medicines.filter((m) => m.timing === 'afternoon').length },
              { id: 'evening', label: '🌇 Evening', count: medicines.filter((m) => m.timing === 'evening').length },
              { id: 'night', label: '🌙 Night', count: medicines.filter((m) => m.timing === 'night').length },
            ].map((tab) => (
              <button
                key={tab.id}
                id={`timing-tab-${tab.id}`}
                type="button"
                onClick={() => setActiveTiming(tab.id as any)}
                className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTiming === tab.id
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${activeTiming === tab.id ? 'bg-stone-700 text-stone-100' : 'bg-stone-200 text-stone-700'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Week View Section */}
      {viewMode === 'week' ? (
        <div id="medicine-week-view" className="bg-white border-2 border-emerald-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-xl font-bold text-stone-900">Weekly Medicine Adherence</h3>
              <p className="text-stone-500 text-sm">
                Tap on any day (Mon-Sun) to check off your medicine dose for that day.
              </p>
            </div>
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full self-start">
              Current Week (Monday - Sunday)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-stone-200 text-xs font-bold text-stone-500 uppercase">
                  <th className="py-3 px-3">Medicine & Timing</th>
                  {['Mon (सोम)', 'Tue (मंगल)', 'Wed (बुध)', 'Thu (गुरु)', 'Fri (शुक्र)', 'Sat (शनि)', 'Sun (रवि)'].map((day, i) => (
                    <th key={i} className="py-3 px-2 text-center">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {medicines.map((med) => {
                  const days = weeklyAdherence[med.id] || [false, false, false, false, false, false, false];
                  return (
                    <tr key={med.id} className="hover:bg-stone-50/80">
                      <td className="py-3 px-3 font-semibold text-stone-900">
                        <div className="flex items-center gap-2">
                          <Pill className="w-4 h-4 text-emerald-600" />
                          <div>
                            <span className="block font-bold">{med.name}</span>
                            <span className="text-xs text-stone-500 font-normal">
                              {med.dosage} • {med.timeLabel}
                            </span>
                          </div>
                        </div>
                      </td>
                      {days.map((isDone, dIdx) => (
                        <td key={dIdx} className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => toggleWeekDay(med.id, dIdx)}
                            className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl transition-transform active:scale-95 ${
                              isDone
                                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                                : 'bg-stone-100 hover:bg-stone-200 text-stone-400 border border-stone-300'
                            }`}
                            title={`Toggle ${med.name} for day ${dIdx + 1}`}
                          >
                            {isDone ? '✓' : '—'}
                          </button>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Medicines Grid */
        <div className="grid md:grid-cols-2 gap-4">
        {filteredMedicines.map((med) => {
          const isLowPills = med.remainingPills <= 5;
          return (
            <div
              key={med.id}
              id={`med-card-${med.id}`}
              className={`border-2 rounded-3xl p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                med.takenToday
                  ? 'bg-emerald-50/40 border-emerald-300'
                  : 'bg-white border-stone-200 hover:border-amber-400'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                        med.takenToday
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      <Pill className="w-6 h-6" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg md:text-xl font-bold text-stone-900">
                          {med.name}
                        </h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                          {med.dosage}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-emerald-800 mt-0.5">
                        {med.purpose}
                      </p>
                    </div>
                  </div>

                  {/* Explain Button */}
                  <button
                    id={`explain-btn-${med.id}`}
                    type="button"
                    onClick={() => handleExplainMedicine(med)}
                    className="p-2 rounded-xl text-amber-800 hover:bg-amber-100/70 border border-amber-200 transition-colors"
                    title="Explain in plain words why doctor prescribed this"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>

                {/* Timing & Food Guideline */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs md:text-sm">
                  <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-200 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-stone-500 shrink-0" />
                    <span className="font-semibold text-stone-800 truncate">{med.timeLabel}</span>
                  </div>

                  <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-200 flex items-center space-x-2">
                    <span className="font-bold text-amber-700">🍽️</span>
                    <span className="font-medium text-stone-700 truncate">
                      {med.withFood === 'before_food'
                        ? 'Khali Pet (Before Food)'
                        : med.withFood === 'after_food'
                        ? 'Khane ke Baad (After Food)'
                        : 'With Food'}
                    </span>
                  </div>
                </div>

                {med.doctorNotes && (
                  <p className="mt-2.5 text-xs text-stone-500 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                    <strong className="text-stone-700 not-italic">Doctor's Note:</strong> {med.doctorNotes}
                  </p>
                )}
              </div>

              {/* Bottom Card Actions */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="text-stone-500 block">Pills in Box:</span>
                  <span
                    className={`font-bold ${
                      isLowPills ? 'text-rose-600 flex items-center gap-1' : 'text-stone-800'
                    }`}
                  >
                    {isLowPills && <AlertCircle className="w-3.5 h-3.5" />}
                    {med.remainingPills} tablets left
                  </span>
                </div>

                <button
                  id={`taken-btn-${med.id}`}
                  type="button"
                  onClick={() => handleToggleTaken(med.id)}
                  className={`px-4 py-2.5 rounded-2xl font-extrabold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-sm ${
                    med.takenToday
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-300'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    {med.takenToday
                      ? `Maine Le Li (${med.takenAt || 'Taken'})`
                      : 'Maine Le Li (Take Now)'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* AI Explanation Modal */}
      {explainingMed && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold text-stone-900">
                  About {explainingMed.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExplainingMed(null)}
                className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isExplainingLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
                <p className="text-stone-600 text-sm font-medium">
                  Consulting medical knowledge base for seniors...
                </p>
              </div>
            ) : medExplanation ? (
              <div className="space-y-4 text-sm text-stone-800">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1">
                  <span className="text-xs font-bold text-amber-900 uppercase">What it does (यह दवाई किसलिए है):</span>
                  <p className="text-base text-stone-900 font-medium">{medExplanation.whatItDoes}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-stone-50 rounded-xl p-3 border border-stone-200">
                    <span className="text-xs font-bold text-stone-600 block mb-1">Best Timing:</span>
                    <p className="text-xs md:text-sm font-semibold text-stone-800">{medExplanation.bestTimeToTake}</p>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-3 border border-stone-200">
                    <span className="text-xs font-bold text-stone-600 block mb-1">Food Guidance:</span>
                    <p className="text-xs md:text-sm font-semibold text-stone-800">{medExplanation.foodGuidance}</p>
                  </div>
                </div>

                {medExplanation.missedDoseAdvice && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 space-y-1">
                    <span className="text-xs font-bold text-blue-900 block">If you forget a dose (भूल जाने पर क्या करें):</span>
                    <p className="text-xs md:text-sm text-blue-950">{medExplanation.missedDoseAdvice}</p>
                  </div>
                )}

                {medExplanation.simplePrecautions && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-stone-700 block">Precautions:</span>
                    <ul className="list-disc list-inside text-xs text-stone-600 space-y-1">
                      {medExplanation.simplePrecautions.map((p: string, i: number) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-[11px] text-stone-400 italic text-center pt-2 border-t border-stone-100">
                  Saarthi provides gentle guidance. Always verify medication changes with your consulting physician.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Add New Medicine Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>Add Medicine to Schedule</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMedicine} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Medicine Name:
                </label>
                <input
                  type="text"
                  required
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  placeholder="e.g. Telma 40 or Ecosprin 75"
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-stone-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Dosage:
                  </label>
                  <input
                    type="text"
                    value={newMedDosage}
                    onChange={(e) => setNewMedDosage(e.target.value)}
                    placeholder="e.g. 1 Tablet / 5 ml"
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Total Pills in Strip:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newMedPillCount}
                    onChange={(e) => setNewMedPillCount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Timing:
                  </label>
                  <select
                    value={newMedTiming}
                    onChange={(e) => setNewMedTiming(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-stone-900"
                  >
                    <option value="morning">Morning (सुबह)</option>
                    <option value="afternoon">Afternoon (दोपहर)</option>
                    <option value="evening">Evening (शाम)</option>
                    <option value="night">Night (रात)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Food Instruction:
                  </label>
                  <select
                    value={newMedFood}
                    onChange={(e) => setNewMedFood(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-stone-900"
                  >
                    <option value="after_food">After Food (खाने के बाद)</option>
                    <option value="before_food">Before Food (खाली पेट)</option>
                    <option value="with_food">With Food (खाने के साथ)</option>
                    <option value="anytime">Anytime</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Purpose in simple words:
                </label>
                <input
                  type="text"
                  value={newMedPurpose}
                  onChange={(e) => setNewMedPurpose(e.target.value)}
                  placeholder="e.g. For Blood Pressure / Sugar / Joint Pain"
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-stone-900"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
