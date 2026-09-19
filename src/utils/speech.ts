// Senior-friendly Speech-to-Text and Text-to-Speech utilities

export class SaarthiVoiceService {
  public static defaultRate: number = 0.85;
  private static synth: SpeechSynthesis | null =
    typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;
  private static isSpeaking: boolean = false;
  private static onStateChangeCallbacks: Array<(speaking: boolean) => void> = [];
  private static voicesLoaded: boolean = false;

  public static subscribe(callback: (speaking: boolean) => void): () => void {
    this.onStateChangeCallbacks.push(callback);
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter((cb) => cb !== callback);
    };
  }

  private static notify(speaking: boolean): void {
    this.isSpeaking = speaking;
    this.onStateChangeCallbacks.forEach((cb) => cb(speaking));
  }

  private static getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      if (!this.synth) {
        resolve([]);
        return;
      }
      const existing = this.synth.getVoices();
      if (existing.length > 0) {
        resolve(existing);
        return;
      }

      // Wait for voiceschanged if getVoices() is empty initially
      const onVoicesChanged = () => {
        if (this.synth) {
          const v = this.synth.getVoices();
          this.synth.removeEventListener('voiceschanged', onVoicesChanged);
          resolve(v);
        } else {
          resolve([]);
        }
      };

      this.synth.addEventListener('voiceschanged', onVoicesChanged);
      // Fallback timeout in case event does not fire
      setTimeout(() => {
        if (this.synth) {
          this.synth.removeEventListener('voiceschanged', onVoicesChanged);
          resolve(this.synth.getVoices());
        } else {
          resolve([]);
        }
      }, 500);
    });
  }

  public static async speak(
    text: string,
    rate?: number,
    lang: string = 'en-IN',
    onNoMatchingVoice?: () => void
  ): Promise<void> {
    if (!this.synth) return;

    // Stop any ongoing speech
    this.stop();

    if (!text || text.trim().length === 0) return;

    // Clean markdown asterisks and URLs for spoken audio
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/₹/g, lang.startsWith('hi') ? 'रुपये ' : 'Rupees ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate ?? this.defaultRate;
    utterance.pitch = 1.0;
    utterance.lang = lang;

    const voices = await this.getAvailableVoices();
    let matchingVoice: SpeechSynthesisVoice | undefined;

    if (lang.startsWith('hi')) {
      // Find Hindi voice
      matchingVoice = voices.find(
        (v) => v.lang.toLowerCase() === 'hi-in' || v.lang.toLowerCase().startsWith('hi')
      );
    } else {
      // Find Indian English voice or general English
      matchingVoice =
        voices.find((v) => v.lang.toLowerCase() === 'en-in') ||
        voices.find((v) => v.lang.toLowerCase().startsWith('en') && v.name.toLowerCase().includes('india')) ||
        voices.find((v) => v.lang.toLowerCase().startsWith('en'));
    }

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    } else if (onNoMatchingVoice && voices.length > 0) {
      onNoMatchingVoice();
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

  public static stop(): void {
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
export function isVoiceDictationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function startVoiceDictation(
  onResult: (transcript: string) => void,
  onEnd: () => void,
  onError: (err: string) => void,
  lang: string = 'en-IN'
): { stop: () => void } | null {
  if (typeof window === 'undefined') return null;

  const w = window as unknown as {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  };

  const SpeechRecognitionClass = w.SpeechRecognition || w.webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    onError('Speech recognition is not supported in this browser.');
    return null;
  }

  try {
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = lang;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      onResult(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
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
        } catch {
          // ignore
        }
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to start microphone';
    onError(msg);
    return null;
  }
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  results: Array<Array<{ transcript: string }>>;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}
