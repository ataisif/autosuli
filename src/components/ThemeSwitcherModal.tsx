import React from 'react';
import { Palette, Check, Sparkles, X, Sun, Moon } from 'lucide-react';
import { DesignTemplateId } from '../types';
import { THEME_LIST, THEME_TEMPLATES } from '../services/themeService';

interface ThemeSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: DesignTemplateId;
  onSelectTheme: (themeId: DesignTemplateId) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const ThemeSwitcherModal: React.FC<ThemeSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  darkMode,
  onToggleDarkMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Fejléc */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Dizájn Sablonok & Téma Testreszabás
              </h3>
              <p className="text-[11px] text-slate-500">
                Válasszon az előre megtervezett vizuális sablonok közül
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tartalom */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Sötét / Világos Mód váltó */}
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {darkMode ? (
                <Moon className="w-5 h-5 text-indigo-400" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  {darkMode ? 'Sötét (Dark) Üzemmód' : 'Világos (Light) Üzemmód'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {darkMode ? 'Kíméli a szemet éjszakai vagy gyenge fényben' : 'Optimális nappali irodai munkavégzéshez'}
                </span>
              </div>
            </div>
            <button
              onClick={onToggleDarkMode}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-xs border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            >
              Váltás: {darkMode ? 'Világosra' : 'Sötétre'}
            </button>
          </div>

          {/* Sablon lista kártyák */}
          <div className="space-y-2.5">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">
              Választható Szín- és Arculati Sablonok:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {THEME_LIST.map((theme) => {
                const isSelected = currentTheme === theme.id;
                const template = THEME_TEMPLATES[theme.id];

                return (
                  <button
                    key={theme.id}
                    onClick={() => onSelectTheme(theme.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Színminta sáv */}
                      <div className={`h-2.5 rounded-full bg-gradient-to-r ${theme.previewBg} mb-3`} />

                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {theme.name}
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {theme.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-mono">
                        {theme.primaryColor}
                      </span>
                      {isSelected ? (
                        <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Aktív sablon</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                          Kiválasztás
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lábléc */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-xs"
          >
            Kész
          </button>
        </div>
      </div>
    </div>
  );
};
