import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Upload,
  Camera,
  CheckCircle2,
  Calendar,
  Pill,
  Sparkles,
  PhoneCall,
  Loader2,
  X,
  Share2,
} from 'lucide-react';
import { UnifiedCheckResult, Language, GeneralReminder, MedicineItem } from '../types';
import { compressImageFile } from '../utils/imageCompressor';
import { VoiceSpeakerButton } from './VoiceSpeakerButton';

interface UnifiedCheckerProps {
  language: Language;
  onAddReminder?: (reminder: { title: string; dueDate: string | null; note: string }) => void;
  onAddMedicine?: (medicine: { name: string; timing: string }) => void;
}

const SAMPLE_CHECKS = [
  {
    id: 'sbi-kyc',
    label: '⚠️ Fake SBI KYC SMS',
    text: 'Dear customer, your SBI account is blocked today due to pending PAN KYC. Click http://bit.ly/sbi-pan to verify now or share OTP.',
  },
  {
    id: 'electricity-threat',
    label: '⚠️ Fake Power Cut Tonight',
    text: 'Dear consumer, electricity will be disconnected tonight at 9:30 PM from the power office because your previous month bill was not updated. Immediately call 9876543210.',
  },
  {
    id: 'genuine-bill',
    label: '📄 Genuine Electricity Bill',
    text: 'BESCOM Electricity Bill: Consumer No 5420199. Billing Period: Sept 2024. Total Amount Due: ₹ 1,450. Due Date: 28th October 2024. Units consumed: 120 KWh.',
  },
  {
    id: 'courier-delivery',
    label: '📦 Normal Delivery Note',
    text: 'Your BlueDart parcel is out for delivery with our executive today. Please be available at your home address.',
  },
  {
    id: 'prescription',
    label: '💊 Prescription Note',
    text: 'Rx Dr. Sharma: Tab Telmisartan 40mg once daily in the morning after breakfast. Check blood pressure every month.',
  },
];

