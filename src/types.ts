export type VehicleCategory =
  | 'AM'
  | 'A1'
  | 'A2'
  | 'A'
  | 'B'
  | 'BE'
  | 'C'
  | 'CE'
  | 'D'
  | 'DE'
  | 'T'
  | string;

export type VehicleStatus = 'active' | 'in_use' | 'service' | 'deregistered';

export interface Vehicle {
  id: string;
  plateNumber: string; // Pl: AA-BC-123 vagy ABC-123
  brandModel: string; // Pl: Toyota Yaris 1.5 Hybrid
  year: number;
  category: VehicleCategory;
  transmission: 'Manuális' | 'Automata';
  currentKm: number;
  status: VehicleStatus;
  motDate: string; // YYYY-MM-DD (Műszaki vizsga érvényesség)
  motReminderDays: number;
  dualPedals: boolean; // Pótpedál felszerelés
  notes?: string;
  // Kivonás / Üzembehelyezés adatok
  deregistrationDate?: string;
  deregistrationReason?: string;
  reactivationDate?: string;
  // Jelenleg kint lévő állapot
  currentInstructorId?: string;
  checkoutTime?: string;
  checkoutKm?: number;
}

export interface VehicleAssignmentLog {
  id: string;
  vehicleId: string;
  instructorId: string;
  checkedOutAt: string;
  checkedInAt?: string;
  startKm: number;
  endKm?: number;
  purpose?: string;
  notes?: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  date: string;
  type:
    | 'Időszakos kötelező szerviz'
    | 'Fékjavítás'
    | 'Kuplung/Váltó'
    | 'Olajcsere'
    | 'Gumicsere'
    | 'Karosszéria/Fényezés'
    | 'Műszaki felkészítés'
    | 'Pótpedál karbantartás'
    | 'Egyéb javítás';
  description: string;
  workshop: string;
  cost: number;
  kmAtService: number;
  status: 'Befejezett' | 'Folyamatban' | 'Tervezett';
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  instructorId?: string;
  date: string;
  currentKm: number;
  liters: number;
  totalCost: number;
  fuelType: 'Benzin (E10)' | 'Gázolaj (B7)' | 'Elektromos (kWh)' | 'LPG';
  fullTank: boolean;
  calculatedLitersPer100Km?: number;
}

export interface Instructor {
  id: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string; // Oktatói igazolvány száma
  categories: VehicleCategory[];
  preferredVehicleId?: string;
  status: 'active' | 'leave' | 'inactive';
  color: string;
  notes?: string;
}

export type TheoryExamStatus = 'Nem kezdte' | 'Folyamatban' | 'Sikeres' | 'Ismétlő';
export type PaymentStatus = 'Rendezve' | 'Részletben' | 'Hátralék';

export interface Student {
  id: string;
  name: string;
  phone: string;
  email: string;
  category: VehicleCategory;
  instructorId?: string;
  theoryExamStatus: TheoryExamStatus;
  medicalExamExpiry: string; // YYYY-MM-DD
  completedHours: number; // pl. 26
  requiredHours: number; // pl. 30
  completedKm: number; // pl. 510
  requiredKm: number; // pl. 580
  paymentStatus: PaymentStatus;
  status: 'active' | 'exam_ready' | 'graduated' | 'suspended';
  notes?: string;
}

export type LessonType =
  | 'Alapoktatás (tanpálya)'
  | 'Városi vezetés'
  | 'Országúti vezetés'
  | 'Éjszakai vezetés'
  | 'Gyakorló óra'
  | 'Hatósági Forgalmi Vizsga';

export interface Lesson {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  instructorId: string;
  studentId: string;
  vehicleId: string;
  lessonType: LessonType;
  status: 'scheduled' | 'completed' | 'cancelled';
  kmStart?: number;
  kmEnd?: number;
  notes?: string;
}

export interface ScheduleConflict {
  id: string;
  type: 'instructor' | 'student' | 'vehicle';
  severity: 'error' | 'warning';
  title: string;
  description: string;
  lessonA: Lesson;
  lessonB: Lesson;
}

