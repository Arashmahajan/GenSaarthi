import React, { useState } from 'react';
import { Landmark, ShieldCheck, CheckCircle2, PhoneCall, ExternalLink, HelpCircle, FileCheck, ArrowRight, UserCheck } from 'lucide-react';
import { SeniorScheme, Language } from '../types';
import { SENIOR_SCHEMES } from '../data/saarthiData';
import { VoiceSpeakerButton } from './VoiceSpeakerButton';
import { useApp } from '../context/AppContext';

interface SeniorSchemesProps {
  language?: Language;
}

export const SeniorSchemes: React.FC<SeniorSchemesProps> = ({ language }) => {
  const { settings } = useApp();
  const lang = language || settings.language;
  const [userAge, setUserAge] = useState<number>(68);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>('ayushman-70-plus');

  const categories = [
    { id: 'all', label: 'All Schemes / सभी योजनाएं' },
    { id: 'health', label: '🏥 Health & Hospital' },
    { id: 'savings', label: '💰 Savings & High Interest' },
    { id: 'pension', label: '📜 Pension & Certificates' },
    { id: 'travel', label: '🚆 Travel & Railways' },
  ];

  const filteredSchemes = SENIOR_SCHEMES.filter((scheme) => {
    if (selectedCategory !== 'all' && scheme.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  return (
    <div id="senior-schemes-section" className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-amber-50 border border-blue-200 rounded-3xl p-6 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 font-bold text-xs uppercase tracking-wide">
            <Landmark className="w-4 h-4 text-blue-700" />
            <span>सरकारी योजनाएं • Govt Senior Schemes in India</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 font-heading">
            Government Schemes & Financial Benefits for You
          </h2>
          <p className="text-stone-600 text-base max-w-3xl leading-relaxed">
            The Government of India provides special high-interest savings, ₹5 Lakh free health treatment for seniors 70+, tax exemptions, and digital life certificates. Check your eligibility below.
          </p>
        </div>

        {/* Interactive Age Eligibility Filter Bar */}
        <div className="mt-5 pt-4 border-t border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 p-4 rounded-2xl border">
          <div className="flex items-center space-x-3">
            <UserCheck className="w-6 h-6 text-blue-600 shrink-0" />
            <div>
              <label htmlFor="user-age-input" className="text-xs font-bold uppercase text-stone-700 block">
                Enter Your Age (आपकी उम्र):
              </label>
              <div className="flex items-center space-x-2 mt-1">
                <input
                  id="user-age-input"
                  type="number"
                  min="50"
                  max="105"
                  value={userAge}
                  onChange={(e) => setUserAge(Number(e.target.value) || 60)}
                  className="w-20 p-2 rounded-xl border border-blue-300 font-bold text-center text-lg text-stone-900 bg-white shadow-xs focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-stone-600">Years Old</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs md:text-sm text-stone-700 bg-blue-50 px-3 py-2 rounded-xl border border-blue-200">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              At age <strong className="text-stone-900">{userAge}</strong>, you qualify for{' '}
              <strong className="text-blue-900">
                {SENIOR_SCHEMES.filter((s) => userAge >= s.minAge).length} Government Benefits
              </strong>!
            </span>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            id={`scheme-cat-${cat.id}`}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-2xl text-xs md:text-sm font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Schemes List */}
      <div className="grid gap-4">
        {filteredSchemes.map((scheme) => {
          const isEligible = userAge >= scheme.minAge;
          const isExpanded = expandedSchemeId === scheme.id;

          const spokenDetails = `${scheme.name}. ${scheme.shortDesc}. Key benefits include: ${scheme.benefits.slice(0, 3).join('. ')}. How to apply: ${scheme.howToApply}`;

          return (
            <div
              key={scheme.id}
              id={`scheme-card-${scheme.id}`}
              className={`border-2 rounded-3xl p-5 md:p-6 shadow-xs transition-all ${
                isEligible
                  ? 'bg-white border-blue-200 hover:border-blue-400'
                  : 'bg-stone-50/70 border-stone-200 opacity-80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                        isEligible
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {isEligible ? '✓ You Are Eligible' : `Eligible at Age ${scheme.minAge}+`}
                    </span>
                    <span className="text-xs uppercase font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      {scheme.category}
                    </span>
                  </div>

                  <h3 className="text-xl md:text-2xl font-extrabold text-stone-900 mt-1">
                    {scheme.name}
                  </h3>
                  {scheme.hindiName && (
                    <p className="text-sm font-medium text-stone-600 font-serif">
                      {scheme.hindiName}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <VoiceSpeakerButton
                    textToSpeak={spokenDetails}
                    label="Listen / सुनें"
                    size="sm"
                  />
                  <button
                    id={`toggle-scheme-${scheme.id}`}
                    type="button"
                    onClick={() => setExpandedSchemeId(isExpanded ? null : scheme.id)}
                    className="px-3.5 py-1.5 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold transition-colors"
                  >
                    {isExpanded ? 'Show Less' : 'Full Details & Documents'}
                  </button>
                </div>
              </div>

              <p className="mt-3 text-base text-stone-700 leading-relaxed">
                {scheme.shortDesc}
              </p>

              {/* Key Benefits Bullets */}
              <div className="mt-4 pt-3 border-t border-stone-100">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-2">
                  Key Senior Advantages:
                </span>
                <div className="grid sm:grid-cols-2 gap-2">
                  {scheme.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-start space-x-2 text-xs md:text-sm text-stone-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expanded Application Guide & Documents */}
              {isExpanded && (
                <div className="mt-5 pt-4 border-t-2 border-dashed border-stone-200 space-y-4 animate-fade-in">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Documents Needed */}
                    <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2">
                      <span className="text-xs font-bold text-stone-800 uppercase flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-amber-600" />
                        <span>Documents You Need to Keep Ready:</span>
                      </span>
                      <ul className="space-y-1 text-xs md:text-sm text-stone-700">
                        {scheme.documentsNeeded.map((doc, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-600 font-bold">•</span>
                            <span>{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* How to Apply */}
                    <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-200 space-y-2">
                      <span className="text-xs font-bold text-blue-900 uppercase flex items-center gap-1.5">
                        <ArrowRight className="w-4 h-4 text-blue-600" />
                        <span>How to Apply (आवेदन कैसे करें):</span>
                      </span>
                      <p className="text-xs md:text-sm text-stone-800 leading-relaxed font-medium">
                        {scheme.howToApply}
                      </p>
                      {scheme.helpline && (
                        <div className="mt-2 pt-2 border-t border-blue-200 text-xs font-bold text-blue-900 flex items-center gap-1.5">
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Official Helpline: {scheme.helpline}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
