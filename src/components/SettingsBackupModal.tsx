import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Lock,
  Unlock,
  Bell,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  Key,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { DatabaseState } from '../types';
import { exportDatabaseToExcel, importDatabaseFromExcel } from '../services/excelService';
import { exportDatabaseToJson, importDatabaseFromJson } from '../services/cryptoDb';
import { requestDesktopNotificationPermission, sendDesktopNotification } from '../services/notificationService';

interface SettingsBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbState: DatabaseState;
  onReplaceDbState: (newState: DatabaseState) => void;
  encryptionKey: string | null;
  onSetEncryptionKey: (key: string | null) => void;
  onTriggerAlertsCheck: () => void;
}

export const SettingsBackupModal: React.FC<SettingsBackupModalProps> = ({
  isOpen,
  onClose,
  dbState,
  onReplaceDbState,
  encryptionKey,
  onSetEncryptionKey,
  onTriggerAlertsCheck,
}) => {
  const [activeTab, setActiveTab] = useState<'excel' | 'backup' | 'security' | 'notifications' | 'company'>('excel');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyForm, setCompanyForm] = useState(dbState.schoolCompany);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleExcelExport = () => {
    try {
      exportDatabaseToExcel(dbState);
      setStatusMessage({ type: 'success', text: 'Excel táblázat (.xlsx) sikeresen letöltve!' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Hiba történt az Excel exportálás során.' });
    }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importDatabaseFromExcel(file);
      if (confirm(`Az Excel fájlból ${imported.vehicles.length} jármű, ${imported.students.length} tanuló, ${imported.instructors.length} oktató és ${imported.lessons.length} óra került beolvasásra. Betölti az adatokat?`)) {
        onReplaceDbState(imported);
        setStatusMessage({ type: 'success', text: 'Excel adatok sikeresen beimportálva a helyi adatbázisba!' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Hiba az importálás során: ${err.message || 'Érvénytelen fájlformátum'}` });
    }
  };

  const handleJsonBackupDownload = () => {
    try {
      exportDatabaseToJson(dbState);
      setStatusMessage({ type: 'success', text: 'JSON biztonsági mentés fájl letöltve!' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Hiba a JSON mentés során.' });
    }
  };

  const handleJsonImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importDatabaseFromJson(file);
      onReplaceDbState(imported);
      setStatusMessage({ type: 'success', text: 'Teljes biztonsági mentés sikeresen visszaállítva!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Nem sikerült visszaállítani: ${err.message}` });
    }
  };

  const handleSaveEncryptionKey = () => {
    if (!newPassword.trim()) {
      onSetEncryptionKey(null);
      setStatusMessage({ type: 'success', text: 'Helyi titkosítási jelszó feloldva. Az adatok sima helyi tárolóban mentődnek.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'A két megadott jelszó nem egyezik meg!' });
      return;
    }

    if (newPassword.length < 4) {
      setStatusMessage({ type: 'error', text: 'A jelszónak legalább 4 karakter hosszúnak kell lennie!' });
      return;
    }

    onSetEncryptionKey(newPassword);
    setStatusMessage({ type: 'success', text: 'AES-256-GCM titkosítási kulcs sikeresen beállítva az adatbázishoz!' });
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleRequestNotifications = async () => {
    const granted = await requestDesktopNotificationPermission();
    if (granted) {
      sendDesktopNotification('AutoSuli Értesítések', {
        body: 'Az asztali értesítések sikeresen be vannak kapcsolva! Riasztunk a határidőkről és műszaki vizsgákról.',
      });
      setStatusMessage({ type: 'success', text: 'Asztali értesítések engedélyezve!' });
    } else {
      setStatusMessage({ type: 'error', text: 'Az értesítési engedélyt a böngésző vagy a felhasználó elutasította.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Fejléc */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Rendszerbeállítások, Adatbázis & Mentések
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabok */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-1 text-xs">
          <button
            onClick={() => setActiveTab('excel')}
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'excel'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel Import / Export</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'backup'
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Teljes Biztonsági Mentés</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'security'
                ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Titkosítás & Jelszó</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'notifications'
                ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Értesítések</span>
          </button>

          <button
            onClick={() => {
              setCompanyForm(dbState.schoolCompany);
              setActiveTab('company');
            }}
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'company'
                ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Képző Cégadatai</span>
          </button>
        </div>

        {/* Tartalom */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Értesítési üzenet */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl flex items-center space-x-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* EXCEL TAB */}
          {activeTab === 'excel' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl space-y-2 border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5 text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Excel (.xlsx) Munkafüzet Exportálása</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-400">
                  Letölt egy több lapból álló, strukturált Excel munkafüzetet (Járművek, Órarend, Tanulók, Oktatók, Tankolások, Karbantartások) formázott oszlopokkal és összegzésekkel.
                </p>
                <button
                  onClick={handleExcelExport}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Excel Munkafüzet Letöltése (.xlsx)</span>
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl space-y-2 border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5 text-sm">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Excel Munkafüzet Importálása</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-400">
                  Töltsön be egy korábban exportált AutoSuli Excel táblázatot vagy kompatibilis munkafüzetet az adatok egyidejű frissítéséhez.
                </p>
                <label className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer shadow-xs">
                  <Upload className="w-4 h-4" />
                  <span>Excel Fájl Kiválasztása</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleExcelImport}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* BACKUP TAB */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Teljes Helyi Adatbázis Mentése (.json)
                </h4>
                <p className="text-slate-600 dark:text-slate-400">
                  Készítsen egy kattintással teljes offline biztonsági másolatot a böngészőben tárolt összes autósiskolai adatról (vizsgaidőpontok, tanfolyamok, diákok, járművek, tankolások).
                </p>
                <button
                  onClick={handleJsonBackupDownload}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                >
                  <Download className="w-4 h-4" />
                  <span>Biztonsági Mentés Letöltése (.json)</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Biztonsági Mentés Visszaállítása
                </h4>
                <p className="text-slate-600 dark:text-slate-400">
                  Egy korábbi .json mentésfájl feltöltésével azonnal helyreállíthatja a teljes autósiskolai állapotot.
                </p>
                <label className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-semibold cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Mentésfájl Betöltése</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleJsonImport}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Beépített Adatbázis AES-GCM Titkosítás
                  </h4>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Az autósiskola érzékeny adatait (tanulók telefonszámai, orvosi adatai, járművek törzskönyvei) kriptográfiai AES-256-GCM kulccsal zárolhatja a helyi böngésző tárolójában.
                </p>

                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Jelenlegi állapot:
                  </span>
                  <div className="flex items-center space-x-2 font-bold">
                    {encryptionKey ? (
                      <span className="text-emerald-600 flex items-center space-x-1">
                        <Lock className="w-4 h-4" />
                        <span>Titkosított (Jelszóval védve)</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center space-x-1">
                        <Unlock className="w-4 h-4" />
                        <span>Nincs jelszavas védelem (Normál helyi tároló)</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="font-semibold block text-slate-700 dark:text-slate-300">
                    {encryptionKey ? 'Jelszó módosítása vagy törlése (üresen hagyva feloldódik):' : 'Új védelmi jelszó beállítása:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="password"
                      placeholder="Jelszó..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <input
                      type="password"
                      placeholder="Jelszó megerősítése..."
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={handleSaveEncryptionKey}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                  >
                    Jelszó Beállítása / Frissítése
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-purple-600" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Asztali Rendszerértesítések
                  </h4>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Az AutoSuli képes natív operációs rendszer szintű asztali buborékértesítéseket küldeni (Windows / macOS / Linux) a lejáró műszaki vizsgákról, az esedékes orvosi alkalmasságikról és az órarendi ütközésekről.
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleRequestNotifications}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center space-x-1.5"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Asztali Értesítések Engedélyezése & Teszt</span>
                  </button>

                  <button
                    onClick={() => {
                      onTriggerAlertsCheck();
                      setStatusMessage({ type: 'success', text: 'Határidő-ellenőrzés sikeresen lefutott! Riasztások az értesítési sávban és az asztalon.' });
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold flex items-center space-x-1.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Azonnali Határidő Ellenőrzés</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* KÉPZŐ CÉGADATAI TAB */}
          {activeTab === 'company' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <span className="font-bold text-amber-900 dark:text-amber-300 block mb-1">
                  Képző Intézmény & Cégadatok (Szerződések Fejléce)
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  Az itt megadott adatok jelennek meg a felnőttképzési szerződéseken, nyomtatványokon és az emailben kiküldött visszaigazolásokon.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Iskola megnevezése
                  </label>
                  <input
                    type="text"
                    value={companyForm.schoolName}
                    onChange={(e) => setCompanyForm({ ...companyForm, schoolName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hivatalos cégnév
                  </label>
                  <input
                    type="text"
                    value={companyForm.companyName}
                    onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Adószám
                  </label>
                  <input
                    type="text"
                    value={companyForm.taxNumber}
                    onChange={(e) => setCompanyForm({ ...companyForm, taxNumber: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Akkreditációs szám
                  </label>
                  <input
                    type="text"
                    value={companyForm.accreditationNumber}
                    onChange={(e) => setCompanyForm({ ...companyForm, accreditationNumber: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Iskolavezető képviselő
                  </label>
                  <input
                    type="text"
                    value={companyForm.representativeName}
                    onChange={(e) => setCompanyForm({ ...companyForm, representativeName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Székhely cím
                  </label>
                  <input
                    type="text"
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bankszámlaszám (Tandíj fizetés)
                  </label>
                  <input
                    type="text"
                    value={companyForm.bankAccountNumber}
                    onChange={(e) => setCompanyForm({ ...companyForm, bankAccountNumber: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefonszám
                  </label>
                  <input
                    type="text"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email cím
                  </label>
                  <input
                    type="email"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Szerződési Záradék Szövege
                </label>
                <textarea
                  rows={3}
                  value={companyForm.termsText || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, termsText: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  onReplaceDbState({
                    ...dbState,
                    schoolCompany: companyForm,
                  });
                  setStatusMessage({ type: 'success', text: 'Cégadatok sikeresen elmentve az adatbázisba!' });
                }}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md shadow-amber-600/20 transition-all"
              >
                Cégadatok Mentése az Adatbázisba
              </button>
            </div>
          )}
        </div>

        {/* Lábléc */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
};
