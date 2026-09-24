import { DesignTemplate, DesignTemplateId } from '../types';

export interface ThemeConfig {
  id: DesignTemplateId;
  name: string;
  description: string;
  primary: string; // Tailwind class fallback e.g. bg-amber-600
  primaryHover: string;
  primaryHex: string;
  primaryHoverHex: string;
  primaryLightHex: string; // Halvány háttér (10-15% átlátszóság)
  primaryBorderHex: string;
  primaryTextHex: string; // Kiemelő szöveg
  primaryBadgeBg: string;
  primaryBadgeText: string;
  gradientHeader: string;
  tagColor: string;
}

export const THEME_TEMPLATES: Record<DesignTemplateId, ThemeConfig> = {
  'amber-classic': {
    id: 'amber-classic',
    name: 'Klasszikus Autósiskola (Borostyán & Arany)',
    description: 'Meleg, dinamikus borostyán-arany stílus a megszokott KRESZ és autósiskolai hangulatban.',
    primary: 'bg-amber-600',
    primaryHover: 'hover:bg-amber-700',
    primaryHex: '#d97706',
    primaryHoverHex: '#b45309',
    primaryLightHex: 'rgba(217, 119, 6, 0.12)',
    primaryBorderHex: '#f59e0b',
    primaryTextHex: '#d97706',
    primaryBadgeBg: '#fef3c7',
    primaryBadgeText: '#92400e',
    gradientHeader: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    tagColor: '#d97706',
  },
  'emerald-modern': {
    id: 'emerald-modern',
    name: 'Öko & Elektromos Flotta (Smaragdzöld)',
    description: 'Modern, környezetbarát zöld dizájn, ideális EV és hibrid oktatóflották számára.',
    primary: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    primaryHex: '#059669',
    primaryHoverHex: '#047857',
    primaryLightHex: 'rgba(5, 150, 105, 0.12)',
    primaryBorderHex: '#10b981',
    primaryTextHex: '#059669',
    primaryBadgeBg: '#d1fae5',
    primaryBadgeText: '#065f46',
    gradientHeader: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
    tagColor: '#059669',
  },
  'blue-corporate': {
    id: 'blue-corporate',
    name: 'Hivatalos Üzleti (Mélykék & Zafír)',
    description: 'Megbízható, precíz adminisztratív és hatósági arculat a tiszta irodai munkához.',
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    primaryHex: '#2563eb',
    primaryHoverHex: '#1d4ed8',
    primaryLightHex: 'rgba(37, 99, 235, 0.12)',
    primaryBorderHex: '#3b82f6',
    primaryTextHex: '#2563eb',
    primaryBadgeBg: '#dbeafe',
    primaryBadgeText: '#1e40af',
    gradientHeader: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
    tagColor: '#2563eb',
  },
  'violet-executive': {
    id: 'violet-executive',
    name: 'Prémium Akadémia (Ibolya & Indigo)',
    description: 'Exkluzív prémium oktatóközpont dizájn, elegáns lila és sötét indigó tónusokkal.',
    primary: 'bg-violet-600',
    primaryHover: 'hover:bg-violet-700',
    primaryHex: '#7c3aed',
    primaryHoverHex: '#6d28d9',
    primaryLightHex: 'rgba(124, 58, 237, 0.12)',
    primaryBorderHex: '#8b5cf6',
    primaryTextHex: '#7c3aed',
    primaryBadgeBg: '#ede9fe',
    primaryBadgeText: '#5b21b6',
    gradientHeader: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
    tagColor: '#7c3aed',
  },
  'slate-minimal': {
    id: 'slate-minimal',
    name: 'Minimalista Sötétszürke (Grafit & Titán)',
    description: 'Visszafogott, magas kontrasztú ipari stílus szürke és titán elemekkel.',
    primary: 'bg-slate-700',
    primaryHover: 'hover:bg-slate-800',
    primaryHex: '#475569',
    primaryHoverHex: '#334155',
    primaryLightHex: 'rgba(71, 85, 105, 0.14)',
    primaryBorderHex: '#64748b',
    primaryTextHex: '#475569',
    primaryBadgeBg: '#f1f5f9',
    primaryBadgeText: '#1e293b',
    gradientHeader: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
    tagColor: '#475569',
  },
  'crimson-speed': {
    id: 'crimson-speed',
    name: 'Sport & Dinamika (Karmazsinvörös)',
    description: 'Sportos, energikus piros arculat, figyelemfelkeltő határidőkkel és kiemelésekkel.',
    primary: 'bg-rose-600',
    primaryHover: 'hover:bg-rose-700',
    primaryHex: '#e11d48',
    primaryHoverHex: '#be123c',
    primaryLightHex: 'rgba(225, 29, 72, 0.12)',
    primaryBorderHex: '#f43f5e',
    primaryTextHex: '#e11d48',
    primaryBadgeBg: '#ffe4e6',
    primaryBadgeText: '#9f1239',
    gradientHeader: 'linear-gradient(135deg, #e11d48 0%, #dc2626 100%)',
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

/**
 * Alkalmazza a kiválasztott témát a teljes webalkalmazás gyökérelemére (CSS Custom Properties).
 */
export function applyThemeToDom(themeId: DesignTemplateId) {
  const theme = THEME_TEMPLATES[themeId] || THEME_TEMPLATES['amber-classic'];
  const root = document.documentElement;
  
  root.style.setProperty('--theme-primary', theme.primaryHex);
  root.style.setProperty('--theme-primary-hover', theme.primaryHoverHex);
  root.style.setProperty('--theme-primary-light', theme.primaryLightHex);
  root.style.setProperty('--theme-primary-border', theme.primaryBorderHex);
  root.style.setProperty('--theme-primary-text', theme.primaryTextHex);
  root.style.setProperty('--theme-gradient-header', theme.gradientHeader);
  root.style.setProperty('--theme-tag-color', theme.tagColor);
  root.style.setProperty('--theme-shadow', `${theme.primaryHex}33`);
  root.style.setProperty('--theme-ring', `${theme.primaryHex}55`);

  root.setAttribute('data-theme', themeId);
}