export interface NotificationLog {
  id: string;
  title: string;
  message: string;
  type: 'mot_due' | 'medical_due' | 'service_due' | 'conflict' | 'info';
  date: string;
  sentAsDesktop: boolean;
  sentAsEmail: boolean;
}

export interface SchoolCompanyInfo {
  schoolName: string;
  companyName: string; // Cégnév
  registrationNumber: string; // Cégjegyzékszám
  taxNumber: string; // Adószám
  accreditationNumber: string; // Képzési engedély / nyilvántartási szám
  address: string; // Székhely / Cím
  phone: string;
  email: string;
  website: string;
  representativeName: string; // Képviselő / Iskolavezető neve
  bankAccountNumber: string; // Bankszámlaszám
  termsText?: string; // Általános képzési szerződési feltételek szövege
}

export interface CourseOffer {
  id: string;
  name: string; // Pl. "B kategóriás személygépkocsi-vezetői tanfolyam"
  category: VehicleCategory;
  theoryHours: number; // pl. 28 óra
  practiceHours: number; // pl. 30 óra
  requiredKm: number; // pl. 580 km
  basePrice: number; // Alap tandíj (Ft)
  examFee: number; // Hatósági vizsgadíj (Ft)
  description: string;
  paymentOptions: string[]; // Pl. 'Egyösszegű fizetés', '3 részletben'
}

export interface CourseRegistration {
  id: string;
  contractNumber: string; // Pl. AS-SZERZ-2026/001
  date: string; // YYYY-MM-DD
  courseId: string;
  courseName: string;
  category: VehicleCategory;
  
  // Tanuló adatai
  studentName: string;
  birthName?: string;
  mothersName: string;
  birthPlace: string;
  birthDate: string; // YYYY-MM-DD
  idCardNumber: string; // Személyi igazolvány szám
  address: string; // Lakcím
  phone: string;
  email: string;
  medicalExamExpiry: string; // Orvosi érvényesség
  hasExistingLicense?: string; // Meglévő vezetői engedély kategóriák
  
  // Választott oktató (opcionális)
  instructorId?: string;
  instructorName?: string;

  // Fizetési konstrukció
  paymentPlan: string;
  totalFee: number;
  initialDeposit: number;
  
  // Digitális Aláírások (Base64 data URL vagy vector path)
  studentSignatureSvg?: string;
  representativeSignatureSvg?: string;
  signedAt?: string;

  // Státusz
  status: 'draft' | 'signed' | 'archived';
  notes?: string;
  syncedToStudents: boolean; // Automatikusan áttöltve a tanulók közé
  studentId?: string;
}

export type UserRole = 'admin' | 'clerk'; // Adminisztrátor vagy Ügyviteli dolgozó

export interface UserPermissions {
  // Tanfolyam és regisztráció
  canRegisterCourses: boolean; // Új tanfolyami regisztráció és szerződéskötés
  canEditRegistrations: boolean; // Szerződések módosítása/törlése
  canPrintContracts: boolean; // Szerződés nyomtatás és PDF export
  // Járművek és flotta
  canCheckoutVehicles: boolean; // Jármű kiadás és visszavétel oktatóknak
  canEditVehicles: boolean; // Jármű felvétele, szerkesztése, kivonása/üzembehelyezése
  canManageMaintenance: boolean; // Szerviz- és műszaki vizsga bejegyzések kezelése
  // Órarend és oktatás
  canManageLessons: boolean; // Órák beosztása, szerkesztése, lemondása
  canOverrideScheduleConflicts: boolean; // Órarendi ütközések felülbírálása
  // Tanulók és oktatók
  canManageStudents: boolean; // Tanulók felvétele, szerkesztése, törlése
  canManageInstructors: boolean; // Oktatók adatainak kezelése
  // Pénzügy és üzemanyag
  canManageFuel: boolean; // Tankolási bizonylatok rögzítése, törlése
  // Beállítások és cégadatok
  canEditCompanyInfo: boolean; // Cégadatok és szerződés záradék szerkesztése
  canExportImportExcel: boolean; // Excel import/export végrehajtása
  canManageUsers: boolean; // Felhasználók és jogosultságok kezelése (Csak admin)
  canViewAuditLogs: boolean; // Tevékenységnapló (Audit log) megtekintése
}

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  passwordHash: string; // Egyszerűsített sha/b64 jelszó vagy tiszta jelszó offline környezetben
  active: boolean;
  avatarColor: string;
  createdAt: string;
  lastLoginAt?: string;
  permissions: UserPermissions;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  userId: string;
  username: string;
  userRole: UserRole;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'CHECKOUT' | 'CHECKIN' | 'SIGN' | 'IMPORT' | 'EXPORT';
  module: 'AUTH' | 'USERS' | 'REGISTRATION' | 'VEHICLES' | 'SCHEDULE' | 'STUDENTS' | 'INSTRUCTORS' | 'FUEL' | 'MAINTENANCE' | 'COMPANY';
  targetId?: string;
  targetName?: string;
  details: string; // Részletes leírás, mit módosítottak
  ipOrDevice?: string;
}

