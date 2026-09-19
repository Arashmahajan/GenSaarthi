import React, { useState, useEffect } from 'react';
import { Volume2, Square } from 'lucide-react';
import { SaarthiVoiceService } from '../utils/speech';

interface VoiceSpeakerButtonProps {
  textToSpeak: string;
  label?: string;
  className?: string;
  speechRate?: number;
  lang?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const VoiceSpeakerButton: React.FC<VoiceSpeakerButtonProps> = ({
  textToSpeak,
  label,
  className = '',
  speechRate = 0.85,
  lang = 'en-IN',
  size = 'md',
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = SaarthiVoiceService.subscribe((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => unsubscribe();
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) {
      SaarthiVoiceService.stop();
    } else {
      SaarthiVoiceService.speak(textToSpeak, speechRate, lang, () => {
        setNotice(lang.startsWith('hi') ? 'Hindi voice not found on device' : 'Voice not found');
        setTimeout(() => setNotice(null), 3000);
      });
    }
  };

  const defaultLabel = lang.startsWith('hi') ? 'आवाज़ में सुनें' : 'Listen aloud';
  const displayLabel = label || defaultLabel;

  return (
    <div className="inline-flex flex-col items-start">
      <button
        id={`voice-btn-${textToSpeak.slice(0, 10).replace(/\s+/g, '-').toLowerCase()}`}
        type="button"
        onClick={handleToggle}
        className={`inline-flex items-center justify-center font-medium transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 active:scale-95 min-h-[48px] min-w-[48px] px-4 py-3 rounded-xl ${
          isSpeaking
            ? 'bg-rose-600 hover:bg-rose-700 text-white'
            : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
        } ${className}`}
        title={isSpeaking ? 'Stop voice reading' : 'Read aloud in clear voice'}
        aria-label={isSpeaking ? 'Stop voice reading' : displayLabel}
      >
        {isSpeaking ? (
          <>
            <Square className="w-5 h-5 mr-2 fill-current shrink-0" />
            <span>{lang.startsWith('hi') ? 'आवाज़ रोकें' : 'Stop Audio'}</span>
            <span className="flex space-x-1 ml-2 shrink-0">
              <span className="w-1.5 h-3.5 bg-white animate-bounce rounded-full" />
              <span className="w-1.5 h-3.5 bg-white animate-bounce [animation-delay:0.15s] rounded-full" />
              <span className="w-1.5 h-3.5 bg-white animate-bounce [animation-delay:0.3s] rounded-full" />
            </span>
          </>
        ) : (
          <>
            <Volume2 className="w-5 h-5 text-amber-900 mr-2 shrink-0" />
            <span>{displayLabel}</span>
          </>
        )}
      </button>
      {notice && (
        <span className="text-xs text-amber-700 dark:text-amber-300 mt-1 pl-1">
          {notice}
        </span>
      )}
    </div>
  );
};
