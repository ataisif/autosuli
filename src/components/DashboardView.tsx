import React, { useState } from 'react';
import {
  Car,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Send,
  Mail,
  ArrowRight,
  Plus,
  KeyRound,
  Wrench,
  Fuel,
  FileSpreadsheet,
  BellRing,
  RotateCcw,
  FileSignature,
  Settings,
  Sparkles,
  ExternalLink,
  Download,
  ChevronDown,
  Play,
  Check,
} from 'lucide-react';
import { DatabaseState, Vehicle, Student, Lesson, CalendarClient, EmailClientMode } from '../types';
import {
  exportMotToCalendar,
  exportMedicalToCalendar,
  sendDesktopNotification,
  runAutomatedEmailReminders,
  openCalendarEventInClient,
} from '../services/notificationService';
import { CalendarSyncSettingsModal } from './CalendarSyncSettingsModal';

interface DashboardViewProps {
  dbState: DatabaseState;
  onUpdateDb?: (newState: DatabaseState) => void;
  onNavigate: (tab: string) => void;
  onQuickCheckout: () => void;
  onQuickNewLesson: () => void;
  onCheckinVehicle: (vehicle: Vehicle) => void;
  onOpenEmailWithTemplate: (type: 'mot' | 'medical' | 'schedule' | 'contract', data: any) => void;
  onExportExcel: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  dbState,
  onUpdateDb,
  onNavigate,
  onQuickCheckout,
  onQuickNewLesson,
  onCheckinVehicle,
  onOpenEmailWithTemplate,
  onExportExcel,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'calendar' | 'email' | 'logs'>('calendar');
  const [syncBatchDropdownOpen, setSyncBatchDropdownOpen] = useState(false);
  const [activeItemDropdownId, setActiveItemDropdownId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const preferredClient: CalendarClient = dbState.calendarSyncSettings?.preferredClient || 'gmail';
  const autoEmailSettings = dbState.autoEmailSettings || {
    enabled: true,
    clientMode: 'gmail' as EmailClientMode,
    lastRunDate: '2026-09-24',
  };

  const handleOpenCalendarSettings = (tab: 'calendar' | 'email' | 'logs' = 'calendar') => {
    setModalTab(tab);
    setCalendarModalOpen(true);
  };

  const handleRunRemindersQuick = () => {
    if (!onUpdateDb) return;
    const result = runAutomatedEmailReminders(dbState, true);
    onUpdateDb(result.updatedState);
    const total = result.motRemindersSent + result.medRemindersSent;
    setActionSuccessMsg(
      total > 0
        ? `Sikeres futtatás: ${result.motRemindersSent} db műszaki és ${result.medRemindersSent} db tanulói orvosi értesítő feldolgozva!`
        : 'Az ellenőrzés lefutott: Nincs új esedékes határidő.'
    );
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Műszaki vizsga lejárati számítások
  const getDaysUntil = (targetDateStr: string) => {
    const target = new Date(targetDateStr).getTime();
    const today = new Date(todayStr).getTime();
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  };

  const motAlerts = dbState.vehicles
    .map((v) => ({
      vehicle: v,
      daysLeft: getDaysUntil(v.motDate),
    }))
    .filter((item) => item.daysLeft <= 45)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // Orvosi lejárati figyelmeztetések tanulóknál
  const medicalAlerts = dbState.students
    .map((s) => ({
      student: s,
      daysLeft: getDaysUntil(s.medicalExamExpiry),
    }))
    .filter((item) => item.daysLeft <= 60)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // Kint lévő járművek
  const checkedOutVehicles = dbState.vehicles.filter((v) => v.status === 'in_use');

  // Mai órák
  const todayLessons = dbState.lessons.filter((l) => l.date === todayStr);

  const handleSendAllAlerts = () => {
    let sentCount = 0;
    motAlerts.forEach((m) => {
      const msg = `${m.vehicle.plateNumber} (${m.vehicle.brandModel}) műszaki vizsgája ${m.daysLeft > 0 ? `${m.daysLeft} nap múlva lejár` : 'már lejárt'}!`;
      const ok = sendDesktopNotification('⚠️ Műszaki vizsga figyelmeztetés', msg);
      if (ok) sentCount++;
    });

    medicalAlerts.forEach((med) => {
      const msg = `${med.student.name} tanuló orvosi alkalmasságija ${med.daysLeft > 0 ? `${med.daysLeft} nap múlva lejár` : 'lejárt'}!`;
      const ok = sendDesktopNotification('⚠️ Orvosi alkalmassági lejárat', msg);
      if (ok) sentCount++;
    });

    alert(
      sentCount > 0
        ? `${sentCount} db asztali értesítés sikeresen kiküldve!`
        : 'Az asztali értesítések küldése befejeződött (ha nem jelent meg ablak, kérjük engedélyezze az asztali értesítéseket a fejlécben).'
    );
  };

  return (
    <div className="space-y-6">
      {/* Üdvözlő és gyorsműveleti fejléc */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-700/50">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-2 border border-amber-500/30">
            <span>Autósiskola Adminisztrációs Központ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">Iskolai Áttekintés & Flottakezelés</h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Aktuális jármű kiadások, esedékes műszaki vizsgák, oktatási órák és határidős teendők felügyelete.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('registration')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-md shadow-amber-500/30 transition-colors cursor-pointer"
          >
            <FileSignature className="w-4 h-4" />
            <span>Új Tanfolyam Regisztráció</span>
          </button>
          <button
            onClick={onQuickNewLesson}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition-colors border border-slate-600"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Új Óra Rögzítése</span>
          </button>
          <button
            onClick={onQuickCheckout}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition-colors border border-slate-600"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Jármű Kiadása</span>
          </button>
          <button
            onClick={onExportExcel}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-700/90 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
            title="Minden adat letöltése Excel (.xlsx) formátumban"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Excel Export</span>
          </button>
        </div>
      </div>

      {/* 4 Fő Statisztikai Csempe */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Flotta Állománya</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{dbState.vehicles.length} db</span>
            <span className="text-xs text-emerald-600 font-medium">
              {dbState.vehicles.filter((v) => v.status === 'active' || v.status === 'in_use').length} üzemképes
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Kivonva: {dbState.vehicles.filter((v) => v.status === 'deregistered').length}</span>
            <span>Szervizben: {dbState.vehicles.filter((v) => v.status === 'service').length}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Kint Lévő Autók</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{checkedOutVehicles.length} db</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">oktatásban</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {checkedOutVehicles.length > 0 ? 'Aktív tanulóvezetés folyamatban' : 'Minden jármű a telephelyen'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Esedékes Műszakiak</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">{motAlerts.length} db</span>
            <span className="text-xs text-slate-500">45 napon belül</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {motAlerts.some((m) => m.daysLeft <= 14) ? '⚠️ Sürgős vizsgafelkészítés!' : 'Nincs azonnali lejárat'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tanulók & Órák</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{dbState.students.length} fő</span>
            <span className="text-xs text-emerald-600 font-medium">{todayLessons.length} óra mára</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {dbState.instructors.length} oktató beosztva
          </p>
        </div>
      </div>

      {/* Kétoszlopos nézet: Kint lévő autók & Határidős teendők */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bal oszlop: Jelenleg kint lévő gépjárművek (7 oszlop) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Jelenleg Oktatáson Kint Lévő Járművek
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Melyik oktató vitte el a kocsit, mikor és milyen km állással
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('vehicles')}
              className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center space-x-1"
            >
              <span>Teljes flotta</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {checkedOutVehicles.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Jelenleg egyetlen gépjármű sincs kint
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Minden gépkocsi a telephelyen tartózkodik és bevetésre kész.
              </p>
              <button
                onClick={onQuickCheckout}
                className="mt-3 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors"
              >
                Gépjármű kiadása oktatónak
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {checkedOutVehicles.map((veh) => {
                const instructor = dbState.instructors.find((i) => i.id === veh.currentInstructorId);
                return (
                  <div
                    key={veh.id}
                    className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded font-mono font-bold text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-xs">
                          {veh.plateNumber}
                        </span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {veh.brandModel}
                        </span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-medium">
                          {veh.category} kat.
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                        <span>
                          Oktató: <strong>{instructor ? instructor.name : 'Ismeretlen'}</strong>
                        </span>
                        <span>
                          Kiadva: {veh.checkoutTime ? veh.checkoutTime.replace('T', ' ') : '-'}
                        </span>
                        <span>Induló km: {veh.checkoutKm || veh.currentKm} km</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => onCheckinVehicle(veh)}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Visszahozatal Rögzítése</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ma esedékes vezetési órák */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Mai Vezetési Órák ({todayLessons.length} db)
              </h4>
              <button
                onClick={() => onNavigate('schedule')}
                className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline"
              >
                Órarend megnyitása
              </button>
            </div>
            {todayLessons.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
                Mára nincs beütemezett vezetési óra rögzítve.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {todayLessons.map((les) => {
                  const inst = dbState.instructors.find((i) => i.id === les.instructorId);
                  const stud = dbState.students.find((s) => s.id === les.studentId);
                  const car = dbState.vehicles.find((v) => v.id === les.vehicleId);
                  return (
                    <div
                      key={les.id}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {les.startTime} - {les.endTime}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          {les.lessonType}
                        </span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-400">
                        Tanuló: <strong>{stud?.name}</strong> | Oktató: {inst?.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Autó: {car?.plateNumber} ({car?.brandModel})
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Jobb oszlop: Sürgős Határidők & Teendők (5 oszlop) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Sürgős Határidők & Teendők
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Műszaki vizsgák, tanulói orvosiak & naptár szinkron
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 flex-wrap">
              {/* Naptár Szinkronizáció Lenyíló Gomb */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSyncBatchDropdownOpen(!syncBatchDropdownOpen)}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-xs font-semibold transition-colors cursor-pointer border border-sky-200/60 dark:border-sky-800/60"
                  title="Határidők szinkronizálása Gmail, Outlook vagy Thunderbird naptárral"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Naptár Szinkron</span>
                  <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
                </button>

                {syncBatchDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setSyncBatchDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 z-40 text-xs animate-in fade-in zoom-in-95 space-y-1">
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Szinkronizálás klienssel
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSyncBatchDropdownOpen(false);
                          handleOpenCalendarSettings('calendar');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-800 dark:text-slate-200 flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          <span>Google Naptár (Gmail)</span>
                        </span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSyncBatchDropdownOpen(false);
                          handleOpenCalendarSettings('calendar');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-800 dark:text-slate-200 flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span>Microsoft Outlook</span>
                        </span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSyncBatchDropdownOpen(false);
                          handleOpenCalendarSettings('calendar');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-800 dark:text-slate-200 flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-sky-500" />
                          <span>Mozilla Thunderbird (.ics)</span>
                        </span>
                        <Download className="w-3 h-3 text-slate-400" />
                      </button>
                      <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setSyncBatchDropdownOpen(false);
                            handleOpenCalendarSettings('calendar');
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-600 dark:text-amber-400 font-semibold flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Settings className="w-3 h-3" />
                          <span>Részletes Naptár Beállítások...</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Beállítások Modal Gomb */}
              <button
                type="button"
                onClick={() => handleOpenCalendarSettings('email')}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-semibold transition-colors cursor-pointer border border-amber-200/60 dark:border-amber-800/60"
                title="Naptár és automatikus email emlékeztetők beállítása"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Beállítások</span>
              </button>

              <button
                type="button"
                onClick={handleSendAllAlerts}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                title="Asztali figyelmeztetés küldése a teendőkről"
              >
                <BellRing className="w-3.5 h-3.5 text-amber-500" />
                <span>Riasztás</span>
              </button>
            </div>
          </div>

          {/* Automata Email Emlékeztetők Állapotjelző és Gyorsfuttató Sáv */}
          <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex flex-col xs:flex-row xs:items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center space-x-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  autoEmailSettings.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span className="text-slate-700 dark:text-slate-300">
                <strong>Automata Email Értesítők:</strong>{' '}
                {autoEmailSettings.enabled ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold uppercase">
                    Aktív ({autoEmailSettings.clientMode})
                  </span>
                ) : (
                  <span className="text-slate-400">Kikapcsolva</span>
                )}
              </span>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="text-slate-500 hidden sm:inline">
                Preferált naptár: <strong className="uppercase">{preferredClient}</strong>
              </span>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                type="button"
                onClick={handleRunRemindersQuick}
                className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-semibold flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
                title="Automatikus határidős ellenőrzés és kiküldés azonnali futtatása"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Futtatás Most</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenCalendarSettings('logs')}
                className="px-2 py-1 rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Kiküldési előzmények megtekintése"
              >
                Napló
              </button>
            </div>
          </div>

          {actionSuccessMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] flex items-center space-x-2 animate-in fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
          )}

          {/* Műszaki vizsga határidők listája */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Esedékes Műszaki Vizsgák</span>
              <span className="text-[11px] font-normal text-slate-400">({motAlerts.length} jármű)</span>
            </div>

            {motAlerts.length === 0 ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 py-2">
                ✓ Minden jármű műszaki érvényessége rendben van.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {motAlerts.map((m) => {
                  const isExpired = m.daysLeft <= 0;
                  const isUrgent = m.daysLeft <= 15;
                  const isDropdownOpen = activeItemDropdownId === `mot-${m.vehicle.id}`;

                  return (
                    <div
                      key={m.vehicle.id}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all ${
                        isExpired
                          ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-200'
                          : isUrgent
                          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold">{m.vehicle.plateNumber}</span>
                          <span className="font-medium truncate max-w-[140px]">
                            {m.vehicle.brandModel}
                          </span>
                        </div>
                        <div className="text-[11px] opacity-80">
                          Lejárat: <strong>{m.vehicle.motDate}</strong> ({m.daysLeft > 0 ? `${m.daysLeft} nap van hátra` : 'LEJÁRT!'})
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0 relative">
                        {/* Naptár szinkron gomb választott klienssel vagy lenyílóval */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveItemDropdownId(isDropdownOpen ? null : `mot-${m.vehicle.id}`)
                            }
                            className="p-1.5 rounded-md hover:bg-white/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer flex items-center space-x-0.5"
                            title={`Műszaki vizsga naptárba írása (${preferredClient.toUpperCase()})`}
                          >
                            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                          </button>

                          {isDropdownOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setActiveItemDropdownId(null)}
                              />
                              <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1 z-40 text-xs animate-in fade-in">
                                <button
                                  type="button"
                                  onClick={() => {
                                    exportMotToCalendar(m.vehicle, 'gmail');
                                    setActiveItemDropdownId(null);
                                  }}
                                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-800 dark:text-slate-200 flex items-center space-x-1.5"
                                >
                                  <span className="w-2 h-2 rounded-full bg-red-500" />
                                  <span>Google Naptár</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    exportMotToCalendar(m.vehicle, 'outlook');
                                    setActiveItemDropdownId(null);
                                  }}
                                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-800 dark:text-slate-200 flex items-center space-x-1.5"
                                >
                                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                                  <span>Outlook Naptár</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    exportMotToCalendar(m.vehicle, 'thunderbird');
                                    setActiveItemDropdownId(null);
                                  }}
                                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-800 dark:text-slate-200 flex items-center space-x-1.5"
                                >
                                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                                  <span>Thunderbird (.ics)</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Email küldés sablonnal */}
                        <button
                          type="button"
                          onClick={() => onOpenEmailWithTemplate('mot', m.vehicle)}
                          className="p-1.5 rounded-md hover:bg-white/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer"
                          title="Értesítő email küldése a műszaki vizsgáról"
                        >
                          <Mail className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tanulói orvosi alkalmassági határidők */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Lejáró Tanulói Orvosiak</span>
              <span className="text-[11px] font-normal text-slate-400">({medicalAlerts.length} tanuló)</span>
            </div>

            {medicalAlerts.length === 0 ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 py-1">
                ✓ Minden tanuló orvosi igazolása rendben van.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {medicalAlerts.map((med) => {
                  const isDropdownOpen = activeItemDropdownId === `med-${med.student.id}`;

                  return (
                    <div
                      key={med.student.id}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {med.student.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Orvosi lejár: {med.student.medicalExamExpiry} ({med.daysLeft} nap)
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0 relative">
                        {/* Naptár szinkron a tanulói orvosira */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveItemDropdownId(isDropdownOpen ? null : `med-${med.student.id}`)
                            }
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                            title="Orvosi lejárat hozzáadása naptárhoz"
                          >
                            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          </button>

                          {isDropdownOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setActiveItemDropdownId(null)}
                              />
                              <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1 z-40 text-xs animate-in fade-in">
                                <button
                                  type="button"
                                  onClick={() => {
                                    exportMedicalToCalendar(med.student, 'gmail');
                                    setActiveItemDropdownId(null);
                                  }}
                                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-800 dark:text-slate-200 flex items-center space-x-1.5"
                                >
                                  <span className="w-2 h-2 rounded-full bg-red-500" />
                                  <span>Google Naptár</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    exportMedicalToCalendar(med.student, 'outlook');
                                    setActiveItemDropdownId(null);
                                  }}
                                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-800 dark:text-slate-200 flex items-center space-x-1.5"
                                >
                                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                                  <span>Outlook Naptár</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    exportMedicalToCalendar(med.student, 'thunderbird');
                                    setActiveItemDropdownId(null);
                                  }}
                                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-800 dark:text-slate-200 flex items-center space-x-1.5"
                                >
                                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                                  <span>Thunderbird (.ics)</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Email gomb a tanulónak */}
                        <button
                          type="button"
                          onClick={() => onOpenEmailWithTemplate('medical', med.student)}
                          className="flex items-center space-x-1 px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 text-[11px] font-medium cursor-pointer"
                          title="Figyelmeztető email a tanulónak"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Emlékeztető</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Naptár Szinkronizáció és Automata Értesítők Modál */}
        <CalendarSyncSettingsModal
          isOpen={calendarModalOpen}
          onClose={() => setCalendarModalOpen(false)}
          dbState={dbState}
          onUpdateDb={onUpdateDb || (() => {})}
          initialTab={modalTab}
        />
      </div>
    </div>
  );
};
