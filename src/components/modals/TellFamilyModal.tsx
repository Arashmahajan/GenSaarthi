import React, { useState } from 'react';
import {
  Users,
  Phone,
  MessageSquare,
  MessageCircle,
  X,
  ShieldAlert,
  AlertTriangle,
  MapPin,
  Loader2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatTelUrl, formatSmsUrl, formatWhatsAppUrl } from '../../utils/phone';
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

  const [includeLocation, setIncludeLocation] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationMapLink, setLocationMapLink] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedContact = contacts.find((c) => c.id === selectedContactId) || contacts[0];
  const isDemo = selectedContact?.isDemo || false;

  const baseMessage =
    lang === 'hi'
      ? `मुझे "${topic}" के बारे में एक संदिग्ध संदेश मिला है। सारथी ऐप ने इसे खतरनाक व धोखाधड़ी (Scam) बताया है। कृपया कुछ भी करने से पहले मेरे साथ इसकी जांच करें।`
      : `I received a suspicious message about "${topic}". Saarthi flagged it as dangerous. Please check this with me before I do anything.`;

  const previewMessage = includeLocation && locationMapLink
    ? `${baseMessage}\n${locationMapLink}`
    : baseMessage;

  const cleanPhone = selectedContact ? selectedContact.phone : '';

  const handleToggleLocation = () => {
    if (!includeLocation) {
      if (!navigator.geolocation) {
        setLocationError(
          lang === 'hi'
            ? 'स्थान सेवा उपलब्ध नहीं है। आप बिना स्थान के भी संदेश भेज सकते हैं।'
            : 'Location is not supported on this device. You can still send your message without it.'
        );
        return;
      }

      setLocationLoading(true);
      setLocationError(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationLoading(false);
          const lat = pos.coords.latitude.toFixed(5);
          const lng = pos.coords.longitude.toFixed(5);
          const acc = Math.round(pos.coords.accuracy);
          const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;

          setIncludeLocation(true);
          setLocationAccuracy(acc);
          setLocationMapLink(mapLink);
        },
        (err) => {
          setLocationLoading(false);
          setIncludeLocation(false);
          setLocationAccuracy(null);
          let msg =
            lang === 'hi'
              ? 'स्थान प्राप्त नहीं हो सका। आप बिना इसके भी संदेश भेज सकते हैं।'
              : 'Could not retrieve your location. You can still send your message without it.';
          if (err.code === 1) {
            msg =
              lang === 'hi'
                ? 'स्थान की अनुमति नहीं मिली। आप बिना इसके भी संदेश भेज सकते हैं।'
                : 'Location permission was denied. You can still send your message without it.';
          } else if (err.code === 3) {
            msg =
              lang === 'hi'
                ? 'स्थान का समय समाप्त हो गया। आप बिना इसके भी संदेश भेज सकते हैं।'
                : 'Location request timed out. You can still send your message without it.';
          }
          setLocationError(msg);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setIncludeLocation(false);
      setLocationAccuracy(null);
      setLocationError(null);
      setLocationMapLink(null);
    }
  };

  const handleWhatsApp = () => {
    if (isDemo || !cleanPhone) return;
    const url = formatWhatsAppUrl(cleanPhone, previewMessage);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSMS = () => {
    if (isDemo || !cleanPhone) return;
    const url = formatSmsUrl(cleanPhone, previewMessage);
    window.location.href = url;
  };

  const handleCall = () => {
    if (isDemo || !cleanPhone) return;
    const url = formatTelUrl(cleanPhone);
    window.location.href = url;
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

            {/* Feature 6: Location Checkbox */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
              <label className="flex items-center space-x-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeLocation}
                  onChange={handleToggleLocation}
                  disabled={locationLoading}
                  className="w-5 h-5 rounded-md text-amber-600 focus:ring-amber-500 border-stone-300"
                />
                <span className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span>{t('includeLocation', lang)}</span>
                </span>
              </label>

              {locationLoading && (
                <div className="flex items-center space-x-2 text-xs text-amber-800 dark:text-amber-300 pl-8">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>{t('gettingLocation', lang)}</span>
                </div>
              )}

              {includeLocation && locationAccuracy !== null && (
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 pl-8">
                  {t('locationFoundAccuracy', lang, { meters: locationAccuracy })}
                </p>
              )}

              {locationError && (
                <p role="alert" className="text-xs font-semibold text-rose-700 dark:text-rose-400 pl-8">
                  {locationError}
                </p>
              )}
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
