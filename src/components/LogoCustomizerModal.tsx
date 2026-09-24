import React, { useState, useRef } from 'react';
import {
  Car,
  Bike,
  Truck,
  GraduationCap,
  Shield,
  Award,
  Compass,
  Zap,
  Gauge,
  Building,
  Upload,
  Image as ImageIcon,
  Check,
  RotateCcw,
  X,
  Sparkles,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { AppLogoConfig, DesignTemplateId } from '../types';
import { THEME_TEMPLATES } from '../services/themeService';

interface LogoCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogo?: AppLogoConfig;
  onSaveLogo: (logo: AppLogoConfig) => void;
  currentTheme: DesignTemplateId;
  schoolName: string;
}

const PRESET_ICONS = [
  { id: 'car', label: 'Személyautó (B)', icon: Car },
  { id: 'bike', label: 'Motorkerékpár (A)', icon: Bike },
  { id: 'truck', label: 'Tehergépkocsi (C)', icon: Truck },
  { id: 'graduation-cap', label: 'Akadémia & Iskola', icon: GraduationCap },
  { id: 'shield', label: 'Biztonság & Védelem', icon: Shield },
  { id: 'award', label: 'Minősített / Prémium', icon: Award },
  { id: 'compass', label: 'Útirány & Navigáció', icon: Compass },
  { id: 'zap', label: 'Elektromos & Korszerű', icon: Zap },
  { id: 'gauge', label: 'Sebesség & Műszerfal', icon: Gauge },
  { id: 'building', label: 'Oktatóközpont', icon: Building },
];

export const LogoCustomizerModal: React.FC<LogoCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentLogo,
  onSaveLogo,
  currentTheme,
  schoolName,
}) => {
  const [activeMode, setActiveMode] = useState<'icon' | 'image'>(currentLogo?.type || 'icon');
  const [selectedIcon, setSelectedIcon] = useState<string>(currentLogo?.iconName || 'car');
  const [customImageUrl, setCustomImageUrl] = useState<string>(currentLogo?.imageUrl || '');
  const [urlInput, setUrlInput] = useState<string>('');
  const [fileName, setFileName] = useState<string>(currentLogo?.uploadedFileName || '');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const themeConfig = THEME_TEMPLATES[currentTheme] || THEME_TEMPLATES['amber-classic'];

  // Képfájl feltöltése és automatikus átméretezése (max 256x256 WebP/PNG adatbázis-kímélő base64-re)
  const handleFileUpload = (file: File) => {
    setErrorMessage('');
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Csak érvényes képfájlt (PNG, JPG, SVG, WebP) tölthet fel!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('A kép mérete legfeljebb 5 MB lehet.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (file.type === 'image/svg+xml') {
        setCustomImageUrl(result);
        setFileName(file.name);
        setActiveMode('image');
        return;
      }

      // Kép optimalizálás és átméretezés Canvas segítségével
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL('image/png', 0.95);
          setCustomImageUrl(optimizedDataUrl);
          setFileName(file.name);
          setActiveMode('image');
        } else {
          setCustomImageUrl(result);
          setFileName(file.name);
          setActiveMode('image');
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setCustomImageUrl(urlInput.trim());
    setFileName('Webes kép URL');
    setActiveMode('image');
    setUrlInput('');
  };

  const handleResetToDefault = () => {
    setActiveMode('icon');
    setSelectedIcon('car');
    setCustomImageUrl('');
    setFileName('');
    setErrorMessage('');
  };

  const handleSave = () => {
    if (activeMode === 'image') {
      if (!customImageUrl) {
        setErrorMessage('Kérjük, töltsön fel egy képet, vagy válasszon az ikonkészletből!');
        return;
      }
      onSaveLogo({
        type: 'image',
        imageUrl: customImageUrl,
        uploadedFileName: fileName || 'logo.png',
      });
    } else {
      onSaveLogo({
        type: 'icon',
        iconName: selectedIcon,
      });
    }
    onClose();
  };

  // Megjelenítendő ikon a pillanatnyi kiválasztás szerint
  const CurrentIconComponent = PRESET_ICONS.find((i) => i.id === selectedIcon)?.icon || Car;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Fejléc */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl theme-bg-primary text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Alkalmazás Logó Testreszabása
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A fejlécben az "AutoSuli Flotta & Admin" felirat előtt megjelenő embléma
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tartalom */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* ÉLŐ ELŐNÉZET A FEJLÉCBEN */}
          <div className="space-y-1.5">
            <span className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
              Élő Előnézet (ahogy a menüsorban látni fogja):
            </span>
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-inner">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${themeConfig.gradientHeader} flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0 p-1 relative overflow-hidden`}
                >
                  {activeMode === 'image' && customImageUrl ? (
                    <img
                      src={customImageUrl}
                      alt="Logo előnézet"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <CurrentIconComponent className="w-6 h-6 stroke-[2.2]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      AutoSuli Flotta & Admin
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      v2.6 RBAC
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block truncate max-w-xs">
                    {schoolName}
                  </span>
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-400 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {activeMode === 'image' ? 'Egyéni kép' : 'Ikon: ' + selectedIcon}
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center space-x-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Módválasztó fülek */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveMode('image')}
              className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                activeMode === 'image'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Saját Céglogó Feltöltése</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('icon')}
              className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                activeMode === 'icon'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Ikonkészletből Választás</span>
            </button>
          </div>

          {/* 1. MÓD: SAJÁT KÉPFÁJL FELTÖLTÉSE / URL */}
          {activeMode === 'image' && (
            <div className="space-y-4 animate-in fade-in">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-850/50"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Húzza ide a logófájlt, vagy kattintson a tallózáshoz
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Támogatott formátumok: PNG, SVG, JPG, WebP (javasolt méret: négyzetes, átlátszó háttérrel)
                </p>
              </div>

              {/* Ha már van feltöltött kép */}
              {customImageUrl && (
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={customImageUrl}
                      alt="Feltöltött logó"
                      className="w-10 h-10 object-contain rounded-lg bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-xs">
                        {fileName || 'Egyéni logókép'}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>Kép betöltve és használatra kész</span>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomImageUrl('');
                      setFileName('');
                    }}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Kép törlése"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Webes URL megadási lehetőség */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Vagy adjon meg közvetlen kép URL-t:
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://pelda.hu/logo.png"
                    className="flex-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300"
                  >
                    Betöltés
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. MÓD: ELŐRE MEGTERVEZETT IKONOK KÖZÜL VÁLASZTÁS */}
          {activeMode === 'icon' && (
            <div className="space-y-3 animate-in fade-in">
              <span className="text-slate-600 dark:text-slate-400 block text-xs">
                Válasszon az alábbi autósiskolai és szimbólumok közül:
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {PRESET_ICONS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedIcon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedIcon(item.id);
                        setActiveMode('icon');
                      }}
                      className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-2 theme-border-primary theme-bg-light shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isSelected ? 'theme-bg-primary text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <span className={`text-[11px] font-semibold leading-tight line-clamp-1 ${isSelected ? 'theme-text-primary font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Lábléc */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-xs font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Alapértelmezett</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Mégse
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl theme-btn-primary font-bold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Logó Mentése és Alkalmazása</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
