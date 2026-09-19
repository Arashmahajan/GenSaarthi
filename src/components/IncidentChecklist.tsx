import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  PhoneCall,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  X,
  Copy,
  Printer,
  Trash2,
  Users,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  INCIDENT_CHOICES,
  IncidentChoiceKey,
  buildIncidentSteps,
  IncidentStep,
  OFFICIAL_HELPLINES,
} from '../data/incidentSteps';
import { IncidentNote } from '../types';
import { formatTelUrl } from '../utils/phone';
import { t } from '../i18n';

interface IncidentChecklistProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: {
    senderNumber?: string;
    link?: string;
    amount?: string;
  } | null;
  onTellFamily?: () => void;
}

export const IncidentChecklist: React.FC<IncidentChecklistProps> = ({
  isOpen,
  onClose,
  initialContext,
  onTellFamily,
}) => {
  const { settings, incidentNotes, saveIncidentNote, deleteIncidentNote } = useApp();
  const lang = settings.language;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedChoices, setSelectedChoices] = useState<IncidentChoiceKey[]>([]);
  const [generatedSteps, setGeneratedSteps] = useState<IncidentStep[]>([]);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);

  // Form fields for "Write it down"
  const [dateTime, setDateTime] = useState('');
  const [amountLost, setAmountLost] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [senderContact, setSenderContact] = useState('');
  const [notes, setNotes] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [choiceError, setChoiceError] = useState('');

  // Reset and prefill on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedChoices([]);
      setChoiceError('');
      setCopySuccess(false);

      const now = new Date();
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDateTime(localIso);
      setAmountLost(initialContext?.amount || '');
      setTransactionId('');
      setSenderContact(initialContext?.senderNumber || initialContext?.link || '');
      setNotes('');
      setCurrentNoteId(`incident-${Date.now()}`);
    }
  }, [isOpen, initialContext]);

  if (!isOpen) return null;

  const toggleChoice = (key: IncidentChoiceKey) => {
    setChoiceError('');
    setSelectedChoices((prev) => {
      if (key === 'not_sure') {
        return prev.includes('not_sure') ? [] : ['not_sure'];
      }
      const filtered = prev.filter((k) => k !== 'not_sure');
      if (filtered.includes(key)) {
        return filtered.filter((k) => k !== key);
      } else {
        return [...filtered, key];
      }
    });
  };

  const handleProceedToSteps = () => {
    if (selectedChoices.length === 0) {
      setChoiceError(
        lang === 'hi'
          ? 'कृपया आगे बढ़ने के लिए कम से कम एक विकल्प चुनें।'
          : 'Please select at least one choice to see what to do.'
      );
      return;
    }

    const steps = buildIncidentSteps(selectedChoices);
    setGeneratedSteps(steps);
    setStep(2);
  };

  const handleProceedToWriteItDown = () => {
    // Automatically save initial draft to storage
    saveIncidentDraft();
    setStep(3);
  };

  const saveIncidentDraft = () => {
    if (!currentNoteId) return;
    const noteObj: IncidentNote = {
      id: currentNoteId,
      dateTime,
      amountLost: amountLost.trim() || undefined,
      transactionId: transactionId.trim() || undefined,
      senderContact: senderContact.trim() || undefined,
      notes: notes.trim() || undefined,
      choices: selectedChoices,
    };
    saveIncidentNote(noteObj);
  };

  const handleCopySummary = async () => {
    const lines: string[] = [
      lang === 'hi' ? '--- सारथी सुरक्षा सारांश ---' : '--- Saarthi Safety Incident Summary ---',
      `${t('dateAndTime', lang)}: ${dateTime}`,
    ];

    if (amountLost.trim()) {
      lines.push(`${t('amountLost', lang)}: ${amountLost.trim()}`);
    }
    if (transactionId.trim()) {
      lines.push(`${t('transactionId', lang)}: ${transactionId.trim()}`);
    }
    if (senderContact.trim()) {
      lines.push(`${t('senderContactOrLink', lang)}: ${senderContact.trim()}`);
    }
    if (notes.trim()) {
      lines.push(`${t('notes', lang)}: ${notes.trim()}`);
    }

    lines.push('\n' + (lang === 'hi' ? 'उठाए जाने वाले महत्वपूर्ण कदम:' : 'Important steps to take:'));
    generatedSteps.forEach((st, idx) => {
      lines.push(`${idx + 1}. ${lang === 'hi' ? st.titleHi : st.titleEn}: ${lang === 'hi' ? st.detailHi : st.detailEn}`);
    });

    lines.push(`\n${lang === 'hi' ? 'राष्ट्रीय साइबर हेल्पलाइन' : 'National Cyber Crime Helpline'}: 1930`);

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    saveIncidentDraft();
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDelete = () => {
    if (currentNoteId && window.confirm(t('confirmDeleteNote', lang))) {
      deleteIncidentNote(currentNoteId);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="incident-checklist-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-6 my-6 max-h-[92vh] overflow-y-auto">
        {/* Header with Title and Step Indicator */}
        <div className="flex items-start justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
          <div className="flex items-center space-x-3 text-rose-700 dark:text-rose-400">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/70 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h2 id="incident-checklist-title" className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 font-heading">
                {t('incidentFlowTitle', lang)}
              </h2>
              <p className="text-sm font-semibold text-stone-600 dark:text-stone-400">
                {t('stepCounter', lang, { current: step, total: 3 })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label={t('close', lang)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* SCREEN 1: What happened? */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                {t('whatHappenedTitle', lang)}
              </h3>
              <p className="text-stone-700 dark:text-stone-300 text-base">
                {t('whatHappenedSubtitle', lang)}
              </p>
            </div>

            {choiceError && (
              <div role="alert" className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-base font-semibold flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-700 dark:text-rose-400" />
                <span>{choiceError}</span>
              </div>
            )}

            <div className="space-y-3">
              {INCIDENT_CHOICES.map((choice) => {
                const isSelected = selectedChoices.includes(choice.key);
                return (
                  <button
                    key={choice.key}
                    type="button"
                    onClick={() => toggleChoice(choice.key)}
                    aria-pressed={isSelected}
                    className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 text-base sm:text-lg font-medium min-h-[56px] ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/80 dark:bg-amber-950/40 text-stone-900 dark:text-stone-100 shadow-xs'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    <span>{lang === 'hi' ? choice.labelHi : choice.labelEn}</span>
                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'border-amber-600 bg-amber-600 text-white'
                          : 'border-stone-400 dark:border-stone-600 bg-white dark:bg-stone-800'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[48px] px-6 py-3 rounded-2xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-base hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                {t('close', lang)}
              </button>
              <button
                type="button"
                onClick={handleProceedToSteps}
                className="min-h-[48px] px-8 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-base shadow-sm inline-flex items-center space-x-2 transition-colors"
              >
                <span>{t('next', lang)}</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 2: Do this now */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                {t('doThisNowTitle', lang)}
              </h3>
              <p className="text-stone-700 dark:text-stone-300 text-base">
                {lang === 'hi'
                  ? 'ये तुरंत उठाए जाने वाले कदम हैं। घबराएं नहीं, एक-एक करके इन्हें पूरा करें।'
                  : 'Take these immediate steps in order. Take your time; do them one by one.'}
              </p>
            </div>

            <div className="space-y-4">
              {generatedSteps.map((st, index) => (
                <div
                  key={st.id}
                  className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 space-y-3"
                >
                  <div className="flex items-start space-x-3">
                    <span className="w-8 h-8 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-base flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                        {lang === 'hi' ? st.titleHi : st.titleEn}
                      </h4>
                      <p className="text-stone-700 dark:text-stone-300 text-base leading-relaxed">
                        {lang === 'hi' ? st.detailHi : st.detailEn}
                      </p>
                    </div>
                  </div>

                  {/* Immediate Action Buttons (e.g. Call 1930) */}
                  {st.actionPhone && (
                    <div className="pt-2 pl-11">
                      <a
                        href={formatTelUrl(st.actionPhone)}
                        className="min-h-[48px] inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-base shadow-sm transition-colors"
                      >
                        <PhoneCall className="w-5 h-5" />
                        <span>
                          {lang === 'hi'
                            ? `कॉल करें: ${st.actionPhone}`
                            : `Call Helpline: ${st.actionPhone}`}
                        </span>
                      </a>
                    </div>
                  )}

                  {st.actionUrl && (
                    <div className="pt-2 pl-11">
                      <a
                        href={st.actionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[48px] inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-base shadow-sm transition-colors"
                      >
                        <ExternalLink className="w-5 h-5" />
                        <span>
                          {lang === 'hi' ? 'आधिकारिक पोर्टल खोलें' : 'Open Official Portal'}
                        </span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="min-h-[48px] px-6 py-3 rounded-2xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-base hover:bg-stone-100 dark:hover:bg-stone-800 inline-flex items-center space-x-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>{t('back', lang)}</span>
              </button>
              <button
                type="button"
                onClick={handleProceedToWriteItDown}
                className="min-h-[48px] px-8 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-base shadow-sm inline-flex items-center space-x-2 transition-colors"
              >
                <span>{t('next', lang)}</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 3: Write it down */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                {t('writeItDownTitle', lang)}
              </h3>
              <p className="text-stone-700 dark:text-stone-300 text-base">
                {t('writeItDownSubtitle', lang)}
              </p>
            </div>

            {copySuccess && (
              <div role="status" aria-live="polite" className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-base font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span>{t('summaryCopied', lang)}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveIncidentDraft();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-base font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  {t('dateAndTime', lang)}
                </label>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => {
                    setDateTime(e.target.value);
                    saveIncidentDraft();
                  }}
                  className="min-h-[48px] w-full px-4 py-3 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  {t('amountLost', lang)}
                </label>
                <input
                  type="text"
                  value={amountLost}
                  onChange={(e) => {
                    setAmountLost(e.target.value);
                    saveIncidentDraft();
                  }}
                  placeholder="e.g. ₹5,000"
                  className="min-h-[48px] w-full px-4 py-3 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  {t('transactionId', lang)}
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => {
                    setTransactionId(e.target.value);
                    saveIncidentDraft();
                  }}
                  placeholder="UTR / Ref / UPI ID"
                  className="min-h-[48px] w-full px-4 py-3 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  {t('senderContactOrLink', lang)}
                </label>
                <input
                  type="text"
                  value={senderContact}
                  onChange={(e) => {
                    setSenderContact(e.target.value);
                    saveIncidentDraft();
                  }}
                  placeholder="Phone number, UPI handle or website link"
                  className="min-h-[48px] w-full px-4 py-3 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  {t('notes', lang)}
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    saveIncidentDraft();
                  }}
                  placeholder="What was promised? What app was installed?"
                  className="w-full p-4 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base"
                />
              </div>
            </form>

            {/* Action Buttons for Note */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {onTellFamily && (
                <button
                  type="button"
                  onClick={() => {
                    saveIncidentDraft();
                    onTellFamily();
                  }}
                  className="min-h-[48px] inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-base shadow-xs transition-colors"
                >
                  <Users className="w-5 h-5" />
                  <span>{t('tellFamily', lang)}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopySummary}
                className="min-h-[48px] inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-base shadow-xs transition-colors"
              >
                <Copy className="w-5 h-5" />
                <span>{t('copySummary', lang)}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="min-h-[48px] inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 font-bold text-base shadow-xs transition-colors"
              >
                <Printer className="w-5 h-5" />
                <span>{t('printOrSavePdf', lang)}</span>
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="min-h-[48px] inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-base transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <span>{t('deleteThisNote', lang)}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-[48px] px-6 py-3 rounded-2xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-base hover:bg-stone-100 dark:hover:bg-stone-800 inline-flex items-center space-x-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>{t('back', lang)}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  saveIncidentDraft();
                  onClose();
                }}
                className="min-h-[48px] px-8 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base shadow-sm transition-colors"
              >
                {t('finish', lang)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
