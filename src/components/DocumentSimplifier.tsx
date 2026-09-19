import React, { useState } from 'react';
import { FileText, Sparkles, AlertCircle, Calendar, IndianRupee, BookOpen, CheckCircle2, ArrowRight, Upload, HelpCircle, Loader2 } from 'lucide-react';
import { DocumentAnalysisResult, Language } from '../types';
import { SAMPLE_DOCUMENTS } from '../data/saarthiData';
import { VoiceSpeakerButton } from './VoiceSpeakerButton';

interface DocumentSimplifierProps {
  language: Language;
}

export const DocumentSimplifier: React.FC<DocumentSimplifierProps> = ({ language }) => {
  const [inputText, setInputText] = useState('');
  const [documentType, setDocumentType] = useState<string>('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Load a sample document for quick senior testing
  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_DOCUMENTS.find((d) => d.id === sampleId);
    if (sample) {
      setInputText(sample.snippet);
      setImagePreview(null);
      setError(null);
      setAnalysisResult(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setInputText('');
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() && !imagePreview) {
      setError('Please paste the bill/letter text or select a sample above.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: inputText,
          imageBase64: imagePreview,
          documentType,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze document.');
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err: any) {
      console.error(err);
      setError('Could not simplify this document right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFullSpokenText = (result: DocumentAnalysisResult) => {
    let text = `Summary: ${result.simplifiedSummary}. `;
    if (result.amountDue) {
      text += `Total amount payable is ${result.amountDue}. `;
    }
    if (result.dueDate) {
      text += `Please pay before ${result.dueDate}. `;
    }
    if (result.actionRequired && result.actionRequired.length > 0) {
      text += `Here are the steps for you: ${result.actionRequired.join('. ')}. `;
    }
    return text;
  };

  return (
    <div id="document-simplifier-section" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs uppercase tracking-wide">
              <FileText className="w-4 h-4 text-amber-700" />
              <span>कागज़ और बिल समझें • Document Clarifier</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 font-heading">
              Understand Any Bill, Letter, or Prescription
            </h2>
            <p className="text-stone-600 text-base max-w-3xl leading-relaxed">
              Confused by fine print, legal jargon, or complicated electricity bills? Paste it below or pick a sample, and Saarthi will explain it in simple, respectful everyday words.
            </p>
          </div>
        </div>

        {/* Quick Sample Selector */}
        <div className="mt-5 pt-4 border-t border-amber-200/80">
          <div className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Try Quick Real Samples (1-Click):</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SAMPLE_DOCUMENTS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleLoadSample(sample.id)}
                className="text-left p-2.5 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-200 transition-all text-xs font-medium text-stone-800 shadow-xs active:scale-98"
              >
                <span className="block font-bold text-amber-950 truncate">{sample.title}</span>
                <span className="text-[11px] text-stone-500">{sample.category}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Form Card */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label htmlFor="document-content-input" className="block text-base font-bold text-stone-900">
            Paste Text or Upload Photo of Bill / Prescription:
          </label>
          <div className="flex items-center gap-2">
            <label
              htmlFor="upload-doc-file"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer border border-stone-300 transition-colors"
            >
              <Upload className="w-4 h-4 text-stone-600" />
              <span>Upload Photo / Bill</span>
              <input
                id="upload-doc-file"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            {inputText && (
              <button
                type="button"
                onClick={() => {
                  setInputText('');
                  setImagePreview(null);
                  setAnalysisResult(null);
                }}
                className="text-xs text-stone-500 hover:text-stone-800 underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {imagePreview ? (
          <div className="relative border-2 border-dashed border-amber-300 rounded-2xl p-4 bg-amber-50/50 flex flex-col items-center">
            <img
              src={imagePreview}
              alt="Uploaded document preview"
              className="max-h-64 object-contain rounded-xl shadow-xs"
              referrerPolicy="no-referrer"
            />
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="mt-3 text-xs font-bold text-rose-600 hover:underline"
            >
              Remove Image & Use Text Instead
            </button>
          </div>
        ) : (
          <textarea
            id="document-content-input"
            rows={6}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your electricity bill, doctor's prescription, bank SMS, or pension notice here... Or click any of the 4 samples above."
            className="w-full p-4 rounded-2xl border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-base text-stone-800 leading-relaxed font-mono"
          />
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-stone-500 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>Saarthi preserves your privacy. No personal data is stored.</span>
          </div>

          <button
            id="simplify-analyze-btn"
            type="button"
            onClick={handleAnalyze}
            disabled={isLoading || (!inputText.trim() && !imagePreview)}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-base shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Simplifying for You...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Explain in Simple Words / सरल भाषा में समझें</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Result Display */}
      {analysisResult && (
        <div
          id="document-analysis-result"
          className="bg-white border-2 border-amber-300 rounded-3xl p-6 shadow-md space-y-6 animate-fade-in"
        >
          {/* Result Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                {analysisResult.documentType.replace('_', ' ').toUpperCase()}
              </span>
              <h3 className="text-xl md:text-2xl font-extrabold text-stone-900 mt-2">
                {analysisResult.title}
              </h3>
            </div>

            <VoiceSpeakerButton
              textToSpeak={getFullSpokenText(analysisResult)}
              label="Listen Full Summary / पूरा सुनें"
              size="md"
            />
          </div>

          {/* Key Numbers / Highlights Grid */}
          {(analysisResult.amountDue || analysisResult.dueDate) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {analysisResult.amountDue && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                    ₹
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-stone-600 uppercase">Amount to Pay:</span>
                    <p className="text-2xl font-extrabold text-stone-900">
                      {analysisResult.amountDue}
                    </p>
                  </div>
                </div>
              )}

              {analysisResult.dueDate && (
                <div className="bg-orange-50/80 border border-orange-200 rounded-2xl p-4 flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-stone-600 uppercase">Pay Before (Due Date):</span>
                    <p className="text-lg md:text-xl font-bold text-orange-950">
                      {analysisResult.dueDate}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Plain Summary Box */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-2">
            <h4 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-700" />
              <span>What this means in plain words (सरल सारांश):</span>
            </h4>
            <p className="text-base md:text-lg text-stone-800 leading-relaxed font-normal">
              {analysisResult.simplifiedSummary}
            </p>
          </div>

          {/* Action Steps for Senior */}
          {analysisResult.actionRequired && analysisResult.actionRequired.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>What Uncle/Aunty needs to do next (अगले कदम):</span>
              </h4>
              <div className="grid gap-2.5">
                {analysisResult.actionRequired.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-3 bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-stone-800"
                  >
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-sm md:text-base font-medium">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings and Disconnections */}
          {analysisResult.warnings && analysisResult.warnings.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-1.5">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Important Watch-outs & Late Fees:</span>
              </span>
              <ul className="list-disc list-inside text-sm text-rose-900 space-y-1">
                {analysisResult.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Jargon Buster */}
          {analysisResult.jargonBuster && analysisResult.jargonBuster.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-700" />
                <span>Jargon Buster (कठिन शब्दों का सरल अर्थ):</span>
              </h4>
              <div className="grid sm:grid-cols-2 gap-3">
                {analysisResult.jargonBuster.map((item, idx) => (
                  <div
                    key={idx}
                    className="border border-stone-200 rounded-xl p-3.5 bg-stone-50/60 space-y-1"
                  >
                    <span className="font-bold text-amber-900 text-sm block">
                      "{item.term}"
                    </span>
                    <p className="text-xs md:text-sm text-stone-600 leading-normal">
                      {item.simpleMeaning}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety note */}
          {analysisResult.safetyNote && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs md:text-sm text-blue-900 flex items-center gap-2">
              <span className="font-bold">🛡️ Senior Safety:</span>
              <span>{analysisResult.safetyNote}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
