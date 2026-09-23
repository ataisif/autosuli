import { DesignTemplate, DesignTemplateId } from '../types';

export interface ThemeConfig {
  id: DesignTemplateId;
  name: string;
  description: string;
  primary: string; // Tailwind color class or hex equivalent
  primaryHover: string;
  primaryBgLight: string;
  primaryBorder: string;
  primaryBadgeBg: string;
  primaryBadgeText: string;
  gradientHeader: string;
  accentRing: string;
  tagColor: string;
}

export const THEME_TEMPLATES: Record<DesignTemplateId, ThemeConfig> = {
  'amber-classic': {
    id: 'amber-classic',
    name: 'Klasszikus Autósiskola (Borostyán & Arany)',
    description: 'Meleg, dinamikus borostyán-arany stílus a megszokott KRESZ és autósiskolai hangulatban.',
    primary: 'bg-amber-600',
    primaryHover: 'hover:bg-amber-500',
    primaryBgLight: 'bg-amber-500/10',
    primaryBorder: 'border-amber-500',
    primaryBadgeBg: 'bg-amber-100 dark:bg-amber-950/60',
    primaryBadgeText: 'text-amber-800 dark:text-amber-300',
    gradientHeader: 'from-amber-500 to-amber-600',
    accentRing: 'focus:ring-amber-500',
    tagColor: '#d97706',
  },
  'emerald-modern': {
    id: 'emerald-modern',
    name: 'Öko & Elektromos Flotta (Smaragdzöld)',
    description: 'Modern, környezetbarát zöld dizájn, ideális EV és hibrid oktatóflották számára.',
    primary: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-500',
    primaryBgLight: 'bg-emerald-500/10',
    primaryBorder: 'border-emerald-500',
    primaryBadgeBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    primaryBadgeText: 'text-emerald-800 dark:text-emerald-300',
    gradientHeader: 'from-emerald-500 to-teal-600',
    accentRing: 'focus:ring-emerald-500',
    tagColor: '#059669',
  },
  'blue-corporate': {
    id: 'blue-corporate',
    name: 'Hivatalos Üzleti (Mélykék & Zafír)',
    description: 'Megbízható, precíz adminisztratív és hatósági arculat a tiszta irodai munkához.',
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-500',
    primaryBgLight: 'bg-blue-500/10',
    primaryBorder: 'border-blue-500',
    primaryBadgeBg: 'bg-blue-100 dark:bg-blue-950/60',
    primaryBadgeText: 'text-blue-800 dark:text-blue-300',
    gradientHeader: 'from-blue-600 to-indigo-600',
    accentRing: 'focus:ring-blue-500',
    tagColor: '#2563eb',
  },
  'violet-executive': {
    id: 'violet-executive',
    name: 'Prémium Akadémia (Ibolya & Indigo)',
    description: 'Exkluzív prémium oktatóközpont dizájn, elegáns lila és sötét indigó tónusokkal.',
    primary: 'bg-violet-600',
    primaryHover: 'hover:bg-violet-500',
    primaryBgLight: 'bg-violet-500/10',
    primaryBorder: 'border-violet-500',
    primaryBadgeBg: 'bg-violet-100 dark:bg-violet-950/60',
    primaryBadgeText: 'text-violet-800 dark:text-violet-300',
    gradientHeader: 'from-violet-600 to-purple-700',
    accentRing: 'focus:ring-violet-500',
    tagColor: '#7c3aed',
  },
  'slate-minimal': {
    id: 'slate-minimal',
    name: 'Minimalista Sötétszürke (Grafit & Titán)',
    description: 'Visszafogott, magas kontrasztú ipari stílus szürke és titán elemekkel.',
    primary: 'bg-slate-800 dark:bg-slate-700',
    primaryHover: 'hover:bg-slate-700 dark:hover:bg-slate-600',
    primaryBgLight: 'bg-slate-500/10',
    primaryBorder: 'border-slate-500',
    primaryBadgeBg: 'bg-slate-200 dark:bg-slate-800',
    primaryBadgeText: 'text-slate-900 dark:text-slate-100',
    gradientHeader: 'from-slate-700 to-slate-900',
    accentRing: 'focus:ring-slate-500',
    tagColor: '#475569',
  },
  'crimson-speed': {
    id: 'crimson-speed',
    name: 'Sport & Dinamika (Karmazsinvörös)',
    description: 'Sportos, energikus piros arculat, figyelemfelkeltő határidőkkel és kiemelésekkel.',
    primary: 'bg-rose-600',
    primaryHover: 'hover:bg-rose-500',
    primaryBgLight: 'bg-rose-500/10',
    primaryBorder: 'border-rose-500',
    primaryBadgeBg: 'bg-rose-100 dark:bg-rose-950/60',
    primaryBadgeText: 'text-rose-800 dark:text-rose-300',
    gradientHeader: 'from-rose-600 to-red-700',
    accentRing: 'focus:ring-rose-500',
    tagColor: '#e11d48',
  },
};

export const THEME_LIST: DesignTemplate[] = [
  {
    id: 'amber-classic',
    name: 'Klasszikus Borostyán',
    description: 'Hagyományos autósiskolai meleg arany-borostyán stílus.',
    primaryColor: '#d97706',
    accentBadge: 'bg-amber-500 text-white',
    previewBg: 'from-amber-400 to-amber-600',
  },
  {
    id: 'emerald-modern',
    name: 'Öko Smaragd',
    description: 'Modern, környezetbarát zöld EV és hibrid arculat.',
    primaryColor: '#059669',
    accentBadge: 'bg-emerald-500 text-white',
    previewBg: 'from-emerald-400 to-teal-600',
  },
  {
    id: 'blue-corporate',
    name: 'Üzleti Zafír',
    description: 'Hivatalos és precíz sötétkék irodai megjelenés.',
    primaryColor: '#2563eb',
    accentBadge: 'bg-blue-600 text-white',
    previewBg: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'violet-executive',
    name: 'Prémium Ibolya',
    description: 'Elegáns akadémiai lila-indigó prémium megjelenés.',
    primaryColor: '#7c3aed',
    accentBadge: 'bg-violet-600 text-white',
    previewBg: 'from-violet-500 to-purple-700',
  },
  {
    id: 'slate-minimal',
    name: 'Titán Minimalista',
    description: 'Visszafogott, ergonomikus sötétszürke és grafit.',
    primaryColor: '#475569',
    accentBadge: 'bg-slate-700 text-white',
    previewBg: 'from-slate-600 to-slate-800',
  },
  {
    id: 'crimson-speed',
    name: 'Sport Karmazsin',
    description: 'Dinamikus, nagy kontrasztú piros sport arculat.',
    primaryColor: '#e11d48',
    accentBadge: 'bg-rose-600 text-white',
    previewBg: 'from-rose-500 to-red-600',
  },
];
