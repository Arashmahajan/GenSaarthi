// Senior-friendly Speech-to-Text and Text-to-Speech utilities

export class SaarthiVoiceService {
  public static defaultRate: number = 0.85;
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;
  private static isSpeaking: boolean = false;
  private static onStateChangeCallbacks: Array<(speaking: boolean) => void> = [];

  public static subscribe(callback: (speaking: boolean) => void) {
    this.onStateChangeCallbacks.push(callback);
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  private static notify(speaking: boolean) {
    this.isSpeaking = speaking;
    this.onStateChangeCallbacks.forEach(cb => cb(speaking));
  }

  public static speak(text: string, rate?: number, lang: string = 'en-IN') {
    if (!this.synth) return;

    // Stop any ongoing speech
    this.stop();

    if (!text || text.trim().length === 0) return;

    // Clean markdown asterisks and URLs for spoken audio
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/₹/g, 'Rupees ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate ?? this.defaultRate; // Gentle, slower pace for seniors
    utterance.pitch = 1.0;

    // Look for Indian English or Hindi voice if available
    const voices = this.synth.getVoices();
    const indianVoice = voices.find(v => v.lang === 'en-IN' || v.lang === 'hi-IN' || v.name.includes('India'));
    if (indianVoice) {
      utterance.voice = indianVoice;
    }

    utterance.onstart = () => {
      this.notify(true);
    };

    utterance.onend = () => {
      this.notify(false);
      this.currentUtterance = null;
    };

    utterance.onerror = () => {
      this.notify(false);
      this.currentUtterance = null;
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public static stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.notify(false);
    this.currentUtterance = null;
  }

  public static getSpeakingStatus(): boolean {
    return this.isSpeaking;
  }
}

// Browser Speech Recognition (Voice Input / Mic)
export function startVoiceDictation(
  onResult: (transcript: string) => void,
  onEnd: () => void,
  onError: (err: string) => void,
  lang: string = 'en-IN'
): { stop: () => void } | null {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError('Microphone speech recognition is not supported in this browser.');
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = lang;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      onError(event.error || 'Could not understand speech');
    };

    recognition.onend = () => {
      onEnd();
    };

    recognition.start();

    return {
      stop: () => {
        try {
          recognition.stop();
        } catch (e) {
          // ignore
        }
      },
    };
  } catch (err: any) {
    onError(err?.message || 'Failed to start microphone');
    return null;
  }
}
