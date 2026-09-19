import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { UnifiedChecker } from './components/UnifiedChecker';
import { RemindersAndMedicines } from './components/RemindersAndMedicines';
import { CompanionChat } from './components/CompanionChat';
import { EmergencyHelp } from './components/EmergencyHelp';
import { EmergencySOSModal } from './components/EmergencySOSModal';
import { MoreMenu } from './components/MoreMenu';
import { PlanMyDay } from './components/PlanMyDay';
import { SeniorSchemes } from './components/SeniorSchemes';
import { DigitalGuides } from './components/DigitalGuides';
import { SettingsModal } from './components/modals/SettingsModal';
import { useApp } from './context/AppContext';
import { SaarthiVoiceService } from './utils/speech';
import { PhoneCall } from 'lucide-react';
import { t } from './i18n';

// Mapping between tab ids and url hashes
const TAB_TO_HASH: Record<string, string> = {
  home: '#home',
  chat: '#ask',
  check: '#check',
  reminders_and_medicines: '#reminders',
  help: '#help',
  more: '#more',
  plan: '#plan',
  schemes: '#schemes',
  guides: '#guides',
};

const HASH_TO_TAB: Record<string, string> = {
  '#home': 'home',
  '#ask': 'chat',
  '#chat': 'chat',
  '#check': 'check',
  '#reminders': 'reminders_and_medicines',
  '#medicine': 'reminders_and_medicines',
  '#medicines': 'reminders_and_medicines',
  '#help': 'help',
  '#sos': 'help',
  '#more': 'more',
  '#plan': 'plan',
  '#schemes': 'schemes',
  '#guides': 'guides',
};

export default function App() {
  const { settings } = useApp();
  const [isSOSOpen, setSOSOpen] = useState<boolean>(false);
  const [isSettingsOpen, setSettingsOpen] = useState<boolean>(false);
  const lang = settings.language;

  // Initialize active tab from window.location.hash or default to 'home'
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#settings') {
        return 'home';
      }
      return HASH_TO_TAB[hash] || 'home';
    }
    return 'home';
  });

  // Handle URL hash changes (back/forward, refreshing, deep links)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#settings') {
        setSettingsOpen(true);
      } else if (hash === '#sos') {
        setSOSOpen(true);
      } else if (HASH_TO_TAB[hash]) {
        setActiveTab(HASH_TO_TAB[hash]);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setSettingsOpen, setSOSOpen]);

  // Sync document level classes and speech rate
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = settings.language;
      document.documentElement.setAttribute('data-text-size', settings.textSize);

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
    }

    if (settings.speechRate) {
      SaarthiVoiceService.defaultRate = settings.speechRate;
    }
  }, [settings]);

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    const targetHash = TAB_TO_HASH[tabId];
    if (targetHash && window.location.hash !== targetHash) {
      window.history.pushState(null, '', targetHash);
    }
    // Scroll to top of main content
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      id="saarthi-app-container"
      className={`min-h-screen transition-colors ${
        settings.highContrast
          ? 'high-contrast bg-black text-yellow-300'
          : settings.darkMode
          ? 'bg-stone-950 text-stone-100'
          : 'bg-stone-50 text-stone-800'
      }`}
    >
      {/* 5-Item Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenSOS={() => setSOSOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main
        id="main-content"
        tabIndex={-1}
        className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 focus:outline-none"
      >
        {activeTab === 'home' && (
          <HomeDashboard
            onSelectTab={handleSelectTab}
            onOpenSOS={() => setSOSOpen(true)}
          />
        )}

        {activeTab === 'chat' && <CompanionChat />}

        {activeTab === 'check' && <UnifiedChecker />}

        {activeTab === 'reminders_and_medicines' && <RemindersAndMedicines />}

        {activeTab === 'help' && (
          <EmergencyHelp
            onClose={() => handleSelectTab('home')}
            isModal={false}
          />
        )}

        {activeTab === 'more' && (
          <MoreMenu
            onNavigate={handleSelectTab}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}

        {activeTab === 'plan' && <PlanMyDay />}

        {activeTab === 'schemes' && <SeniorSchemes />}

        {activeTab === 'guides' && <DigitalGuides />}
      </main>

      {/* Floating Emergency SOS trigger on mobile viewports */}
      <div className="fixed bottom-6 right-6 z-30 sm:hidden">
        <button
          id="floating-sos-btn"
          type="button"
          onClick={() => setSOSOpen(true)}
          className="min-h-[56px] min-w-[56px] p-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-2xl flex items-center justify-center font-bold active:scale-95 transition-transform"
          title="Emergency SOS"
          aria-label="Open emergency numbers and contacts"
        >
          <PhoneCall className="w-7 h-7" />
        </button>
      </div>

      {/* Modals */}
      <EmergencySOSModal isOpen={isSOSOpen} onClose={() => setSOSOpen(false)} />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Respectful Senior-Centric Footer */}
      <footer className="mt-14 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-8 text-stone-600 dark:text-stone-300 text-sm">
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
                {lang === 'hi'
                  ? 'भारत के वरिष्ठ नागरिकों के लिए समर्पित और आदरपूर्वक निर्मित।'
                  : 'Dedicated with devotion and respect to the elders of India.'}
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
