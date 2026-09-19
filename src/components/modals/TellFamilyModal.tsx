import React, { useState } from 'react';
import { Users, Phone, MessageSquare, MessageCircle, X, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { t } from '../../i18n';

interface TellFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic?: string;
}

export const TellFamilyModal: React.FC<TellFamilyModalProps> = ({ isOpen, onClose, topic = 'a suspicious message or bill' }) => {
  const { settings, contacts, setActiveTab } = useApp();
  const lang = settings.language;

  const [selectedContactId, setSelectedContactId] = useState<string>(() => {
    const primary = contacts.find((c) => c.isPrimary);
    return primary ? primary.id : contacts[0]?.id || '';
  });

  if (!isOpen) return null;

  const selectedContact = contacts.find((c) => c.id === selectedContactId) || contacts[0];
  const isDemo = selectedContact?.isDemo || false;

  const previewMessage =
    lang === 'hi'
      ? `मुझे "${topic}" के बारे में एक संदिग्ध संदेश मिला है। सारथी ऐप ने इसे खतरनाक व धोखाधड़ी (Scam) बताया है। कृपया कुछ भी करने से पहले मेरे साथ इसकी जांच करें।`
      : `I received a suspicious message about "${topic}". Saarthi flagged it as dangerous. Please check this with me before I do anything.`;

  const cleanPhone = selectedContact ? selectedContact.phone.replace(/[^0-9+]/g, '') : '';
  const encodedText = encodeURIComponent(previewMessage);

  const handleWhatsApp = () => {
    if (isDemo || !cleanPhone) return;
    const url = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodedText}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSMS = () => {
    if (isDemo || !cleanPhone) return;
    window.location.href = `sms:${cleanPhone}?body=${encodedText}`;
  };

  const handleCall = () => {
    if (isDemo || !cleanPhone) return;
    window.location.href = `tel:${cleanPhone}`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tell-family-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-lg w-full p-6 border border-stone-200 dark:border-stone-700 shadow-xl space-y-4 my-8 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center space-x-3 text-amber-700 dark:text-amber-400">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h2 id="tell-family-title" className="text-xl font-bold text-stone-900 dark:text-stone-100">
              {t('tellFamilyTitle', lang)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label={t('close', lang)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-stone-700 dark:text-stone-300 text-sm">
          {t('tellFamilySub', lang)}
        </p>

        {contacts.length === 0 ? (
          <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-xl text-center space-y-3 border border-stone-200 dark:border-stone-700">
            <p className="text-stone-700 dark:text-stone-300 font-medium text-sm">
              {t('noContactsSaved', lang)}
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                setActiveTab('help');
              }}
              className="min-h-[48px] px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              {t('addContactBtn', lang)}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-2">
                {t('chooseContact', lang)}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => setSelectedContactId(contact.id)}
                    className={`min-h-[48px] px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                      (selectedContact?.id === contact.id)
                        ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 font-semibold ring-2 ring-amber-500'
                        : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <div className="text-sm font-bold truncate">{contact.name}</div>
                      <div className="text-xs text-stone-500 dark:text-stone-400 truncate">
                        {contact.relation} • {contact.phone}
                      </div>
                    </div>
                    {contact.isDemo && (
                      <span className="text-[11px] bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 px-1.5 py-0.5 rounded font-medium shrink-0">
                        Demo
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
                {t('messagePreview', lang)}
              </label>
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm leading-relaxed select-all">
                {previewMessage}
              </div>
            </div>

            {isDemo && (
              <div className="bg-amber-50 dark:bg-amber-950/50 p-3 rounded-xl border border-amber-300 dark:border-amber-800 flex items-center space-x-2 text-xs text-amber-900 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
                <span>{t('disabledDemoContact', lang)}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDemo || !cleanPhone}
                onClick={handleWhatsApp}
                className="min-h-[48px] px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors shadow-sm flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{t('sendViaWhatsApp', lang)}</span>
              </button>

              <button
                type="button"
                disabled={isDemo || !cleanPhone}
                onClick={handleSMS}
                className="min-h-[48px] px-3 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors shadow-sm flex items-center justify-center space-x-2"
              >
                <MessageSquare className="w-5 h-5" />
                <span>{t('sendViaSMS', lang)}</span>
              </button>

              <button
                type="button"
                disabled={isDemo || !cleanPhone}
                onClick={handleCall}
                className="min-h-[48px] px-3 py-2.5 rounded-xl bg-stone-700 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors shadow-sm flex items-center justify-center space-x-2"
              >
                <Phone className="w-5 h-5" />
                <span>{t('callContact', lang)}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
