import React from 'react';
import { Shield, Sparkles, PhoneCall, Volume2, Type, Sun, Moon, Languages } from 'lucide-react';
import { AccessibilitySettings, Language, TextSize } from '../types';

interface NavbarProps {
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  onOpenSOS: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onUpdateSettings,
  onOpenSOS,
  activeTab,
  onSelectTab,
}) => {
  const languageLabels: Record<Language, string> = {
    en: 'English',
    hi: 'हिंदी (Hindi)',
    hinglish: 'Hinglish',
    bn: 'বাংলা (Bengali)',
    mr: 'मराठी (Marathi)',
    ta: 'தமிழ் (Tamil)',
    te: 'తెలుగు (Telugu)',
    gu: 'ગુજરાતી (Gujarati)',
  };

  const navItems = [
    { id: 'home', label: 'Home / मुख्य पृष्ठ', icon: '🏠' },
    { id: 'check', label: 'Check / जांचें', icon: '🛡️' },
    { id: 'chat', label: 'Ask / पूछें', icon: '🎙️' },
    { id: 'reminders', label: 'Reminders / याददाश्त', icon: '📅' },
    { id: 'medicine', label: 'Medicines / दवाई साथी', icon: '💊' },
    { id: 'plan', label: 'Plan My Day / दिनचर्या', icon: '🌅' },
    { id: 'schemes', label: 'Senior Schemes / योजनाएं', icon: '🏛️' },
    { id: 'guides', label: 'Digital Guides / आसान तकनीक', icon: '📱' },
  ];

  const toggleLanguage = (newLang: Language) => {
    onUpdateSettings({ language: newLang });
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLang;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 shadow-sm transition-colors">
      {/* Top Accessibility Bar */}
      <div className="bg-stone-100 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 px-4 py-2 text-sm text-stone-700 dark:text-stone-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Tagline */}
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold text-stone-800 dark:text-stone-100">
              सारथी • Senior Citizen Friendly Companion
            </span>
          </div>

          {/* Quick Accessibility Controls with 48px minimum touch targets */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            {/* Font Size Selector */}
            <div className="flex items-center space-x-1 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-1">
              <span className="text-xs font-bold text-stone-600 dark:text-stone-300 px-1">Text:</span>
              <button
                id="font-size-normal"
                type="button"
                onClick={() => onUpdateSettings({ textSize: 'normal' })}
                className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  settings.textSize === 'normal'
                    ? 'bg-amber-500 text-white'
                    : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700'
                }`}
                title="Normal text size (19px)"
              >
                Normal
              </button>
              <button
                id="font-size-large"
                type="button"
                onClick={() => onUpdateSettings({ textSize: 'large' })}
                className={`min-h-[44px] px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                  settings.textSize === 'large'
                    ? 'bg-amber-500 text-white'
                    : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700'
                }`}
                title="Large text size"
              >
                Large
              </button>
              <button
                id="font-size-extra-large"
                type="button"
                onClick={() => onUpdateSettings({ textSize: 'extra-large' })}
                className={`min-h-[44px] px-3 py-1.5 rounded-lg text-base font-extrabold transition-colors ${
                  settings.textSize === 'extra-large'
                    ? 'bg-amber-500 text-white'
                    : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700'
                }`}
                title="Extra large text size"
              >
                Extra Large
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              id="dark-mode-toggle"
              type="button"
              onClick={() => onUpdateSettings({ darkMode: !settings.darkMode })}
              className={`min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                settings.darkMode
                  ? 'bg-stone-900 text-amber-300 border-amber-500'
                  : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200'
              }`}
              title="Toggle Dark Mode"
            >
              {settings.darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              <span>{settings.darkMode ? 'Light' : 'Dark'}</span>
            </button>

            {/* High Contrast Mode Toggle */}
            <button
              id="contrast-mode-toggle"
              type="button"
              onClick={() => onUpdateSettings({ highContrast: !settings.highContrast })}
              className={`min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                settings.highContrast
                  ? 'bg-black text-amber-300 border-amber-400 ring-2 ring-amber-400'
                  : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200'
              }`}
              title="Toggle High Contrast Mode"
            >
              <span>{settings.highContrast ? '⚡ High Contrast (ON)' : 'High Contrast'}</span>
            </button>

            {/* English / Hindi Quick Toggle */}
            <div className="flex items-center space-x-1 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-1">
              <button
                id="lang-en-btn"
                type="button"
                onClick={() => toggleLanguage('en')}
                className={`min-h-[44px] px-3 py-1 rounded-lg text-xs font-bold ${
                  settings.language === 'en'
                    ? 'bg-amber-600 text-white'
                    : 'text-stone-700 dark:text-stone-300'
                }`}
              >
                English
              </button>
              <button
                id="lang-hi-btn"
                type="button"
                onClick={() => toggleLanguage('hi')}
                className={`min-h-[44px] px-3 py-1 rounded-lg text-xs font-bold ${
                  settings.language === 'hi'
                    ? 'bg-amber-600 text-white'
                    : 'text-stone-700 dark:text-stone-300'
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand */}
        <button
          id="brand-home-link"
          type="button"
          onClick={() => onSelectTab('home')}
          className="flex items-center space-x-3 text-left focus:outline-none group"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <span className="text-2xl font-bold font-serif">सा</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-stone-900 font-heading">
                Saarthi
              </h1>
              <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                सारथी
              </span>
            </div>
            <p className="text-xs text-stone-500 hidden sm:block">
              Daily Companion & Guide for Seniors in India
            </p>
          </div>
        </button>

        {/* Emergency SOS Button */}
        <button
          id="nav-sos-button"
          type="button"
          onClick={onOpenSOS}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-rose-600/30 active:scale-95 transition-all animate-pulse"
          title="Open Emergency SOS Help numbers"
        >
          <PhoneCall className="w-5 h-5 fill-current" />
          <span>Emergency SOS / सहायता</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <nav className="border-t border-stone-200 overflow-x-auto scrollbar-none bg-stone-50/70">
        <div className="max-w-7xl mx-auto px-4 flex items-center space-x-1 sm:space-x-2 py-1.5 min-w-max">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-btn-${item.id}`}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-stone-700 hover:bg-stone-200/70 hover:text-stone-900'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
