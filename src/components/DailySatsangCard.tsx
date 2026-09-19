import React, { useState } from 'react';
import { Sun, Sparkles, RefreshCw, Heart, Smile } from 'lucide-react';
import { DAILY_SATSANG_MESSAGES } from '../data/saarthiData';
import { VoiceSpeakerButton } from './VoiceSpeakerButton';

export const DailySatsangCard: React.FC = () => {
  const [index, setIndex] = useState(0);
  const current = DAILY_SATSANG_MESSAGES[index];

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % DAILY_SATSANG_MESSAGES.length);
  };

  const todayDateFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const speakText = `Suprabhatam! Today's peaceful thought: ${current.quote}. ${current.meaning}. Today's morning wellness tip: ${current.routineTip}`;

  return (
    <div
      id="daily-satsang-card"
      className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/70 border border-amber-200 rounded-3xl p-5 md:p-6 shadow-sm mb-6 transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
            <Sun className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                सुप्रभात • Morning Satsang
              </span>
              <span className="text-xs text-stone-600 font-medium">{todayDateFormatted}</span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-stone-900 mt-0.5">
              Pranam & Welcome to Saarthi
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <VoiceSpeakerButton
            textToSpeak={speakText}
            label="Listen / सुनें"
            size="sm"
          />
          <button
            id="satsang-refresh-btn"
            type="button"
            onClick={handleNext}
            className="p-2 rounded-xl text-amber-800 hover:bg-amber-200/70 border border-amber-300 transition-colors"
            title="Read another peaceful thought"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid md:grid-cols-3 gap-4 items-center">
        <div className="md:col-span-2 space-y-2">
          <p className="text-base md:text-lg font-medium text-stone-900 leading-relaxed font-serif italic text-amber-950">
            "{current.quote}"
          </p>
          <p className="text-sm md:text-base text-stone-700">
            <strong className="text-stone-900">Meaning:</strong> {current.meaning}
            <span className="text-xs text-amber-800 ml-2 font-semibold">({current.source})</span>
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur border border-amber-200/90 rounded-2xl p-3.5 text-xs md:text-sm text-stone-800 shadow-sm flex items-start space-x-2.5">
          <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-900 block mb-0.5">Senior Wellness Tip:</span>
            <p className="text-stone-700 leading-normal">{current.routineTip}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
