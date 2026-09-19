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
    { id: 'simplify', label: 'Bills & Letters / बिल समझें', icon: '📄' },
    { id: 'scam', label: 'Scam Shield / सुरक्षा गार्ड', icon: '🛡️' },
    { id: 'medicine', label: 'Medicines / दवाई साथी', icon: '💊' },
    { id: 'schemes', label: 'Senior Schemes / योजनाएं', icon: '🏛️' },
    { id: 'guides', label: 'Digital Guides / आसान तकनीक', icon: '📱' },
    { id: 'chat', label: 'Talk to Saarthi / बात करें', icon: '🎙️' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm transition-colors">
      {/* Top Accessibility Bar */}
      <div className="bg-stone-100 border-b border-stone-200 px-4 py-1.5 text-xs text-stone-700">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Tagline */}
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-medium text-stone-800">
              सारथी • Senior Citizen Friendly Companion
            </span>
          </div>

          {/* Quick Accessibility Controls */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-4">
            {/* Font Size Selector */}
            <div className="flex items-center space-x-1 bg-white border border-stone-300 rounded-lg p-0.5">
              <span className="text-[11px] font-semibold text-stone-600 px-1">Text:</span>
              <button
                id="font-size-normal"
                type="button"
                onClick={() => onUpdateSettings({ textSize: 'normal' })}
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  settings.textSize === 'normal'
                    ? 'bg-amber-500 text-white'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
                title="Normal text size"
              >
                A-
              </button>
              <button
                id="font-size-large"
                type="button"
                onClick={() => onUpdateSettings({ textSize: 'large' })}
                className={`px-2 py-0.5 rounded text-sm font-bold ${
                  settings.textSize === 'large'
                    ? 'bg-amber-500 text-white'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
                title="Large text size"
              >
                A
              </button>
              <button
                id="font-size-extra-large"
                type="button"
                onClick={() => onUpdateSettings({ textSize: 'extra-large' })}
                className={`px-2 py-0.5 rounded text-base font-extrabold ${
                  settings.textSize === 'extra-large'
                    ? 'bg-amber-500 text-white'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
                title="Extra large text size for easier reading"
              >
                A+
              </button>
            </div>

            {/* Speech Rate Switcher */}
            <button
              id="speech-speed-toggle"
              type="button"
              onClick={() =>
                onUpdateSettings({
                  speechRate: settings.speechRate === 0.85 ? 1.0 : 0.85,
                })
              }
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${
                settings.speechRate === 0.85
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-white border-stone-300 text-stone-700'
              }`}
              title="Toggle slow clear speech"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-700" />
              <span>Voice: {settings.speechRate === 0.85 ? 'Slow (0.85x)' : 'Normal (1.0x)'}</span>
            </button>

            {/* High Contrast Mode Toggle */}
            <button
              id="contrast-mode-toggle"
              type="button"
              onClick={() => onUpdateSettings({ highContrast: !settings.highContrast })}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${
                settings.highContrast
                  ? 'bg-slate-900 text-amber-300 border-slate-700'
                  : 'bg-white border-stone-300 text-stone-700'
              }`}
              title="Toggle High Contrast Dark Mode"
            >
              {settings.highContrast ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{settings.highContrast ? 'Normal View' : 'High Contrast'}</span>
            </button>

            {/* Language Selector */}
            <div className="flex items-center space-x-1">
              <Languages className="w-3.5 h-3.5 text-stone-500" />
              <select
                id="language-select"
                value={settings.language}
                onChange={(e) => onUpdateSettings({ language: e.target.value as Language })}
                aria-label="Select preferred language"
                className="bg-white border border-stone-300 text-xs font-medium rounded-lg px-2 py-0.5 text-stone-800 focus:ring-1 focus:ring-amber-500"
              >
                {Object.entries(languageLabels).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
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
