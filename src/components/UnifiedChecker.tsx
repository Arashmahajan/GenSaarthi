import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Camera,
  Calendar,
  Pill,
  PhoneCall,
  Loader2,
  X,
  Mic,
  MicOff,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { UnifiedCheckResult } from '../types';
import { compressImageFile } from '../utils/imageCompressor';
import { VoiceSpeakerButton } from './VoiceSpeakerButton';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';
import { startVoiceDictation, isVoiceDictationSupported } from '../utils/speech';
import { PrivacyNoticeModal } from './modals/PrivacyNoticeModal';
import { ConfirmAddMedicineModal } from './modals/ConfirmAddMedicineModal';
import { ConfirmAddReminderModal } from './modals/ConfirmAddReminderModal';
import { TellFamilyModal } from './modals/TellFamilyModal';

export const UnifiedChecker: React.FC = () => {
  const { settings, privacySeen, setIsSOSOpen, setSOSTargetNumber } = useApp();
  const lang = settings.language;

  const [inputText, setInputText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<UnifiedCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Dictation state
  const [isDictating, setIsDictating] = useState(false);
  const [dictationStop, setDictationStop] = useState<(() => void) | null>(null);
  const [dictationError, setDictationError] = useState<string | null>(null);

  // Modals state
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const [medicineModalOpen, setMedicineModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [tellFamilyModalOpen, setTellFamilyModalOpen] = useState(false);

  // Toast confirmations
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError(lang === 'hi' ? 'कृपया केवल फ़ोटो फ़ाइल चुनें (JPEG, PNG, WebP)।' : 'Please select an image file (JPEG, PNG, or WebP).');
      return;
    }

    // Privacy note check (Requirement 7)
    if (!privacySeen) {
      setPendingFile(file);
      setShowPrivacyModal(true);
      return;
    }

    processImageFile(file);
  };

  const processImageFile = async (file: File) => {
    try {
      setIsCompressing(true);
      setError(null);
      const compressedDataUrl = await compressImageFile(file);
      setImagePreview(compressedDataUrl);
      setInputText('');
    } catch (err) {
      console.error(err);
      setError(lang === 'hi' ? 'फ़ोटो तैयार नहीं की जा सकी। कृपया दूसरी फ़ोटो चुनें।' : 'Could not process this photo. Please try another one.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handlePrivacyDismissed = () => {
    setShowPrivacyModal(false);
    if (pendingFile) {
      processImageFile(pendingFile);
      setPendingFile(null);
    }
  };

  const handleToggleDictation = () => {
    if (isDictating) {
      if (dictationStop) dictationStop();
      setIsDictating(false);
      setDictationStop(null);
      return;
    }

    if (!isVoiceDictationSupported()) {
      setDictationError(t('micNotSupported', lang));
      setTimeout(() => setDictationError(null), 4000);
      return;
    }

    setDictationError(null);
    const recognition = startVoiceDictation(
      (transcript) => {
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      },
      () => {
        setIsDictating(false);
        setDictationStop(null);
      },
      (err) => {
        setDictationError(err);
        setIsDictating(false);
        setDictationStop(null);
        setTimeout(() => setDictationError(null), 4000);
      },
      lang === 'hi' ? 'hi-IN' : 'en-IN'
    );

    if (recognition) {
      setIsDictating(true);
      setDictationStop(() => recognition.stop);
    }
  };

  const handleCheck = async () => {
    if (!inputText.trim() && !imagePreview) {
      setError(t('emptyInputWarning', lang));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim() || undefined,
          image: imagePreview || undefined,
          language: lang === 'hi' ? 'hi' : 'en',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || (lang === 'hi' ? 'जांच पूरी नहीं हो सकी।' : 'Failed to complete safety check.'));
      }

      const data: UnifiedCheckResult = await response.json();
      setResult(data);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : (lang === 'hi' ? 'जांच पूरी नहीं हो सकी। कृपया दोबारा प्रयास करें।' : 'Could not complete the check. Please try again.');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Language-aware speech readout (Requirement 6)
  const getSpokenReadout = (r: UnifiedCheckResult) => {
    if (lang === 'hi') {
      let text = `${r.title}। `;
      if (r.risk === 'scam') {
        text += `खतरे की चेतावनी! यह संदिग्ध धोखाधड़ी है। ${r.riskReason}। `;
      } else if (r.risk === 'careful') {
        text += `सावधानी से पढ़ें। ${r.riskReason}। `;
      } else {
        text += `यह संदेश सुरक्षित प्रतीत होता है। ${r.riskReason}। `;
      }
      text += `सार: ${r.summary}। `;
      if (r.steps && r.steps.length > 0) {
        text += `आगे के जरूरी कदम: ${r.steps.join('। ')}। `;
      }
      if (r.amountDue) {
        text += `देय राशि: ${r.amountDue}। `;
      }
      if (r.dueDate) {
        text += `अंतिम तारीख: ${r.dueDate}। `;
      }
      return text;
    }

    // English readout
    let text = `${r.title}. `;
    if (r.risk === 'scam') {
      text += `Scam warning! ${r.riskReason}. `;
    } else if (r.risk === 'careful') {
      text += `Please read carefully. ${r.riskReason}. `;
    } else {
      text += `Appears safe. ${r.riskReason}. `;
    }
    text += `Summary: ${r.summary}. `;
    if (r.steps && r.steps.length > 0) {
      text += `Recommended steps: ${r.steps.join('. ')}. `;
    }
    if (r.amountDue) {
      text += `Amount due: ${r.amountDue}. `;
    }
    if (r.dueDate) {
      text += `Due date: ${r.dueDate}. `;
    }
    return text;
  };

  return (
    <div id="unified-checker-section" className="space-y-6 max-w-4xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-3 text-base font-semibold animate-in fade-in slide-in-from-bottom-4"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen Title & Description */}
      <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 font-heading">
          {t('checkScreenTitle', lang)}
        </h1>
        <p className="text-stone-700 dark:text-stone-300 text-base leading-relaxed">
          {t('checkScreenSubtitle', lang)}
        </p>
      </div>

      {/* Main Input Card */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        {/* Photo Upload & Preview */}
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="min-h-[48px] inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-950 dark:text-amber-200 font-semibold text-base border border-amber-300 dark:border-amber-800 cursor-pointer transition-colors shadow-xs">
              <Camera className="w-5 h-5 text-amber-800 dark:text-amber-300 shrink-0" />
              <span>{imagePreview ? t('changePhoto', lang) : t('uploadPhoto', lang)}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageSelect(file);
                }}
              />
            </label>

            {imagePreview && (
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                className="min-h-[48px] px-4 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium text-sm flex items-center space-x-1.5 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>{t('removePhoto', lang)}</span>
              </button>
            )}

            {isCompressing && (
              <span className="text-sm text-amber-800 dark:text-amber-300 flex items-center space-x-1.5 font-medium animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('optimizingPhoto', lang)}</span>
              </span>
            )}
          </div>

          {imagePreview && (
            <div className="mt-4 relative inline-block rounded-2xl border border-stone-300 dark:border-stone-700 overflow-hidden shadow-xs bg-stone-100 dark:bg-stone-800">
              <img
                src={imagePreview}
                alt="Uploaded document preview"
                className="max-h-56 object-contain"
              />
            </div>
          )}
        </div>

        {/* Text Area Input with Voice Microphone Option */}
        <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <label htmlFor="check-text-input" className="block text-base font-semibold text-stone-900 dark:text-stone-100">
              {t('pasteOrType', lang)}
            </label>

            {/* Microphone dictation button */}
            <button
              type="button"
              onClick={handleToggleDictation}
              className={`min-h-[48px] min-w-[48px] px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center space-x-1.5 transition-colors ${
                isDictating
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
              title={isDictating ? t('stopAudio', lang) : t('speak', lang)}
              aria-label={isDictating ? t('stopAudio', lang) : t('speak', lang)}
            >
              {isDictating ? (
                <>
                  <MicOff className="w-4 h-4 shrink-0" />
                  <span>{t('listening', lang)}</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                  <span>{t('speak', lang)}</span>
                </>
              )}
            </button>
          </div>

          {dictationError && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {dictationError}
            </p>
          )}

          <textarea
            id="check-text-input"
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('pastePlaceholder', lang)}
            className="w-full p-4 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none placeholder:text-stone-400 dark:placeholder:text-stone-500"
          />
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-stone-500 dark:text-stone-400">
            {inputText.length > 0 ? `${inputText.length} characters` : ''}
          </div>

          <button
            id="run-unified-check-btn"
            type="button"
            disabled={isLoading || isCompressing || (!inputText.trim() && !imagePreview)}
            onClick={handleCheck}
            className="w-full sm:w-auto min-h-[48px] px-8 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 dark:disabled:bg-stone-800 disabled:text-stone-500 text-white font-bold rounded-2xl shadow-sm transition-colors text-base flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('checkingButton', lang)}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>{t('checkButton', lang)}</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-sm font-medium flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Result Section */}
      <div aria-live="polite">
        {result && (
          <div
            id="check-result-card"
            className={`border-2 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm ${
              result.risk === 'scam'
                ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                : result.risk === 'careful'
                ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
            }`}
          >
            {/* Top Risk Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200 dark:border-stone-700">
              <div className="flex items-center space-x-3.5">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
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
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide mb-1 border">
                    {result.risk === 'scam' && (
                      <span className="bg-rose-100 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700 px-2 py-0.5 rounded-full">
                        {t('riskScam', lang)}
                      </span>
                    )}
                    {result.risk === 'careful' && (
                      <span className="bg-amber-100 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded-full">
                        {t('riskCareful', lang)}
                      </span>
                    )}
                    {result.risk === 'safe' && (
                      <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 px-2 py-0.5 rounded-full">
                        {t('riskSafe', lang)}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 font-heading">
                    {result.title}
                  </h2>
                </div>
              </div>

              {/* Spoken Voice Button with Language Awareness */}
              <div className="self-start sm:self-center">
                <VoiceSpeakerButton
                  textToSpeak={getSpokenReadout(result)}
                  lang={lang === 'hi' ? 'hi-IN' : 'en-IN'}
                  speechRate={settings.speechRate}
                  size="md"
                />
              </div>
            </div>

            {/* Honest Fallback Notice if triggered */}
            {result.source === 'fallback' && (
              <div className="p-3.5 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100 text-xs font-semibold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-800 dark:text-amber-300 shrink-0" />
                <span>
                  {lang === 'hi'
                    ? 'सारथी ने यह जांच सामान्य सुरक्षा नियमों के आधार पर की है। कृपया बैंक या परिवार से पुष्टि अवश्य करें।'
                    : 'I could not read this fully, so this is a general safety check only.'}
                </span>
              </div>
            )}

            {/* Guidance & Reason */}
            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1">
                {t('guidanceReason', lang)}
              </span>
              <p className="text-stone-900 dark:text-stone-100 text-base leading-relaxed font-medium">
                {result.riskReason}
              </p>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 space-y-1">
              <p className="text-stone-900 dark:text-stone-100 text-base sm:text-lg leading-relaxed">
                {result.summary}
              </p>
            </div>

            {/* Red Flags if any */}
            {result.redFlags && result.redFlags.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 block">
                  {t('redFlagsTitle', lang)}
                </span>
                <ul className="space-y-1.5">
                  {result.redFlags.map((flag, idx) => (
                    <li
                      key={idx}
                      className="text-sm font-medium text-rose-950 dark:text-rose-200 bg-rose-100/80 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 p-2.5 rounded-xl flex items-start space-x-2"
                    >
                      <span className="font-bold text-rose-700 dark:text-rose-400">•</span>
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
                  <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-semibold block">
                      {t('amountDue', lang)}
                    </span>
                    <span className="text-xl font-bold text-stone-900 dark:text-stone-100">{result.amountDue}</span>
                  </div>
                )}
                {result.dueDate && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-semibold block">
                      {t('dueDate', lang)}
                    </span>
                    <span className="text-lg font-bold text-amber-900 dark:text-amber-300">{result.dueDate}</span>
                  </div>
                )}
              </div>
            )}

            {/* Recommended Steps */}
            {result.steps && result.steps.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 block">
                  {t('stepsToTake', lang)}
                </span>
                <div className="space-y-2">
                  {result.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-start space-x-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-sm sm:text-base font-medium text-stone-800 dark:text-stone-200">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Jargon Buster */}
            {result.jargon && result.jargon.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-700">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 block">
                  {t('jargonBusterTitle', lang)}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.jargon.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300"
                    >
                      <strong className="text-stone-900 dark:text-stone-100 block font-bold mb-0.5">
                        {item.term}:
                      </strong>
                      <span>{item.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons (Requirement 3, 4, 5) */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-stone-200 dark:border-stone-700">
              {/* If scam detected: Tell family & Get help buttons (Requirement 5) */}
              {result.risk === 'scam' && (
                <>
                  <button
                    type="button"
                    onClick={() => setTellFamilyModalOpen(true)}
                    className="min-h-[48px] inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-xs transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    <span>{t('tellMyFamily', lang)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSOSTargetNumber('1930');
                      setIsSOSOpen(true);
                    }}
                    className="min-h-[48px] inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-sm shadow-xs transition-colors"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>{t('getEmergencyHelp', lang)}</span>
                  </button>
                </>
              )}

              {/* Add to Reminders button */}
              {(result.reminder || result.dueDate) && (
                <button
                  id="add-to-reminders-btn"
                  type="button"
                  onClick={() => setReminderModalOpen(true)}
                  className="min-h-[48px] inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-sm shadow-xs transition-colors"
                >
                  <Calendar className="w-4 h-4 text-amber-400 dark:text-amber-600" />
                  <span>{t('addToReminders', lang)}</span>
                </button>
              )}

              {/* Add to Medicines button */}
              {result.medicine && (
                <button
                  id="add-to-medicines-btn"
                  type="button"
                  onClick={() => setMedicineModalOpen(true)}
                  className="min-h-[48px] inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xs transition-colors"
                >
                  <Pill className="w-4 h-4 text-emerald-200" />
                  <span>{t('addToMedicines', lang)}</span>
                </button>
              )}

              {result.helpline && (
                <a
                  href={`tel:${result.helpline}`}
                  className="min-h-[48px] inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-sm shadow-xs transition-colors"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call {result.helpline}</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation and Privacy Modals */}
      <PrivacyNoticeModal
        isOpen={showPrivacyModal}
        onClose={handlePrivacyDismissed}
      />

      <ConfirmAddMedicineModal
        isOpen={medicineModalOpen}
        onClose={() => setMedicineModalOpen(false)}
        initialData={{
          name: result?.medicine?.name,
          dosage: '1 Tablet',
          timing: 'morning',
          withFood: 'after_food',
          purpose: result?.title,
        }}
        onSuccess={(name) => {
          showToast(lang === 'hi' ? `"${name}" आपकी दवा सूची में जोड़ दी गई है।` : `"${name}" added to your medicines.`);
        }}
      />

      <ConfirmAddReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        initialData={{
          title: result?.reminder?.title || result?.title || 'Bill / Reminder',
          dueDate: result?.reminder?.dueDate || result?.dueDate || undefined,
          note: result?.reminder?.note || (result?.amountDue ? `Amount: ${result.amountDue}` : undefined),
        }}
        onSuccess={(title) => {
          showToast(lang === 'hi' ? `"${title}" रिमाइंडर में जोड़ दिया गया है।` : `"${title}" saved to your reminders.`);
        }}
      />

      <TellFamilyModal
        isOpen={tellFamilyModalOpen}
        onClose={() => setTellFamilyModalOpen(false)}
        topic={result?.title || 'a suspicious message'}
      />
    </div>
  );
};
