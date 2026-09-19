import React, { useState } from 'react';
import { AccessibilitySettings, Language, TextSize } from './types';
import { Navbar } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { DocumentSimplifier } from './components/DocumentSimplifier';
import { ScamShield } from './components/ScamShield';
import { MedicineReminder } from './components/MedicineReminder';
import { SeniorSchemes } from './components/SeniorSchemes';
import { DigitalGuides } from './components/DigitalGuides';
import { CompanionChat } from './components/CompanionChat';
import { EmergencySOSModal } from './components/EmergencySOSModal';
import { PhoneCall, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isSOSOpen, setIsSOSOpen] = useState(false);

  const [settings, setSettings] = useState<AccessibilitySettings>({
    textSize: 'normal',
    highContrast: false,
    speechRate: 0.85, // Gentle elder speech pace
    language: 'en',
    soundEnabled: true,
  });

  const handleUpdateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Font size class mapping for elders
  const textSizeClass =
    settings.textSize === 'extra-large'
      ? 'text-xl [&_h1]:text-4xl [&_h2]:text-3xl [&_h3]:text-2xl [&_p]:text-xl [&_button]:text-lg'
      : settings.textSize === 'large'
      ? 'text-lg [&_h1]:text-3xl [&_h2]:text-2xl [&_h3]:text-xl [&_p]:text-lg [&_button]:text-base'
      : 'text-base';

  return (
    <div
      className={`min-h-screen transition-all ${
        settings.highContrast
          ? 'high-contrast bg-slate-950 text-slate-100'
          : 'bg-stone-50 text-stone-800'
      } ${textSizeClass}`}
    >
      {/* Navigation Header with Accessibility Controls */}
      <Navbar
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenSOS={() => setIsSOSOpen(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        {activeTab === 'home' && (
          <HomeDashboard
            onSelectTab={setActiveTab}
            onOpenSOS={() => setIsSOSOpen(true)}
            language={settings.language}
          />
        )}

        {activeTab === 'simplify' && (
          <DocumentSimplifier language={settings.language} />
        )}

        {activeTab === 'scam' && (
          <ScamShield language={settings.language} />
        )}

        {activeTab === 'medicine' && (
          <MedicineReminder language={settings.language} />
        )}

        {activeTab === 'schemes' && (
          <SeniorSchemes language={settings.language} />
        )}

        {activeTab === 'guides' && (
          <DigitalGuides language={settings.language} />
        )}

        {activeTab === 'chat' && (
          <CompanionChat language={settings.language} />
        )}
      </main>

      {/* Floating Emergency SOS trigger on mobile */}
      <div className="fixed bottom-6 right-6 z-30 sm:hidden">
        <button
          id="floating-sos-btn"
          type="button"
          onClick={() => setIsSOSOpen(true)}
          className="p-4 rounded-full bg-rose-600 text-white shadow-2xl flex items-center justify-center font-bold animate-pulse active:scale-95"
          title="Emergency SOS"
        >
          <PhoneCall className="w-7 h-7" />
        </button>
      </div>

      {/* Emergency Modal */}
      <EmergencySOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />

      {/* Respectful Senior-Centric Footer */}
      <footer className="mt-12 border-t border-stone-200 bg-white py-8 text-stone-600 text-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-center md:text-left">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-serif font-bold text-base shadow-xs">
              सा
            </div>
            <div>
              <span className="font-extrabold text-stone-900 block">
                Saarthi (सारथी) • Daily Companion for Senior Citizens
              </span>
              <p className="text-xs text-stone-500">
                Dedicated with devotion and respect to the elders of India.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-stone-700">
            <span className="bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
              Elderline: <strong className="text-amber-800">14567</strong>
            </span>
            <span className="bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
              Cyber Fraud: <strong className="text-rose-700">1930</strong>
            </span>
            <span className="bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
              Emergency: <strong className="text-blue-800">112</strong>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
