import React from 'react';
import {
  Landmark,
  Smartphone,
  Sun,
  Settings,
  Heart,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';

interface MoreMenuProps {
  onNavigate: (tab: string) => void;
  onOpenSettings: () => void;
}

export const MoreMenu: React.FC<MoreMenuProps> = ({ onNavigate, onOpenSettings }) => {
  const { settings } = useApp();
  const lang = settings.language;

  const moreItems = [
    {
      id: 'plan',
      title: t('planDayTitle', lang),
      desc: lang === 'hi' ? 'दवाइयों और रिमाइंडर को मिलाकर आज की शांतिपूर्ण दिनचर्या बनाएं।' : 'Automatically merge today’s medicines and reminders into a calm routine.',
      icon: <Sun className="w-7 h-7 text-amber-600 dark:text-amber-400" />,
      tag: lang === 'hi' ? 'दैनिक योजना' : 'Routine',
    },
    {
      id: 'schemes',
      title: t('seniorSchemes', lang),
      desc: lang === 'hi' ? 'वरिष्ठ नागरिक बचत योजना, आयुष्मान भारत, पीएम वय वंदना एवं रेल लाभ।' : 'SCSS, Ayushman Bharat, PMVVY, and senior government welfare programs.',
      icon: <Landmark className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />,
      tag: lang === 'hi' ? 'सरकारी लाभ' : 'Welfare',
    },
    {
      id: 'guides',
      title: t('digitalGuides', lang),
      desc: lang === 'hi' ? 'फोनपे से बिजली बिल, व्हाट्सएप वीडियो कॉल, और जीवन प्रमाण पत्र के सरल चरण।' : 'Step-by-step simple guides for PhonePe electricity bill, WhatsApp, Jeevan Pramaan.',
      icon: <Smartphone className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />,
      tag: lang === 'hi' ? 'कदम-दर-कदम' : 'Tutorials',
    },
  ];

  return (
    <div id="more-menu-section" className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 font-heading">
          {t('moreTab', lang)}
        </h1>
        <p className="text-stone-700 dark:text-stone-300 text-base leading-relaxed">
          {lang === 'hi'
            ? 'वरिष्ठ नागरिक योजनाएं, डिजिटल गाइड, दिनचर्या और ऐप सेटिंग्स।'
            : 'Explore senior citizen government schemes, step-by-step tech guides, day planner, and settings.'}
        </p>
      </div>

      {/* Grid of More options */}
      <div className="grid sm:grid-cols-2 gap-4">
        {moreItems.map((item) => (
          <div
            key={item.id}
            id={`more-item-${item.id}`}
            onClick={() => onNavigate(item.id)}
            className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-600 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group active:scale-98"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-800 group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                  {item.tag}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors font-heading">
                  {item.title}
                </h2>
                <p className="text-stone-600 dark:text-stone-400 text-sm mt-1 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>

            <div className="flex items-center text-xs font-bold text-amber-700 dark:text-amber-400 pt-2 border-t border-stone-100 dark:border-stone-800">
              <span>{lang === 'hi' ? 'खोलें' : 'Open'}</span>
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}

        {/* Settings Card */}
        <div
          id="more-item-settings"
          onClick={onOpenSettings}
          className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-600 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group active:scale-98"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-800 group-hover:scale-105 transition-transform">
                <Settings className="w-7 h-7 text-stone-700 dark:text-stone-300" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                {lang === 'hi' ? 'सेटिंग्स' : 'Settings'}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors font-heading">
                {t('settingsTitle', lang)}
              </h2>
              <p className="text-stone-600 dark:text-stone-400 text-sm mt-1 leading-relaxed">
                {lang === 'hi'
                  ? 'भाषा, अक्षर का आकार, आवाज़ की गति, डार्क मोड और व्यक्तिगत नाम बदलें।'
                  : 'Customize language, text size, voice speed, dark mode, and your name.'}
              </p>
            </div>
          </div>

          <div className="flex items-center text-xs font-bold text-amber-700 dark:text-amber-400 pt-2 border-t border-stone-100 dark:border-stone-800">
            <span>{t('settingsTitle', lang)}</span>
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
