import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Square, Loader2 } from 'lucide-react';
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
  label = 'Listen / आवाज़ में सुनें',
  className = '',
  speechRate = 0.85,
  lang = 'en-IN',
  size = 'md',
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

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
      SaarthiVoiceService.speak(textToSpeak, speechRate, lang);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
    md: 'px-4 py-2.5 text-sm md:text-base gap-2 rounded-xl',
    lg: 'px-5 py-3 text-base md:text-lg gap-2.5 rounded-2xl',
  };

  return (
    <button
      id={`voice-btn-${textToSpeak.slice(0, 10).replace(/\s+/g, '-').toLowerCase()}`}
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center font-medium transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 active:scale-95 ${
        isSpeaking
          ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
          : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
      } ${sizeClasses[size]} ${className}`}
      title={isSpeaking ? 'Stop voice reading' : 'Read aloud in slow, clear voice'}
    >
      {isSpeaking ? (
        <>
          <Square className="w-4 h-4 fill-current" />
          <span>Stop Voice / रोकें</span>
          <span className="flex space-x-0.5 ml-1">
            <span className="w-1 h-3 bg-white animate-bounce rounded-full" />
            <span className="w-1 h-3 bg-white animate-bounce [animation-delay:0.15s] rounded-full" />
            <span className="w-1 h-3 bg-white animate-bounce [animation-delay:0.3s] rounded-full" />
          </span>
        </>
      ) : (
        <>
          <Volume2 className="w-5 h-5 text-amber-800" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
