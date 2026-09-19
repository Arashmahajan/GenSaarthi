import { en, TranslationKey } from './en';
import { hi } from './hi';
import { Language } from '../types';

export type { TranslationKey };

export function t(key: TranslationKey, language: Language = 'en', params?: Record<string, string | number>): string {
  const dictionary = language === 'hi' ? hi : en;
  let text = dictionary[key] || en[key] || (key as string);

  if (params) {
    Object.entries(params).forEach(([paramKey, val]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
    });
  }

  return text;
}
