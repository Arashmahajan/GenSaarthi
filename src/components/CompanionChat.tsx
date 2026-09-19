import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Mic, MicOff, Send, Volume2, Sparkles, Loader2, User, Bot, RefreshCw } from 'lucide-react';
import { ChatMessage, Language } from '../types';
import { SaarthiVoiceService, startVoiceDictation } from '../utils/speech';
import { VoiceSpeakerButton } from './VoiceSpeakerButton';

interface CompanionChatProps {
  language: Language;
}

export const CompanionChat: React.FC<CompanionChatProps> = ({ language }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'saarthi',
      text: 'Namaste Uncle ji, Pranam Aunty ji! I am Saarthi, your caring companion. You can speak to me by tapping the microphone or type any question below. How are you feeling today? You can ask me about bills, suspicious phone calls, health routines, or just have a peaceful chat.',
      timestamp: 'Just now',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const dictationControllerRef = useRef<{ stop: () => void } | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickPrompts = [
    'How do I submit my digital life certificate (Jeevan Pramaan)?',
    'Someone sent an SMS saying my electricity will be cut tonight. What should I do?',
    'Share a peaceful Kabir doha or morning wisdom for today',
    'What are gentle chair exercises for elderly joint pain?',
    'How to spot a fake WhatsApp forward in India?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputValue;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversationHistory: messages,
          language,
        }),
      });

      const data = await response.json();
      const botReply: ChatMessage = {
        id: `saarthi-${Date.now()}`,
        sender: 'saarthi',
        text: data.reply || 'Namaste! I am right here with you. How can I assist you further?',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botReply]);

      // Automatically speak the response gently for the senior
      SaarthiVoiceService.speak(botReply.text, 0.85);
    } catch (err) {
      console.error(err);
      const fallback: ChatMessage = {
        id: `saarthi-err-${Date.now()}`,
        sender: 'saarthi',
        text: 'Namaste Uncle ji! I had a slight trouble with the connection. Please ask again, I am right by your side.',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMic = () => {
    if (isListening) {
      dictationControllerRef.current?.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      dictationControllerRef.current = startVoiceDictation(
        (transcript) => {
          setInputValue(transcript);
          setIsListening(false);
          // Auto send after speech
          handleSendMessage(transcript);
        },
        () => {
          setIsListening(false);
        },
        (error) => {
          console.warn('Voice error:', error);
          setIsListening(false);
        },
        language === 'hi' ? 'hi-IN' : 'en-IN'
      );
    }
  };

  return (
    <div id="companion-chat-section" className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 border border-amber-200 rounded-3xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-200/80 text-amber-900 font-bold text-xs uppercase tracking-wide">
              <Bot className="w-4 h-4 text-amber-800" />
              <span>सारथी साथी • Voice-First Companion</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-stone-900 font-heading">
              Talk to Saarthi (सारथी से बात करें)
            </h2>
            <p className="text-stone-600 text-sm md:text-base leading-relaxed">
              Ask anything in plain language or Hindi. Tap the large microphone button to speak instead of typing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="clear-chat-btn"
              type="button"
              onClick={() =>
                setMessages([
                  {
                    id: 'welcome-reset',
                    sender: 'saarthi',
                    text: 'Namaste! Chat cleared. What would you like to talk about today?',
                    timestamp: 'Just now',
                  },
                ])
              }
              className="p-2 rounded-xl text-stone-600 hover:bg-stone-200/70 border border-stone-300 text-xs font-semibold flex items-center gap-1"
              title="Reset conversation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Chat</span>
            </button>
          </div>
        </div>

        {/* Quick Question Chips */}
        <div className="mt-4 pt-3 border-t border-amber-200/80">
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-2">
            Suggested Elder Topics (Tap to ask):
          </span>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="text-left px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 border border-amber-200 text-xs text-stone-800 font-medium transition-all shadow-2xs active:scale-98"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="bg-white border-2 border-stone-200 rounded-3xl p-5 md:p-6 shadow-sm min-h-[420px] max-h-[560px] overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold font-serif shrink-0 shadow-xs">
                  सा
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-3xl p-4 md:p-5 text-base md:text-lg leading-relaxed shadow-2xs ${
                  isUser
                    ? 'bg-amber-500 text-white rounded-br-xs'
                    : 'bg-stone-50 border border-stone-200 text-stone-900 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                <div className="mt-2 pt-2 border-t border-stone-200/60 flex items-center justify-between gap-3 text-xs">
                  <span className={isUser ? 'text-amber-100' : 'text-stone-400'}>
                    {msg.timestamp}
                  </span>

                  {!isUser && (
                    <VoiceSpeakerButton
                      textToSpeak={msg.text}
                      label="Listen / सुनें"
                      size="sm"
                    />
                  )}
                </div>
              </div>

              {isUser && (
                <div className="w-10 h-10 rounded-2xl bg-stone-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center space-x-3 text-stone-500 text-sm">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold font-serif shrink-0">
              सा
            </div>
            <div className="bg-stone-100 rounded-2xl px-4 py-3 flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              <span>Saarthi is thinking with care...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input & Voice Controls */}
      <div className="bg-white border-2 border-stone-200 rounded-3xl p-3 md:p-4 shadow-sm space-y-3">
        {isListening && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-2xl text-rose-900 text-sm font-bold flex items-center justify-between animate-pulse">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
              <span>Listening to your voice... Speak comfortably in English or Hindi!</span>
            </div>
            <button
              type="button"
              onClick={handleToggleMic}
              className="text-xs px-3 py-1 bg-rose-600 text-white rounded-lg"
            >
              Stop Mic
            </button>
          </div>
        )}

        <div className="flex items-center space-x-2">
          {/* Large Senior Mic Button */}
          <button
            id="chat-mic-btn"
            type="button"
            onClick={handleToggleMic}
            className={`p-3.5 md:p-4 rounded-2xl transition-all flex items-center justify-center shadow-md active:scale-95 shrink-0 ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
            }`}
            title="Tap to speak in voice"
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Text Input */}
          <input
            id="chat-text-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Type your question or tap mic to speak..."
            className="flex-1 p-3.5 md:p-4 rounded-2xl border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-base md:text-lg text-stone-900"
          />

          {/* Send Button */}
          <button
            id="chat-send-btn"
            type="button"
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputValue.trim()}
            className="p-3.5 md:p-4 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold transition-all shadow-md active:scale-95 shrink-0"
            title="Send question"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
