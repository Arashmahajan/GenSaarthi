import React, { useState, useEffect } from 'react';
import {
  Pill,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Info,
  Sparkles,
  RefreshCw,
  X,
  Loader2,
  Trash2,
  ShieldCheck,
  CalendarDays,
  Package,
} from 'lucide-react';
import { MedicineItem, DoseRecord, Language } from '../types';
import { DEFAULT_MEDICINES, SAMPLE_TUTORIAL_MEDICINE } from '../data/saarthiData';
import { VoiceSpeakerButton } from './VoiceSpeakerButton';

interface MedicineReminderProps {
  language: Language;
}

// Local date string helper: "YYYY-MM-DD"
function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Current week (Monday - Sunday) generator based on client local time
function getCurrentWeekDays(): Array<{
  dateStr: string;
  dayNum: number;
  monthNum: number;
  dayLabelEn: string;
  dayLabelHi: string;
  isToday: boolean;
  isFuture: boolean;
}> {
  const today = new Date();
  const todayStr = getLocalDateString(today);
  const currentDayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const days = [];
  const dayNamesEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayNamesHi = ['सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि', 'रवि'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = getLocalDateString(d);
    days.push({
      dateStr,
      dayNum: d.getDate(),
      monthNum: d.getMonth() + 1,
      dayLabelEn: `${dayNamesEn[i]} ${d.getDate()}/${d.getMonth() + 1}`,
      dayLabelHi: `${dayNamesHi[i]} ${d.getDate()}/${d.getMonth() + 1}`,
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
    });
  }
  return days;
}

