import React, { useState } from 'react';
import {
  Settings,
  X,
  User,
  Volume2,
  Type,
  Sun,
  Moon,
  Zap,
  Check,
  Database,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { t } from '../../i18n';
import { TextSize } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    settings,
    updateSettings,
    loadDemo,
    clearDemo,
    isDemo,
  } = useApp();

  const lang = settings.language;
  const [nameInput, setNameInput] = useState(settings.userName || '');
  const [savedNameSuccess, setSavedNameSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ userName: nameInput.trim() });
    setSavedNameSuccess(true);
    setTimeout(() => setSavedNameSuccess(false), 3000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 dark:border-stone-800 max-h-[92vh] overflow-y-auto space-y-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 font-heading">
              {t('settingsTitle', lang)}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] min-w-[48px] p-2 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors flex items-center justify-center"
            aria-label={t('close', lang)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 1. Name input: "What should I call you?" (Requirement 5 & 8) */}
        <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
          <div className="flex items-center space-x-2 text-stone-900 dark:text-stone-100 font-bold text-base">
            <User className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <span>{t('whatShouldICallYou', lang)}</span>
          </div>
          <form onSubmit={handleSaveName} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={t('nameInputPlaceholder', lang)}
              className="flex-1 min-h-[48px] px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none"
            />
            <button
              type="submit"
              className="min-h-[48px] px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-colors text-sm flex items-center justify-center space-x-1.5"
            >
              {savedNameSuccess ? <Check className="w-4 h-4" /> : null}
              <span>{savedNameSuccess ? t('saved', lang) : t('saveName', lang)}</span>
            </button>
          </form>
          {settings.userName && (
            <p className="text-xs text-stone-600 dark:text-stone-400">
              {lang === 'hi'
                ? `सारथी आपको "नमस्ते, ${settings.userName} जी" कहकर संबोधित करेगा।`
                : `Saarthi will greet you respectfully as "Namaste, ${settings.userName} ji".`}
            </p>
          )}
        </div>

        {/* 2. Language: English / Hindi toggle with native labels (Requirement 8) */}
        <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
          <label className="block text-sm font-bold text-stone-900 dark:text-stone-100">
            {t('languageSetting', lang)}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => updateSettings({ language: 'en' })}
              className={`min-h-[48px] px-4 py-2.5 rounded-xl font-bold text-sm border flex items-center justify-center space-x-2 transition-colors ${
                settings.language === 'en'
                  ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-stone-800 dark:text-stone-200 hover:bg-stone-100'
              }`}
            >
              <span>English</span>
              {settings.language === 'en' && <Check className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => updateSettings({ language: 'hi' })}
              className={`min-h-[48px] px-4 py-2.5 rounded-xl font-bold text-sm border flex items-center justify-center space-x-2 transition-colors ${
                settings.language === 'hi'
                  ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-stone-800 dark:text-stone-200 hover:bg-stone-100'
              }`}
            >
              <span>हिंदी (Hindi)</span>
              {settings.language === 'hi' && <Check className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 3. Text Size: 3 discrete sizes (Regular 16px, Large 18px, Extra Large 20px) (Requirement 8) */}
        <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
          <div className="flex items-center space-x-2 text-stone-900 dark:text-stone-100 font-bold text-sm">
            <Type className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span>{t('textSizeSetting', lang)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'normal', label: t('textSizeRegular', lang) },
                { id: 'large', label: t('textSizeLarge', lang) },
                { id: 'extra-large', label: t('textSizeExtraLarge', lang) },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => updateSettings({ textSize: item.id as TextSize })}
                className={`min-h-[48px] px-2 py-2 rounded-xl font-bold text-xs sm:text-sm border transition-colors ${
                  settings.textSize === item.id
                    ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-stone-800 dark:text-stone-200 hover:bg-stone-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Display: Dark Mode & High Contrast (Requirement 8) */}
        <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
          <span className="block text-sm font-bold text-stone-900 dark:text-stone-100">
            {t('displayMode', lang)}
          </span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => updateSettings({ darkMode: !settings.darkMode })}
              className={`min-h-[48px] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm border flex items-center justify-center space-x-2 transition-colors ${
                settings.darkMode
                  ? 'bg-stone-900 border-amber-500 text-amber-300'
                  : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-stone-800 dark:text-stone-200'
              }`}
            >
              {settings.darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{settings.darkMode ? t('lightMode', lang) : t('darkMode', lang)}</span>
            </button>

            <button
              type="button"
              onClick={() => updateSettings({ highContrast: !settings.highContrast })}
              className={`min-h-[48px] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm border flex items-center justify-center space-x-2 transition-colors ${
                settings.highContrast
                  ? 'bg-black border-amber-400 text-amber-300 ring-2 ring-amber-400'
                  : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-stone-800 dark:text-stone-200'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>{settings.highContrast ? 'High Contrast ON' : t('highContrast', lang)}</span>
            </button>
          </div>
        </div>

        {/* 5. Voice Speed: Normal (1.0x), Slow (0.85x), Slower (0.75x) (Requirement 8) */}
        <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
          <div className="flex items-center space-x-2 text-stone-900 dark:text-stone-100 font-bold text-sm">
            <Volume2 className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span>{t('voiceSpeedSetting', lang)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { rate: 1.0, label: t('voiceSpeedNormal', lang) },
              { rate: 0.85, label: t('voiceSpeedSlow', lang) },
              { rate: 0.75, label: t('voiceSpeedSlower', lang) },
            ].map((item) => (
              <button
                key={item.rate}
                type="button"
                onClick={() => updateSettings({ speechRate: item.rate })}
                className={`min-h-[48px] px-2 py-2 rounded-xl font-bold text-xs sm:text-sm border transition-colors ${
                  settings.speechRate === item.rate
                    ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-stone-800 dark:text-stone-200 hover:bg-stone-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Demo Data Management (Requirement 1 & 8) */}
        <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
          <div className="flex items-center space-x-2 text-stone-900 dark:text-stone-100 font-bold text-sm">
            <Database className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span>{lang === 'hi' ? 'नमूना डेटा (डेमो)' : 'Sample Demo Data'}</span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            {lang === 'hi'
              ? 'सारथी की जांच के लिए नमूना दवाइयां और रिमाइंडर लोड करें, या एक टैप में हटाएं।'
              : 'Test Saarthi features with sample medicines, reminders and contacts. Clearly labelled and removable in one tap.'}
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              type="button"
              onClick={loadDemo}
              className="min-h-[48px] px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm transition-colors shadow-xs"
            >
              {t('loadDemoData', lang)}
            </button>

            {isDemo && (
              <button
                type="button"
                onClick={clearDemo}
                className="min-h-[48px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition-colors shadow-xs flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('clearDemoData', lang)}</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] px-6 py-2.5 rounded-2xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 text-white dark:text-stone-900 font-bold text-base transition-colors"
          >
            {t('close', lang)}
          </button>
        </div>
      </div>
    </div>
  );
};
