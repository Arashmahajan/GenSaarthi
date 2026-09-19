import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  AlertTriangle,
  Heart,
  Plus,
  Trash2,
  Info,
  UserPlus,
  MessageSquare,
  ShieldAlert,
  Send,
  CheckCircle2,
  X,
} from 'lucide-react';
import { EmergencyContact } from '../types';
import { EMERGENCY_NUMBERS } from '../data/saarthiData';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';

interface EmergencyHelpProps {
  initialTargetNumber?: string | null;
  onClose?: () => void;
  isModal?: boolean;
}

export const EmergencyHelp: React.FC<EmergencyHelpProps> = ({
  initialTargetNumber,
  onClose,
  isModal = false,
}) => {
  const { settings, contacts, addContact, deleteContact, loadDemo, isDemo } = useApp();
  const lang = settings.language;

  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('Family');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // "I'm not feeling well" drafting state (Requirement 5)
  const [feelingUnwellOpen, setFeelingUnwellOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string>(contacts[0]?.id || '');
  const [customUnwellText, setCustomUnwellText] = useState(
    'I am not feeling well and need some help. Please call or come over.'
  );

  useEffect(() => {
    if (contacts.length > 0 && !selectedContactId) {
      setSelectedContactId(contacts[0].id);
    }
  }, [contacts, selectedContactId]);

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);

    const nameTrimmed = newContactName.trim();
    const phoneClean = newContactPhone.replace(/[^0-9+]/g, '');
    const digitsOnly = phoneClean.replace(/[^0-9]/g, '');

    if (!nameTrimmed) {
      setPhoneError(lang === 'hi' ? 'कृपया संपर्क व्यक्ति का नाम लिखें।' : 'Please enter the contact person’s name.');
      return;
    }

    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      setPhoneError(lang === 'hi' ? 'कृपया मान्य 10 अंकों का मोबाइल नंबर लिखें।' : 'Please enter a valid 10-digit mobile number.');
      return;
    }

    addContact({
      name: nameTrimmed,
      relation: newContactRelation.trim() || 'Family',
      phone: phoneClean.startsWith('+') ? phoneClean : `+91 ${phoneClean}`,
      isPrimary: contacts.length === 0,
    });

    setIsAddingContact(false);
    setNewContactName('');
    setNewContactPhone('');
  };

  const selectedContact = contacts.find((c) => c.id === selectedContactId) || contacts[0];

  const handleSendWhatsApp = (phone: string, text: string) => {
    const cleanNumber = phone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encoded}`, '_blank');
  };

  const handleSendSMS = (phone: string, text: string) => {
    const cleanNumber = phone.replace(/[^0-9+]/g, '');
    const encoded = encodeURIComponent(text);
    window.open(`sms:${cleanNumber}?body=${encoded}`, '_self');
  };

  return (
    <div id="emergency-help-section" className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 rounded-3xl p-6 sm:p-8 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-200/80 dark:bg-rose-900/60 text-rose-950 dark:text-rose-200 font-extrabold text-xs uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 text-rose-700 dark:text-rose-400" />
              <span>{t('emergencyTab', lang)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 font-heading">
              {lang === 'hi'
                ? 'आपातकालीन सहायता और पारिवारिक संपर्क'
                : 'Emergency Assistance & Family Contacts'}
            </h1>
            <p className="text-stone-700 dark:text-stone-300 text-base leading-relaxed max-w-2xl">
              {lang === 'hi'
                ? 'ज़रूरत के समय तुरंत सरकारी हेल्पलाइन या अपने परिजनों से संपर्क करें। डायल करने से पहले आप संदेश देख सकते हैं।'
                : 'Direct access to official Indian helplines and your trusted family circle. Nothing is sent automatically without your tap.'}
            </p>
          </div>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] min-w-[48px] p-2 rounded-2xl bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors flex items-center justify-center"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Technical safety note */}
        <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-rose-200 dark:border-rose-900 text-xs text-stone-700 dark:text-stone-300 flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-stone-900 dark:text-stone-100 font-bold block mb-0.5">
              {lang === 'hi' ? 'महत्वपूर्ण सूचना:' : 'Safety Notice:'}
            </strong>
            {lang === 'hi'
              ? 'कॉल करने पर आपके फ़ोन का डायलर खुलेगा। सारथी पृष्ठभूमि में कोई कॉल अपने आप नहीं करता है।'
              : 'Tapping Call opens your phone dialer. Saarthi does not automatically dial in the background.'}
          </div>
        </div>
      </div>

      {/* "I'm Not Feeling Well" Action Button & Composer (Requirement 5) */}
      <div className="bg-white dark:bg-stone-900 border-2 border-amber-300 dark:border-amber-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                {t('notFeelingWellBtn', lang)}
              </h2>
            </div>
            <p className="text-stone-600 dark:text-stone-400 text-sm">
              {lang === 'hi'
                ? 'यदि आपकी तबीयत ठीक नहीं है, तो परिजनों को पहले से तैयार संदेश भेजें।'
                : 'Need immediate support? Draft a quick check-in message to your family or emergency contacts.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFeelingUnwellOpen(!feelingUnwellOpen)}
            className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-xs transition-colors self-start sm:self-center"
          >
            {feelingUnwellOpen ? t('cancel', lang) : t('notFeelingWellBtn', lang)}
          </button>
        </div>

        {feelingUnwellOpen && (
          <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-stone-800/80 border border-amber-300 dark:border-amber-700 space-y-4 animate-in fade-in">
            {contacts.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                  {lang === 'hi'
                    ? 'कृपया पहले नीचे एक पारिवारिक संपर्क जोड़ें ताकि संदेश भेजा जा सके।'
                    : 'Please add at least one family contact below to send this check-in.'}
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddingContact(true)}
                  className="min-h-[48px] px-4 py-2 bg-emerald-700 text-white text-sm font-bold rounded-xl"
                >
                  {t('addContactBtn', lang)}
                </button>
              </div>
            ) : (
              <>
                {/* Select Contact */}
                <div className="space-y-1.5">
                  <label htmlFor="unwell-contact-select" className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase">
                    {lang === 'hi' ? 'संपर्क चुनें:' : 'Send to contact:'}
                  </label>
                  <select
                    id="unwell-contact-select"
                    value={selectedContactId}
                    onChange={(e) => setSelectedContactId(e.target.value)}
                    className="min-h-[48px] w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base"
                  >
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.relation}) — {c.phone} {c.isSample ? `(${t('demoBadge', lang)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pre-filled editable message */}
                <div className="space-y-1.5">
                  <label htmlFor="unwell-msg-input" className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase">
                    {lang === 'hi' ? 'संदेश का पाठ (समीक्षा करें):' : 'Message text (preview & edit before sending):'}
                  </label>
                  <textarea
                    id="unwell-msg-input"
                    rows={3}
                    value={customUnwellText}
                    onChange={(e) => setCustomUnwellText(e.target.value)}
                    className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base"
                  />
                </div>

                {/* Send Buttons (Disabled if demo data) */}
                {selectedContact?.isSample ? (
                  <div className="p-3 rounded-xl bg-stone-200 dark:bg-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300">
                    ⚠️ {t('demoContactNotice', lang)}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSendWhatsApp(selectedContact.phone, customUnwellText)}
                      className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center space-x-2 transition-colors shadow-xs"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{t('sendWhatsApp', lang)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendSMS(selectedContact.phone, customUnwellText)}
                      className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm flex items-center space-x-2 transition-colors shadow-xs"
                    >
                      <Send className="w-4 h-4" />
                      <span>{t('sendSMS', lang)}</span>
                    </button>

                    <a
                      href={`tel:${selectedContact.phone}`}
                      className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm flex items-center space-x-2 transition-colors shadow-xs"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Call {selectedContact.name}</span>
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Official 24x7 Government Emergency Helplines */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-heading">
          {lang === 'hi'
            ? 'सरकारी आपातकालीन हेल्पलाइन नंबर (भारत):'
            : 'Official 24x7 Government Helplines (India):'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {EMERGENCY_NUMBERS.map((item) => {
            const isHighlighted = initialTargetNumber === item.number;
            return (
              <a
                key={item.number}
                href={`tel:${item.number}`}
                id={`dial-${item.number}`}
                className={`min-h-[72px] p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                  isHighlighted
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 ring-2 ring-rose-300'
                    : 'border-stone-200 dark:border-stone-800 hover:border-rose-400 bg-stone-50/50 dark:bg-stone-800/60 hover:bg-rose-50/30'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-stone-600 dark:text-stone-400 block">
                    {item.name}
                  </span>
                  <span className="text-2xl font-black text-rose-700 dark:text-rose-400 block font-heading">
                    📞 {item.number}
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-400 block">
                    {item.description}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Trusted Family & Caregivers List */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-heading">
            {lang === 'hi' ? 'भरोसेमंद पारिवारिक संपर्क:' : 'Trusted Family & Caregivers:'}
          </h2>

          <button
            id="add-family-contact-btn"
            type="button"
            onClick={() => setIsAddingContact(true)}
            className="min-h-[48px] px-4 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm flex items-center space-x-2 transition-colors self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addContactBtn', lang)}</span>
          </button>
        </div>

        {/* Inline Add Contact Form */}
        {isAddingContact && (
          <form
            onSubmit={handleAddContact}
            className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                {t('addContactBtn', lang)}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingContact(false)}
                className="text-stone-500 hover:text-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  {lang === 'hi' ? 'नाम' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="e.g. Ramesh"
                  className="min-h-[48px] w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  {lang === 'hi' ? 'रिश्ता' : 'Relationship'}
                </label>
                <input
                  type="text"
                  value={newContactRelation}
                  onChange={(e) => setNewContactRelation(e.target.value)}
                  placeholder="Son, Daughter, Neighbor"
                  className="min-h-[48px] w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  {lang === 'hi' ? 'फ़ोन नंबर' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  placeholder="9876543210"
                  className="min-h-[48px] w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 text-sm"
                />
              </div>
            </div>

            {phoneError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                {phoneError}
              </p>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingContact(false)}
                className="min-h-[48px] px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 font-medium"
              >
                {t('cancel', lang)}
              </button>
              <button
                type="submit"
                className="min-h-[48px] px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                {t('save', lang)}
              </button>
            </div>
          </form>
        )}

        {/* Contacts List or Empty State */}
        {contacts.length === 0 && !isAddingContact ? (
          <div className="bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 text-center space-y-3">
            <UserPlus className="w-8 h-8 text-stone-400 mx-auto" />
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              {t('noContactsYet', lang)}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 max-w-sm mx-auto">
              {lang === 'hi'
                ? 'ज़रूरी समय पर एक टैप से WhatsApp या फ़ोन कॉल करने के लिए अपने बेटे, बेटी, या पड़ोसी का नंबर जोड़ें।'
                : 'Add your son, daughter, or neighbor’s real phone number for 1-tap WhatsApp check-ins and calls.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingContact(true)}
                className="min-h-[48px] px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl"
              >
                {t('addContactBtn', lang)}
              </button>
              {!isDemo && (
                <button
                  type="button"
                  onClick={loadDemo}
                  className="min-h-[48px] px-4 py-2 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 text-sm font-semibold rounded-xl"
                >
                  {t('loadDemoData', lang)}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="font-bold text-base text-stone-900 dark:text-stone-100">
                      {contact.name}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-semibold border border-amber-300 dark:border-amber-800">
                      {contact.relation}
                    </span>
                    {contact.isSample && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 font-bold">
                        {t('demoBadge', lang)}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-mono text-stone-600 dark:text-stone-400 block">
                    {contact.phone}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {contact.isSample ? (
                    <span className="text-xs text-stone-500 dark:text-stone-400 italic">
                      {t('demoContactNotice', lang)}
                    </span>
                  ) : (
                    <>
                      <a
                        href={`tel:${contact.phone}`}
                        className="min-h-[48px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-colors"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span>Call</span>
                      </a>

                      <button
                        type="button"
                        onClick={() =>
                          handleSendWhatsApp(
                            contact.phone,
                            lang === 'hi'
                              ? `प्रणाम! यह केवल सूचना संदेश है: मैं सुरक्षित हूँ और घर पर ठीक हूँ। चिंता की कोई बात नहीं है।`
                              : `Pranam! Quick reassurance message: I am safe, healthy, and doing well at home right now.`
                          )
                        }
                        className="min-h-[48px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-colors"
                      >
                        <span>✓ I am Safe</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteContact(contact.id)}
                    className="min-h-[48px] min-w-[48px] flex items-center justify-center text-stone-400 hover:text-rose-600 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                    title={t('delete', lang)}
                    aria-label={`${t('delete', lang)} ${contact.name}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
