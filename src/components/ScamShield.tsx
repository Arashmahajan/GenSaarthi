import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, PhoneCall, Share2, HelpCircle, Loader2, Sparkles, ExternalLink, Lock } from 'lucide-react';
import { ScamCheckResult, Language } from '../types';
import { SAMPLE_SCAMS } from '../data/saarthiData';
import { VoiceSpeakerButton } from './VoiceSpeakerButton';

interface ScamShieldProps {
  language: Language;
}

export const ScamShield: React.FC<ScamShieldProps> = ({ language }) => {
  const [messageInput, setMessageInput] = useState('');
  const [senderInfo, setSenderInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScamCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLoadSample = (sampleId: string) => {
    const s = SAMPLE_SCAMS.find((item) => item.id === sampleId);
    if (s) {
      setMessageInput(s.sampleText);
      setSenderInfo('Unknown +91 Mobile Number');
      setError(null);
      setResult(null);
    }
  };

  const handleCheck = async () => {
    if (!messageInput.trim()) {
      setError('Please paste the message or describe the phone call.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/scam-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageText: messageInput,
          senderInfo,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze safety.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError('Could not complete scam analysis. Please check your message.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareWhatsApp = (r: ScamCheckResult) => {
    const text = encodeURIComponent(
      `⚠️ *Scam Alert for Family from Saarthi* ⚠️\n\n*Verdict:* ${r.verdictTitle}\n*Scam Type:* ${r.scamType}\n*Details:* ${r.summaryExplanation}\n\n*National Cyber Crime Helpline:* 1930\nStay safe and never share OTPs!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const getSpokenWarning = (r: ScamCheckResult) => {
    return `${r.verdictTitle}. ${r.summaryExplanation}. What you should do: ${r.recommendedSteps.join('. ')}. In case of doubt, dial 1930.`;
  };

  return (
    <div id="scam-shield-section" className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-rose-50 via-orange-50 to-amber-50 border-2 border-rose-200 rounded-3xl p-6 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-900 font-bold text-xs uppercase tracking-wide">
            <ShieldAlert className="w-4 h-4 text-rose-700" />
            <span>सुरक्षा गार्ड • Indian Senior Scam Shield</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 font-heading">
            Is This Message or Call a Scam? Check in 5 Seconds
          </h2>
          <p className="text-stone-600 text-base max-w-3xl leading-relaxed">
            Did you get an urgent SMS threatening power cut tonight, an SBI KYC link, or a fake police video call? Fraudsters target seniors with fear. Saarthi instantly analyzes if it is a trap.
          </p>
        </div>

        {/* Quick Sample Scams */}
        <div className="mt-5 pt-4 border-t border-rose-200/80">
          <div className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            <span>Common Frauds Targeting Seniors in India (Click to test):</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SAMPLE_SCAMS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleLoadSample(s.id)}
                className="text-left p-2.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 transition-all text-xs font-medium text-stone-800 shadow-xs active:scale-98"
              >
                <span className="block font-bold text-rose-950 truncate">{s.title}</span>
                <span className="text-[11px] text-stone-500">{s.category}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Card */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="space-y-2">
          <label htmlFor="scam-message-input" className="block text-base font-bold text-stone-900">
            Paste the suspicious SMS, WhatsApp message, or description of caller:
          </label>
          <textarea
            id="scam-message-input"
            rows={4}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="e.g. 'Electricity power will be disconnected tonight at 9.30 PM...', 'SBI Account blocked update PAN', or 'Caller said he is Inspector from CBI...'"
            className="w-full p-4 rounded-2xl border border-stone-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-base text-stone-800 leading-relaxed font-mono"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="scam-sender-input" className="block text-xs font-bold text-stone-600 uppercase mb-1">
              Sender Mobile Number / WhatsApp Name (Optional):
            </label>
            <input
              id="scam-sender-input"
              type="text"
              value={senderInfo}
              onChange={(e) => setSenderInfo(e.target.value)}
              placeholder="e.g., +91 98114xxxxx or unknown WhatsApp user"
              className="w-full p-2.5 rounded-xl border border-stone-300 text-sm text-stone-800"
            />
          </div>

          <div className="flex items-end justify-end">
            <button
              id="check-scam-btn"
              type="button"
              onClick={handleCheck}
              disabled={isLoading || !messageInput.trim()}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-base shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Checking for Traps...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-5 h-5" />
                  <span>Check Safety Now / सुरक्षा जांचें</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Result Display */}
      {result && (
        <div
          id="scam-check-result"
          className={`border-2 rounded-3xl p-6 shadow-md space-y-6 transition-all ${
            result.verdict === 'DANGER_SCAM'
              ? 'bg-rose-50/70 border-rose-400'
              : result.verdict === 'SUSPICIOUS'
              ? 'bg-amber-50/70 border-amber-400'
              : 'bg-emerald-50/70 border-emerald-400'
          }`}
        >
          {/* Header Verdict */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-300/80">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    result.verdict === 'DANGER_SCAM'
                      ? 'bg-rose-600 text-white animate-pulse'
                      : result.verdict === 'SUSPICIOUS'
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {result.verdict === 'DANGER_SCAM'
                    ? 'CRITICAL DANGER SCAM'
                    : result.verdict === 'SUSPICIOUS'
                    ? 'SUSPICIOUS MESSAGE'
                    : 'VERIFIED SAFE'}
                </span>
                <span className="text-xs font-bold text-stone-600">
                  Risk Score: {result.riskScore}%
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-stone-900">
                {result.verdictTitle}
              </h3>
              <p className="text-xs font-semibold text-rose-900 uppercase">
                Pattern: {result.scamType}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <VoiceSpeakerButton
                textToSpeak={getSpokenWarning(result)}
                label="Listen Warning / सुनें"
                size="md"
              />
              <button
                id="share-whatsapp-btn"
                type="button"
                onClick={() => handleShareWhatsApp(result)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-bold rounded-xl shadow-xs transition-colors"
                title="Share alert on WhatsApp to protect friends & family"
              >
                <Share2 className="w-4 h-4" />
                <span>Alert Family</span>
              </button>
            </div>
          </div>

          {/* Explanation in plain words */}
          <div className="bg-white/90 rounded-2xl p-5 border border-stone-200 shadow-xs space-y-2">
            <h4 className="text-base font-bold text-stone-900">
              Why this is a trap (यह धोखाधड़ी क्यों है):
            </h4>
            <p className="text-base text-stone-800 leading-relaxed">
              {result.summaryExplanation}
            </p>
          </div>

          {/* Red Flags & What Scammers Want Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/90 rounded-2xl p-4 border border-rose-200 space-y-2">
              <h5 className="font-bold text-rose-900 text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>The Red Flags (खतरे के संकेत):</span>
              </h5>
              <ul className="space-y-1.5 text-xs md:text-sm text-stone-700">
                {result.redFlags.map((flag, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/90 rounded-2xl p-4 border border-amber-200 space-y-2">
              <h5 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>What scammers are trying to steal:</span>
              </h5>
              <ul className="space-y-1.5 text-xs md:text-sm text-stone-700">
                {result.whatScammersWant.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">⚠️</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Checklist */}
          <div className="bg-white/95 rounded-2xl p-5 border border-stone-200 space-y-3">
            <h4 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>Exact Steps You Should Take Right Now:</span>
            </h4>
            <div className="grid gap-2">
              {result.recommendedSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl text-stone-800 text-sm font-medium border border-stone-200"
                >
                  <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Direct Helpline Banner */}
          <div className="bg-gradient-to-r from-red-600 to-rose-700 rounded-2xl p-4 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div className="flex items-center space-x-3">
              <PhoneCall className="w-8 h-8 shrink-0 animate-bounce" />
              <div>
                <span className="text-xs font-semibold text-rose-100 uppercase tracking-wider block">
                  Govt National Cyber Crime Helpline
                </span>
                <span className="text-xl md:text-2xl font-black">
                  Dial 1930 (Toll Free, 24x7)
                </span>
              </div>
            </div>

            <a
              href="tel:1930"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-red-700 font-bold text-sm text-center shadow-xs hover:bg-rose-50 transition-colors"
            >
              Call 1930 Now / तुरंत फोन करें
            </a>
          </div>
        </div>
      )}

      {/* Golden Rules Card */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
          <Lock className="w-5 h-5 text-amber-600" />
          <span>Golden Rules of Cyber Safety for Indian Elders (सुनहरे नियम):</span>
        </h3>
        <div className="grid sm:grid-cols-3 gap-3 text-xs md:text-sm">
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
            <span className="font-bold text-amber-900 block mb-1">1. Never Share OTP or PIN</span>
            <p className="text-stone-600">No bank manager or electricity officer will EVER ask for your 6-digit OTP or ATM PIN.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
            <span className="font-bold text-rose-900 block mb-1">2. No "Digital Arrest" Exists</span>
            <p className="text-stone-600">Police and CBI NEVER put citizens on video call in a room. If someone demands this, disconnect immediately!</p>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
            <span className="font-bold text-blue-900 block mb-1">3. Don't Install Remote Apps</span>
            <p className="text-stone-600">Never install AnyDesk, TeamViewer, or QuickSupport if a caller asks you to do so to "verify" an account.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
