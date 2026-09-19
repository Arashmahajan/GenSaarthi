import React from 'react';
import {
  ShieldAlert,
  Sparkles,
  MessageSquare,
  FileText,
  Heart,
  Settings,
  Menu,
  Languages,
  PhoneCall,
  Pill,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSOS: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenSOS,
  onOpenSettings,
}) => {
  const { settings, updateSettings } = useApp();
  const lang = settings.language;

  // 5 Core navigation items (Requirement 8)
  const navItems = [
    {
      id: 'home',
      hash: '#home',
      label: t('homeTab', lang),
      icon: '🏠',
    },
    {
      id: 'chat',
      hash: '#ask',
      label: t('askTab', lang),
      icon: '🎙️',
    },
    {
      id: 'check',
      hash: '#check',
      label: t('checkTab', lang),
      icon: '🛡️',
    },
    {
      id: 'reminders_and_medicines',
      hash: '#reminders',
      label: t('remindersMedicinesTab', lang),
      icon: '💊',
    },
    {
      id: 'help',
      hash: '#help',
      label: t('emergencyTab', lang),
      icon: '🚨',
    },
  ];

  const isMoreActive = ['more', 'schemes', 'guides', 'plan'].includes(activeTab);

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'hi' : 'en';
    updateSettings({ language: nextLang });
    if (typeof document !== 'undefined') {
      document.documentElement.lang = nextLang;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 shadow-xs transition-colors">
      {/* Top Utility Bar */}
      <div className="bg-stone-100 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 px-4 py-1.5 text-xs text-stone-700 dark:text-stone-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Logo & Tagline */}
          <div
            onClick={() => onSelectTab('home')}
            className="flex items-center space-x-2 cursor-pointer group"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-extrabold text-stone-900 dark:text-stone-100 text-sm font-heading tracking-tight">
              सारथी • Saarthi
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 text-[11px] font-bold border border-amber-300 dark:border-amber-800">
              {lang === 'hi' ? 'बुजुर्गों का डिजिटल साथी' : 'Senior AI Companion'}
            </span>
          </div>

          {/* Quick Language & Settings actions */}
          <div className="flex items-center space-x-2">
            {/* Direct Language Switcher (Requirement 8: English / Hindi toggle) */}
            <button
              id="nav-lang-toggle"
              type="button"
              onClick={toggleLanguage}
              className="min-h-[44px] px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 text-xs font-bold flex items-center space-x-1.5 transition-colors focus:ring-2 focus:ring-amber-400"
              title="Change Language / भाषा बदलें"
              aria-label="Change Language / भाषा बदलें"
            >
              <Languages className="w-4 h-4 text-amber-600" />
              <span>{lang === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}</span>
            </button>

            {/* Settings Dialog Button */}
            <button
              id="nav-settings-btn"
              type="button"
              onClick={onOpenSettings}
              className="min-h-[44px] min-w-[44px] p-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 flex items-center justify-center transition-colors focus:ring-2 focus:ring-amber-400"
              title={t('settingsTitle', lang)}
              aria-label={t('settingsTitle', lang)}
            >
              <Settings className="w-4 h-4 text-stone-700 dark:text-stone-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Main 5-Item Navigation Bar (Requirement 8) */}
      <nav
        aria-label="Main Navigation"
        className="max-w-7xl mx-auto px-2 sm:px-4 py-2 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none"
      >
        <div className="flex items-center space-x-1 sm:space-x-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                id={`nav-item-${item.id}`}
                href={item.hash}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectTab(item.id);
                }}
                className={`min-h-[48px] px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 sm:space-x-2 transition-all shrink-0 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-xs font-extrabold'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-amber-50 dark:hover:bg-stone-800 border border-transparent hover:border-stone-200 dark:hover:border-stone-700'
                }`}
              >
                <span className="text-base sm:text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            );
          })}

          {/* More Menu Item (Requirement 8: Schemes, Guides, Plan, Settings) */}
          <a
            id="nav-item-more"
            href="#more"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab('more');
            }}
            className={`min-h-[48px] px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 sm:space-x-2 transition-all shrink-0 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-amber-500 ${
              isMoreActive
                ? 'bg-amber-600 text-white shadow-xs font-extrabold'
                : 'text-stone-700 dark:text-stone-300 hover:bg-amber-50 dark:hover:bg-stone-800 border border-transparent hover:border-stone-200 dark:hover:border-stone-700'
            }`}
          >
            <Menu className="w-4 h-4" />
            <span>{t('moreTab', lang)}</span>
          </a>
        </div>

        {/* Persistent Floating SOS quick trigger */}
        <button
          id="nav-sos-quick-btn"
          type="button"
          onClick={onOpenSOS}
          className="min-h-[48px] px-3.5 sm:px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm flex items-center space-x-1.5 shrink-0 shadow-xs transition-colors focus:ring-2 focus:ring-rose-400"
          title="Emergency 1930 / 112 / Helpline"
          aria-label="Emergency Helplines"
        >
          <PhoneCall className="w-4 h-4 animate-pulse" />
          <span className="hidden md:inline">1930 / 112</span>
          <span>SOS</span>
        </button>
      </nav>
    </header>
  );
};
