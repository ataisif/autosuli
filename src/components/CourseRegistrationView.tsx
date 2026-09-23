import React, { useState, useEffect } from 'react';
import {
  FileSignature,
  UserPlus,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  User,
  Phone,
  Mail,
  FileText,
  Printer,
  Eye,
  Send,
  Plus,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertCircle,
  FileCheck,
  BookOpen,
} from 'lucide-react';
import {
  DatabaseState,
  CourseRegistration,
  CourseOffer,
  Student,
  SchoolCompanyInfo,
  VehicleCategory,
} from '../types';
import { SignaturePad } from './SignaturePad';
import { CompanySettingsModal } from './CompanySettingsModal';
import { ContractPrintView } from './ContractPrintView';

interface CourseRegistrationViewProps {
  dbState: DatabaseState;
  onAddRegistration: (reg: CourseRegistration, autoCreateStudent: boolean) => void;
  onUpdateRegistration: (reg: CourseRegistration) => void;
  onUpdateCompanyInfo: (info: SchoolCompanyInfo) => void;
  onOpenEmailModal: (type: 'contract', reg: CourseRegistration) => void;
  onNavigateToStudents?: () => void;
}

export const CourseRegistrationView: React.FC<CourseRegistrationViewProps> = ({
  dbState,
  onAddRegistration,
  onUpdateRegistration,
  onUpdateCompanyInfo,
  onOpenEmailModal,
  onNavigateToStudents,
}) => {
  const [selectedSubTab, setSelectedSubTab] = useState<'new_form' | 'contracts_list'>('new_form');
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [printContract, setPrintContract] = useState<CourseRegistration | null>(null);

  // Kereső & szűrő a szerződések listájához
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Új regisztráció űrlap állapot
  const todayStr = new Date().toISOString().slice(0, 10);
  const nextYearStr = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  // Alapértelmezett választott tanfolyam
  const defaultCourse = dbState.courseOffers[0] || {
    id: 'course-b',
    name: 'B Kategóriás Személygépkocsi-vezetői Tanfolyam',
    category: 'B' as VehicleCategory,
    basePrice: 345000,
    examFee: 26000,
    paymentOptions: ['Egyösszegben', '3 részletben'],
  };

  const [selectedCourseId, setSelectedCourseId] = useState<string>(defaultCourse.id);
  const [autoSyncToStudents, setAutoSyncToStudents] = useState<boolean>(true);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Szerződés űrlap mezők
  const [formData, setFormData] = useState({
    contractNumber: `AS-${new Date().getFullYear()}/${String(
      dbState.courseRegistrations.length + 1
    ).padStart(3, '0')}`,
    date: todayStr,
    category: defaultCourse.category,
    courseName: defaultCourse.name,
    studentName: '',
    birthName: '',
    mothersName: '',
    birthPlace: 'Budapest',
    birthDate: '2005-01-01',
    idCardNumber: '',
    address: '',
    phone: '+36 ',
    email: '',
    medicalExamExpiry: nextYearStr,
    hasExistingLicense: 'Nincs',
    instructorId: dbState.instructors[0]?.id || '',
    paymentPlan: defaultCourse.paymentOptions[0] || 'Egyösszegben',
    totalFee: (defaultCourse.basePrice || 300000) + (defaultCourse.examFee || 0),
    initialDeposit: 100000,
    studentSignatureSvg: '',
    representativeSignatureSvg: '',
    notes: '',
  });

  // Ha a felhasználó létező tanulót választ ki az ismertek közül, betöltjük az adatait
  const [prefillStudentId, setPrefillStudentId] = useState<string>('');

  // Tanfolyam választás változása dinamikusan frissíti a kategóriát, árat és konstrukciókat
  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    const course = dbState.courseOffers.find((c) => c.id === courseId);
    if (course) {
      setFormData((prev) => ({
        ...prev,
        category: course.category,
        courseName: course.name,
        paymentPlan: course.paymentOptions[0] || 'Egyösszegben',
        totalFee: course.basePrice + (course.examFee || 0),
        initialDeposit: Math.round((course.basePrice + (course.examFee || 0)) / 3 / 1000) * 1000,
      }));
    }
  };

  // Meglévő tanuló adatainak automatikus betöltése az űrlapba
  const handlePrefillStudent = (studId: string) => {
    setPrefillStudentId(studId);
    if (!studId) return;

    const student = dbState.students.find((s) => s.id === studId);
    if (student) {
      setFormData((prev) => ({
        ...prev,
        studentName: student.name,
        birthName: student.name,
        phone: student.phone || prev.phone,
        email: student.email || prev.email,
        category: student.category || prev.category,
        medicalExamExpiry: student.medicalExamExpiry || prev.medicalExamExpiry,
        instructorId: student.instructorId || prev.instructorId,
      }));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'totalFee' || name === 'initialDeposit'
          ? Number(value) || 0
          : value,
    }));
  };

  // Szerződés beküldése és mentése
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.studentName.trim()) {
      alert('Kérjük, adja meg a Tanuló nevét!');
      return;
    }

    if (!formData.studentSignatureSvg) {
      if (
        !confirm(
          'A tanuló digitális aláírása még hiányzik. Kívánja piszkozatként elmenteni a szerződést?'
        )
      ) {
        return;
      }
    }

    const assignedInstructor = dbState.instructors.find((i) => i.id === formData.instructorId);

    const newRegistration: CourseRegistration = {
      id: `reg-${Date.now()}`,
      contractNumber: formData.contractNumber,
      date: formData.date,
      courseId: selectedCourseId,
      courseName: formData.courseName,
      category: formData.category,
      studentName: formData.studentName.trim(),
      birthName: formData.birthName.trim() || formData.studentName.trim(),
      mothersName: formData.mothersName.trim(),
      birthPlace: formData.birthPlace.trim(),
      birthDate: formData.birthDate,
      idCardNumber: formData.idCardNumber.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      medicalExamExpiry: formData.medicalExamExpiry,
      hasExistingLicense: formData.hasExistingLicense,
      instructorId: formData.instructorId || undefined,
      instructorName: assignedInstructor?.name || undefined,
      paymentPlan: formData.paymentPlan,
      totalFee: formData.totalFee,
      initialDeposit: formData.initialDeposit,
      studentSignatureSvg: formData.studentSignatureSvg || undefined,
      representativeSignatureSvg:
        formData.representativeSignatureSvg ||
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M 20 30 Q 60 50 100 20 T 170 35" stroke="%230284c7" stroke-width="2" fill="none"/></svg>',
      signedAt: formData.studentSignatureSvg ? new Date().toISOString() : undefined,
      status: formData.studentSignatureSvg ? 'signed' : 'draft',
      notes: formData.notes,
      syncedToStudents: autoSyncToStudents,
    };

    onAddRegistration(newRegistration, autoSyncToStudents);

    setSuccessToast(
      `Szerződés (${newRegistration.contractNumber} - ${newRegistration.studentName}) sikeresen rögzítve${
        autoSyncToStudents ? ' és a tanulói törzsbe áttöltve!' : '!'
      }`
    );

    // Kérdés nyomtatásra vagy emailre
    setPrintContract(newRegistration);

    // Űrlap visszaállítása következő szerződésre
    setFormData((prev) => ({
      ...prev,
      contractNumber: `AS-${new Date().getFullYear()}/${String(
        dbState.courseRegistrations.length + 2
      ).padStart(3, '0')}`,
      studentName: '',
      birthName: '',
      mothersName: '',
      idCardNumber: '',
      address: '',
      phone: '+36 ',
      email: '',
      studentSignatureSvg: '',
      notes: '',
    }));
    setPrefillStudentId('');

    setTimeout(() => setSuccessToast(null), 5000);
  };

  // Szűrt szerződések
  const filteredRegistrations = dbState.courseRegistrations.filter((reg) => {
    const matchSearch =
      reg.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === 'all' || reg.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      {/* Fő Címsor & Gyorsgombok */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20">
            <FileSignature className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Tanfolyam Regisztráció & Képzési Szerződés</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                Érintőképernyős Aláírással
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dinamikus adatcsere a tanulók törzsével, digitális aláírás rögzítés, email továbbítás és nyomtatás
            </p>
          </div>
        </div>

        {/* Felső műveletek: Cégadatok beállítása & Alfülek */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCompanyModalOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Képző Cégadatai ({dbState.schoolCompany.schoolName.slice(0, 15)}...)</span>
          </button>
        </div>
      </div>

      {/* Sikeres visszajelzés Toast */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-medium">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{successToast}</span>
          </div>
          {onNavigateToStudents && (
            <button
              onClick={onNavigateToStudents}
              className="underline font-bold hover:text-emerald-950 dark:hover:text-white"
            >
              Ugrás a Tanulókhoz &rarr;
            </button>
          )}
        </div>
      )}

      {/* Al-navigáció: Új regisztráció űrlap VAGY Szerződések listája */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setSelectedSubTab('new_form')}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors ${
            selectedSubTab === 'new_form'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Új Tanfolyam Regisztráció & Aláírás</span>
        </button>

        <button
          onClick={() => setSelectedSubTab('contracts_list')}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors ${
            selectedSubTab === 'contracts_list'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Tárolt Szerződések ({dbState.courseRegistrations.length})</span>
        </button>
      </div>

      {/* TARTALOM 1: ÚJ REGISZTRÁCIÓS ŰRLAP */}
      {selectedSubTab === 'new_form' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Előzetes adatok & Dinamikus Tanfolyam Választó Kártya */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  1. Képzés & Szerződési Alapadatok
                </h3>
              </div>
              {/* Ismert meglévő tanuló előtöltése */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-500">Ismert tanuló adatainak betöltése:</span>
                <select
                  value={prefillStudentId}
                  onChange={(e) => handlePrefillStudent(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
                >
                  <option value="">-- Új tanuló bevitele --</option>
                  {dbState.students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category} kat., {s.phone})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Választható Tanfolyam *
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white"
                >
                  {dbState.courseOffers.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.category} kategória - {course.basePrice.toLocaleString('hu-HU')} Ft)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Szerződés száma
                </label>
                <input
                  type="text"
                  name="contractNumber"
                  value={formData.contractNumber}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Szerződéskötés dátuma
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Tanfolyam részletező panel */}
            {(() => {
              const activeCourse = dbState.courseOffers.find((c) => c.id === selectedCourseId);
              if (!activeCourse) return null;
              return (
                <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 text-xs text-amber-950 dark:text-amber-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="font-bold text-amber-900 dark:text-amber-300">
                      Kötelező előírások:
                    </span>
                    <div className="flex flex-wrap items-center gap-3 text-[11px]">
                      <span>Elmélet: <b>{activeCourse.theoryHours} óra</b></span>
                      <span>•</span>
                      <span>Gyakorlati vezetés: <b>{activeCourse.practiceHours} óra</b></span>
                      <span>•</span>
                      <span>Kötelező menettáv: <b>{activeCourse.requiredKm} km</b></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 block">Alapdíj + Hatósági vizsgadíj:</span>
                    <span className="text-sm font-extrabold text-amber-900 dark:text-amber-200">
                      {(activeCourse.basePrice + (activeCourse.examFee || 0)).toLocaleString('hu-HU')} Ft
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 2. Tanuló Személyes Adatai Űrlap (Dinamikusan áttöltődik a Tanulók táblába) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  2. Képzésben Résztvevő Tanuló Adatai
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                A csillaggal (*) jelölt mezők kitöltése kötelező
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tanuló teljes neve *
                </label>
                <input
                  type="text"
                  name="studentName"
                  required
                  placeholder="Pl: Nagy Dániel"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Születési név
                </label>
                <input
                  type="text"
                  name="birthName"
                  placeholder="Ha megegyezik, üresen hagyható"
                  value={formData.birthName}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Anyja születési neve *
                </label>
                <input
                  type="text"
                  name="mothersName"
                  placeholder="Pl: Kis Mária"
                  value={formData.mothersName}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Születési hely
                </label>
                <input
                  type="text"
                  name="birthPlace"
                  value={formData.birthPlace}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Születési idő
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Személyi igazolvány száma *
                </label>
                <input
                  type="text"
                  name="idCardNumber"
                  placeholder="Pl: 123456AB"
                  value={formData.idCardNumber}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Állandó lakcím *
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="Pl: 1118 Budapest, Rétköz u. 12. 2/4"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telefonszám *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="+36 30 123 4567"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email cím (szerződés & értesítők ide mennek) *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="tanulo@gmail.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Orvosi alkalmassági érvényessége *
                </label>
                <input
                  type="date"
                  name="medicalExamExpiry"
                  value={formData.medicalExamExpiry}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Meglévő jogosítvány kategóriák
                </label>
                <input
                  type="text"
                  name="hasExistingLicense"
                  placeholder="Pl: AM, A1 vagy Nincs"
                  value={formData.hasExistingLicense}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Dinamikus Adatkapcsolat Kapcsoló: Áttöltés a Tanulók közé */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSyncToStudents}
                  onChange={(e) => setAutoSyncToStudents(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Dinamikus áttöltés: Tanuló azonnali felvétele az autósiskola aktív tanulói törzsébe
                </span>
              </label>
              <span className="text-[11px] text-slate-500">
                {autoSyncToStudents
                  ? '✓ Automatikusan létrejön a tanulói profil az Órarendhez és Képzéshez'
                  : 'Csak szerződésként tárolódik'}
              </span>
            </div>
          </div>

          {/* 3. Pénzügyi konstrukció & Beosztott oktató */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CreditCard className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                3. Fizetési Konstrukció & Oktató Választás
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Választott fizetési ütemezés
                </label>
                <select
                  name="paymentPlan"
                  value={formData.paymentPlan}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Egyösszegben (5% kedvezmény)">Egyösszegben (5% kedvezmény)</option>
                  <option value="3 részletben kamatmentesen">3 részletben kamatmentesen</option>
                  <option value="Óránkénti fizetés vezetéskor">Óránkénti fizetés vezetéskor</option>
                  <option value="Céges átutalás (30 nap)">Céges átutalás (30 nap)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Teljes tanfolyami díj (Ft)
                </label>
                <input
                  type="number"
                  name="totalFee"
                  value={formData.totalFee}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Befizetett kezdőrészlet / előleg (Ft)
                </label>
                <input
                  type="number"
                  name="initialDeposit"
                  value={formData.initialDeposit}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Választott gyakorlati oktató
                </label>
                <select
                  name="instructorId"
                  value={formData.instructorId}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">-- Még nincs kijelölve --</option>
                  {dbState.instructors.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.licenseNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 4. Digitális Érintőképernyős Aláírások Területe */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div className="flex items-center space-x-2">
                <FileSignature className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  4. Digitális Aláírás Érintőképernyőn (Szerződő Felek)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Érintőceruzával, ujjal vagy egérrel közvetlenül a képernyőn aláírható
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tanuló Aláírása */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
                <SignaturePad
                  label="Tanuló / Képzésben résztvevő aláírása *"
                  signeeName={formData.studentName || 'Tanuló'}
                  signeeRole="Képzésben résztvevő"
                  value={formData.studentSignatureSvg}
                  onChange={(dataUrl) =>
                    setFormData((prev) => ({ ...prev, studentSignatureSvg: dataUrl }))
                  }
                />
              </div>

              {/* Iskolavezető / Képviselet Aláírása */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
                <SignaturePad
                  label="Iskolavezető / Képviselő aláírása"
                  signeeName={dbState.schoolCompany.representativeName}
                  signeeRole="Képző szerv képviselője"
                  value={formData.representativeSignatureSvg}
                  onChange={(dataUrl) =>
                    setFormData((prev) => ({ ...prev, representativeSignatureSvg: dataUrl }))
                  }
                />
              </div>
            </div>

            {/* Megjegyzések */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Egyedi megjegyzések, kedvezmények vagy feltételek
              </label>
              <textarea
                name="notes"
                rows={2}
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Pl: E-learning hozzáférés azonnal aktiválva, első részlet készpénzben átvéve..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Rögzítő Műveleti Sáv */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>A szerződés a helyi adatbázisban tárolódik, azonnal nyomtatható és küldhető emailben.</span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="submit"
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold shadow-md shadow-amber-600/25 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Szerződés Véglegesítése & Tárolása</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TARTALOM 2: TÁROLT SZERZŐDÉSEK LISTÁJA */}
      {selectedSubTab === 'contracts_list' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Kereső és szűrősáv */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Keresés tanuló neve, szerződésszám vagy email alapján..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="all">Minden kategória</option>
                <option value="A">"A" Motorkerékpár</option>
                <option value="B">"B" Személyautó</option>
                <option value="C">"C" Teherautó</option>
                <option value="CE">"CE" Nehézpótkocsi</option>
              </select>

              <button
                onClick={() => setSelectedSubTab('new_form')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Új Szerződés</span>
              </button>
            </div>
          </div>

          {/* Táblázat */}
          {filteredRegistrations.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs">Nem található a keresési feltételeknek megfelelő szerződés.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Szerződésszám & Dátum</th>
                    <th className="py-3 px-4">Tanuló Neve & Elérhetőség</th>
                    <th className="py-3 px-4">Tanfolyam & Kategória</th>
                    <th className="py-3 px-4">Tandíj & Befizetés</th>
                    <th className="py-3 px-4">Aláírás Állapota</th>
                    <th className="py-3 px-4 text-right">Műveletek</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 dark:text-white block">
                          {reg.contractNumber}
                        </span>
                        <span className="text-[11px] text-slate-400">{reg.date}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          {reg.studentName}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {reg.phone} • {reg.email}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            {reg.category}
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                            {reg.courseName}
                          </span>
                        </div>
                        {reg.instructorName && (
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Oktató: {reg.instructorName}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {reg.totalFee.toLocaleString('hu-HU')} Ft
                        </span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">
                          Előleg: {reg.initialDeposit.toLocaleString('hu-HU')} Ft ({reg.paymentPlan})
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {reg.studentSignatureSvg ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                            <Check className="w-3 h-3" />
                            <span>Digitálisan aláírva</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                            <span>Aláírásra vár</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onOpenEmailModal('contract', reg)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors"
                            title="Továbbítás emailben a feleknek"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPrintContract(reg)}
                            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition-colors"
                            title="Megtekintés és Nyomtatás"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Nyomtatás</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CÉGADATOK SZERKESZTÉSE MODÁL */}
      <CompanySettingsModal
        isOpen={companyModalOpen}
        onClose={() => setCompanyModalOpen(false)}
        companyInfo={dbState.schoolCompany}
        onSaveCompanyInfo={onUpdateCompanyInfo}
      />

      {/* SZERZŐDÉS MEGTEKINTÉS ÉS NYOMTATÁS NÉZET MODÁL */}
      {printContract && (
        <ContractPrintView
          registration={printContract}
          schoolInfo={dbState.schoolCompany}
          onClose={() => setPrintContract(null)}
          onSendEmail={(reg) => {
            onOpenEmailModal('contract', reg);
          }}
        />
      )}
    </div>
  );
};