export const MedicineReminder: React.FC<MedicineReminderProps> = ({ language }) => {
  const todayStr = getLocalDateString();
  const weekDays = getCurrentWeekDays();

  // Medicines list
  const [medicines, setMedicines] = useState<MedicineItem[]>(() => {
    const saved = localStorage.getItem('saarthi_medicines');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.warn('Could not parse saarthi_medicines from localStorage');
      }
    }
    return DEFAULT_MEDICINES;
  });

  // Dose records history (date-specific dose tracking)
  const [doseRecords, setDoseRecords] = useState<DoseRecord[]>(() => {
    const saved = localStorage.getItem('saarthi_dose_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.warn('Could not parse saarthi_dose_records from localStorage');
      }
    }
    // Migration: if there are existing medicines with takenToday = true but no records, create today's record once
    return [];
  });

  const [activeTiming, setActiveTiming] = useState<'all' | 'morning' | 'afternoon' | 'evening' | 'night'>('all');
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refillMed, setRefillMed] = useState<MedicineItem | null>(null);
  const [refillCount, setRefillCount] = useState<number>(30);
  const [explainingMed, setExplainingMed] = useState<MedicineItem | null>(null);
  const [medExplanation, setMedExplanation] = useState<any | null>(null);
  const [isExplainingLoading, setIsExplainingLoading] = useState(false);

  // New medicine form state
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('1 Tablet');
  const [newMedTiming, setNewMedTiming] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  const [newMedFood, setNewMedFood] = useState<'after_food' | 'before_food' | 'with_food' | 'anytime'>('after_food');
  const [newMedPurpose, setNewMedPurpose] = useState('');
  const [newMedPillCount, setNewMedPillCount] = useState(30);

  // Persist medicines
  useEffect(() => {
    localStorage.setItem('saarthi_medicines', JSON.stringify(medicines));
  }, [medicines]);

  // Persist dose records
  useEffect(() => {
    localStorage.setItem('saarthi_dose_records', JSON.stringify(doseRecords));
  }, [doseRecords]);

  // Check if a dose is recorded for a medicine on a specific date
  const getDoseForDate = (medId: string, date: string): DoseRecord | undefined => {
    return doseRecords.find((r) => r.medicineId === medId && r.date === date);
  };

  const isDoseTakenToday = (medId: string): boolean => {
    return Boolean(getDoseForDate(medId, todayStr));
  };

  // Toggle dose for a specific date (today or in weekly calendar)
  const handleToggleDose = (medId: string, targetDate: string = todayStr) => {
    const med = medicines.find((m) => m.id === medId);
    if (!med) return;

    const existingRecord = getDoseForDate(medId, targetDate);

    if (existingRecord) {
      // UNDO DOSE: Remove record and restore pills deducted (prevent inventory corruption)
      const pillsToRestore = existingRecord.pillsDeducted || 1;
      setDoseRecords((prev) => prev.filter((r) => r.id !== existingRecord.id));

      setMedicines((prev) =>
        prev.map((m) => {
          if (m.id === medId) {
            return {
              ...m,
              remainingPills: m.remainingPills + pillsToRestore,
              takenToday: targetDate === todayStr ? false : m.takenToday,
              takenAt: targetDate === todayStr ? undefined : m.takenAt,
            };
          }
          return m;
        })
      );
    } else {
      // RECORD DOSE: Deduct pill safely (inventory never goes below 0)
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const pillsToDeduct = med.remainingPills > 0 ? 1 : 0;
      const newRecord: DoseRecord = {
        id: `dose-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        medicineId: medId,
        date: targetDate,
        timing: med.timing,
        takenAt: timeString,
        timestamp: now.getTime(),
        pillsDeducted: pillsToDeduct,
      };

      setDoseRecords((prev) => [...prev, newRecord]);

      setMedicines((prev) =>
        prev.map((m) => {
          if (m.id === medId) {
            return {
              ...m,
              remainingPills: Math.max(0, m.remainingPills - pillsToDeduct),
              takenToday: targetDate === todayStr ? true : m.takenToday,
              takenAt: targetDate === todayStr ? timeString : m.takenAt,
            };
          }
          return m;
        })
      );
    }
  };

  // Handle Refill stock
  const handleSaveRefill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refillMed) return;
    const addedCount = Math.max(0, Number(refillCount) || 0);

    setMedicines((prev) =>
      prev.map((m) => {
        if (m.id === refillMed.id) {
          return {
            ...m,
            remainingPills: m.remainingPills + addedCount,
          };
        }
        return m;
      })
    );
    setRefillMed(null);
  };

  // Delete medicine
  const handleDeleteMedicine = (id: string, name: string) => {
    const confirmDelete = window.confirm(
      language === 'hi'
        ? `क्या आप "${name}" को अपनी दवाई सूची से हटाना चाहते हैं?`
        : `Remove "${name}" from your medicine schedule?`
    );
    if (confirmDelete) {
      setMedicines((prev) => prev.filter((m) => m.id !== id));
      setDoseRecords((prev) => prev.filter((r) => r.medicineId !== id));
    }
  };

  // Explain medicine via AI
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
          language: language === 'hi' ? 'hi' : 'en',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch medicine explanation');
      }

      const data = await response.json();
      setMedExplanation(data);
    } catch (e) {
      console.error(e);
      setMedExplanation({
        simpleName: med.name,
        whatItDoes: 'Prescribed by your consulting physician for your health condition.',
        bestTimeToTake: med.timeLabel,
        foodGuidance: med.withFood.replace('_', ' '),
        simplePrecautions: [
          'Take at the regular prescribed time each day.',
          'Always verify questions with your doctor or pharmacist.',
        ],
        missedDoseAdvice: 'Please ask your doctor or pharmacist what to do if you miss a dose. Never take a double dose.',
        disclaimer: 'I only explain; your doctor decides. Always follow your physician’s exact prescription.',
      });
    } finally {
      setIsExplainingLoading(false);
    }
  };

  // Add new medicine
  const handleAddMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;

    const timeLabels = {
      morning: 'Morning (8:00 AM)',
      afternoon: 'Afternoon (1:30 PM)',
      evening: 'Evening (6:00 PM)',
      night: 'Night (9:00 PM)',
    };

    const pillCount = Math.max(1, Number(newMedPillCount) || 30);

    const newMed: MedicineItem = {
      id: `med-${Date.now()}`,
      name: newMedName.trim(),
      dosage: newMedDosage.trim() || '1 Tablet',
      timing: newMedTiming,
      timeLabel: timeLabels[newMedTiming],
      withFood: newMedFood,
      purpose: newMedPurpose.trim() || 'Prescribed by doctor for health wellness',
      takenToday: false,
      colorBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      pillIconType: 'tablet',
      remainingPills: pillCount,
      initialPills: pillCount,
      doctorNotes: `Take ${newMedFood.replace('_', ' ')} with fresh water as prescribed.`,
    };

    setMedicines([...medicines, newMed]);
    setIsAddModalOpen(false);
    setNewMedName('');
    setNewMedDosage('1 Tablet');
    setNewMedPurpose('');
    setNewMedPillCount(30);
  };

  const handleLoadSample = () => {
    // Only add if not already present
    if (!medicines.some((m) => m.id === SAMPLE_TUTORIAL_MEDICINE.id)) {
      setMedicines([SAMPLE_TUTORIAL_MEDICINE, ...medicines]);
    }
  };

  // Filter medicines by active timing tab
  const filteredMedicines =
    activeTiming === 'all'
      ? medicines
      : medicines.filter((m) => m.timing === activeTiming);

  const takenCount = medicines.filter((m) => isDoseTakenToday(m.id)).length;
  const totalCount = medicines.length;

  const lowStockMedicines = medicines.filter((m) => m.remainingPills <= 5);

  const todaySummarySpoken = `Medicine summary for today: You have taken ${takenCount} out of ${totalCount} medicines. ${
    totalCount - takenCount > 0
      ? `${totalCount - takenCount} medicines are still pending for today.`
      : 'All medicines taken for today. Wonderful!'
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
              {language === 'hi' ? 'दवाई समय और रूटीन' : 'Daily Medicines & Timely Routine'}
            </h2>
            <p className="text-stone-600 text-base max-w-2xl leading-relaxed">
              {language === 'hi'
                ? 'समय पर दवा लें और कोई खुराक न भूलें। दवा लेने के बाद "Maine Le Li" दबाएं।'
                : 'Never miss a dose or take the wrong pill. Tap "Maine Le Li" when taken. Saarthi keeps your loved ones stress-free.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {totalCount > 0 && (
              <VoiceSpeakerButton
                textToSpeak={todaySummarySpoken}
                label="Today's Schedule / सुनें"
                size="md"
              />
            )}
            <button
              id="add-medicine-btn"
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-md transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'hi' ? 'दवाई जोड़ें' : 'Add Medicine'}</span>
            </button>
          </div>
        </div>

        {/* Progress Tracker Card */}
        {totalCount > 0 && (
          <div className="mt-5 pt-4 border-t border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {takenCount}/{totalCount}
              </div>
              <div>
                <span className="text-xs text-stone-600 uppercase font-semibold block">Today's Progress:</span>
                <span className="text-base font-extrabold text-stone-900">
                  {takenCount === totalCount
                    ? '🎉 All scheduled medicines taken for today! Shabash.'
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
        )}
      </div>

      {/* Low Stock Alert Notification */}
      {lowStockMedicines.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <strong className="text-rose-900 font-bold block">
              Pill Box Refill Reminder (दवाई खत्म होने वाली है):
            </strong>
            <p className="text-rose-800 mt-0.5">
              {lowStockMedicines.map((m) => `${m.name} (${m.remainingPills} pills left)`).join(', ')}.
              Please order refills from your pharmacy in advance.
            </p>
          </div>
        </div>
      )}

      {/* Medical Safety Disclaimer */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-3 text-xs md:text-sm text-stone-700">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
        <span>
          <strong className="font-semibold text-stone-900">Medical Safety Notice:</strong> Saarthi helps you track your routine.
          Saarthi never prescribes, diagnoses, or alters dosages. Always follow your doctor's exact prescription and consult your physician or pharmacist with any medication questions.
        </span>
      </div>

      {/* View Mode Switcher: Today's Schedule vs. Week View */}
      {totalCount > 0 && (
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
              Week Calendar (पूरा सप्ताह)
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
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                      activeTiming === tab.id
                        ? 'bg-stone-700 text-stone-100'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State when no medicines are added */}
      {totalCount === 0 && (
        <div className="bg-white border-2 border-dashed border-stone-200 rounded-3xl p-8 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <Pill className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-stone-900">
              {language === 'hi' ? 'कोई दवाई अभी तक नहीं जोड़ी गई है' : 'No Medicines Added Yet'}
            </h3>
            <p className="text-stone-500 text-sm leading-relaxed">
              {language === 'hi'
                ? 'अपने डॉक्टर द्वारा लिखी गई दवाएं जोड़ें ताकि सारथी आपको सही समय पर याद दिला सके।'
                : 'Add the exact medicines prescribed by your doctor. Saarthi keeps track of your daily doses, timing, and remaining pills.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-sm text-sm"
            >
              + Add Doctor Prescribed Medicine
            </button>
            <button
              type="button"
              onClick={handleLoadSample}
              className="px-4 py-2.5 border border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold rounded-2xl text-xs"
            >
              Load Sample Demo Pill (Vitamin D3)
            </button>
          </div>
        </div>
      )}

      {/* Week Calendar View (Date-Specific Dose History) */}
      {viewMode === 'week' && totalCount > 0 && (
        <div id="medicine-week-view" className="bg-white border-2 border-emerald-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-emerald-600" />
                <span>Weekly Medicine Adherence (Date-Specific Log)</span>
              </h3>
              <p className="text-stone-500 text-sm">
                Tap on any past or current day to record or verify your dose. Doses adjust pill inventory automatically.
              </p>
            </div>
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full self-start">
              Current Week ({weekDays[0].dayLabelEn} - {weekDays[6].dayLabelEn})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-stone-200 text-xs font-bold text-stone-600 uppercase">
                  <th className="py-3 px-3">Medicine & Timing</th>
                  {weekDays.map((day, i) => (
                    <th
                      key={i}
                      className={`py-3 px-2 text-center ${
                        day.isToday ? 'bg-emerald-50 text-emerald-900 font-extrabold rounded-t-lg' : ''
                      }`}
                    >
                      <span>{language === 'hi' ? day.dayLabelHi : day.dayLabelEn}</span>
                      {day.isToday && <span className="block text-[10px] text-emerald-700">(Today)</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {medicines.map((med) => {
                  return (
                    <tr key={med.id} className="hover:bg-stone-50/80">
                      <td className="py-3 px-3 font-semibold text-stone-900">
                        <div className="flex items-center gap-2">
                          <Pill className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="block font-bold">{med.name}</span>
                            <span className="text-xs text-stone-500 font-normal">
                              {med.dosage} • {med.timeLabel}
                            </span>
                          </div>
                        </div>
                      </td>
                      {weekDays.map((day, dIdx) => {
                        const dose = getDoseForDate(med.id, day.dateStr);
                        const isDone = Boolean(dose);
                        return (
                          <td
                            key={dIdx}
                            className={`py-3 px-2 text-center ${day.isToday ? 'bg-emerald-50/40' : ''}`}
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleDose(med.id, day.dateStr)}
                              className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl transition-transform active:scale-95 text-xs font-bold ${
                                isDone
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : day.isFuture
                                  ? 'bg-stone-100 text-stone-300 cursor-pointer border border-stone-200'
                                  : 'bg-stone-100 hover:bg-stone-200 text-stone-400 border border-stone-300'
                              }`}
                              title={
                                isDone
                                  ? `Taken on ${day.dateStr} at ${dose?.takenAt || 'recorded'}. Tap to undo.`
                                  : `Tap to mark taken on ${day.dateStr}`
                              }
                            >
                              {isDone ? '✓' : '—'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Today's Schedule Grid */}
      {viewMode === 'today' && totalCount > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredMedicines.map((med) => {
            const isTaken = isDoseTakenToday(med.id);
            const todayDose = getDoseForDate(med.id, todayStr);
            const isLowPills = med.remainingPills <= 5;

            return (
              <div
                key={med.id}
                id={`med-card-${med.id}`}
                className={`border-2 rounded-3xl p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                  isTaken
                    ? 'bg-emerald-50/40 border-emerald-300'
                    : 'bg-white border-stone-200 hover:border-amber-400'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                          isTaken ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <Pill className="w-6 h-6" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg md:text-xl font-bold text-stone-900">
                            {med.name}
                          </h3>
                          {med.isSample && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                              Demo
                            </span>
                          )}
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                            {med.dosage}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-emerald-800 mt-0.5">
                          {med.purpose}
                        </p>
                      </div>
                    </div>

                    {/* Actions: Explain & Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        id={`explain-btn-${med.id}`}
                        type="button"
                        onClick={() => handleExplainMedicine(med)}
                        className="p-2 rounded-xl text-amber-800 hover:bg-amber-100/70 border border-amber-200 transition-colors"
                        title="Explain in plain words why doctor prescribed this"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMedicine(med.id, med.name)}
                        className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove medicine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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

                {/* Bottom Card Actions: Stock & Take Button */}
                <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className="text-stone-500 block">Pills in Box:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`font-bold ${
                          isLowPills ? 'text-rose-600 flex items-center gap-1' : 'text-stone-800'
                        }`}
                      >
                        {isLowPills && <AlertCircle className="w-3.5 h-3.5" />}
                        {med.remainingPills} tablets left
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setRefillMed(med);
                          setRefillCount(30);
                        }}
                        className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold underline"
                      >
                        + Refill
                      </button>
                    </div>
                  </div>

                  <button
                    id={`taken-btn-${med.id}`}
                    type="button"
                    onClick={() => handleToggleDose(med.id, todayStr)}
                    className={`px-4 py-2.5 rounded-2xl font-extrabold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-sm ${
                      isTaken
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-300'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>
                      {isTaken
                        ? `Maine Le Li (${todayDose?.takenAt || 'Taken'})`
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
                    <span className="text-xs font-bold text-stone-600 block mb-1">Timing Advice:</span>
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

                {medExplanation.simplePrecautions && Array.isArray(medExplanation.simplePrecautions) && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-stone-700 block">Precautions:</span>
                    <ul className="list-disc list-inside text-xs text-stone-600 space-y-1">
                      {medExplanation.simplePrecautions.map((p: string, i: number) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-stone-100 rounded-xl p-3 text-xs text-stone-700 font-medium">
                  {medExplanation.disclaimer || 'I only explain; your doctor decides. Always follow your physician’s exact prescription.'}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Refill Inventory Modal */}
      {refillMed && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <span>Refill Pill Box</span>
              </h3>
              <button
                type="button"
                onClick={() => setRefillMed(null)}
                className="p-1 rounded-lg text-stone-500 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRefill} className="space-y-4 text-sm">
              <p className="text-stone-600 text-xs">
                Adding new tablets to <strong className="text-stone-900 font-bold">{refillMed.name}</strong>.
                Current count: {refillMed.remainingPills} tablets.
              </p>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Tablets to Add:
                </label>
                <div className="flex items-center gap-2 mb-2">
                  {[10, 15, 30, 60].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setRefillCount(count)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${
                        refillCount === count
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-stone-50 hover:bg-stone-100 border-stone-300 text-stone-700'
                      }`}
                    >
                      +{count}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="500"
                  required
                  value={refillCount}
                  onChange={(e) => setRefillCount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-stone-900 font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRefillMed(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                >
                  Confirm Refill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Medicine Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>Add Doctor Prescribed Medicine</span>
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
                  Medicine Name *
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
                    Total Pills in Box:
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
                  placeholder="e.g. For Blood Pressure / Blood Sugar / Joint Health"
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-stone-900"
                />
              </div>

              <p className="text-[11px] text-stone-500 italic">
                Notice: Always confirm prescription details with your doctor before adding.
              </p>

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
