import React, { useState, useEffect } from 'react';
import { AccessibilitySettings, Language } from './types';
import { Navbar } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { UnifiedChecker } from './components/UnifiedChecker';
import { RemindersManager } from './components/RemindersManager';
import { PlanMyDay } from './components/PlanMyDay';
import { MedicineReminder } from './components/MedicineReminder';
import { SeniorSchemes } from './components/SeniorSchemes';
import { DigitalGuides } from './components/DigitalGuides';
import { CompanionChat } from './components/CompanionChat';
import { EmergencySOSModal } from './components/EmergencySOSModal';
import { SaarthiVoiceService } from './utils/speech';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isSOSOpen, setIsSOSOpen] = useState(false);

  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem('saarthi_accessibility_settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse saved settings');
    }
    return {
      textSize: 'normal',
      highContrast: false,
      darkMode: false,
      speechRate: 0.85, // Gentle elder speech pace
      language: 'en',
      soundEnabled: true,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('saarthi_accessibility_settings', JSON.stringify(settings));
    } catch (e) {
      // ignore
    }

    if (settings.speechRate) {
      SaarthiVoiceService.defaultRate = settings.speechRate;
    }

    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (settings.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [settings]);

  const handleUpdateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Font size class mapping for elders (19px base scale)
  const textSizeClass =
    settings.textSize === 'extra-large'
      ? 'text-xl [&_h1]:text-4xl [&_h2]:text-3xl [&_h3]:text-2xl [&_p]:text-xl [&_button]:text-lg'
      : settings.textSize === 'large'
      ? 'text-lg [&_h1]:text-3xl [&_h2]:text-2xl [&_h3]:text-xl [&_p]:text-lg [&_button]:text-base'
      : 'text-base';

  return (
    <div
      className={`min-h-screen transition-colors ${settings.darkMode ? 'dark' : ''} ${
        settings.highContrast
          ? 'high-contrast bg-black text-yellow-300'
          : settings.darkMode
          ? 'bg-stone-950 text-stone-100'
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

      {/* Main Content Viewport with Accessible Skip-to-Content Anchor */}
      <main id="main-content" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 focus:outline-none">
        {activeTab === 'home' && (
          <HomeDashboard
            onSelectTab={setActiveTab}
            onOpenSOS={() => setIsSOSOpen(true)}
            language={settings.language}
          />
        )}

        {(activeTab === 'check' || activeTab === 'simplify' || activeTab === 'scam') && (
          <UnifiedChecker language={settings.language} />
        )}

        {activeTab === 'chat' && (
          <CompanionChat language={settings.language} />
        )}

        {activeTab === 'reminders' && (
          <RemindersManager language={settings.language} />
        )}

        {activeTab === 'medicine' && (
          <MedicineReminder language={settings.language} />
        )}

        {activeTab === 'plan' && (
          <PlanMyDay language={settings.language} />
        )}

        {activeTab === 'schemes' && (
          <SeniorSchemes language={settings.language} />
        )}

        {activeTab === 'guides' && (
          <DigitalGuides language={settings.language} />
        )}
      </main>

      {/* Floating Emergency SOS trigger on mobile */}
      <div className="fixed bottom-6 right-6 z-30 sm:hidden">
        <button
          id="floating-sos-btn"
          type="button"
          onClick={() => setIsSOSOpen(true)}
          className="p-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-2xl flex items-center justify-center font-bold animate-pulse active:scale-95"
          title="Emergency SOS"
          aria-label="Open emergency numbers and contacts"
        >
          <PhoneCall className="w-7 h-7" />
        </button>
      </div>

      {/* Emergency Modal */}
      <EmergencySOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />

      {/* Respectful Senior-Centric Footer */}
      <footer className="mt-12 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-8 text-stone-600 dark:text-stone-300 text-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-center md:text-left">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-serif font-bold text-lg shadow-xs">
              सा
            </div>
            <div>
              <span className="font-extrabold text-stone-900 dark:text-stone-100 block">
                Saarthi (सारथी) • Daily Companion for Senior Citizens
              </span>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Dedicated with devotion and respect to the elders of India.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-stone-700 dark:text-stone-200">
            <span className="bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-700">
              Elderline: <strong className="text-amber-700 dark:text-amber-400">14567</strong>
            </span>
            <span className="bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-700">
              Cyber Fraud: <strong className="text-rose-700 dark:text-rose-400">1930</strong>
            </span>
            <span className="bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-700">
              Emergency: <strong className="text-blue-700 dark:text-blue-400">112</strong>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
