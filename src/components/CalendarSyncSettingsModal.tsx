import React, { useState } from 'react';
import {
  X,
  Calendar,
  Mail,
  Check,
  Send,
  Download,
  ExternalLink,
  Copy,
  Clock,
  Settings,
  Bell,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Info,
  Shield,
  FileText,
  Sliders,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  DatabaseState,
  CalendarClient,
  EmailClientMode,
  CalendarSyncSettings,
  AutoEmailReminderSettings,
  EmailReminderLog,
} from '../types';
import {
  compileAllDeadlinesAsEvents,
  generateMultiEventICS,
  downloadICSFile,
  createGoogleCalendarUrl,
  createOutlookCalendarUrl,
  runAutomatedEmailReminders,
  openCalendarEventInClient,
  downloadEMLFile,
} from '../services/notificationService';

interface CalendarSyncSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbState: DatabaseState;
  onUpdateDb: (newState: DatabaseState) => void;
  initialTab?: 'calendar' | 'email' | 'logs';
}

export const CalendarSyncSettingsModal: React.FC<CalendarSyncSettingsModalProps> = ({
  isOpen,
  onClose,
  dbState,
  onUpdateDb,
  initialTab = 'calendar',
}) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'email' | 'logs'>(initialTab);
  const [copiedLink, setCopiedLink] = useState(false);
  const [runSuccessMessage, setRunSuccessMessage] = useState<string | null>(null);

  // Local state for calendar settings
  const [calendarSettings, setCalendarSettings] = useState<CalendarSyncSettings>(
    dbState.calendarSyncSettings || {
      preferredClient: 'gmail',
      autoSyncMot: true,
      autoSyncMedical: true,
      autoSyncLessons: true,
      autoSyncMaintenance: true,
      reminderDaysAhead: [30, 15, 7, 1],
      calendarName: 'AutoSuli Határidők & Flotta',
      defaultAlarmMinutes: 1440,
    }
  );

  // Local state for auto email settings
  const [emailSettings, setEmailSettings] = useState<AutoEmailReminderSettings>(
    dbState.autoEmailSettings || {
      enabled: true,
      clientMode: 'gmail',
      checkFrequency: 'daily',
      lastRunDate: '',
      motRecipientEmail: dbState.schoolCompany.email || 'muszaki@autosuli.hu',
      bccSchoolAdmin: true,
      schoolAdminEmail: dbState.schoolCompany.email || 'iroda@autosuli-kepzes.hu',
      motThresholdDays: 30,
      medicalThresholdDays: 45,
      sendDuplicateIntervalDays: 7,
      senderName: dbState.schoolCompany.schoolName || 'AutoSuli Képzési Központ',
    }
  );

  const [customTemplatesOpen, setCustomTemplatesOpen] = useState(false);

  if (!isOpen) return null;

  // Határidős események összeállítása
  const allEvents = compileAllDeadlinesAsEvents(dbState, calendarSettings);

  const handleSaveSettings = () => {
    const updatedState: DatabaseState = {
      ...dbState,
      calendarSyncSettings: calendarSettings,
      autoEmailSettings: emailSettings,
    };
    onUpdateDb(updatedState);
    setRunSuccessMessage('A beállítások sikeresen elmentve!');
    setTimeout(() => setRunSuccessMessage(null), 3000);
  };

  // 1. Összes esemény letöltése Thunderbird / Outlookhoz (.ics)
  const handleDownloadAllICS = () => {
    const icsContent = generateMultiEventICS(
      allEvents,
      calendarSettings.calendarName || 'AutoSuli Flotta & Adminisztráció',
      calendarSettings.reminderDaysAhead
    );
    downloadICSFile('AutoSuli_Osszes_Hatarido_Thunderbird.ics', icsContent);
    setRunSuccessMessage(`${allEvents.length} db határidős esemény letöltve Thunderbird / Outlook iCal formátumban!`);
    setTimeout(() => setRunSuccessMessage(null), 4000);
  };

  // 2. Kötegelt szinkronizáció Google Naptárhoz
  const handleBatchGoogleCalendar = () => {
    if (allEvents.length === 0) {
      alert('Nincsenek aktív határidős események a szinkronizáláshoz.');
      return;
    }
    // Az első / legközelebbi sürgős esemény megnyitása közvetlenül Google Naptárban
    const nextEvent = allEvents[0];
    const url = createGoogleCalendarUrl(nextEvent);
    window.open(url, '_blank', 'noopener,noreferrer');

    // Ha több van, a teljes köteget iCal formátumban is letöltjük a felhasználónak
    if (allEvents.length > 1) {
      const ics = generateMultiEventICS(allEvents, calendarSettings.calendarName);
      downloadICSFile('AutoSuli_Google_Naptar_Import.ics', ics);
      setRunSuccessMessage(
        `A legközelebbi esemény megnyílt a Google Naptárban! További ${allEvents.length - 1} db esemény importfájlja (.ics) letöltve a gépre.`
      );
    } else {
      setRunSuccessMessage('Esemény megnyitva a Google Naptárban!');
    }
    setTimeout(() => setRunSuccessMessage(null), 4000);
  };

  // 3. Kötegelt szinkronizáció Outlookhoz
  const handleBatchOutlookCalendar = () => {
    if (allEvents.length === 0) {
      alert('Nincsenek aktív határidős események.');
      return;
    }
    const nextEvent = allEvents[0];
    const url = createOutlookCalendarUrl(nextEvent);
    window.open(url, '_blank', 'noopener,noreferrer');

    if (allEvents.length > 1) {
      const ics = generateMultiEventICS(allEvents, calendarSettings.calendarName);
      downloadICSFile('AutoSuli_Outlook_Naptar_Import.ics', ics);
      setRunSuccessMessage(
        `Az esemény megnyílt az Outlook Naptárban! További ${allEvents.length - 1} db esemény naptárfájlja letöltve.`
      );
    }
    setTimeout(() => setRunSuccessMessage(null), 4000);
  };

  // 4. Webcal / Élő naptár feliratkozási hivatkozás másolása
  const handleCopyCalendarFeed = () => {
    const icsContent = generateMultiEventICS(allEvents, calendarSettings.calendarName);
    const dataUri = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
    navigator.clipboard.writeText(dataUri);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // 5. Automata értesítők AZONNALI futtatása
  const handleRunRemindersNow = () => {
    const result = runAutomatedEmailReminders(dbState, true, emailSettings.clientMode);
    onUpdateDb(result.updatedState);
    const total = result.motRemindersSent + result.medRemindersSent;
    setRunSuccessMessage(
      total > 0
        ? `Sikeres futtatás: ${result.motRemindersSent} db műszaki értesítő és ${result.medRemindersSent} db tanulói orvosi figyelmeztető feldolgozva (${emailSettings.clientMode.toUpperCase()} módban)!`
        : 'Az ellenőrzés lefutott: Nincs új esedékes határidő, vagy minden tételre nemrég ment ki értesítés.'
    );
    setTimeout(() => setRunSuccessMessage(null), 5000);
  };

  const emailLogs = dbState.emailReminderLogs || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Fejléc */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                  Naptár Szinkronizáció & Automata Email Emlékeztetők
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Gmail • Outlook • Thunderbird
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sürgős határidők (műszaki vizsgák, tanulói orvosiak, órák) szinkronizálása és automatikus értesítő motor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigáció */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 bg-slate-50/70 dark:bg-slate-900/50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition-all ${
              activeTab === 'calendar'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-800/80 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Naptár Szinkronizáció</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700">
              {allEvents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition-all ${
              activeTab === 'email'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-800/80 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Automata Email Értesítők</span>
            {emailSettings.enabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition-all ${
              activeTab === 'logs'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-800/80 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Kiküldési Napló</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700">
              {emailLogs.length}
            </span>
          </button>
        </div>

        {/* Sikeres művelet visszajelzés */}
        {runSuccessMessage && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center space-x-2 text-xs animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{runSuccessMessage}</span>
          </div>
        )}

        {/* Modal Tartalom */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* TAB 1: NAPTÁR SZINKRONIZÁCIÓ */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              {/* Preferált Kliens Választó Doboz */}
              <div>
                <label className="font-bold text-slate-900 dark:text-white block mb-2 text-sm">
                  1. Preferált Naptár & Email Kliens Kiválasztása
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Google Calendar (Gmail) */}
                  <button
                    type="button"
                    onClick={() => setCalendarSettings({ ...calendarSettings, preferredClient: 'gmail' })}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      calendarSettings.preferredClient === 'gmail'
                        ? 'border-red-500 bg-red-50/70 dark:bg-red-950/30 text-red-950 dark:text-red-200 ring-2 ring-red-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-red-600 dark:text-red-400 flex items-center space-x-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                          <span>Google Naptár / Gmail</span>
                        </span>
                        {calendarSettings.preferredClient === 'gmail' && (
                          <Check className="w-4 h-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        Közvetlen 1-kattintásos esemény hozzáadás böngészőből és webes Google Mail nyitás.
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] font-semibold text-red-600 dark:text-red-400">
                      Böngészős Deeplink & Import
                    </span>
                  </button>

                  {/* Microsoft Outlook */}
                  <button
                    type="button"
                    onClick={() => setCalendarSettings({ ...calendarSettings, preferredClient: 'outlook' })}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      calendarSettings.preferredClient === 'outlook'
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 text-blue-950 dark:text-blue-200 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-blue-600 dark:text-blue-400 flex items-center space-x-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          <span>Microsoft Outlook</span>
                        </span>
                        {calendarSettings.preferredClient === 'outlook' && (
                          <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        Outlook.com és Microsoft 365 webes naptár eseménydeeplink és iCal szinkronizáció.
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                      Outlook Web & Asztali
                    </span>
                  </button>

                  {/* Mozilla Thunderbird */}
                  <button
                    type="button"
                    onClick={() => setCalendarSettings({ ...calendarSettings, preferredClient: 'thunderbird' })}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      calendarSettings.preferredClient === 'thunderbird'
                        ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/30 text-sky-950 dark:text-sky-200 ring-2 ring-sky-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-sky-600 dark:text-sky-400 flex items-center space-x-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                          <span>Mozilla Thunderbird</span>
                        </span>
                        {calendarSettings.preferredClient === 'thunderbird' && (
                          <Check className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        Asztali naptár fájl (.ics) és hálózati naptár feliratkozás beépített VALARM riasztásokkal.
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                      Thunderbird iCal & EML
                    </span>
                  </button>
                </div>
              </div>

              {/* Szinkronizálandó adatok kiválasztása */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="font-bold text-slate-900 dark:text-white block text-sm">
                  2. Milyen események és határidők kerüljenek a naptárba?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center space-x-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={calendarSettings.autoSyncMot}
                      onChange={(e) =>
                        setCalendarSettings({ ...calendarSettings, autoSyncMot: e.target.checked })
                      }
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        Műszaki vizsgák lejárati határideje
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {dbState.vehicles.filter((v) => v.status !== 'deregistered').length} db aktív flottajármű
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={calendarSettings.autoSyncMedical}
                      onChange={(e) =>
                        setCalendarSettings({ ...calendarSettings, autoSyncMedical: e.target.checked })
                      }
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        Tanulói orvosi alkalmasságik lejárata
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {dbState.students.filter((s) => s.status === 'active' || s.status === 'exam_ready').length} aktív tanuló
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={calendarSettings.autoSyncLessons}
                      onChange={(e) =>
                        setCalendarSettings({ ...calendarSettings, autoSyncLessons: e.target.checked })
                      }
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        Tervezett vezetési órák & forgalmi vizsgák
                      </div>
                      <div className="text-[10px] text-slate-500">Órarendi események és időpontok</div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={calendarSettings.autoSyncMaintenance}
                      onChange={(e) =>
                        setCalendarSettings({ ...calendarSettings, autoSyncMaintenance: e.target.checked })
                      }
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        Tervezett kötelező járműszervizek
                      </div>
                      <div className="text-[10px] text-slate-500">Olajcsere, fékfelújítás, pótpedál</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Riasztási időzítés beállítása */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="font-bold text-slate-900 dark:text-white block text-sm">
                  3. Előzetes emlékeztető riasztások a naptárban (VALARM)
                </label>
                <p className="text-[11px] text-slate-500">
                  A naptáreseményekbe beépített riasztások, amelyek a Gmailben, Outlookban és Thunderbirdben is jeleznek:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[30, 15, 7, 3, 1].map((days) => {
                    const isSelected = calendarSettings.reminderDaysAhead?.includes(days);
                    return (
                      <button
                        key={days}
                        type="button"
                        onClick={() => {
                          const current = calendarSettings.reminderDaysAhead || [];
                          const next = isSelected
                            ? current.filter((d) => d !== days)
                            : [...current, days].sort((a, b) => b - a);
                          setCalendarSettings({ ...calendarSettings, reminderDaysAhead: next });
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {days} nappal előtte
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Kötegelt szinkronizálási gombok */}
              <div>
                <label className="font-bold text-slate-900 dark:text-white block mb-2 text-sm">
                  4. Azonnali Kötegelt Szinkronizálás ({allEvents.length} esemény)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={handleBatchGoogleCalendar}
                    className="p-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center justify-center space-x-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Hozzáadás Google Naptárhoz</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBatchOutlookCalendar}
                    className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center space-x-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Hozzáadás Outlookhoz</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadAllICS}
                    className="p-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold flex items-center justify-center space-x-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Thunderbird .ICS Letöltés</span>
                  </button>
                </div>
              </div>

              {/* Thunderbird és feliratkozási útmutató kártya */}
              <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900/50 bg-sky-50/60 dark:bg-sky-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sky-900 dark:text-sky-300 flex items-center space-x-2">
                    <Info className="w-4 h-4 text-sky-600" />
                    <span>Hogyan állítható be a Thunderbird naptár 1 perc alatt?</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCalendarFeed}
                    className="flex items-center space-x-1 text-[11px] font-semibold text-sky-700 dark:text-sky-300 hover:underline"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Naptáradat kimásolva!' : 'Adatfolyam másolása'}</span>
                  </button>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  <li>
                    Kattintson a <strong>„Thunderbird .ICS Letöltés”</strong> gombra a fenti sorban.
                  </li>
                  <li>
                    A Thunderbird programban váltson a <strong>Naptár</strong> fülre (bal felső sarok).
                  </li>
                  <li>
                    Kattintson a bal oldali sávban a <strong>„+”</strong> (Új naptár) gombra, vagy válassza a{' '}
                    <strong>Menü &gt; Események és feladatok &gt; Importálás...</strong> lehetőséget.
                  </li>
                  <li>
                    Válassza ki a letöltött <code>AutoSuli_Osszes_Hatarido_Thunderbird.ics</code> fájlt. Az összes műszaki vizsga és határidő azonnal megjelenik a riasztásokkal!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: AUTOMATIKUS EMAIL ÉRTESÍTŐK */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              {/* Fő Ki/Bekapcsoló kártya */}
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Automatikus Határidős Email Értesítő Rendszer
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 max-w-lg">
                    Ha engedélyezve van, a rendszer figyeli az esedékes műszaki vizsgákat és a tanulók lejáró orvosi alkalmasságijait, és automatikusan kiküldi vagy előkészíti a figyelmeztetéseket.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailSettings.enabled}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, enabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Kliens és Küldési Mechanizmus */}
              <div>
                <label className="font-bold text-slate-900 dark:text-white block mb-2 text-sm">
                  Kiküldési Kliens & Módszer
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEmailSettings({ ...emailSettings, clientMode: 'gmail' })}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      emailSettings.clientMode === 'gmail'
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 ring-2 ring-red-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold text-red-600 dark:text-red-400 mb-1">Gmail Web</div>
                    <div className="text-[10px] text-slate-500">Böngészős új levél ablak pre-filled adatokkal</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmailSettings({ ...emailSettings, clientMode: 'outlook' })}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      emailSettings.clientMode === 'outlook'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold text-blue-600 dark:text-blue-400 mb-1">Outlook Web</div>
                    <div className="text-[10px] text-slate-500">Outlook.com és Office 365 Deeplink</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmailSettings({ ...emailSettings, clientMode: 'thunderbird' })}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      emailSettings.clientMode === 'thunderbird'
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold text-sky-600 dark:text-sky-400 mb-1">Thunderbird</div>
                    <div className="text-[10px] text-slate-500">Rendszer mailto: protokoll & EML csomag</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmailSettings({ ...emailSettings, clientMode: 'direct' })}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      emailSettings.clientMode === 'direct'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">Csendes Háttér</div>
                    <div className="text-[10px] text-slate-500">Közvetlen háttérküldés és naplózás popup nélkül</div>
                  </button>
                </div>
              </div>

              {/* Ellenőrzési Gyakoriság & Határidő Küszöbök */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    Ütemezési Gyakoriság
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">
                      Mikor fusson le az automata határidő-ellenőrzés?
                    </label>
                    <select
                      value={emailSettings.checkFrequency}
                      onChange={(e) =>
                        setEmailSettings({
                          ...emailSettings,
                          checkFrequency: e.target.value as any,
                        })
                      }
                      className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="daily">Naponta egyszer (Első belépéskor)</option>
                      <option value="on_open">Minden alkalmazás indításakor</option>
                      <option value="weekly">Hetente egyszer (Hétfő reggel)</option>
                    </select>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Utolsó automatikus futtatás dátuma:{' '}
                    <strong>{emailSettings.lastRunDate || 'Még nem futott'}</strong>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    Határidő Küszöbértékek
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">
                        Műszaki vizsga előtti napok:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={emailSettings.motThresholdDays}
                        onChange={(e) =>
                          setEmailSettings({
                            ...emailSettings,
                            motThresholdDays: parseInt(e.target.value) || 30,
                          })
                        }
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">
                        Tanulói orvosi előtti napok:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={emailSettings.medicalThresholdDays}
                        onChange={(e) =>
                          setEmailSettings({
                            ...emailSettings,
                            medicalThresholdDays: parseInt(e.target.value) || 45,
                          })
                        }
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">
                      Duplikáció védelem (ne küldje újra X napon belül):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={emailSettings.sendDuplicateIntervalDays}
                      onChange={(e) =>
                        setEmailSettings({
                          ...emailSettings,
                          sendDuplicateIntervalDays: parseInt(e.target.value) || 7,
                        })
                      }
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Címzettek és Másolat beállítások */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  Címzettek & Értesítési Célok
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">
                      Műszaki vizsga értesítő címzettje:
                    </label>
                    <input
                      type="email"
                      value={emailSettings.motRecipientEmail}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, motRecipientEmail: e.target.value })
                      }
                      placeholder="muszaki@autoszerviz.hu"
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">
                      Tanulói orvosi értesítő címzettje:
                    </label>
                    <input
                      type="text"
                      disabled
                      value="Automatikusan a tanuló regisztrált email címe"
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailSettings.bccSchoolAdmin}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, bccSchoolAdmin: e.target.checked })
                      }
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      Titkos másolat (BCC) küldése az iskola központi irodájának:
                    </span>
                  </label>
                  <input
                    type="email"
                    value={emailSettings.schoolAdminEmail}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, schoolAdminEmail: e.target.value })
                    }
                    placeholder="iroda@autosuli-kepzes.hu"
                    className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs w-64"
                  />
                </div>
              </div>

              {/* Sablonok testreszabása gomb */}
              <div>
                <button
                  type="button"
                  onClick={() => setCustomTemplatesOpen(!customTemplatesOpen)}
                  className="flex items-center space-x-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{customTemplatesOpen ? 'Sablonok elrejtése' : 'Egyedi email sablonok és tárgy testreszabása'}</span>
                </button>

                {customTemplatesOpen && (
                  <div className="mt-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-4">
                    <div>
                      <label className="font-semibold block mb-1 text-slate-800 dark:text-slate-200">
                        Műszaki vizsga egyedi tárgya (üresen hagyva az automatikus):
                      </label>
                      <input
                        type="text"
                        value={emailSettings.customMotSubject || ''}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, customMotSubject: e.target.value })
                        }
                        placeholder="Műszaki vizsga időpont egyeztetés - AutoSuli Flotta"
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-slate-800 dark:text-slate-200">
                        Tanulói orvosi figyelmeztető egyedi tárgya:
                      </label>
                      <input
                        type="text"
                        value={emailSettings.customMedicalSubject || ''}
                        onChange={(e) =>
                          setEmailSettings({
                            ...emailSettings,
                            customMedicalSubject: e.target.value,
                          })
                        }
                        placeholder="Fontos: Esedékes orvosi alkalmassági megújítása - AutoSuli"
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* AZONNALI FUTTATÁS GOMB */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div>
                  <div className="font-bold text-sm">Azonnali Automatikus Ellenőrzés & Kiküldés</div>
                  <div className="text-[11px] text-slate-300">
                    A rendszer átvizsgálja az összes járművet és tanulót, és elindítja a kiküldést a választott ({emailSettings.clientMode.toUpperCase()}) klienssel.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRunRemindersNow}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/30 transition-colors shrink-0 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Automatikus Értesítők Futtatása Most</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: KIKÜLDÉSI NAPLÓ */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Kiküldött Automata Értesítők & Emlékeztetők ({emailLogs.length})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Műszaki vizsgák és tanulói orvosiak értesítési előzményei a duplikáció elkerülésére
                  </p>
                </div>

                {emailLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Biztosan törölni szeretné az értesítési naplót?')) {
                        onUpdateDb({ ...dbState, emailReminderLogs: [] });
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold cursor-pointer"
                  >
                    Napló ürítése
                  </button>
                )}
              </div>

              {emailLogs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                  <Mail className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <div className="font-semibold text-slate-700 dark:text-slate-300">
                    Még nincsenek rögzített értesítési naplóbejegyzések.
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Kattintson az „Automatikus Értesítők Futtatása Most” gombra az első emlékeztetők kiküldéséhez.
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {emailLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.type === 'mot'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                            }`}
                          >
                            {log.type === 'mot' ? 'Műszaki' : 'Orvosi'}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {log.targetName}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({new Date(log.timestamp).toLocaleString('hu-HU')})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300">
                          <strong>Címzett:</strong> {log.recipient} • <strong>Tárgy:</strong> {log.subject}
                        </div>
                        {log.notes && (
                          <div className="text-[10px] text-slate-400 italic">
                            Megjegyzés: {log.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end shrink-0 space-y-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {log.clientUsed?.toUpperCase()} ({log.status})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Lábléc */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Aktuális preferált kliens:{' '}
            <strong className="text-slate-800 dark:text-slate-200 uppercase">
              {calendarSettings.preferredClient}
            </strong>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Bezárás
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              Beállítások Mentése
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
