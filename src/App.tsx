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
  AppUser,
  AuditLogEntry,
  DesignTemplateId,
  AppLogoConfig,
  CourseOffer,
} from './types';
import { loadLocalDatabase, saveLocalDatabase } from './services/cryptoDb';
import { initialDatabase } from './services/mockData';
import {
  evaluateSystemAlerts,
  sendDesktopNotification,
  requestDesktopNotificationPermission,
} from './services/notificationService';
import { exportFullDatabaseToExcel } from './services/excelService';
import { THEME_TEMPLATES, applyThemeToDom } from './services/themeService';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { CourseRegistrationView } from './components/CourseRegistrationView';
import { VehiclesView } from './components/VehiclesView';
import { ScheduleView } from './components/ScheduleView';
import { InstructorsStudentsView } from './components/InstructorsStudentsView';
import { FuelView } from './components/FuelView';
import { UsersManagementView } from './components/UsersManagementView';
import { LoginScreen } from './components/LoginScreen';
import { ThemeSwitcherModal } from './components/ThemeSwitcherModal';
import { LogoCustomizerModal } from './components/LogoCustomizerModal';
import { EmailModal } from './components/EmailModal';
import { SettingsBackupModal } from './components/SettingsBackupModal';
import { CompanySettingsModal } from './components/CompanySettingsModal';
import { Keyboard, X, ShieldAlert } from 'lucide-react';

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

  // BEJELENTKEZETT FELHASZNÁLÓ ÁLLAPOT
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('autosuli_logged_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // TÉMA / DIZÁJN SABLON ÁLLAPOT
  const [currentTheme, setCurrentTheme] = useState<DesignTemplateId>(() => {
    return (localStorage.getItem('autosuli_theme') as DesignTemplateId) || 'amber-classic';
  });

  // Modálok
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [logoModalOpen, setLogoModalOpen] = useState(false);
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
        if (loaded.currentTheme) {
          setCurrentTheme(loaded.currentTheme);
          applyThemeToDom(loaded.currentTheme);
        }
      } else {
        const savedTheme = (localStorage.getItem('autosuli_theme') as DesignTemplateId) || 'amber-classic';
        applyThemeToDom(savedTheme);
      }
    }
    initDb();
  }, []);

  // Téma érvényesítése a teljes webalkalmazásban
  useEffect(() => {
    applyThemeToDom(currentTheme);
  }, [currentTheme]);

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

  // Téma mentése
  const handleSelectTheme = (themeId: DesignTemplateId) => {
    setCurrentTheme(themeId);
    applyThemeToDom(themeId);
    localStorage.setItem('autosuli_theme', themeId);
    handleUpdateDb({
      ...dbState,
      currentTheme: themeId,
    });
  };

  // AUDIT LOG Segédfüggvény - Minden adatmódosítás naplózása
  const logAudit = useCallback(
    (
      action: AuditLogEntry['action'],
      module: AuditLogEntry['module'],
      details: string,
      targetId?: string,
      targetName?: string
    ) => {
      const newEntry: AuditLogEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        userId: currentUser?.id || 'system',
        username: currentUser?.username || 'Rendszer',
        userRole: currentUser?.role || 'admin',
        action,
        module,
        targetId,
        targetName,
        details,
      };

      setDbState((prev) => {
        const updatedLogs = [newEntry, ...(prev.auditLogs || [])];
        const nextState = { ...prev, auditLogs: updatedLogs };
        // Aszinkron háttérmentés
        saveLocalDatabase(nextState, encryptionKey || undefined);
        return nextState;
      });
    },
    [currentUser, encryptionKey]
  );

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

  // BEJELENTKEZÉS ÉS KIJELENTKEZÉS
  const handleLogin = (user: AppUser) => {
    const updatedUser = {
      ...user,
      lastLoginAt: new Date().toISOString(),
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('autosuli_logged_user', JSON.stringify(updatedUser));

    // Felhasználó utolsó belépésének frissítése a db-ben
    const updatedUsers = dbState.users.map((u) => (u.id === user.id ? updatedUser : u));
    const nextState = { ...dbState, users: updatedUsers };
    handleUpdateDb(nextState);

    // Belépés audit log
    logAudit('LOGIN', 'AUTH', `Felhasználó sikeresen bejelentkezett (${user.fullName}, szerepkör: ${user.role})`);
  };

  const handleLogout = () => {
    if (currentUser) {
      logAudit('LOGOUT', 'AUTH', `Felhasználó kijelentkezett (${currentUser.fullName})`);
    }
    setCurrentUser(null);
    localStorage.removeItem('autosuli_logged_user');
  };

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

  // Gyorsbillentyűk (Alt + 1..7, Alt + S, ?)
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
        } else if (e.key === '7') {
          e.preventDefault();
          setActiveTab('users');
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

  // FELHASZNÁLÓKEZELÉS MŰVELETEK (Admin)
  const handleAddUser = (user: AppUser) => {
    handleUpdateDb({
      ...dbState,
      users: [...dbState.users, user],
    });
    logAudit('CREATE', 'USERS', `Új felhasználó regisztrálva: ${user.fullName} (@${user.username}, szerepkör: ${user.role})`, user.id, user.fullName);
  };

  const handleUpdateUser = (user: AppUser) => {
    handleUpdateDb({
      ...dbState,
      users: dbState.users.map((u) => (u.id === user.id ? user : u)),
    });
    if (currentUser?.id === user.id) {
      setCurrentUser(user);
      localStorage.setItem('autosuli_logged_user', JSON.stringify(user));
    }
    logAudit('UPDATE', 'USERS', `Felhasználó adatai és jogosultságai módosítva: ${user.fullName} (@${user.username})`, user.id, user.fullName);
  };

  const handleDeleteUser = (userId: string) => {
    const target = dbState.users.find((u) => u.id === userId);
    handleUpdateDb({
      ...dbState,
      users: dbState.users.filter((u) => u.id !== userId),
    });
    logAudit('DELETE', 'USERS', `Felhasználó törölve a rendszerből: ${target?.fullName || userId}`, userId, target?.fullName);
  };

  // TANFOLYAM REGISZTRÁCIÓ & SZERZŐDÉS MŰVELETEK (Dinamikus adatcserével & Audit)
  const handleAddRegistration = (registration: CourseRegistration, autoCreateStudent: boolean) => {
    let updatedStudents = [...dbState.students];
    let createdStudentId = registration.studentId;

    if (autoCreateStudent) {
      const existingIndex = updatedStudents.findIndex(
        (s) =>
          s.email.toLowerCase() === registration.email.toLowerCase() ||
          s.name.toLowerCase() === registration.studentName.toLowerCase()
      );

      const targetCourse = dbState.courseOffers.find((c) => c.id === registration.courseId);
      const reqHours = targetCourse ? targetCourse.practiceHours : 30;
      const reqKm = targetCourse ? targetCourse.requiredKm : 580;

      if (existingIndex >= 0) {
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

    logAudit(
      'CREATE',
      'REGISTRATION',
      `Új képzési szerződés rögzítve (${registration.contractNumber}, ${registration.studentName}, ${registration.category} kat, előleg: ${registration.initialDeposit.toLocaleString('hu-HU')} Ft)`,
      regWithId.id,
      registration.studentName
    );
  };

  const handleUpdateRegistration = (reg: CourseRegistration) => {
    handleUpdateDb({
      ...dbState,
      courseRegistrations: dbState.courseRegistrations.map((r) => (r.id === reg.id ? reg : r)),
    });
    logAudit('UPDATE', 'REGISTRATION', `Szerződés adatainak frissítése (${reg.contractNumber})`, reg.id, reg.studentName);
  };

  const handleUpdateCompanyInfo = (info: SchoolCompanyInfo) => {
    handleUpdateDb({
      ...dbState,
      schoolCompany: info,
    });
    logAudit('UPDATE', 'COMPANY', `Autósiskola cégadatainak és bankszámlaszámának frissítése (${info.companyName})`);
  };

  // JÁRMŰ MŰVELETEK
  const handleAddVehicle = (vehicle: Vehicle) => {
    handleUpdateDb({
      ...dbState,
      vehicles: [...dbState.vehicles, vehicle],
    });
    logAudit('CREATE', 'VEHICLES', `Új jármű felvéve a flottába: ${vehicle.plateNumber} (${vehicle.brandModel})`, vehicle.id, vehicle.plateNumber);
  };

  const handleUpdateVehicle = (vehicle: Vehicle) => {
    handleUpdateDb({
      ...dbState,
      vehicles: dbState.vehicles.map((v) => (v.id === vehicle.id ? vehicle : v)),
    });
    logAudit('UPDATE', 'VEHICLES', `Jármű adatai módosítva: ${vehicle.plateNumber} (${vehicle.brandModel}, állapot: ${vehicle.status})`, vehicle.id, vehicle.plateNumber);
  };

  const handleDeleteVehicle = (id: string) => {
    const target = dbState.vehicles.find((v) => v.id === id);
    handleUpdateDb({
      ...dbState,
      vehicles: dbState.vehicles.filter((v) => v.id !== id),
    });
    logAudit('DELETE', 'VEHICLES', `Jármű törölve a nyilvántartásból: ${target?.plateNumber || id}`, id, target?.plateNumber);
  };

  const handleCheckoutVehicle = (vehicleId: string, instructorId: string, startKm: number, notes?: string) => {
    const veh = dbState.vehicles.find((v) => v.id === vehicleId);
    const inst = dbState.instructors.find((i) => i.id === instructorId);

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

    logAudit(
      'CHECKOUT',
      'VEHICLES',
      `Jármű kiadva oktatásra: ${veh?.plateNumber} -> ${inst?.name || instructorId} (Kezdő km: ${startKm})`,
      vehicleId,
      veh?.plateNumber
    );
  };

  const handleCheckinVehicle = (vehicleId: string, endKm: number, notes?: string) => {
    const veh = dbState.vehicles.find((v) => v.id === vehicleId);

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

    logAudit(
      'CHECKIN',
      'VEHICLES',
      `Jármű visszavéve oktatásból: ${veh?.plateNumber} (Leadási km: ${endKm})`,
      vehicleId,
      veh?.plateNumber
    );
  };

  const handleAddMaintenance = (maintenanceRecord: MaintenanceRecord) => {
    const veh = dbState.vehicles.find((v) => v.id === maintenanceRecord.vehicleId);
    handleUpdateDb({
      ...dbState,
      maintenance: [...dbState.maintenance, maintenanceRecord],
    });
    logAudit(
      'CREATE',
      'MAINTENANCE',
      `Szervizbejegyzés rögzítve: ${veh?.plateNumber} - ${maintenanceRecord.type} (${maintenanceRecord.cost.toLocaleString('hu-HU')} Ft, ${maintenanceRecord.workshop})`,
      maintenanceRecord.id,
      veh?.plateNumber
    );
  };

  // ÓRAREND MŰVELETEK
  const handleAddLesson = (lesson: Lesson) => {
    const stud = dbState.students.find((s) => s.id === lesson.studentId);
    const inst = dbState.instructors.find((i) => i.id === lesson.instructorId);

    handleUpdateDb({
      ...dbState,
      lessons: [...dbState.lessons, lesson],
    });

    logAudit(
      'CREATE',
      'SCHEDULE',
      `Új vezetési óra beütemezve: ${lesson.date} ${lesson.startTime}-${lesson.endTime} (${stud?.name || 'Tanuló'} • ${inst?.name || 'Oktató'})`,
      lesson.id,
      stud?.name
    );
  };

  const handleUpdateLesson = (lesson: Lesson) => {
    handleUpdateDb({
      ...dbState,
      lessons: dbState.lessons.map((l) => (l.id === lesson.id ? lesson : l)),
    });
    logAudit('UPDATE', 'SCHEDULE', `Vezetési óra módosítva: ${lesson.date} (${lesson.status})`, lesson.id);
  };

  const handleDeleteLesson = (id: string) => {
    const target = dbState.lessons.find((l) => l.id === id);
    handleUpdateDb({
      ...dbState,
      lessons: dbState.lessons.filter((l) => l.id !== id),
    });
    logAudit('DELETE', 'SCHEDULE', `Vezetési óra törölve: ${target?.date} ${target?.startTime}`, id);
  };

  // TANULÓ ÉS OKTATÓ MŰVELETEK
  const handleAddStudent = (student: Student) => {
    handleUpdateDb({
      ...dbState,
      students: [...dbState.students, student],
    });
    logAudit('CREATE', 'STUDENTS', `Új tanuló felvéve: ${student.name} (${student.category} kategória)`, student.id, student.name);
  };

  const handleUpdateStudent = (student: Student) => {
    handleUpdateDb({
      ...dbState,
      students: dbState.students.map((s) => (s.id === student.id ? student : s)),
    });
    logAudit('UPDATE', 'STUDENTS', `Tanulói adatok módosítva: ${student.name} (${student.completedHours} levezetett óra)`, student.id, student.name);
  };

  const handleDeleteStudent = (id: string) => {
    const target = dbState.students.find((s) => s.id === id);
    handleUpdateDb({
      ...dbState,
      students: dbState.students.filter((s) => s.id !== id),
    });
    logAudit('DELETE', 'STUDENTS', `Tanuló törölve: ${target?.name || id}`, id, target?.name);
  };

  const handleAddInstructor = (instructor: Instructor) => {
    handleUpdateDb({
      ...dbState,
      instructors: [...dbState.instructors, instructor],
    });
    logAudit('CREATE', 'INSTRUCTORS', `Új oktató rögzítve: ${instructor.name} (${instructor.licenseNumber})`, instructor.id, instructor.name);
  };

  const handleUpdateInstructor = (instructor: Instructor) => {
    handleUpdateDb({
      ...dbState,
      instructors: dbState.instructors.map((i) => (i.id === instructor.id ? instructor : i)),
    });
    logAudit('UPDATE', 'INSTRUCTORS', `Oktató adatai frissítve: ${instructor.name}`, instructor.id, instructor.name);
  };

  const handleDeleteInstructor = (id: string) => {
    const target = dbState.instructors.find((i) => i.id === id);
    handleUpdateDb({
      ...dbState,
      instructors: dbState.instructors.filter((i) => i.id !== id),
    });
    logAudit('DELETE', 'INSTRUCTORS', `Oktató törölve: ${target?.name || id}`, id, target?.name);
  };

  // TANKOLÁS MŰVELETEK
  const handleAddFuelLog = (log: FuelLog) => {
    const veh = dbState.vehicles.find((v) => v.id === log.vehicleId);
    handleUpdateDb({
      ...dbState,
      fuelLogs: [...dbState.fuelLogs, log],
      vehicles: dbState.vehicles.map((v) =>
        v.id === log.vehicleId && log.currentKm > v.currentKm
          ? { ...v, currentKm: log.currentKm }
          : v
      ),
    });
    logAudit(
      'CREATE',
      'FUEL',
      `Tankolás rögzítve: ${veh?.plateNumber} (${log.liters} l, ${log.totalCost.toLocaleString('hu-HU')} Ft, ${log.currentKm} km)`,
      log.id,
      veh?.plateNumber
    );
  };

  const handleDeleteFuelLog = (id: string) => {
    handleUpdateDb({
      ...dbState,
      fuelLogs: dbState.fuelLogs.filter((f) => f.id !== id),
    });
    logAudit('DELETE', 'FUEL', `Tankolási bizonylat törölve`, id);
  };

  // LOGÓ MÓDOSÍTÁS KEZELÉSE
  const handleSaveLogo = (logo: AppLogoConfig) => {
    const updatedCompany: SchoolCompanyInfo = {
      ...dbState.schoolCompany,
      ...(logo.type === 'image' && logo.imageUrl ? { logoUrl: logo.imageUrl } : {}),
    };

    const newState: DatabaseState = {
      ...dbState,
      appLogo: logo,
      schoolCompany: updatedCompany,
    };

    handleUpdateDb(newState);
    logAudit(
      'UPDATE',
      'COMPANY',
      logo.type === 'image'
        ? `Új egyedi kép alapú applikáció logó beállítva (${logo.uploadedFileName || 'kép'}).`
        : `Applikáció ikon embléma módosítva: ${logo.iconName || 'car'}.`
    );
  };

  // KÉPZÉSI KATEGÓRIÁK ÉS TANFOLYAMOK KEZELÉSE
  const handleAddCourseOffer = (course: CourseOffer) => {
    const newState: DatabaseState = {
      ...dbState,
      courseOffers: [...dbState.courseOffers, course],
    };
    handleUpdateDb(newState);
    logAudit(
      'CREATE',
      'REGISTRATION',
      `Új képzési kategória és tanfolyam rögzítve: ${course.name} (${course.category} kat., ${course.basePrice.toLocaleString('hu-HU')} Ft)`,
      course.id,
      course.name
    );
  };

  const handleUpdateCourseOffer = (course: CourseOffer) => {
    const newState: DatabaseState = {
      ...dbState,
      courseOffers: dbState.courseOffers.map((c) => (c.id === course.id ? course : c)),
    };
    handleUpdateDb(newState);
    logAudit(
      'UPDATE',
      'REGISTRATION',
      `Képzési tanfolyam módosítva: ${course.name} (${course.category} kat., ${course.basePrice.toLocaleString('hu-HU')} Ft)`,
      course.id,
      course.name
    );
  };

  const handleDeleteCourseOffer = (courseId: string) => {
    const target = dbState.courseOffers.find((c) => c.id === courseId);
    const newState: DatabaseState = {
      ...dbState,
      courseOffers: dbState.courseOffers.filter((c) => c.id !== courseId),
    };
    handleUpdateDb(newState);
    logAudit(
      'DELETE',
      'REGISTRATION',
      `Képzési tanfolyam törölve: ${target?.name || courseId}`,
      courseId,
      target?.name
    );
  };

  const handleResetCourseOffers = () => {
    const defaultOffers = initialDatabase.courseOffers;
    const newState: DatabaseState = {
      ...dbState,
      courseOffers: defaultOffers,
    };
    handleUpdateDb(newState);
    logAudit(
      'UPDATE',
      'REGISTRATION',
      `Gyári tanfolyamok és kategóriák visszaállítva (${defaultOffers.length} képzés).`
    );
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
    logAudit('UPDATE', 'COMPANY', newKey ? 'Adatbázis jelszavas AES-GCM titkosítása aktiválva' : 'Adatbázis titkosítás kikapcsolva');
  };

  // Email sablon megnyitó segéd
  const handleOpenEmailTemplate = (type: 'mot' | 'medical' | 'schedule' | 'contract', data: any) => {
    setEmailModal({
      isOpen: true,
      type,
      data,
    });
  };

  // 1. HA NINCS BEJELENTKEZVE: BEJELENTKEZŐ KÉPERNYŐ MEGJELENÍTÉSE
  if (!currentUser) {
    return (
      <LoginScreen
        users={dbState.users}
        onLogin={handleLogin}
        schoolName={dbState.schoolCompany.schoolName}
      />
    );
  }

  // Jogosultságok lekérése a bejelentkezett felhasználótól
  const perms = currentUser.permissions;

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
        onOpenThemeModal={() => setThemeModalOpen(true)}
        onOpenLogoModal={() => setLogoModalOpen(true)}
        onOpenShortcutsModal={() => setShortcutsModalOpen(true)}
        onOpenEmailModal={() => handleOpenEmailTemplate('mot', dbState.vehicles[0])}
        onPrintSchedule={() => window.print()}
        onRequestNotifications={handleRequestNotifications}
        notificationsEnabled={notificationsEnabled}
        urgentCount={urgentCount}
        currentUser={currentUser}
        onLogout={handleLogout}
        currentTheme={currentTheme}
      />

      {/* Fő Tartalmi Terület */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8">
        {/* DASHBOARD TAB */}
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

        {/* TANFOLYAM REGISZTRÁCIÓ TAB */}
        {activeTab === 'registration' && (
          perms.canRegisterCourses ? (
            <CourseRegistrationView
              dbState={dbState}
              onAddRegistration={handleAddRegistration}
              onUpdateRegistration={handleUpdateRegistration}
              onUpdateCompanyInfo={handleUpdateCompanyInfo}
              onOpenEmailModal={(type, reg) => handleOpenEmailTemplate(type, reg)}
              onNavigateToStudents={() => setActiveTab('people')}
              onAddCourseOffer={handleAddCourseOffer}
              onUpdateCourseOffer={handleUpdateCourseOffer}
              onDeleteCourseOffer={handleDeleteCourseOffer}
              onResetCourseOffers={handleResetCourseOffers}
            />
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Hozzáférés Korlátozva</h3>
              <p className="text-xs text-slate-500 mt-1">Az Ön felhasználói profilja számára a tanfolyam regisztrációs modul nem engedélyezett.</p>
            </div>
          )
        )}

        {/* GÉPJÁRMŰ FLOTTA TAB */}
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

        {/* ÓRAREND TAB */}
        {activeTab === 'schedule' && (
          perms.canManageLessons ? (
            <ScheduleView
              dbState={dbState}
              onAddLesson={handleAddLesson}
              onUpdateLesson={handleUpdateLesson}
              onDeleteLesson={handleDeleteLesson}
              onPrint={() => window.print()}
            />
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Hozzáférés Korlátozva</h3>
              <p className="text-xs text-slate-500 mt-1">Az Ön felhasználói profilja nem jogosult az órarendi beosztások szerkesztésére.</p>
            </div>
          )
        )}

        {/* OKTATÓK & TANULÓK TAB */}
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

        {/* TANKOLÁSOK TAB */}
        {activeTab === 'fuel' && (
          perms.canManageFuel ? (
            <FuelView
              dbState={dbState}
              onAddFuelLog={handleAddFuelLog}
              onDeleteFuelLog={handleDeleteFuelLog}
            />
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Hozzáférés Korlátozva</h3>
              <p className="text-xs text-slate-500 mt-1">Az Ön felhasználói profilja számára a tankolások kezelése le van tiltva.</p>
            </div>
          )
        )}

        {/* FELHASZNÁLÓK & AUDIT NAPLÓ TAB (Csak jogosultaknak) */}
        {activeTab === 'users' && (
          (currentUser.role === 'admin' || perms.canManageUsers || perms.canViewAuditLogs) ? (
            <UsersManagementView
              currentUser={currentUser}
              users={dbState.users}
              auditLogs={dbState.auditLogs || []}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
            />
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Adminisztrátori Hozzáférés Szükséges</h3>
              <p className="text-xs text-slate-500 mt-1">A felhasználók és a tevékenységnapló (Audit) megtekintése kizárólag rendszergazdáknak engedélyezett.</p>
            </div>
          )
        )}
      </main>

      {/* Lábléc Információk & Gyorsbillentyű gomb */}
      <footer className="no-print border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-3 px-4 sm:px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">AutoSuli Flotta & Admin v2.6</span>
          <span>•</span>
          <span className="font-medium text-amber-600 dark:text-amber-400">
            {dbState.schoolCompany.schoolName}
          </span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">Bejelentkezve: {currentUser.fullName} ({currentUser.role === 'admin' ? 'Adminisztrátor' : 'Ügyviteli dolgozó'})</span>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => setLogoModalOpen(true)}
            className="hover:text-amber-600 transition-colors"
          >
            App Logó
          </button>
          <span>•</span>
          <button
            onClick={() => setThemeModalOpen(true)}
            className="hover:text-amber-600 transition-colors"
          >
            Dizájn Sablonok
          </button>
          <span>•</span>
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
            <span className="hidden sm:inline">Gyorsbillentyűk (Alt+1..7, ?)</span>
            <span className="sm:hidden">Súgó</span>
          </button>
        </div>
      </footer>

      {/* ALKALMAZÁS LOGÓ TESTRESZABÓ MODÁL */}
      <LogoCustomizerModal
        isOpen={logoModalOpen}
        onClose={() => setLogoModalOpen(false)}
        currentLogo={dbState.appLogo}
        onSaveLogo={handleSaveLogo}
        currentTheme={currentTheme}
        schoolName={dbState.schoolCompany.schoolName}
      />

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
        onReplaceDbState={(newState) => {
          handleUpdateDb(newState);
          logAudit('IMPORT', 'USERS', 'Teljes adatbázis csere vagy visszaállítás végrehajtva');
        }}
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

      {/* DIZÁJN SABLONOK MODÁL */}
      <ThemeSwitcherModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
        darkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
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
                <span>Felhasználók & Audit</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold">Alt + 7</kbd>
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
