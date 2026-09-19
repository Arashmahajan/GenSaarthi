import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { t } from '../../i18n';

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({ isOpen, onClose }) => {
  const { settings, setPrivacySeen } = useApp();
  const lang = settings.language;

  if (!isOpen) return null;

  const handleDismiss = () => {
    setPrivacySeen(true);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-notice-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
    >
      <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full p-6 border border-stone-200 dark:border-stone-700 shadow-xl space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center space-x-3 text-emerald-700 dark:text-emerald-400">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 id="privacy-notice-title" className="text-xl font-bold text-stone-900 dark:text-stone-100">
            {t('privacyNoticeTitle', lang)}
          </h2>
        </div>

        <p className="text-stone-700 dark:text-stone-300 text-base leading-relaxed">
          {t('privacyNoticeBody', lang)}
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-base transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            {t('privacyNoticeButton', lang)}
          </button>
        </div>
      </div>
    </div>
  );
};
