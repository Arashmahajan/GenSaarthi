import React from 'react';
import { FileText, ShieldAlert, Pill, Landmark, Smartphone, MessageSquare, PhoneCall, CheckCircle, ArrowRight, Sun, Sparkles, Volume2 } from 'lucide-react';
import { AccessibilitySettings, Language } from '../types';
import { DailySatsangCard } from './DailySatsangCard';
import { VoiceSpeakerButton } from './VoiceSpeakerButton';
import { useApp } from '../context/AppContext';

interface HomeDashboardProps {
  onSelectTab: (tab: string) => void;
  onOpenSOS: () => void;
  language?: Language;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onSelectTab,
  onOpenSOS,
}) => {
  const { settings } = useApp();
  const lang = settings.language;
  const userName = settings.userName;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'सुप्रभात • Suprabhatam (Good Morning)', sub: 'May your morning be peaceful and energetic.' };
    if (hour < 17) return { text: 'शुभ दोपहर • Namaste (Good Afternoon)', sub: 'Hope you had a healthy, warm lunch.' };
    return { text: 'शुभ संध्या • Shubh Sandhya (Good Evening)', sub: 'Time to rest your eyes and relax comfortably.' };
  };

  const greeting = getGreeting();

  const primaryActions = [
    {
      id: 'check',
      title: 'सुरक्षा और बिल जांचें (Check Safety)',
      engTitle: 'Is This Message or Document Safe?',
      desc: 'Got an urgent SMS threatening power cut tonight, SBI KYC link, electricity bill, or prescription? Saarthi clarifies in plain words.',
      icon: <ShieldAlert className="w-8 h-8 text-amber-600" />,
      bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50/80 border-amber-300 hover:border-amber-400',
      badge: 'Scam Detection • Bills • Prescriptions',
      badgeColor: 'bg-amber-100 text-amber-900',
      buttonText: 'Check Message / जांचें',
    },
    {
      id: 'chat',
      title: 'सारथी से पूछें (Ask Saarthi)',
      engTitle: 'Companion Chat & Voice',
      desc: 'Ask any question in gentle spoken Hindi or English. From digital life certificates to daily calm advice.',
      icon: <MessageSquare className="w-8 h-8 text-rose-600" />,
      bgColor: 'bg-gradient-to-br from-rose-50 to-orange-50/80 border-rose-300 hover:border-rose-400',
      badge: 'Voice • Hindi & English • Caring',
      badgeColor: 'bg-rose-100 text-rose-900',
      buttonText: 'Talk to Saarthi / बात करें',
    },
    {
      id: 'medicine',
      title: 'दवाई साथी (Medicine Routine)',
      engTitle: 'Week View & Taken Tracker',
      desc: 'Visual morning, afternoon, and night pill reminders with "Maine Le Li" (Taken) checkoff and doctor explanations.',
      icon: <Pill className="w-8 h-8 text-emerald-600" />,
      bgColor: 'bg-gradient-to-br from-emerald-50 to-teal-50/80 border-emerald-300 hover:border-emerald-400',
      badge: 'Week Adherence • Timely Schedule',
      badgeColor: 'bg-emerald-100 text-emerald-900',
      buttonText: 'View Medicines / दवाई देखें',
    },
    {
      id: 'reminders',
      title: 'याददाश्त साथी (Reminders)',
      engTitle: 'Due Dates & Routine Tasks',
      desc: 'Never worry about forgetting electricity bill deadlines, doctor visits, or pension certificate submission dates.',
      icon: <FileText className="w-8 h-8 text-blue-600" />,
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50/80 border-blue-300 hover:border-blue-400',
      badge: 'Bill Dates • Doctor Visits • Deadlines',
      badgeColor: 'bg-blue-100 text-blue-900',
      buttonText: 'My Reminders / याददाश्त देखें',
    },
  ];

  const quickGuideShortcuts = [
    { title: 'Pay Electricity Bill on PhonePe', id: 'guides' },
    { title: 'Make WhatsApp Video Call to Grandchildren', id: 'guides' },
    { title: 'Book an Uber Auto Safely', id: 'guides' },
    { title: 'Submit Jeevan Pramaan from Home', id: 'guides' },
  ];

  const spokenOverview = `${userName ? `Pranam ${userName} ji!` : 'Pranam!'} Welcome to Saarthi. ${greeting.text}. On Saarthi, you can easily understand electricity bills and doctor prescriptions, check suspicious messages for scams, manage your daily medicines, and explore senior citizen government benefits. How may I help you right now?`;

  return (
    <div id="home-dashboard" className="space-y-6">
      {/* Daily Satsang Morning Thought Card */}
      <DailySatsangCard />

      {/* Warm Elder Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-3 py-0.5 rounded-full">
              {greeting.text}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-heading">
            {userName ? `Namaste, ${userName} ji` : 'Namaste'}, How Can Saarthi Help You Today?
          </h2>
          <p className="text-stone-600 dark:text-stone-400 text-base max-w-2xl">
            {greeting.sub} Tap any of the 4 big cards below or speak with Saarthi in voice.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <VoiceSpeakerButton
            textToSpeak={spokenOverview}
            label="Listen Welcome / सुनें"
            size="md"
          />
        </div>
      </div>

      {/* 4 Primary Action Cards Grid (Large, High Contrast, Elder Friendly) */}
      <div className="grid md:grid-cols-2 gap-5">
        {primaryActions.map((action) => (
          <div
            key={action.id}
            id={`card-${action.id}`}
            onClick={() => onSelectTab(action.id)}
            className={`border-2 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group active:scale-98 ${action.bgColor}`}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="p-3 bg-white rounded-2xl shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                  {action.icon}
                </div>
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${action.badgeColor}`}>
                  {action.badge}
                </span>
              </div>

              <div className="mt-3 space-y-1">
                <h3 className="text-xl md:text-2xl font-black text-stone-900 font-heading">
                  {action.title}
                </h3>
                <span className="text-xs font-bold text-stone-500 block uppercase">
                  {action.engTitle}
                </span>
                <p className="text-sm md:text-base text-stone-700 leading-relaxed pt-1">
                  {action.desc}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between">
              <span className="text-sm font-bold text-stone-900 flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                <span>{action.buttonText}</span>
                <ArrowRight className="w-4 h-4 text-stone-700" />
              </span>
              <span className="text-xs font-semibold text-stone-500">Tap to Open →</span>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Companion & Voice Guidance Strip */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* Voice Companion Chat */}
        <div
          onClick={() => onSelectTab('chat')}
          className="bg-white border-2 border-amber-200 hover:border-amber-400 rounded-3xl p-5 shadow-xs cursor-pointer transition-all hover:shadow-sm flex items-start space-x-3.5 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl font-serif shrink-0 group-hover:scale-105 transition-transform shadow-xs">
            🎙️
          </div>
          <div>
            <h4 className="font-extrabold text-base text-stone-900">
              सारथी से बोलकर पूछें
            </h4>
            <span className="text-xs font-medium text-stone-500 block mb-1">
              Voice Assistant & Companion
            </span>
            <p className="text-xs text-stone-600">
              Speak in Hindi or English. Ask any question without typing!
            </p>
          </div>
        </div>

        {/* Digital Guides */}
        <div
          onClick={() => onSelectTab('guides')}
          className="bg-white border-2 border-purple-200 hover:border-purple-400 rounded-3xl p-5 shadow-xs cursor-pointer transition-all hover:shadow-sm flex items-start space-x-3.5 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-xl shrink-0 group-hover:scale-105 transition-transform shadow-xs">
            📱
          </div>
          <div>
            <h4 className="font-extrabold text-base text-stone-900">
              आसान डिजिटल तकनीक
            </h4>
            <span className="text-xs font-medium text-stone-500 block mb-1">
              PhonePe, WhatsApp & Uber Guides
            </span>
            <p className="text-xs text-stone-600">
              Large visual steps to pay bills, make video calls, and book autos.
            </p>
          </div>
        </div>

        {/* Plan My Day */}
        <div
          onClick={() => onSelectTab('plan')}
          className="bg-white border-2 border-emerald-200 hover:border-emerald-400 rounded-3xl p-5 shadow-xs cursor-pointer transition-all hover:shadow-sm flex items-start space-x-3.5 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shrink-0 group-hover:scale-105 transition-transform shadow-xs">
            🌅
          </div>
          <div>
            <h4 className="font-extrabold text-base text-stone-900">
              दिनचर्या बनाएं (Plan My Day)
            </h4>
            <span className="text-xs font-medium text-stone-500 block mb-1">
              Calm Senior Daily Routine
            </span>
            <p className="text-xs text-stone-600">
              Personalized gentle schedule for walks, prayers, meals, and rest.
            </p>
          </div>
        </div>

        {/* Emergency SOS */}
        <div
          onClick={onOpenSOS}
          className="bg-white border-2 border-rose-200 hover:border-rose-400 rounded-3xl p-5 shadow-xs cursor-pointer transition-all hover:shadow-sm flex items-start space-x-3.5 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold text-xl shrink-0 group-hover:scale-105 transition-transform shadow-xs">
            🚨
          </div>
          <div>
            <h4 className="font-extrabold text-base text-stone-900">
              आपातकालीन सहायता (SOS)
            </h4>
            <span className="text-xs font-medium text-stone-500 block mb-1">
              112, 14567, 1930 & Family Dial
            </span>
            <p className="text-xs text-stone-600">
              1-tap dial for police, senior helpline, cyber crime, or children.
            </p>
          </div>
        </div>
      </div>

      {/* Cyber Safety Quick Reminder Footer Banner */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 block">
            ⭐ Senior Golden Rule of the Day:
          </span>
          <p className="text-base md:text-lg font-bold text-stone-100">
            Never share your 6-digit bank OTP or click SMS links threatening immediate electricity cut-off.
          </p>
          <p className="text-xs text-stone-400">
            Official departments give at least 15 days written notice by physical letter. When in doubt, check with Saarthi!
          </p>
        </div>

        <button
          id="home-check-scam-btn"
          type="button"
          onClick={() => onSelectTab('check')}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-sm shrink-0 shadow-md transition-colors"
        >
          Verify Any Message →
        </button>
      </div>
    </div>
  );
};
