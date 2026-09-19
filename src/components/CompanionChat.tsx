import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Loader2,
  Bot,
  RotateCcw,
  Sparkles,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { startVoiceDictation, isVoiceDictationSupported } from '../utils/speech';
import { VoiceSpeakerButton } from './VoiceSpeakerButton';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';

export const CompanionChat: React.FC = () => {
  const { settings } = useApp();
  const lang = settings.language;
  const userName = settings.userName;

  const greetingPrefix = userName ? `Namaste ${userName} ji!` : 'Namaste!';
  const initialGreeting =
    lang === 'hi'
      ? `${userName ? `नमस्ते ${userName} जी!` : 'नमस्ते!'} मैं आपका सारथी साथी हूँ। आप नीचे माइक दबाकर बोल सकते हैं या संदेश लिख सकते हैं। बिजली बिल, संदिग्ध फ़ोन कॉल, स्वास्थ्य नियम, या कोई भी प्रश्न पूछें।`
      : `${greetingPrefix} I am Saarthi, your caring companion. You can tap the microphone to speak or type any question below. Ask me about bills, suspicious phone calls, health routines, or just have a peaceful chat.`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'saarthi',
      text: initialGreeting,
      timestamp: 'Just now',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);

  // Voice dictation state
  const [isListening, setIsListening] = useState(false);
  const [dictationStop, setDictationStop] = useState<(() => void) | null>(null);
  const [dictationError, setDictationError] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, isLoading]);

  const quickPrompts =
    lang === 'hi'
      ? [
          'डिजिटल जीवन प्रमाण पत्र (Jeevan Pramaan) कैसे जमा करें?',
          'किसी ने संदेश भेजा कि रात में बिजली कट जाएगी। क्या करूँ?',
          'आज के लिए कबीर का कोई शांत दोहा सुनाइए',
          'बुजुर्गों के घुटने और जोड़ों के लिए सरल व्यायाम बताइए',
          'फर्जी व्हाट्सएप संदेश कैसे पहचानें?',
        ]
      : [
          'How do I submit my digital life certificate (Jeevan Pramaan)?',
          'Someone sent an SMS saying electricity will be cut tonight. What should I do?',
          'Share a peaceful Kabir doha or morning wisdom for today',
          'What are gentle chair exercises for elderly joint pain?',
          'How to spot a fake WhatsApp forward in India?',
        ];

  const handleSendMessage = async (textToSend?: string, isExplainAgain = false) => {
    const query = (textToSend !== undefined ? textToSend : inputValue).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: isExplainAgain
        ? lang === 'hi'
          ? 'कृपया इसे और सरल शब्दों में दोबारा समझाइए।'
          : 'Could you please explain that again in simpler words?'
        : query,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (textToSend === undefined) setInputValue('');
    setIsLoading(true);
    setStreamingText(null);

    // Try SSE streaming first (Requirement 6)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversationHistory: messages,
          language: lang,
          userName: userName || undefined,
          stream: true,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Streaming failed, fallback to JSON');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value, { stream: true });
        const lines = raw.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') {
              continue;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.chunk) {
                accumulated += parsed.chunk;
                setStreamingText(accumulated);
              }
            } catch {
              // ignore malformed chunks
            }
          }
        }
      }

      const finalText = accumulated.trim();
      if (!finalText) {
        throw new Error('Empty streamed text');
      }

      const botReply: ChatMessage = {
        id: `saarthi-${Date.now()}`,
        sender: 'saarthi',
        text: finalText,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botReply]);
      setStreamingText(null);
    } catch {
      // Non-streaming JSON fallback
      try {
        const fallbackRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            conversationHistory: messages,
            language: lang,
            userName: userName || undefined,
            stream: false,
          }),
        });

        if (!fallbackRes.ok) {
          throw new Error('API failed');
        }

        const data = await fallbackRes.json();
        const replyText = data.reply || t('chatErrorPolite', lang);

        const botReply: ChatMessage = {
          id: `saarthi-${Date.now()}`,
          sender: 'saarthi',
          text: replyText,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, botReply]);
      } catch {
        // Polite error retry prompt (Requirement 6)
        const politeError: ChatMessage = {
          id: `saarthi-err-${Date.now()}`,
          sender: 'saarthi',
          text: t('chatErrorPolite', lang),
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, politeError]);
      } finally {
        setStreamingText(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplainAgain = (previousMessageText: string) => {
    const prompt =
      lang === 'hi'
        ? `कृपया इसे और अधिक सरल, स्पष्ट भाषा में दूसरे उदाहरण देकर दोबारा समझाइए: "${previousMessageText.slice(0, 150)}"`
        : `Could you please explain this again in simpler terms with different examples: "${previousMessageText.slice(0, 150)}"?`;
    handleSendMessage(prompt, true);
  };

  const handleToggleMic = () => {
    if (isListening) {
      if (dictationStop) dictationStop();
      setIsListening(false);
      setDictationStop(null);
      return;
    }

    if (!isVoiceDictationSupported()) {
      setDictationError(t('micNotSupported', lang));
      setTimeout(() => setDictationError(null), 4000);
      return;
    }

    setDictationError(null);
    const recognition = startVoiceDictation(
      (transcript) => {
        setInputValue(transcript);
        setIsListening(false);
        setDictationStop(null);
        handleSendMessage(transcript);
      },
      () => {
        setIsListening(false);
        setDictationStop(null);
      },
      (err) => {
        setDictationError(err);
        setIsListening(false);
        setDictationStop(null);
        setTimeout(() => setDictationError(null), 4000);
      },
      lang === 'hi' ? 'hi-IN' : 'en-IN'
    );

    if (recognition) {
      setIsListening(true);
      setDictationStop(() => recognition.stop);
    }
  };

  return (
    <div id="companion-chat-section" className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-800 dark:text-amber-300">
              <Bot className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 font-heading">
              {t('askTab', lang)}
            </h1>
          </div>
          <p className="text-stone-700 dark:text-stone-300 text-base leading-relaxed">
            {lang === 'hi'
              ? 'सारथी आपके हर सवाल का सरल भाषा में जवाब देगा। बोलकर या लिखकर पूछें।'
              : 'Speak or type any question about bills, messages, government schemes, or health routines.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setMessages([
              {
                id: 'welcome-reset',
                sender: 'saarthi',
                text: initialGreeting,
                timestamp: 'Just now',
              },
            ])
          }
          className="min-h-[48px] px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-semibold flex items-center space-x-1.5 self-start sm:self-center transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{lang === 'hi' ? 'नई बातचीत' : 'New Chat'}</span>
        </button>
      </div>

      {/* Suggested Quick Questions */}
      <div className="flex flex-wrap gap-2">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            className="min-h-[44px] text-xs font-semibold px-3.5 py-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-amber-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-left transition-colors shadow-2xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div
        id="chat-messages-container"
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-4 sm:p-6 min-h-[380px] max-h-[550px] overflow-y-auto space-y-4 shadow-xs"
      >
        {messages.map((msg) => {
          const isSaarthi = msg.sender === 'saarthi';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isSaarthi ? 'items-start' : 'items-end'} space-y-1.5`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 text-base leading-relaxed ${
                  isSaarthi
                    ? 'bg-amber-50/80 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-amber-200/80 dark:border-stone-700'
                    : 'bg-stone-900 dark:bg-amber-600 text-white dark:text-stone-900'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                <div
                  className={`mt-3 pt-2 flex flex-wrap items-center justify-between gap-2 text-xs border-t ${
                    isSaarthi
                      ? 'border-amber-200/60 dark:border-stone-700 text-stone-500 dark:text-stone-400'
                      : 'border-white/20 text-stone-300 dark:text-stone-800'
                  }`}
                >
                  <span>{msg.timestamp}</span>

                  {isSaarthi && (
                    <div className="flex items-center space-x-2">
                      <VoiceSpeakerButton
                        textToSpeak={msg.text}
                        lang={lang === 'hi' ? 'hi-IN' : 'en-IN'}
                        speechRate={settings.speechRate}
                        size="sm"
                      />

                      {/* Explain it again button (Requirement 6) */}
                      <button
                        type="button"
                        onClick={() => handleExplainAgain(msg.text)}
                        className="min-h-[44px] px-2.5 py-1 rounded-lg border border-amber-300 dark:border-stone-600 hover:bg-amber-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold text-xs flex items-center space-x-1 transition-colors"
                        title={t('explainAgain', lang)}
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                        <span>{t('explainAgain', lang)}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Live Streaming Response Bubble */}
        {streamingText && (
          <div className="flex flex-col items-start space-y-1.5">
            <div className="max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 text-base leading-relaxed bg-amber-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-amber-300 dark:border-stone-700">
              <div className="whitespace-pre-wrap">{streamingText}</div>
              <div className="mt-2 text-xs text-amber-700 dark:text-amber-400 flex items-center space-x-1.5 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{lang === 'hi' ? 'सारथी सोच रहा है...' : 'Saarthi is replying...'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Loading Spinner Indicator */}
        {isLoading && !streamingText && (
          <div className="flex items-center space-x-2 text-stone-500 dark:text-stone-400 text-sm p-3">
            <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
            <span>{lang === 'hi' ? 'सारथी सोच रहा है...' : 'Thinking carefully...'}</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Dictation error notice if any */}
      {dictationError && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{dictationError}</span>
        </div>
      )}

      {/* Input Form & Large Mic Button */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 sm:gap-3"
      >
        <button
          type="button"
          onClick={handleToggleMic}
          className={`min-h-[48px] min-w-[48px] px-4 py-3 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 transition-colors shrink-0 shadow-xs ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
          }`}
          title={isListening ? t('stopAudio', lang) : t('speak', lang)}
          aria-label={isListening ? t('stopAudio', lang) : t('speak', lang)}
        >
          {isListening ? (
            <>
              <MicOff className="w-5 h-5" />
              <span className="hidden sm:inline">{t('listening', lang)}</span>
            </>
          ) : (
            <>
              <Mic className="w-5 h-5 text-amber-800 dark:text-amber-300" />
              <span className="hidden sm:inline">{t('speak', lang)}</span>
            </>
          )}
        </button>

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={t('chatInputPlaceholder', lang)}
          disabled={isLoading}
          className="flex-1 min-h-[48px] px-4 py-3 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none placeholder:text-stone-400 dark:placeholder:text-stone-500"
        />

        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="min-h-[48px] min-w-[48px] px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 dark:disabled:bg-stone-800 disabled:text-stone-500 text-white font-bold transition-colors shrink-0 flex items-center justify-center shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          title={t('send', lang)}
          aria-label={t('send', lang)}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
