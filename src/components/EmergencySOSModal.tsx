import React, { useState, useEffect } from 'react';
import { PhoneCall, AlertTriangle, ShieldAlert, HeartHandshake, Activity, X, Share2, Plus, Check, Trash2 } from 'lucide-react';
import { EmergencyContact } from '../types';
import { EMERGENCY_NUMBERS } from '../data/saarthiData';

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_FAMILY_CONTACTS: EmergencyContact[] = [
  {
    id: 'contact-1',
    name: 'Ramesh (Beta / Son)',
    relation: 'Son',
    phone: '+91 98450 12345',
    isPrimary: true,
  },
  {
    id: 'contact-2',
    name: 'Priya (Beti / Daughter)',
    relation: 'Daughter',
    phone: '+91 98110 56789',
    isPrimary: false,
  },
];

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({ isOpen, onClose }) => {
  const [contacts, setContacts] = useState<EmergencyContact[]>(() => {
    const saved = localStorage.getItem('saarthi_emergency_contacts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_FAMILY_CONTACTS;
  });

  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('Family');
  const [newContactPhone, setNewContactPhone] = useState('');

  useEffect(() => {
    localStorage.setItem('saarthi_emergency_contacts', JSON.stringify(contacts));
  }, [contacts]);

  if (!isOpen) return null;

  const handleSendSafeMessage = (phone: string, name: string) => {
    const text = encodeURIComponent(
      `Pranam! This is a quick reassurance message from Saarthi: I am safe, healthy, and doing well at home right now (${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}). No need to worry!`
    );
    const cleanNumber = phone.replace(/[^0-9]/g, '');
    window.open(`https://api.whatsapp.com/send?phone=${cleanNumber}&text=${text}`, '_blank');
  };

  const handleSendSOSMessage = (phone: string) => {
    const text = encodeURIComponent(
      `🚨 URGENT EMERGENCY ALERT FROM SAARTHI 🚨\n\nI need immediate assistance or a call back right now. Please call my phone immediately!`
    );
    const cleanNumber = phone.replace(/[^0-9]/g, '');
    window.open(`https://api.whatsapp.com/send?phone=${cleanNumber}&text=${text}`, '_blank');
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;

    const newContact: EmergencyContact = {
      id: `c-${Date.now()}`,
      name: newContactName,
      relation: newContactRelation,
      phone: newContactPhone,
      isPrimary: contacts.length === 0,
    };

    setContacts([...contacts, newContact]);
    setIsAddingContact(false);
    setNewContactName('');
    setNewContactPhone('');
  };

  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/75 backdrop-blur-md flex items-center justify-center p-4">
      <div
        id="emergency-sos-dialog"
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border-4 border-rose-500 max-h-[90vh] overflow-y-auto space-y-6 animate-fade-in"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-rose-200">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-900 font-extrabold text-xs uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
              <span>आपातकालीन सहायता • Emergency SOS</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-stone-900 font-heading">
              1-Tap Emergency Helplines & Family Dial
            </h2>
            <p className="text-stone-600 text-sm">
              Press any button below to immediately call or send an SOS message.
            </p>
          </div>

          <button
            id="close-sos-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
            title="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Official Indian Emergency Numbers */}
        <div className="space-y-3">
          <span className="text-xs font-extrabold text-stone-800 uppercase tracking-wider block">
            National Helplines in India (Govt 24x7):
          </span>

          <div className="grid sm:grid-cols-2 gap-3">
            {EMERGENCY_NUMBERS.map((item) => (
              <a
                key={item.number}
                href={`tel:${item.number}`}
                id={`dial-${item.number}`}
                className="p-4 rounded-2xl border-2 border-stone-200 hover:border-rose-400 bg-stone-50 hover:bg-rose-50/50 transition-all flex items-center justify-between group shadow-xs active:scale-98"
              >
                <div className="space-y-1">
                  <span className="text-xs font-bold text-stone-600 block">
                    {item.name}
                  </span>
                  <span className="text-2xl font-black text-rose-700 group-hover:scale-105 transition-transform block">
                    📞 {item.number}
                  </span>
                  <span className="text-[11px] text-stone-500 block leading-tight">
                    {item.description}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Family Speed Dial & Check-in */}
        <div className="space-y-3 pt-3 border-t border-stone-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-stone-800 uppercase tracking-wider block">
              Family Speed Dial & WhatsApp Check-in:
            </span>
            <button
              id="add-family-contact-btn"
              type="button"
              onClick={() => setIsAddingContact(true)}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Family Member</span>
            </button>
          </div>

          <div className="grid gap-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="p-4 rounded-2xl border-2 border-stone-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base md:text-lg text-stone-900">
                      {contact.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold">
                      {contact.relation}
                    </span>
                  </div>
                  <span className="text-sm font-mono text-stone-600 font-semibold">
                    {contact.phone}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Call phone */}
                  <a
                    href={`tel:${contact.phone}`}
                    className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Call Now</span>
                  </a>

                  {/* Send I Am Safe WhatsApp */}
                  <button
                    type="button"
                    onClick={() => handleSendSafeMessage(contact.phone, contact.name)}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                    title="Send 'I am safe' message on WhatsApp"
                  >
                    <span>✓ I am Safe</span>
                  </button>

                  {/* Send SOS WhatsApp */}
                  <button
                    type="button"
                    onClick={() => handleSendSOSMessage(contact.phone)}
                    className="px-3 py-2 rounded-xl bg-red-800 hover:bg-red-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                    title="Send Urgent SOS alert on WhatsApp"
                  >
                    <span>🚨 SOS Alert</span>
                  </button>

                  {contacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteContact(contact.id)}
                      className="p-2 text-stone-400 hover:text-rose-600 rounded-lg"
                      title="Remove contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Contact Form Inline */}
          {isAddingContact && (
            <form
              onSubmit={handleAddContact}
              className="p-4 rounded-2xl bg-stone-50 border border-stone-300 space-y-3"
            >
              <h4 className="font-bold text-sm text-stone-900">Add Family Contact</h4>
              <div className="grid sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Name (e.g. Ramesh)"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="p-2 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
                <input
                  type="text"
                  placeholder="Relation (e.g. Son / Beti / Neighbor)"
                  value={newContactRelation}
                  onChange={(e) => setNewContactRelation(e.target.value)}
                  className="p-2 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
                <input
                  type="tel"
                  required
                  placeholder="Mobile (e.g. 9845012345)"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="p-2 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingContact(false)}
                  className="px-3 py-1.5 rounded-lg border text-xs text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                >
                  Save
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
