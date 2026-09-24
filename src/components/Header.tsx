import React, { useState } from 'react';
import {
  Car,
  Clock,
  Users,
  Fuel,
  LayoutDashboard,
  Moon,
  Sun,
  ShieldCheck,
  Save,
  Printer,
  Bell,
  HelpCircle,
  Database,
  FileSignature,
  Building2,
  Palette,
  LogOut,
  UserCheck,
  Shield,
  Menu,
  X,
  ChevronDown,
  Pencil,
  Image as ImageIcon,
  Bike,
  Truck,
  GraduationCap,
  Award,
  Compass,
  Zap,
  Gauge,
} from 'lucide-react';
import { DatabaseState, AppUser, DesignTemplateId } from '../types';
import { THEME_TEMPLATES } from '../services/themeService';

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
  onOpenThemeModal?: () => void;
  onOpenLogoModal?: () => void;
  onPrintSchedule: () => void;
  onRequestNotifications: () => void;
  notificationsEnabled: boolean;
  urgentCount: number;
  currentUser: AppUser | null;
  onLogout: () => void;
  currentTheme: DesignTemplateId;
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
  onOpenThemeModal,
  onOpenLogoModal,
  onPrintSchedule,
  onRequestNotifications,
  notificationsEnabled,
  urgentCount,
  currentUser,
  onLogout,
  currentTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const themeConfig = THEME_TEMPLATES[currentTheme] || THEME_TEMPLATES['amber-classic'];

  const perms = currentUser?.permissions;
  const isAdmin = currentUser?.role === 'admin';

  // Dinamikus logó renderelése (saját feltöltött kép vagy választott szimbólum)
  const renderHeaderLogo = () => {
    const appLogo = dbState.appLogo;
    if (appLogo?.type === 'image' && appLogo?.imageUrl) {
      return (
        <img
          src={appLogo.imageUrl}
          alt="AutoSuli Logó"
          className="w-full h-full object-contain p-0.5 rounded-lg"
        />
      );
    }

    const iconName = appLogo?.iconName || 'car';
    switch (iconName) {
      case 'bike':
        return <Bike className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />;
      case 'truck':
        return <Truck className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />;
      case 'graduation-cap':
        return <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />;
      case 'shield':
        return <Shield className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />;
      case 'award':
        return <Award className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />;
      case 'compass':
        return <Compass className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />;
      case 'zap':
        return <Zap className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />;
      case 'gauge':
        return <Gauge className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />;
      case 'building':
        return <Building2 className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />;
      case 'car':
      default:
        return <Car className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />;
    }
  };

  // Dinamikus fülek a felhasználó jogosultságai alapján
  const allTabs = [
    { id: 'dashboard', label: 'Áttekintés', icon: LayoutDashboard, shortcut: 'Alt+1', allowed: true },
    {
      id: 'registration',
      label: 'Tanfolyam Regisztráció',
      icon: FileSignature,
      shortcut: 'Alt+2',
      allowed: perms ? perms.canRegisterCourses : true,
    },
    {
      id: 'vehicles',
      label: 'Gépjárművek & Flotta',
      icon: Car,
      shortcut: 'Alt+3',
      allowed: perms ? perms.canCheckoutVehicles || perms.canEditVehicles : true,
    },
    {
      id: 'schedule',
      label: 'Órarend & Ütközések',
      icon: Clock,
      shortcut: 'Alt+4',
      allowed: perms ? perms.canManageLessons : true,
    },
    {
      id: 'people',
      label: 'Oktatók & Tanulók',
      icon: Users,
      shortcut: 'Alt+5',
      allowed: perms ? perms.canManageStudents || perms.canManageInstructors : true,
    },
    {
      id: 'fuel',
      label: 'Tankolások & Fogyasztás',
      icon: Fuel,
      shortcut: 'Alt+6',
      allowed: perms ? perms.canManageFuel : true,
    },
    {
      id: 'users',
      label: 'Felhasználók & Audit',
      icon: Shield,
      shortcut: 'Alt+7',
      allowed: isAdmin || (perms ? perms.canManageUsers || perms.canViewAuditLogs : false),
    },
  ];

  const visibleTabs = allTabs.filter((t) => t.allowed);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200 no-print">
      {/* Felső információs sáv */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60">
        {/* Bal oldal: Logó & Cím */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
          <button
            type="button"
            onClick={onOpenLogoModal}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr ${themeConfig.gradientHeader} flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0 relative group cursor-pointer transition-transform hover:scale-105`}
            title="App logó testreszabása / cseréje (Kattintson ide a módosításhoz)"
          >
            {renderHeaderLogo()}
            <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Pencil className="w-3.5 h-3.5 text-white drop-shadow-sm" />
            </div>
          </button>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">
                AutoSuli Flotta & Admin
              </h1>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                v2.6 RBAC
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate hidden xs:block">
              {dbState.schoolCompany.schoolName}
            </p>
          </div>
        </div>

        {/* Jobb oldal: Felhasználó, Témaváltó, Eszközök */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          {/* Bejelentkezett Felhasználó Profil Doboz */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-all text-xs"
                title="Bejelentkezett profil"
              >
                <div
                  className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${currentUser.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0`}
                >
                  {currentUser.username.slice(0, 1).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[120px]">
                    {currentUser.fullName.split(' ')[0]}
                  </div>
                  <span
                    className={`text-[9px] font-extrabold uppercase px-1 py-0.2 rounded ${
                      currentUser.role === 'admin'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                    }`}
                  >
                    {currentUser.role === 'admin' ? 'Admin' : 'Ügyvitel'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Felhasználói lenyíló menü */}
              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 text-xs animate-in fade-in zoom-in-95">
                    <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {currentUser.fullName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">
                        @{currentUser.username} • {currentUser.email}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setActiveTab('users');
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-2 text-slate-700 dark:text-slate-300"
                    >
                      <Shield className="w-4 h-4 text-amber-500" />
                      <span>Felhasználók & Jogosultságok</span>
                    </button>

                    {onOpenLogoModal && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenLogoModal();
                        }}
                        className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-2 text-slate-700 dark:text-slate-300"
                      >
                        <ImageIcon className="w-4 h-4 text-amber-500" />
                        <span>App Logó Cseréje</span>
                      </button>
                    )}

                    {onOpenThemeModal && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenThemeModal();
                        }}
                        className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-2 text-slate-700 dark:text-slate-300"
                      >
                        <Palette className="w-4 h-4 text-purple-500" />
                        <span>Dizájn Sablon Váltása</span>
                      </button>
                    )}

                    <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center space-x-2 text-red-600 dark:text-red-400 font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Kijelentkezés</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* App Logó Testreszabás gomb */}
          {onOpenLogoModal && (
            <button
              onClick={onOpenLogoModal}
              className="p-1.5 sm:px-2 sm:py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center space-x-1 transition-colors cursor-pointer"
              title="Alkalmazás logó és embléma testreszabása"
            >
              <ImageIcon className="w-4 h-4 text-amber-500" />
              <span className="hidden md:inline text-xs font-medium">Logó</span>
            </button>
          )}

          {/* Dizájn Sablon gomb */}
          {onOpenThemeModal && (
            <button
              onClick={onOpenThemeModal}
              className="p-1.5 sm:px-2 sm:py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center space-x-1 transition-colors"
              title="Dizájn sablon és színtéma váltása"
            >
              <Palette className="w-4 h-4 text-purple-500" />
              <span className="hidden md:inline text-xs font-medium">Sablonok</span>
            </button>
          )}

          {/* Automatikus mentés állapot */}
          <div
            className="hidden lg:flex items-center space-x-1 text-xs text-slate-600 dark:text-slate-400 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800"
            title="Minden módosítás automatikusan mentésre kerül a helyi adatbázisba"
          >
            <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin text-amber-500' : 'text-emerald-500'}`} />
            <span>{isSaving ? 'Mentés...' : 'Auto-mentve'}</span>
          </div>

          {/* Értesítések gomb & számláló */}
          <button
            onClick={onRequestNotifications}
            className={`relative p-1.5 rounded-xl border transition-colors ${
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

          {/* Sötét / Világos mód */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={darkMode ? 'Váltás világos módra' : 'Váltás sötét módra'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Mobil Menü Gomb */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Navigációs menü"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Navigációs fülek sávja (Desktop & Tablet) */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-1.5 overflow-x-auto py-2 no-scrollbar">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? `${themeConfig.primary} text-white shadow-sm shadow-amber-500/20`
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`hidden xl:inline text-[9px] px-1 py-0.2 rounded font-mono ${
                    isActive ? 'bg-black/20 text-white' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.shortcut}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobil Lenyíló Menü (Okostelefon optimalizáció) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 space-y-1 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
            Navigációs Menü
          </div>
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? `${themeConfig.primary} text-white font-bold`
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
                <span className="text-[10px] font-mono opacity-60">{tab.shortcut}</span>
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-2 text-xs">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCompanyModal?.();
              }}
              className="text-slate-600 dark:text-slate-400 hover:text-amber-500 font-medium py-1"
            >
              Cégadatok
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDbModal();
              }}
              className="text-slate-600 dark:text-slate-400 hover:text-amber-500 font-medium py-1"
            >
              Adatbázis & Mentések
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="text-red-500 font-semibold py-1"
            >
              Kijelentkezés
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
