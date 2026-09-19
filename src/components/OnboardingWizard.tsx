import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Volume2,
  Sparkles,
  Heart,
  Moon,
  Sun,
  Shield,
  Phone,
  User,
  Sliders,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TextSize, Language } from '../types';
import { sanitizePhoneNumber } from '../utils/phone';
import { t } from '../i18n';

interface OnboardingWizardProps {
  isOpen: boolean;
  onComplete: (useSimpleMode: boolean) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  isOpen,
  onComplete,
}) => {
  const {
    userName,
    setUserName,
    settings,
    updateSettings,
    contacts,
    addContact,
  } = useApp();
  const lang = settings.language;

  const [step, setStep] = useState<number>(1);
  const [localName, setLocalName] = useState(userName || '');
  const [useSimpleModeOption, setUseSimpleModeOption] = useState(false);

  // Step 5 family contact state
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState(
    lang === 'hi' ? 'बेटा/बेटी/मित्र' : 'Family / Friend'
  );
  const [contactError, setContactError] = useState('');

  if (!isOpen) return null;

  const handleNextStep = () => {
    // If on step 1, commit name if entered
    if (step === 1 && localName.trim()) {
      setUserName(localName.trim());
    }

    // If on step 5 and contact was entered
    if (step === 5 && (contactName.trim() || contactPhone.trim())) {
      const sanitizedPhone = sanitizePhoneNumber(contactPhone);
      if (!contactName.trim()) {
        setContactError(
          lang === 'hi' ? 'कृपया संपर्क का नाम लिखें।' : 'Please enter contact name.'
        );
        return;
      }
      if (!sanitizedPhone || sanitizedPhone.length < 5) {
        setContactError(
          lang === 'hi'
            ? 'कृपया एक मान्य फ़ोन नंबर लिखें।'
            : 'Please enter a valid phone number.'
        );
        return;
      }
      addContact({
        name: contactName.trim(),
        phone: sanitizedPhone,
        relation: contactRelation.trim() || 'Family',
        isPrimary: contacts.length === 0,
      });
      setContactError('');
    }

    if (step < 6) {
      setStep(step + 1);
    } else {
      onComplete(useSimpleModeOption);
    }
  };

  const handleSkip = () => {
    if (step < 6) {
      setStep(step + 1);
    } else {
      onComplete(useSimpleModeOption);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-step-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/80 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-6 my-6 max-h-[92vh] overflow-y-auto">
        {/* Progress Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <span className="text-base font-bold text-amber-700 dark:text-amber-400">
            {step <= 5 ? t('stepCounter', lang, { current: step, total: 5 }) : t('firstRunFinishTitle', lang)}
          </span>
          {step <= 5 && (
            <button
              type="button"
              onClick={handleSkip}
              className="min-h-[48px] px-4 py-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 text-base font-semibold transition-colors"
            >
              {t('skip', lang)}
            </button>
          )}
        </div>

        {/* STEP 1: Name */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="space-y-2">
              <h2 id="onboarding-step-title" className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 font-heading">
                {t('firstRunStep1Title', lang)}
              </h2>
              <p className="text-stone-700 dark:text-stone-300 text-base leading-relaxed">
                {t('firstRunStep1Desc', lang)}
              </p>
            </div>

            <div>
              <label htmlFor="onboarding-name-input" className="sr-only">
                {t('whatShouldICallYou', lang)}
              </label>
              <input
                id="onboarding-name-input"
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder={t('nameInputPlaceholder', lang)}
                className="min-h-[56px] w-full px-5 py-3.5 rounded-2xl border-2 border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-lg focus:border-amber-600 focus:outline-none"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* STEP 2: Language */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="space-y-2">
              <h2 id="onboarding-step-title" className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 font-heading">
                {t('firstRunStep2Title', lang)}
              </h2>
              <p className="text-stone-700 dark:text-stone-300 text-base leading-relaxed">
                {t('firstRunStep2Desc', lang)}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => updateSettings({ language: 'en' })}
                aria-pressed={lang === 'en'}
                className={`min-h-[64px] p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                  lang === 'en'
                    ? 'border-amber-600 bg-amber-50/80 dark:bg-amber-950/40 text-stone-900 dark:text-stone-100'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 text-stone-800 dark:text-stone-200'
                }`}
              >
                <div>
                  <span className="text-xl font-bold block">English</span>
                  <span className="text-sm text-stone-600 dark:text-stone-400">Simple English</span>
                </div>
                {lang === 'en' && <CheckCircle2 className="w-6 h-6 text-amber-600 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => updateSettings({ language: 'hi' })}
                aria-pressed={lang === 'hi'}
                className={`min-h-[64px] p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                  lang === 'hi'
                    ? 'border-amber-600 bg-amber-50/80 dark:bg-amber-950/40 text-stone-900 dark:text-stone-100'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 text-stone-800 dark:text-stone-200'
                }`}
              >
                <div>
                  <span className="text-xl font-bold block">हिंदी</span>
                  <span className="text-sm text-stone-600 dark:text-stone-400">सरल हिंदी</span>
                </div>
                {lang === 'hi' && <CheckCircle2 className="w-6 h-6 text-amber-600 shrink-0" />}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Text Size */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="space-y-2">
              <h2 id="onboarding-step-title" className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 font-heading">
                {t('firstRunStep3Title', lang)}
              </h2>
              <p className="text-stone-700 dark:text-stone-300 text-base leading-relaxed">
                {t('firstRunStep3Desc', lang)}
              </p>
            </div>

            {/* Live Preview Paragraph */}
            <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-stone-800/80 border border-amber-300 dark:border-amber-700">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 block mb-1">
                {lang === 'hi' ? 'लाइव पूर्वावलोकन (Preview)' : 'Live Preview'}
              </span>
              <p className="text-stone-900 dark:text-stone-100 font-medium leading-relaxed">
                {t('firstRunStep3Preview', lang)}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['normal', 'large', 'extra-large'] as TextSize[]).map((size) => {
                const isSelected = settings.textSize === size;
                const label =
                  size === 'normal'
                    ? lang === 'hi'
                      ? 'सामान्य (19px)'
                      : 'Regular (19px)'
                    : size === 'large'
                    ? lang === 'hi'
                      ? 'बड़ा (22px)'
                      : 'Large (22px)'
                    : lang === 'hi'
                    ? 'अतिरिक्त बड़ा (26px)'
                    : 'Extra Large (26px)';

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => updateSettings({ textSize: size })}
                    aria-pressed={isSelected}
                    className={`min-h-[56px] p-4 rounded-2xl border-2 text-center font-bold text-base transition-all ${
                      isSelected
                        ? 'border-amber-600 bg-amber-600 text-white shadow-xs'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 text-stone-900 dark:text-stone-100'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Comfort & Contrast */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="space-y-2">
              <h2 id="onboarding-step-title" className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 font-heading">
                {t('firstRunStep4Title', lang)}
              </h2>
              <p className="text-stone-700 dark:text-stone-300 text-base leading-relaxed">
                {t('firstRunStep4Desc', lang)}
              </p>
            </div>

            <div className="space-y-4">
              {/* High Contrast Toggle */}
              <button
                type="button"
                onClick={() => updateSettings({ highContrast: !settings.highContrast })}
                className="w-full min-h-[60px] p-4 rounded-2xl border-2 border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 flex items-center justify-between text-left"
              >
                <div className="space-y-0.5">
                  <span className="text-lg font-bold text-stone-900 dark:text-stone-100 block">
                    {lang === 'hi' ? 'हाई कंट्रास्ट (High Contrast)' : 'High Contrast Mode'}
                  </span>
                  <span className="text-sm text-stone-600 dark:text-stone-400 block">
                    {lang === 'hi'
                      ? 'अक्षरों और सीमाओं को और अधिक गहरा व स्पष्ट बनाता है'
                      : 'Bolds borders and deepens text for maximum clarity'}
                  </span>
                </div>
                <div
                  className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center shrink-0 ${
                    settings.highContrast ? 'bg-amber-600 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </div>
              </button>

              {/* Dark Mode Toggle */}
              <button
                type="button"
                onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                className="w-full min-h-[60px] p-4 rounded-2xl border-2 border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 flex items-center justify-between text-left"
              >
                <div className="space-y-0.5">
                  <span className="text-lg font-bold text-stone-900 dark:text-stone-100 block">
                    {lang === 'hi' ? 'डार्क मोड (Dark Mode)' : 'Dark Mode'}
                  </span>
                  <span className="text-sm text-stone-600 dark:text-stone-400 block">
                    {lang === 'hi'
                      ? 'रात के समय आंखों को आराम देने के लिए गहरा रंग'
                      : 'Gentle dark background for dimmer rooms'}
                  </span>
                </div>
                <div
                  className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center shrink-0 ${
                    settings.darkMode ? 'bg-amber-600 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Family Member */}
        {step === 5 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="space-y-2">
              <h2 id="onboarding-step-title" className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 font-heading">
                {t('firstRunStep5Title', lang)}
              </h2>
              <p className="text-stone-700 dark:text-stone-300 text-base leading-relaxed">
                {t('firstRunStep5Desc', lang)}
              </p>
            </div>

            {contactError && (
              <div role="alert" className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 text-rose-900 dark:text-rose-200 text-base font-semibold">
                {contactError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-base font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  {lang === 'hi' ? 'नाम (जैसे बेटा/बेटी/मित्र)' : 'Name (e.g. Son, Daughter, Friend)'}
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder={lang === 'hi' ? 'जैसे राहुल' : 'e.g. Rahul'}
                  className="min-h-[52px] w-full px-4 py-3 rounded-2xl border-2 border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  {lang === 'hi' ? 'फ़ोन नंबर' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="min-h-[52px] w-full px-4 py-3 rounded-2xl border-2 border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Finish Summary & Simple Mode Offer */}
        {step === 6 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 id="onboarding-step-title" className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 font-heading">
                {t('firstRunFinishTitle', lang)}
              </h2>
              <p className="text-stone-700 dark:text-stone-300 text-base leading-relaxed">
                {t('firstRunFinishDesc', lang)}
              </p>
            </div>

            {/* Simple Mode Toggle Option */}
            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border-2 border-stone-200 dark:border-stone-700 space-y-3">
              <button
                type="button"
                onClick={() => setUseSimpleModeOption(!useSimpleModeOption)}
                className="w-full flex items-center justify-between text-left min-h-[48px]"
              >
                <div className="space-y-0.5">
                  <span className="text-lg font-bold text-stone-900 dark:text-stone-100 block">
                    {t('useSimpleMode', lang)}
                  </span>
                  <span className="text-sm text-stone-600 dark:text-stone-400 block">
                    {t('simpleModeDesc', lang)}
                  </span>
                </div>
                <div
                  className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center shrink-0 ${
                    useSimpleModeOption ? 'bg-amber-600 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-stone-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="min-h-[48px] px-6 py-3 rounded-2xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-base hover:bg-stone-100 dark:hover:bg-stone-800 inline-flex items-center space-x-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t('back', lang)}</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNextStep}
            className="min-h-[52px] px-8 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-base shadow-sm inline-flex items-center space-x-2 transition-colors"
          >
            <span>{step === 6 ? t('startSaarthi', lang) : t('next', lang)}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
