import React from 'react';
import {
  Car,
  Calendar,
  Clock,
  Users,
  Fuel,
  LayoutDashboard,
  Moon,
  Sun,
  ShieldCheck,
  ShieldAlert,
  Save,
  Printer,
  Bell,
  HelpCircle,
  Database,
  WifiOff,
  FileSpreadsheet,
  FileSignature,
  Building2,
} from 'lucide-react';
import { DatabaseState } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dbState: DatabaseState;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  isSaving: boolean;
  onOpenDbModal: () => void;
  onOpenShortcutsModal: () => void;
  onOpenEmailModal: () => void;
  onOpenCompanyModal?: () => void;
  onPrintSchedule: () => void;
  onRequestNotifications: () => void;
  notificationsEnabled: boolean;
  urgentCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  dbState,
  darkMode,
  setDarkMode,
  isSaving,
  onOpenDbModal,
  onOpenShortcutsModal,
  onOpenEmailModal,
  onOpenCompanyModal,
  onPrintSchedule,
  onRequestNotifications,
  notificationsEnabled,
  urgentCount,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Áttekintés', icon: LayoutDashboard, shortcut: 'Alt+1' },
    { id: 'registration', label: 'Tanfolyam Regisztráció', icon: FileSignature, shortcut: 'Alt+2' },
    { id: 'vehicles', label: 'Gépjárművek & Flotta', icon: Car, shortcut: 'Alt+3' },
    { id: 'schedule', label: 'Órarend & Ütközések', icon: Clock, shortcut: 'Alt+4' },
    { id: 'people', label: 'Oktatók & Tanulók', icon: Users, shortcut: 'Alt+5' },
    { id: 'fuel', label: 'Tankolások & Fogyasztás', icon: Fuel, shortcut: 'Alt+6' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200 no-print">
      {/* Felső információs sáv */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <Car className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                AutoSuli Flotta & Admin
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                Desktop App (Win / Linux)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gépjárművezető oktató iskola flottakezelő és adminisztráció
            </p>
          </div>
        </div>

        {/* Állapotjelzők és eszközök */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Offline / Lokális működés jelző */}
          <div
            title="Lokális beépített adatbázis: Az alkalmazás internet nélkül, offline is megbízhatóan működik."
            className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Offline készenlét</span>
          </div>

          {/* Automatikus mentés állapot */}
          <div
            className="flex items-center space-x-1 text-xs text-slate-600 dark:text-slate-400 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800"
            title="Minden módosítás automatikusan mentésre kerül a helyi adatbázisba"
          >
            <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin text-amber-500' : 'text-emerald-500'}`} />
            <span className="hidden sm:inline">{isSaving ? 'Mentés...' : 'Auto-mentve'}</span>
          </div>

          {/* Titkosítás állapot gomb */}
          <button
            onClick={onOpenDbModal}
            className={`flex items-center space-x-1 text-xs px-2 py-1 rounded border transition-colors ${
              dbState.isEncrypted
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300'
                : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 hover:bg-slate-100'
            }`}
            title="Adatbázis titkosítás és biztonsági mentések"
          >
            {dbState.isEncrypted ? (
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Database className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {dbState.isEncrypted ? 'AES-GCM Titkosítva' : 'Adatbázis / Excel'}
            </span>
          </button>

          {/* Cégadatok szerkesztő gomb */}
          {onOpenCompanyModal && (
            <button
              onClick={onOpenCompanyModal}
              className="flex items-center space-x-1 text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Képző szerv és cégadatok módosítása a szerződésekhez"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden lg:inline">Cégadatok</span>
            </button>
          )}

          {/* Értesítések gomb & számláló */}
          <button
            onClick={onRequestNotifications}
            className={`relative p-1.5 rounded-lg border transition-colors ${
              notificationsEnabled
                ? 'text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                : 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30'
            }`}
            title={notificationsEnabled ? 'Asztali értesítések engedélyezve' : 'Asztali értesítések bekapcsolása'}
          >
            <Bell className="w-4 h-4" />
            {urgentCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {urgentCount}
              </span>
            )}
          </button>

          {/* Sötét mód kapcsoló */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={darkMode ? 'Váltás világos módra' : 'Váltás sötét módra'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Nyomtatás / PDF gomb */}
          <button
            onClick={onPrintSchedule}
            className="hidden sm:flex items-center space-x-1 p-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
            title="Nyomtatási nézet és PDF mentés (Ctrl+P)"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Nyomtatás / PDF</span>
          </button>

          {/* Billentyűparancsok gomb */}
          <button
            onClick={onOpenShortcutsModal}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Billentyűparancsok áttekintése (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigációs fülek sávja */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`hidden lg:inline text-[10px] px-1 py-0.2 rounded font-mono ${
                    isActive ? 'bg-amber-600/60 text-amber-100' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.shortcut}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