export const UnifiedChecker: React.FC<UnifiedCheckerProps> = ({
  language,
  onAddReminder,
  onAddMedicine,
}) => {
  const [inputText, setInputText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<UnifiedCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedReminderMessage, setAddedReminderMessage] = useState(false);
  const [addedMedicineMessage, setAddedMedicineMessage] = useState(false);

  const handleLoadSample = (text: string) => {
    setInputText(text);
    setImagePreview(null);
    setError(null);
    setResult(null);
    setAddedReminderMessage(false);
    setAddedMedicineMessage(false);
  };

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, or WebP).');
      return;
    }

    try {
      setIsCompressing(true);
      setError(null);
      // Canvas compression to max 1280px, quality 0.8
      const compressedDataUrl = await compressImageFile(file);
      setImagePreview(compressedDataUrl);
      setInputText('');
    } catch (err) {
      console.error(err);
      setError('Could not process this photo. Please try another one.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleCheck = async () => {
    if (!inputText.trim() && !imagePreview) {
      setError(
        language === 'hi'
          ? 'कृपया संदेश लिखें या कागज़ की फ़ोटो चुनें।'
          : 'Please enter text or upload a document photo to check.'
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setAddedReminderMessage(false);
    setAddedMedicineMessage(false);

    try {
      const response = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim() || undefined,
          image: imagePreview || undefined,
          language: language === 'hi' ? 'hi' : 'en',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || 'Failed to complete safety check.');
      }

      const data: UnifiedCheckResult = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          (language === 'hi'
            ? 'जांच पूरी नहीं हो सकी। कृपया दोबारा प्रयास करें।'
            : 'Could not complete the check. Please try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReminderClick = () => {
    if (result?.reminder) {
      if (onAddReminder) {
        onAddReminder(result.reminder);
      } else {
        // Direct local storage fallback
        const existing: GeneralReminder[] = JSON.parse(
          localStorage.getItem('saarthi_reminders') || '[]'
        );
        const newRem: GeneralReminder = {
          id: `rem-${Date.now()}`,
          title: result.reminder.title,
          dueDate: result.reminder.dueDate,
          note: result.reminder.note,
          isCompleted: false,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('saarthi_reminders', JSON.stringify([newRem, ...existing]));
      }
      setAddedReminderMessage(true);
    }
  };

  const handleAddMedicineClick = () => {
    if (result?.medicine) {
      if (onAddMedicine) {
        onAddMedicine(result.medicine);
      } else {
        const existing: MedicineItem[] = JSON.parse(
          localStorage.getItem('saarthi_medicines') || '[]'
        );
        const newMed: MedicineItem = {
          id: `med-${Date.now()}`,
          name: result.medicine.name,
          dosage: 'As prescribed',
          timing: 'morning',
          timeLabel: 'Morning (8:00 AM)',
          withFood: 'after_food',
          purpose: result.title || 'Doctor prescribed medication',
          takenToday: false,
          colorBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          pillIconType: 'tablet',
          remainingPills: 30,
          doctorNotes: result.medicine.timing,
        };
        localStorage.setItem('saarthi_medicines', JSON.stringify([...existing, newMed]));
      }
      setAddedMedicineMessage(true);
    }
  };

  const getSpokenReadout = (r: UnifiedCheckResult) => {
    let text = `${r.title}. `;
    if (r.risk === 'scam') {
      text += `Scam warning! ${r.riskReason}. `;
    } else if (r.risk === 'careful') {
      text += `Please be careful. ${r.riskReason}. `;
    } else {
      text += `Appears safe. ${r.riskReason}. `;
    }
    text += `Summary: ${r.summary}. `;
    if (r.steps && r.steps.length > 0) {
      text += `Recommended steps: ${r.steps.join('. ')}. `;
    }
    if (r.amountDue) {
      text += `Amount mentioned: ${r.amountDue}. `;
    }
    if (r.dueDate) {
      text += `Due date: ${r.dueDate}. `;
    }
    return text;
  };

  return (
    <div id="unified-checker-section" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-stone-100 border-2 border-amber-200 rounded-3xl p-6 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>सुरक्षा और जांच • Message & Document Clarifier</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 font-heading">
            {language === 'hi'
              ? 'क्या यह संदेश या बिल सुरक्षित है? जांचें'
              : 'Is This Message or Document Safe? Check with Saarthi'}
          </h2>
          <p className="text-stone-600 text-base max-w-3xl leading-relaxed">
            {language === 'hi'
              ? 'बिजली कटने की धमकी, बैंक केवाईसी लिंक, अनजान नंबर का फोन, या कोई सरकारी पत्र—सारथी सरल भाषा में समझाएगा।'
              : 'Whether an urgent SMS, power cut threat, bank KYC warning, doctor prescription, or utility bill—Saarthi checks it in seconds.'}
          </p>
        </div>

        {/* Quick Sample Chips */}
        <div className="mt-5 pt-4 border-t border-amber-200">
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-2">
            Try a common example (Click to test):
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_CHECKS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleLoadSample(sample.text)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-xs font-semibold text-stone-800 shadow-xs transition-transform active:scale-95"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Input Form */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="space-y-2">
          <label htmlFor="check-text-input" className="block text-base font-bold text-stone-900">
            {language === 'hi'
              ? 'संदेश या पत्र का पाठ यहाँ लिखें:'
              : 'Paste SMS, WhatsApp text, or describe the message:'}
          </label>
          <textarea
            id="check-text-input"
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              language === 'hi'
                ? 'जैसे: "आपका बिजली बिल बाकी है, आज रात कट जाएगा..." या बिल की कोई भी बात'
                : 'e.g., "Electricity will be disconnected tonight...", "Your SBI KYC is pending...", or type bill details'
            }
            className="w-full p-4 rounded-2xl border border-stone-300 text-stone-800 text-base focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition-all placeholder:text-stone-400"
          />
        </div>

        {/* Photo Upload Option with Canvas Auto-Compression */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-sm cursor-pointer border border-stone-300 transition-colors">
              <Camera className="w-4 h-4 text-amber-700" />
              <span>{imagePreview ? 'Change Photo' : 'Upload / Take Photo'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFile(file);
                }}
              />
            </label>
            {isCompressing && (
              <span className="text-xs text-amber-700 flex items-center gap-1 font-medium animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Optimizing photo...
              </span>
            )}
          </div>

          <button
            id="run-unified-check-btn"
            type="button"
            disabled={isLoading || isCompressing || (!inputText.trim() && !imagePreview)}
            onClick={handleCheck}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 text-white font-bold rounded-2xl shadow-md transition-transform active:scale-95 text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Checking carefully...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>{language === 'hi' ? 'जांच करें' : 'Check with Saarthi'}</span>
              </>
            )}
          </button>
        </div>

        {/* Image preview thumbnail if uploaded */}
        {imagePreview && (
          <div className="relative inline-block mt-2 rounded-2xl border-2 border-amber-300 overflow-hidden shadow-sm">
            <img
              src={imagePreview}
              alt="Document uploaded for review"
              className="max-h-48 object-contain bg-stone-100"
            />
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-stone-900/80 text-white hover:bg-rose-600 transition-colors"
              title="Remove photo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Result Card with aria-live for screen readers */}
      <div aria-live="polite">
        {result && (
          <div
            id="check-result-card"
            className={`border-2 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md transition-all ${
              result.risk === 'scam'
                ? 'bg-rose-50/70 border-rose-300'
                : result.risk === 'careful'
                ? 'bg-amber-50/70 border-amber-300'
                : 'bg-emerald-50/70 border-emerald-300'
            }`}
          >
            {/* Top Risk Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200/80">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    result.risk === 'scam'
                      ? 'bg-rose-600 text-white'
                      : result.risk === 'careful'
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {result.risk === 'scam' ? (
                    <ShieldAlert className="w-8 h-8" />
                  ) : result.risk === 'careful' ? (
                    <AlertTriangle className="w-8 h-8" />
                  ) : (
                    <ShieldCheck className="w-8 h-8" />
                  )}
                </div>

                <div>
                  {/* Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide mb-1 border shadow-xs">
                    {result.risk === 'scam' && (
                      <span className="bg-rose-100 text-rose-900 border-rose-300">
                        🚨 Scam Warning
                      </span>
                    )}
                    {result.risk === 'careful' && (
                      <span className="bg-amber-100 text-amber-900 border-amber-300">
                        ⚠️ Be Careful
                      </span>
                    )}
                    {result.risk === 'safe' && (
                      <span className="bg-emerald-100 text-emerald-900 border-emerald-300">
                        ✅ Appears Safe
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-stone-900 font-heading">
                    {result.title}
                  </h3>
                </div>
              </div>

              {/* Spoken Voice Button */}
              <div className="self-start sm:self-center">
                <VoiceSpeakerButton
                  textToSpeak={getSpokenReadout(result)}
                  label="Listen / सुनें"
                  size="md"
                />
              </div>
            </div>

            {/* Honest Fallback Notice */}
            {result.source === 'fallback' && (
              <div className="p-3.5 rounded-2xl bg-amber-100/80 border border-amber-300 text-amber-950 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-800 shrink-0" />
                <span>
                  {language === 'hi'
                    ? 'सारथी ने यह जांच सामान्य सुरक्षा नियमों के आधार पर की है। कृपया बैंक या परिवार से पुष्टि अवश्य करें।'
                    : 'I could not read this fully, so this is a general safety check only.'}
                </span>
              </div>
            )}

            {/* Plain Risk Reason */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1">
                Guidance & Reason:
              </span>
              <p className="text-stone-800 text-base leading-relaxed font-medium">
                {result.riskReason}
              </p>
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                What this means in plain words:
              </span>
              <p className="text-stone-800 text-base sm:text-lg leading-relaxed bg-white/70 p-4 rounded-2xl border border-stone-200/60">
                {result.summary}
              </p>
            </div>

            {/* Red Flags if any */}
            {result.redFlags && result.redFlags.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 block">
                  Warning Signs Found:
                </span>
                <ul className="space-y-1.5">
                  {result.redFlags.map((flag, idx) => (
                    <li
                      key={idx}
                      className="text-sm font-medium text-rose-900 bg-rose-100/80 border border-rose-200 p-2.5 rounded-xl flex items-start gap-2"
                    >
                      <span className="font-bold text-rose-700">•</span>
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bill / Prescribed amounts & dates if present */}
            {(result.amountDue || result.dueDate) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.amountDue && (
                  <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
                    <span className="text-xs text-stone-500 font-semibold block">
                      Amount Mentioned
                    </span>
                    <span className="text-xl font-black text-stone-900">{result.amountDue}</span>
                  </div>
                )}
                {result.dueDate && (
                  <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
                    <span className="text-xs text-stone-500 font-semibold block">Due Date</span>
                    <span className="text-lg font-bold text-amber-900">{result.dueDate}</span>
                  </div>
                )}
              </div>
            )}

            {/* Recommended Steps */}
            {result.steps && result.steps.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-600 block">
                  What you should do right now:
                </span>
                <div className="space-y-2">
                  {result.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-sm sm:text-base font-medium text-stone-800">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Jargon Buster if any */}
            {result.jargon && result.jargon.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-stone-200">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-600 block">
                  Difficult Words Explained:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.jargon.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white border border-stone-200 text-xs text-stone-700"
                    >
                      <strong className="text-stone-900 block font-bold mb-0.5">
                        {item.term}:
                      </strong>
                      <span>{item.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons: Add to Reminders & Add to Medicines ONLY when present */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-stone-200">
              {result.reminder && (
                <button
                  id="add-to-reminders-btn"
                  type="button"
                  onClick={handleAddReminderClick}
                  disabled={addedReminderMessage}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white font-bold text-sm shadow-xs transition-transform active:scale-95"
                >
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>
                    {addedReminderMessage ? '✓ Added to Reminders' : 'Add to My Reminders'}
                  </span>
                </button>
              )}

              {result.medicine && (
                <button
                  id="add-to-medicines-btn"
                  type="button"
                  onClick={handleAddMedicineClick}
                  disabled={addedMedicineMessage}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-400 text-white font-bold text-sm shadow-xs transition-transform active:scale-95"
                >
                  <Pill className="w-4 h-4 text-emerald-200" />
                  <span>
                    {addedMedicineMessage ? '✓ Added to Medicines' : 'Add to My Medicines'}
                  </span>
                </button>
              )}

              {result.helpline && (
                <a
                  href={`tel:${result.helpline}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-xs transition-transform active:scale-95"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call Helpline {result.helpline}</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