export type DesignTemplateId = 'amber-classic' | 'emerald-modern' | 'blue-corporate' | 'violet-executive' | 'slate-minimal' | 'crimson-speed';

export interface AppLogoConfig {
  type: 'icon' | 'image';
  iconName?: string; // pl. 'car', 'steering-wheel', 'shield', 'graduation-cap', 'truck', 'award', 'compass', 'zap', 'gauge'
  imageUrl?: string; // Base64 data URL vagy kép URL
  uploadedFileName?: string;
}

export type CalendarClient = 'gmail' | 'outlook' | 'thunderbird' | 'ics';
export type EmailClientMode = 'gmail' | 'outlook' | 'thunderbird' | 'mailto' | 'direct';

export interface CalendarSyncSettings {
  preferredClient: CalendarClient;
  autoSyncMot: boolean;
  autoSyncMedical: boolean;
  autoSyncLessons: boolean;
  autoSyncMaintenance: boolean;
  reminderDaysAhead: number[]; // pl. [30, 15, 7, 1]
  calendarName: string;
  defaultAlarmMinutes: number; // pl. 1440 (1 nap)
}

export interface AutoEmailReminderSettings {
  enabled: boolean;
  clientMode: EmailClientMode;
  checkFrequency: 'daily' | 'on_open' | 'weekly';
  lastRunDate?: string; // YYYY-MM-DD
  motRecipientEmail: string; // pl. muszaki@autosuli.hu
  bccSchoolAdmin: boolean;
  schoolAdminEmail: string;
  motThresholdDays: number; // pl. 30
  medicalThresholdDays: number; // pl. 45
  sendDuplicateIntervalDays: number; // pl. 7 napig ne küldje újra ugyanarra
  customMotSubject?: string;
  customMotBody?: string;
  customMedicalSubject?: string;
  customMedicalBody?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  senderName?: string;
}

export interface EmailReminderLog {
  id: string;
  timestamp: string; // ISO
  targetId: string; // vehicleId vagy studentId
  targetName: string;
  type: 'mot' | 'medical' | 'schedule';
  recipient: string;
  subject: string;
  clientUsed: EmailClientMode;
  status: 'sent' | 'opened_in_client' | 'queued';
  notes?: string;
}

export interface DesignTemplate {
  id: DesignTemplateId;
  name: string;
  description: string;
  primaryColor: string;
  accentBadge: string;
  previewBg: string;
}

export interface DatabaseState {
  vehicles: Vehicle[];
  instructors: Instructor[];
  students: Student[];
  lessons: Lesson[];
  maintenance: MaintenanceRecord[];
  fuelLogs: FuelLog[];
  assignmentLogs: VehicleAssignmentLog[];
  notifications: NotificationLog[];
  schoolCompany: SchoolCompanyInfo;
  courseOffers: CourseOffer[];
  courseRegistrations: CourseRegistration[];
  users: AppUser[];
  auditLogs: AuditLogEntry[];
  currentTheme: DesignTemplateId;
  appLogo?: AppLogoConfig;
  calendarSyncSettings?: CalendarSyncSettings;
  autoEmailSettings?: AutoEmailReminderSettings;
  emailReminderLogs?: EmailReminderLog[];
  isEncrypted: boolean;
  encryptionPasswordHash?: string;
  lastSaved: string;
}
