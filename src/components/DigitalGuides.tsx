import React, { useState } from 'react';
import { Smartphone, Zap, Video, Award, Navigation, CheckCircle2, AlertCircle, Sparkles, ChevronRight, Clock } from 'lucide-react';
import { DigitalGuide, Language } from '../types';
import { DIGITAL_GUIDES } from '../data/saarthiData';
import { VoiceSpeakerButton } from './VoiceSpeakerButton';

interface DigitalGuidesProps {
  language: Language;
}

export const DigitalGuides: React.FC<DigitalGuidesProps> = ({ language }) => {
  const [selectedGuideId, setSelectedGuideId] = useState<string>('guide-phonepe-bill');
  const [completedSteps, setCompletedSteps] = useState<Record<string, number[]>>({});

  const activeGuide = DIGITAL_GUIDES.find((g) => g.id === selectedGuideId) || DIGITAL_GUIDES[0];

  const toggleStepCompleted = (guideId: string, stepNumber: number) => {
    setCompletedSteps((prev) => {
      const current = prev[guideId] || [];
      const updated = current.includes(stepNumber)
        ? current.filter((s) => s !== stepNumber)
        : [...current, stepNumber];
      return { ...prev, [guideId]: updated };
    });
  };

  const getSpokenGuide = (guide: DigitalGuide) => {
    return `${guide.title}. ${guide.summary}. ` +
      guide.steps.map((s) => `Step ${s.stepNumber}: ${s.heading}. ${s.instruction}.`).join(' ');
  };

  const getGuideIcon = (icon: string) => {
    switch (icon) {
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-600" />;
      case 'Video':
        return <Video className="w-5 h-5 text-emerald-600" />;
      case 'Award':
        return <Award className="w-5 h-5 text-blue-600" />;
      case 'Navigation':
        return <Navigation className="w-5 h-5 text-purple-600" />;
      default:
        return <Smartphone className="w-5 h-5 text-stone-600" />;
    }
  };

  const guideCompletedCount = (completedSteps[activeGuide.id] || []).length;
  const isAllStepsCompleted = guideCompletedCount === activeGuide.steps.length;

  return (
    <div id="digital-guides-section" className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border border-purple-200 rounded-3xl p-6 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-900 font-bold text-xs uppercase tracking-wide">
            <Smartphone className="w-4 h-4 text-purple-700" />
            <span>आसान तकनीक • Everyday Smartphone Guides</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 font-heading">
            Learn Modern Apps at Your Own Comfortable Pace
          </h2>
          <p className="text-stone-600 text-base max-w-3xl leading-relaxed">
            No need to wait for busy children to help you. These simple, step-by-step guides explain how to pay electricity bills, make WhatsApp video calls, book autos, and submit your digital life certificate.
          </p>
        </div>

        {/* Guide Selector Tabs */}
        <div className="mt-5 pt-4 border-t border-purple-200/80 grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {DIGITAL_GUIDES.map((guide) => {
            const isSelected = guide.id === selectedGuideId;
            return (
              <button
                key={guide.id}
                id={`guide-selector-${guide.id}`}
                type="button"
                onClick={() => setSelectedGuideId(guide.id)}
                className={`p-3 rounded-2xl border text-left transition-all flex items-start space-x-3 ${
                  isSelected
                    ? 'bg-white border-purple-500 shadow-md ring-2 ring-purple-300'
                    : 'bg-white/70 hover:bg-white border-purple-200'
                }`}
              >
                <div className="p-2 rounded-xl bg-purple-50 shrink-0">
                  {getGuideIcon(guide.icon)}
                </div>
                <div>
                  <span className="text-xs font-extrabold text-stone-900 block leading-tight">
                    {guide.title}
                  </span>
                  <span className="text-[11px] text-purple-800 font-semibold mt-0.5 block">
                    {guide.difficulty} • {guide.estimatedMinutes} mins
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Guide Content */}
      <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        {/* Guide Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full">
                {activeGuide.category}
              </span>
              <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" /> {activeGuide.estimatedMinutes} minutes
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-stone-900">
              {activeGuide.title}
            </h3>
            <p className="text-sm font-medium text-stone-600 font-serif">
              {activeGuide.hindiTitle}
            </p>
          </div>

          <VoiceSpeakerButton
            textToSpeak={getSpokenGuide(activeGuide)}
            label="Listen Guide Aloud / पूरा सुनें"
            size="md"
          />
        </div>

        {/* Summary */}
        <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 text-stone-800 text-sm md:text-base">
          <p className="leading-relaxed font-medium">💡 {activeGuide.summary}</p>
        </div>

        {/* Steps List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-stone-600 tracking-wider">
            <span>Follow These Simple Steps:</span>
            <span>
              Completed: {guideCompletedCount}/{activeGuide.steps.length}
            </span>
          </div>

          <div className="grid gap-3.5">
            {activeGuide.steps.map((step) => {
              const isDone = (completedSteps[activeGuide.id] || []).includes(step.stepNumber);

              return (
                <div
                  key={step.stepNumber}
                  id={`step-${activeGuide.id}-${step.stepNumber}`}
                  className={`border-2 rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                    isDone
                      ? 'bg-emerald-50/40 border-emerald-300'
                      : 'bg-stone-50 border-stone-200 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <button
                      type="button"
                      onClick={() => toggleStepCompleted(activeGuide.id, step.stepNumber)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 transition-colors ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-200 text-stone-700 hover:bg-amber-400 hover:text-white'
                      }`}
                      title={isDone ? 'Mark as incomplete' : 'Mark as done'}
                    >
                      {isDone ? '✓' : step.stepNumber}
                    </button>

                    <div className="space-y-1.5">
                      <h4
                        className={`text-base md:text-lg font-bold ${
                          isDone ? 'line-through text-stone-500' : 'text-stone-900'
                        }`}
                      >
                        {step.heading}
                      </h4>
                      <p className="text-sm md:text-base text-stone-700 leading-relaxed">
                        {step.instruction}
                      </p>

                      {step.proTip && (
                        <div className="inline-flex items-center gap-1.5 text-xs text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded-lg font-semibold mt-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Tip: {step.proTip}</span>
                        </div>
                      )}

                      {step.warning && (
                        <div className="inline-flex items-center gap-1.5 text-xs text-rose-900 bg-rose-100/90 px-2.5 py-1 rounded-lg font-bold mt-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Warning: {step.warning}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleStepCompleted(activeGuide.id, step.stepNumber)}
                    className={`self-end sm:self-center px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      isDone
                        ? 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200'
                        : 'text-stone-700 bg-white border border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {isDone ? 'Completed ✓' : 'Mark Done'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {isAllStepsCompleted && (
          <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-2xl text-center text-emerald-950 font-bold text-sm md:text-base shadow-xs animate-bounce">
            🎉 Shabash Uncle/Aunty ji! You have successfully completed this guide. You are becoming a digital master!
          </div>
        )}
      </div>
    </div>
  );
};
