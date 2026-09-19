import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  X,
  Printer,
  Share2,
  CheckCircle2,
  Pill,
  HelpCircle,
  Briefcase,
  Users,
  ChevronRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DoctorVisitPrepData } from '../types';
import { formatWhatsAppUrl, formatSmsUrl } from '../utils/phone';
import { t } from '../i18n';

interface DoctorVisitPrepModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DoctorVisitPrepModal: React.FC<DoctorVisitPrepModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    settings,
    medicines,
    contacts,
    doctorVisitData,
    saveDoctorVisitData,
  } = useApp();
  const lang = settings.language;

  const [step, setStep] = useState<'form' | 'output'>('form');
  const [doctorName, setDoctorName] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [customBringItems, setCustomBringItems] = useState<string[]>([]);
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Selected contact for sharing
  const [shareContactId, setShareContactId] = useState<string>(() => {
    const primary = contacts.find((c) => c.isPrimary);
    return primary ? primary.id : contacts[0]?.id || '';
  });

  // Prefill active medicines
  useEffect(() => {
    if (isOpen) {
      if (doctorVisitData) {
        setDoctorName(doctorVisitData.doctorName || '');
        setSymptoms(doctorVisitData.symptoms || '');
        setSelectedMeds(doctorVisitData.includedMedicineNames || medicines.map((m) => m.name));
        setCustomBringItems(doctorVisitData.bringItems || []);
        setCustomQuestions(doctorVisitData.questionsToAsk || []);
      } else {
        setSelectedMeds(medicines.map((m) => m.name));
        setDoctorName('');
        setSymptoms('');
      }
      setStep('form');
      setShareSuccess(false);
    }
  }, [isOpen, doctorVisitData, medicines]);

  if (!isOpen) return null;

  const toggleMedicine = (name: string) => {
    setSelectedMeds((prev) =>
      prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name]
    );
  };

  const handleGenerate = async () => {
    setIsLoading(true);

    try {
      // Call backend API /api/visit-prep (safe: sends only symptoms, doctorName, medicines)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch('/api/visit-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorName: doctorName.trim() || undefined,
          symptoms: symptoms.trim() || undefined,
          medicines: selectedMeds,
          language: lang,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setCustomBringItems(data.bringItems || []);
        setCustomQuestions(data.questionsToAsk || []);

        const prepData: DoctorVisitPrepData = {
          doctorName: doctorName.trim(),
          symptoms: symptoms.trim(),
          includedMedicineNames: selectedMeds,
          bringItems: data.bringItems || [],
          questionsToAsk: data.questionsToAsk || [],
          updatedAt: new Date().toISOString(),
        };
        saveDoctorVisitData(prepData);
      } else {
        throw new Error('API failed');
      }
    } catch {
      // Deterministic offline fallback
      const defaultBring =
        lang === 'hi'
          ? [
              'वर्तमान दवाओं और नुस्खों (Prescriptions) की सूची',
              'पुराने पर्चे और हालिया खून/जांच रिपोर्ट',
              'चश्मा या सुनने की मशीन (यदि उपयोग करते हैं)',
              'आधार कार्ड या अस्पताल पंजीकरण कार्ड',
              'भुगतान का साधन या नकद राशि',
            ]
          : [
              'Active medicines list and original strips / bottles',
              'Old prescriptions and recent diagnostic reports',
              'Reading glasses or hearing aid (if used)',
              'Aadhaar card or hospital registration card',
              'Payment method or emergency cash',
            ];

      const defaultQuestions =
        lang === 'hi'
          ? [
              'क्या मेरी वर्तमान दवाओं में कोई बदलाव करने की आवश्यकता है?',
              'इन लक्षणों के लिए मुझे किन बातों या खानपान का ध्यान रखना चाहिए?',
              'क्या मुझे कोई जांच या टेस्ट करवाने की आवश्यकता है?',
              'मुझे अगली बार आपसे मिलने कब आना चाहिए?',
            ]
          : [
              'Should any of my current medicines change or be stopped?',
              'What lifestyle or diet precautions should I take for these symptoms?',
              'Are there any lab tests or diagnostic scans required?',
              'When should I see you next for a follow-up?',
            ];

      setCustomBringItems(defaultBring);
      setCustomQuestions(defaultQuestions);

      const prepData: DoctorVisitPrepData = {
        doctorName: doctorName.trim(),
        symptoms: symptoms.trim(),
        includedMedicineNames: selectedMeds,
        bringItems: defaultBring,
        questionsToAsk: defaultQuestions,
        updatedAt: new Date().toISOString(),
      };
      saveDoctorVisitData(prepData);
    } finally {
      setIsLoading(false);
      setStep('output');
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const selectedContact = contacts.find((c) => c.id === shareContactId) || contacts[0];

  const handleShareWhatsApp = () => {
    if (!selectedContact) return;
    const textLines = [
      lang === 'hi' ? '--- डॉक्टर से मिलने की तैयारी ---' : '--- Doctor Visit Checklist ---',
      doctorName.trim() ? `${t('whichDoctorOrClinic', lang)}: ${doctorName.trim()}` : '',
      symptoms.trim() ? `${t('symptomsOrWorries', lang)}: ${symptoms.trim()}` : '',
      `\n${t('bringWithYou', lang)}:`,
      ...customBringItems.map((item, i) => `${i + 1}. ${item}`),
      `\n${t('questionsToAskDoctor', lang)}:`,
      ...customQuestions.map((q, i) => `${i + 1}. ${q}`),
    ].filter(Boolean);

    const url = formatWhatsAppUrl(selectedContact.phone, textLines.join('\n'));
    window.open(url, '_blank', 'noopener,noreferrer');
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 4000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="visit-prep-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-6 my-6 max-h-[92vh] overflow-y-auto print:max-w-none print:shadow-none print:border-none print:m-0 print:p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4 print:hidden">
          <div className="flex items-center space-x-3 text-amber-700 dark:text-amber-400">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/70 flex items-center justify-center shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h2 id="visit-prep-modal-title" className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 font-heading">
                {t('doctorVisitPrepTitle', lang)}
              </h2>
              <p className="text-sm font-semibold text-stone-600 dark:text-stone-400">
                {t('doctorVisitPrepSubtitle', lang)}
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

        {/* STEP 1: FORM */}
        {step === 'form' && (
          <div className="space-y-6 animate-in fade-in print:hidden">
            {/* Doctor or clinic name */}
            <div>
              <label htmlFor="prep-doctor-input" className="block text-base font-semibold text-stone-800 dark:text-stone-200 mb-1">
                {t('whichDoctorOrClinic', lang)}
              </label>
              <input
                id="prep-doctor-input"
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder={lang === 'hi' ? 'उदा. डॉ. शर्मा, नेत्र चिकित्सक' : 'e.g. Dr. Sharma, eye checkup'}
                className="min-h-[52px] w-full px-4 py-3 rounded-2xl border-2 border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base"
              />
            </div>

            {/* Symptoms */}
            <div>
              <label htmlFor="prep-symptoms-input" className="block text-base font-semibold text-stone-800 dark:text-stone-200 mb-1">
                {t('symptomsOrWorries', lang)}
              </label>
              <textarea
                id="prep-symptoms-input"
                rows={3}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder={lang === 'hi' ? 'उदा. मंगलवार से घुटने में दर्द, सुबह चक्कर आना...' : 'e.g. knee pain since Tuesday, dizzy in the morning...'}
                className="w-full p-4 rounded-2xl border-2 border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base"
              />
            </div>

            {/* Current Medicines Checkbox List */}
            <div>
              <label className="block text-base font-semibold text-stone-800 dark:text-stone-200 mb-2">
                {t('medicinesTaking', lang)}
              </label>
              {medicines.length === 0 ? (
                <p className="text-sm text-stone-600 dark:text-stone-400 p-3 rounded-xl bg-stone-100 dark:bg-stone-800">
                  {lang === 'hi' ? 'कोई दवा सहेजी नहीं गई है।' : 'No medicines currently saved.'}
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                  {medicines.map((med) => {
                    const isChecked = selectedMeds.includes(med.name);
                    return (
                      <button
                        key={med.id}
                        type="button"
                        onClick={() => toggleMedicine(med.name)}
                        className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-colors min-h-[48px] ${
                          isChecked
                            ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/40 text-stone-900 dark:text-stone-100'
                            : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Pill className="w-4 h-4 text-amber-600" />
                          <span className="font-semibold text-base">{med.name}</span>
                          <span className="text-xs text-stone-600 dark:text-stone-400">({med.dosage})</span>
                        </div>
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center ${
                            isChecked ? 'bg-amber-600 border-amber-600 text-white' : 'border-stone-400'
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[48px] px-6 py-3 rounded-2xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-base hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                {t('cancel', lang)}
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading}
                className="min-h-[52px] px-8 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-base shadow-sm inline-flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{lang === 'hi' ? 'तैयार हो रहा है...' : 'Preparing...'}</span>
                  </>
                ) : (
                  <>
                    <span>{lang === 'hi' ? 'चेकलिस्ट बनाएं' : 'Create Checklist'}</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CHECKLIST OUTPUT */}
        {step === 'output' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Header info in print */}
            <div className="hidden print:block border-b pb-4 mb-4">
              <h1 className="text-2xl font-bold">{t('doctorVisitPrepTitle', lang)}</h1>
              {doctorName && <p className="text-lg font-semibold">{t('whichDoctorOrClinic', lang)}: {doctorName}</p>}
              {symptoms && <p className="text-base">{t('symptomsOrWorries', lang)}: {symptoms}</p>}
            </div>

            {/* SECTION 1: Bring With You */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-stone-900 dark:text-stone-100">
                <Briefcase className="w-5 h-5 text-amber-600" />
                <h3 className="text-xl font-bold font-heading">
                  {t('bringWithYou', lang)}
                </h3>
              </div>
              <div className="space-y-2">
                {customBringItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-start space-x-3 text-base font-medium text-stone-900 dark:text-stone-100"
                  >
                    <div className="w-6 h-6 rounded-lg bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 2: Questions to Ask */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-stone-900 dark:text-stone-100">
                <HelpCircle className="w-5 h-5 text-amber-600" />
                <h3 className="text-xl font-bold font-heading">
                  {t('questionsToAskDoctor', lang)}
                </h3>
              </div>
              <div className="space-y-2">
                {customQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-start space-x-3 text-base font-medium text-stone-900 dark:text-stone-100"
                  >
                    <div className="w-6 h-6 rounded-lg bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <span>{q}</span>
                  </div>
                ))}
              </div>
            </div>

            {shareSuccess && (
              <div role="status" aria-live="polite" className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-base font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>{lang === 'hi' ? 'परिजनों के साथ साझा किया गया।' : 'Shared with family.'}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-stone-200 dark:border-stone-800 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="min-h-[48px] inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl border-2 border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 font-bold text-base transition-colors"
              >
                <Printer className="w-5 h-5" />
                <span>{t('printOrSavePdf', lang)}</span>
              </button>

              {contacts.length > 0 && (
                <div className="flex items-center space-x-2">
                  <select
                    value={shareContactId}
                    onChange={(e) => setShareContactId(e.target.value)}
                    className="min-h-[48px] px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm"
                    aria-label={t('shareWithFamily', lang)}
                  >
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="min-h-[48px] inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base shadow-xs transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>{t('shareWithFamily', lang)}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-stone-800 print:hidden">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="min-h-[48px] px-6 py-3 rounded-2xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-base hover:bg-stone-100 dark:hover:bg-stone-800 inline-flex items-center space-x-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>{t('edit', lang)}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[48px] px-8 py-3 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-base shadow-sm transition-colors"
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
