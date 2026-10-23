import { ru } from './ru';
import { uk } from './uk';

export type Lang = 'es' | 'ru' | 'uk';

export const LANGUAGES: { code: Lang; label: string; locale: string }[] = [
  { code: 'es', label: 'Español', locale: 'es-ES' },
  { code: 'ru', label: 'Русский', locale: 'ru-RU' },
  { code: 'uk', label: 'Українська', locale: 'uk-UA' }
];

const STORAGE_KEY = 'holamotor_lang';
const dictionaries: Record<Lang, Record<string, string>> = { es: {}, ru, uk };

function detectLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (saved && saved in dictionaries) {
    return saved;
  }
  const browser = (navigator.language || 'es').slice(0, 2).toLowerCase();
  return (browser in dictionaries ? browser : 'es') as Lang;
}

export const currentLang: Lang = detectLang();
export const currentLocale = LANGUAGES.find(l => l.code === currentLang)!.locale;

/** Translates a Spanish source text into the current language (falls back to Spanish). */
export function t(text: string | null | undefined): string {
  if (text === null || text === undefined) {
    return '';
  }
  return dictionaries[currentLang][text] ?? text;
}

/** Saves the language and reloads so every view, pipe and date locale picks it up. */
export function setLang(lang: Lang): void {
  if (lang === currentLang) {
    return;
  }
  localStorage.setItem(STORAGE_KEY, lang);
  location.reload();
}
