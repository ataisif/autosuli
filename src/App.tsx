import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DatabaseState,
  Vehicle,
  Lesson,
  Student,
  Instructor,
  FuelLog,
  MaintenanceRecord,
  CourseRegistration,
  SchoolCompanyInfo,
} from './types';
import { loadLocalDatabase, saveLocalDatabase } from './services/cryptoDb';
import { initialDatabase } from './services/mockData';
import {
  evaluateSystemAlerts,
  sendDesktopNotification,
  requestDesktopNotificationPermission,
} from './services/notificationService';
import { exportFullDatabaseToExcel } from './services/excelService';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { CourseRegistrationView } from './components/CourseRegistrationView';
import { VehiclesView } from './components/VehiclesView';
import { ScheduleView } from './components/ScheduleView';
import { InstructorsStudentsView } from './components/InstructorsStudentsView';
import { FuelView } from './components/FuelView';
import { EmailModal } from './components/EmailModal';
import { SettingsBackupModal } from './components/SettingsBackupModal';
import { CompanySettingsModal } from './components/CompanySettingsModal';
import { Keyboard, X } from 'lucide-react';

export default function App() {
  const [dbState, setDbState] = useState<DatabaseState>(initialDatabase);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSaving, setIsSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return typeof Notification !== 'undefined' && Notification.permission === 'granted';
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('autosuli_dark_mode') === 'true';
  });

  // Modálok
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [emailModal, setEmailModal] = useState<{
    isOpen: boolean;
    type: 'mot' | 'medical' | 'schedule' | 'contract';
    data: any;
  }>({
    isOpen: false,
    type: 'mot',
    data: null,
  });

  // Helyi adatbázis betöltése induláskor
  useEffect(() => {
    async function initDb() {
      const storedKey = localStorage.getItem('autosuli_enc_key');
      if (storedKey) setEncryptionKey(storedKey);

      const loaded = await loadLocalDatabase(storedKey || undefined);
      if (loaded) {
        setDbState(loaded);
      }
    }
    initDb();
  }, []);

  // Dark mode szinkronizálása
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('autosuli_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('autosuli_dark_mode', 'false');
    }
  }, [isDarkMode]);

  // Adatbázis automatikus mentése helyi tárolóba
  const handleUpdateDb = useCallback(
    async (newState: DatabaseState) => {
      setDbState(newState);
      setIsSaving(true);
      try {
        await saveLocalDatabase(newState, encryptionKey || undefined);
      } finally {
        setTimeout(() => setIsSaving(false), 300);
      }
    },
    [encryptionKey]
  );

  // Riasztások és határidők számítása
  const systemAlerts = useMemo(() => {
    return evaluateSystemAlerts(dbState);
  }, [dbState]);

  const urgentCount = useMemo(() => {
    return systemAlerts.filter((a) => a.severity === 'critical' || a.severity === 'warning').length;
  }, [systemAlerts]);

  // Riasztások azonnali ellenőrzése
  const triggerAlertsCheck = useCallback(() => {
    const alerts = evaluateSystemAlerts(dbState);
    if (alerts.length > 0) {
      const urgent = alerts.filter((a) => a.severity === 'critical');
      sendDesktopNotification(`AutoSuli Figyelmeztetés (${alerts.length} teendő)`, {
        body:
          urgent.length > 0
            ? `Sürgős: ${urgent[0].title} - ${urgent[0].description}`
            : `${alerts[0].title} - ${alerts[0].description}`,
      });
    }
  }, [dbState]);

  // Értesítések kérése
  const handleRequestNotifications = async () => {
    const granted = await requestDesktopNotificationPermission();
    setNotificationsEnabled(granted);
    if (granted) {
      sendDesktopNotification('AutoSuli Értesítések', {
        body: 'Az asztali értesítések aktívak! Időben figyelmeztetünk a műszaki vizsgákról és teendőkről.',
      });
    }
  };

  // Gyorsbillentyűk (Alt + 1..6, Alt + S, ?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          setActiveTab('dashboard');
        } else if (e.key === '2') {
          e.preventDefault();
          setActiveTab('registration');
        } else if (e.key === '3') {
          e.preventDefault();
          setActiveTab('vehicles');
        } else if (e.key === '4') {
          e.preventDefault();
          setActiveTab('schedule');
        } else if (e.key === '5') {
          e.preventDefault();
          setActiveTab('people');
        } else if (e.key === '6') {
          e.preventDefault();
          setActiveTab('fuel');
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          setSettingsModalOpen(true);
        }
      } else if (
        e.key === '?' &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // TANFOLYAM REGISZTRÁCIÓ & SZERZŐDÉS MŰVELETEK (Dinamikus adatcserével)
  const handleAddRegistration = (registration: CourseRegistration, autoCreateStudent: boolean) => {
    let updatedStudents = [...dbState.students];
    let createdStudentId = registration.studentId;

    if (autoCreateStudent) {
      // Megnézzük, hogy létezik-e már a tanuló név vagy email alapján
      const existingIndex = updatedStudents.findIndex(
        (s) =>
          s.email.toLowerCase() === registration.email.toLowerCase() ||
          s.name.toLowerCase() === registration.studentName.toLowerCase()
      );

      const targetCourse = dbState.courseOffers.find((c) => c.id === registration.courseId);
      const reqHours = targetCourse ? targetCourse.practiceHours : 30;
      const reqKm = targetCourse ? targetCourse.requiredKm : 580;

      if (existingIndex >= 0) {
        // Frissítjük a meglévő tanulót az új tanfolyami adatokkal
        const existing = updatedStudents[existingIndex];
        createdStudentId = existing.id;
        updatedStudents[existingIndex] = {
          ...existing,
          phone: registration.phone || existing.phone,
          category: registration.category,
          medicalExamExpiry: registration.medicalExamExpiry || existing.medicalExamExpiry,
          instructorId: registration.instructorId || existing.instructorId,
          notes: registration.notes
            ? `${existing.notes ? existing.notes + ' | ' : ''}Szerződésszám: ${registration.contractNumber}`
            : existing.notes,
        };
      } else {
        // Új tanuló létrehozása a törzsben
        createdStudentId = `stud-${Date.now()}`;
        const newStudent: Student = {
          id: createdStudentId,
          name: registration.studentName,
          phone: registration.phone,
          email: registration.email,
          category: registration.category,
          instructorId: registration.instructorId,
          theoryExamStatus: 'Nem kezdte',
          medicalExamExpiry: registration.medicalExamExpiry || '2027-09-01',
          completedHours: 0,
          requiredHours: reqHours,
          completedKm: 0,
          requiredKm: reqKm,
          paymentStatus:
            registration.initialDeposit >= registration.totalFee
              ? 'Rendezve'
              : registration.initialDeposit > 0
              ? 'Részletben'
              : 'Hátralék',
          status: 'active',
          notes: `Szerződésszám: ${registration.contractNumber}. Lakcím: ${registration.address}. Anyja neve: ${registration.mothersName}.`,
        };
        updatedStudents.push(newStudent);
      }
    }

    const regWithId: CourseRegistration = {
      ...registration,
      studentId: createdStudentId,
    };

    handleUpdateDb({
      ...dbState,
      courseRegistrations: [regWithId, ...dbState.courseRegistrations],
      students: updatedStudents,
    });
  };

  const handleUpdateRegistration = (reg: CourseRegistration) => {
    handleUpdateDb({
      ...dbState,
      courseRegistrations: dbState.courseRegistrations.map((r) => (r.id === reg.id ? reg : r)),
    });
  };

  const handleUpdateCompanyInfo = (info: SchoolCompanyInfo) => {
    handleUpdateDb({
      ...dbState,
      schoolCompany: info,
    });
  };

  // JÁRMŰ MŰVELETEK
  const handleAddVehicle = (vehicle: Vehicle) => {
    handleUpdateDb({
      ...dbState,
      vehicles: [...dbState.vehicles, vehicle],
    });
  };

  const handleUpdateVehicle = (vehicle: Vehicle) => {
    handleUpdateDb({
      ...dbState,
      vehicles: dbState.vehicles.map((v) => (v.id === vehicle.id ? vehicle : v)),
    });
  };

  const handleDeleteVehicle = (id: string) => {
    handleUpdateDb({
      ...dbState,
      vehicles: dbState.vehicles.filter((v) => v.id !== id),
    });
  };

  const handleCheckoutVehicle = (vehicleId: string, instructorId: string, startKm: number, notes?: string) => {
    handleUpdateDb({
      ...dbState,
      vehicles: dbState.vehicles.map((v) =>
        v.id === vehicleId
          ? {
              ...v,
              status: 'in_use',
              currentInstructorId: instructorId,
              checkoutTime: new Date().toISOString(),
              checkoutKm: startKm,
              notes: notes || v.notes,
            }
          : v
      ),
    });
  };

  const handleCheckinVehicle = (vehicleId: string, endKm: number, notes?: string) => {
    handleUpdateDb({
      ...dbState,
      vehicles: dbState.vehicles.map((v) =>
        v.id === vehicleId
          ? {
              ...v,
              status: 'active',
              currentInstructorId: undefined,
              checkoutTime: undefined,
              currentKm: endKm && endKm > v.currentKm ? endKm : v.currentKm,
              notes: notes || v.notes,
            }
          : v
      ),
    });
  };

  const handleAddMaintenance = (maintenanceRecord: MaintenanceRecord) => {
    handleUpdateDb({
      ...dbState,
      maintenance: [...dbState.maintenance, maintenanceRecord],
    });
  };

  // ÓRAREND MŰVELETEK
  const handleAddLesson = (lesson: Lesson) => {
    handleUpdateDb({
      ...dbState,
      lessons: [...dbState.lessons, lesson],
    });
  };

  const handleUpdateLesson = (lesson: Lesson) => {
    handleUpdateDb({
      ...dbState,
      lessons: dbState.lessons.map((l) => (l.id === lesson.id ? lesson : l)),
    });
  };

  const handleDeleteLesson = (id: string) => {
    handleUpdateDb({
      ...dbState,
      lessons: dbState.lessons.filter((l) => l.id !== id),
    });
  };

  // TANULÓ ÉS OKTATÓ MŰVELETEK
  const handleAddStudent = (student: Student) => {
    handleUpdateDb({
      ...dbState,
      students: [...dbState.students, student],
    });
  };

  const handleUpdateStudent = (student: Student) => {
    handleUpdateDb({
      ...dbState,
      students: dbState.students.map((s) => (s.id === student.id ? student : s)),
    });
  };

  const handleDeleteStudent = (id: string) => {
    handleUpdateDb({
      ...dbState,
      students: dbState.students.filter((s) => s.id !== id),
    });
  };

  const handleAddInstructor = (instructor: Instructor) => {
    handleUpdateDb({
      ...dbState,
      instructors: [...dbState.instructors, instructor],
    });
  };

  const handleUpdateInstructor = (instructor: Instructor) => {
    handleUpdateDb({
      ...dbState,
      instructors: dbState.instructors.map((i) => (i.id === instructor.id ? instructor : i)),
    });
  };

  const handleDeleteInstructor = (id: string) => {
    handleUpdateDb({
      ...dbState,
      instructors: dbState.instructors.filter((i) => i.id !== id),
    });
  };

  // TANKOLÁS MŰVELETEK
  const handleAddFuelLog = (log: FuelLog) => {
    handleUpdateDb({
      ...dbState,
      fuelLogs: [...dbState.fuelLogs, log],
      vehicles: dbState.vehicles.map((v) =>
        v.id === log.vehicleId && log.currentKm > v.currentKm
          ? { ...v, currentKm: log.currentKm }
          : v
      ),
    });
  };

  const handleDeleteFuelLog = (id: string) => {
    handleUpdateDb({
      ...dbState,
      fuelLogs: dbState.fuelLogs.filter((f) => f.id !== id),
    });
  };

  // Titkosítási kulcs mentése
  const handleSetEncryptionKey = async (newKey: string | null) => {
    setEncryptionKey(newKey);
    if (newKey) {
      localStorage.setItem('autosuli_enc_key', newKey);
    } else {
      localStorage.removeItem('autosuli_enc_key');
    }
    await saveLocalDatabase(dbState, newKey || undefined);
  };

  // Email sablon megnyitó segéd
  const handleOpenEmailTemplate = (type: 'mot' | 'medical' | 'schedule' | 'contract', data: any) => {
    setEmailModal({
      isOpen: true,
      type,
      data,
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Fő Navigációs Fejléc */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dbState={dbState}
        darkMode={isDarkMode}
        setDarkMode={setIsDarkMode}
        isSaving={isSaving}
        onOpenDbModal={() => setSettingsModalOpen(true)}
        onOpenCompanyModal={() => setCompanyModalOpen(true)}
        onOpenShortcutsModal={() => setShortcutsModalOpen(true)}
        onOpenEmailModal={() => handleOpenEmailTemplate('mot', dbState.vehicles[0])}
        onPrintSchedule={() => window.print()}
        onRequestNotifications={handleRequestNotifications}
        notificationsEnabled={notificationsEnabled}
        urgentCount={urgentCount}
      />

      {/* Fő Tartalmi Terület */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            dbState={dbState}
            onNavigate={(tab) => setActiveTab(tab)}
            onQuickCheckout={() => setActiveTab('vehicles')}
            onQuickNewLesson={() => setActiveTab('schedule')}
            onCheckinVehicle={(vehicle) => handleCheckinVehicle(vehicle.id, vehicle.currentKm + 50)}
            onOpenEmailWithTemplate={handleOpenEmailTemplate}
            onExportExcel={() => exportFullDatabaseToExcel(dbState)}
          />
        )}

        {activeTab === 'registration' && (
          <CourseRegistrationView
            dbState={dbState}
            onAddRegistration={handleAddRegistration}
            onUpdateRegistration={handleUpdateRegistration}
            onUpdateCompanyInfo={handleUpdateCompanyInfo}
            onOpenEmailModal={(type, reg) => handleOpenEmailTemplate(type, reg)}
            onNavigateToStudents={() => setActiveTab('people')}
          />
        )}

        {activeTab === 'vehicles' && (
          <VehiclesView
            dbState={dbState}
            onAddVehicle={handleAddVehicle}
            onUpdateVehicle={handleUpdateVehicle}
            onDeleteVehicle={handleDeleteVehicle}
            onCheckoutVehicle={handleCheckoutVehicle}
            onCheckinVehicle={handleCheckinVehicle}
            onAddMaintenance={handleAddMaintenance}
            onOpenEmailWithTemplate={handleOpenEmailTemplate}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleView
            dbState={dbState}
            onAddLesson={handleAddLesson}
            onUpdateLesson={handleUpdateLesson}
            onDeleteLesson={handleDeleteLesson}
            onPrint={() => window.print()}
          />
        )}

        {activeTab === 'people' && (
          <InstructorsStudentsView
            dbState={dbState}
            onAddInstructor={handleAddInstructor}
            onUpdateInstructor={handleUpdateInstructor}
            onDeleteInstructor={handleDeleteInstructor}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onOpenEmailWithTemplate={handleOpenEmailTemplate}
          />
        )}

        {activeTab === 'fuel' && (
          <FuelView
            dbState={dbState}
            onAddFuelLog={handleAddFuelLog}
            onDeleteFuelLog={handleDeleteFuelLog}
          />
        )}
      </main>

      {/* Lábléc Információk & Gyorsbillentyű gomb */}
      <footer className="no-print border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-3 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">AutoSuli Flotta & Admin v2.5</span>
          <span>•</span>
          <span className="font-medium text-amber-600 dark:text-amber-400">
            {dbState.schoolCompany.schoolName}
          </span>
          <span>•</span>
          <span>Érintőképernyős Aláíró & Szerződéskezelő</span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCompanyModalOpen(true)}
            className="hover:text-amber-600 transition-colors"
          >
            Cégadatok
          </button>
          <span>•</span>
          <button
            onClick={() => setShortcutsModalOpen(true)}
            className="flex items-center space-x-1 hover:text-amber-600 transition-colors"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Gyorsbillentyűk (Alt+1..6, ?)</span>
          </button>
          <span>•</span>
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="hover:text-amber-600 transition-colors"
          >
            Adatbázis & Mentések
          </button>
        </div>
      </footer>

      {/* EMAIL KÜLDŐ SABLON MODÁL */}
      <EmailModal
        isOpen={emailModal.isOpen}
        onClose={() => setEmailModal((prev) => ({ ...prev, isOpen: false }))}
        templateType={emailModal.type}
        targetData={emailModal.data}
        companyInfo={dbState.schoolCompany}
      />

      {/* BEÁLLÍTÁSOK, EXCEL ÉS MENTÉSEK MODÁL */}
      <SettingsBackupModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        dbState={dbState}
        onReplaceDbState={(newState) => handleUpdateDb(newState)}
        encryptionKey={encryptionKey}
        onSetEncryptionKey={handleSetEncryptionKey}
        onTriggerAlertsCheck={triggerAlertsCheck}
      />

      {/* CÉGADATOK MÓDOSÍTÁSA MODÁL */}
      <CompanySettingsModal
        isOpen={companyModalOpen}
        onClose={() => setCompanyModalOpen(false)}
        companyInfo={dbState.schoolCompany}
        onSaveCompanyInfo={handleUpdateCompanyInfo}
      />

      {/* GYORSBILLENTYŰK SÚGÓ MODÁL */}
      {shortcutsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Keyboard className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Gyorsbillentyűk
                </h3>
              </div>
              <button
                onClick={() => setShortcutsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Áttekintés (Dashboard)</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold">Alt + 1</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Tanfolyam Regisztráció & Aláírás</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold">Alt + 2</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Gépjármű Flotta</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold">Alt + 3</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Órarend & Ütközések</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold">Alt + 4</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Tanulók & Oktatók</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold">Alt + 5</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Tankolások & Fogyasztás</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold">Alt + 6</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Beállítások & Mentések</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold">Alt + S</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Nyomtatás / PDF mentés</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold">Ctrl + P</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
