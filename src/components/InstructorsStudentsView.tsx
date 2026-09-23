import React, { useState } from 'react';
import {
  Users,
  GraduationCap,
  UserCheck,
  Plus,
  Mail,
  Phone,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Car,
  Award,
  Search,
} from 'lucide-react';
import { DatabaseState, Instructor, Student, VehicleCategory, TheoryExamStatus, PaymentStatus } from '../types';

interface InstructorsStudentsViewProps {
  dbState: DatabaseState;
  onAddInstructor: (instructor: Instructor) => void;
  onUpdateInstructor: (instructor: Instructor) => void;
  onDeleteInstructor: (id: string) => void;
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onOpenEmailWithTemplate: (type: 'mot' | 'medical' | 'schedule', data: any) => void;
}

export const InstructorsStudentsView: React.FC<InstructorsStudentsViewProps> = ({
  dbState,
  onAddInstructor,
  onUpdateInstructor,
  onDeleteInstructor,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onOpenEmailWithTemplate,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'students' | 'instructors'>('students');
  const [searchQuery, setSearchQuery] = useState('');

  // Modálok
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [instructorModalOpen, setInstructorModalOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);

  // Tanuló Form állapot
  const [studentForm, setStudentForm] = useState<Partial<Student>>({
    name: '',
    phone: '+36 30 ',
    email: '',
    category: 'B',
    instructorId: dbState.instructors[0]?.id || '',
    theoryExamStatus: 'Sikeres',
    medicalExamExpiry: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    completedHours: 0,
    requiredHours: 30,
    completedKm: 0,
    requiredKm: 580,
    paymentStatus: 'Rendezve',
    status: 'active',
    notes: '',
  });

  // Oktató Form állapot
  const [instructorForm, setInstructorForm] = useState<Partial<Instructor>>({
    name: '',
    phone: '+36 30 ',
    email: '',
    licenseNumber: 'OKT-2024-',
    categories: ['B'],
    preferredVehicleId: dbState.vehicles[0]?.id || '',
    status: 'active',
    color: '#3b82f6',
    notes: '',
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const getDaysUntil = (targetDateStr: string) => {
    const target = new Date(targetDateStr).getTime();
    const today = new Date(todayStr).getTime();
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  };

  const filteredStudents = dbState.students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone.includes(searchQuery) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInstructors = dbState.instructors.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.phone.includes(searchQuery) ||
    i.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenNewStudent = () => {
    setEditingStudent(null);
    setStudentForm({
      id: `stud-${Date.now()}`,
      name: '',
      phone: '+36 30 ',
      email: '',
      category: 'B',
      instructorId: dbState.instructors[0]?.id || '',
      theoryExamStatus: 'Sikeres',
      medicalExamExpiry: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      completedHours: 0,
      requiredHours: 30,
      completedKm: 0,
      requiredKm: 580,
      paymentStatus: 'Rendezve',
      status: 'active',
      notes: '',
    });
    setStudentModalOpen(true);
  };

  const handleOpenEditStudent = (s: Student) => {
    setEditingStudent(s);
    setStudentForm({ ...s });
    setStudentModalOpen(true);
  };

  const handleSaveStudent = () => {
    if (!studentForm.name?.trim()) {
      alert('Kérjük adja meg a tanuló nevét!');
      return;
    }
    const studentData = studentForm as Student;
    if (editingStudent) {
      onUpdateStudent(studentData);
    } else {
      onAddStudent(studentData);
    }
    setStudentModalOpen(false);
  };

  const handleOpenNewInstructor = () => {
    setEditingInstructor(null);
    setInstructorForm({
      id: `inst-${Date.now()}`,
      name: '',
      phone: '+36 30 ',
      email: '',
      licenseNumber: 'OKT-2024-',
      categories: ['B'],
      preferredVehicleId: dbState.vehicles[0]?.id || '',
      status: 'active',
      color: '#3b82f6',
      notes: '',
    });
    setInstructorModalOpen(true);
  };

  const handleOpenEditInstructor = (inst: Instructor) => {
    setEditingInstructor(inst);
    setInstructorForm({ ...inst });
    setInstructorModalOpen(true);
  };

  const handleSaveInstructor = () => {
    if (!instructorForm.name?.trim()) {
      alert('Kérjük adja meg az oktató nevét!');
      return;
    }
    const instData = instructorForm as Instructor;
    if (editingInstructor) {
      onUpdateInstructor(instData);
    } else {
      onAddInstructor(instData);
    }
    setInstructorModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Fejléc és Al-fülek */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-amber-500" />
            <span>Oktatói & Tanulói Nyilvántartás</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tanulók kötelező óra- és kilométerszámai, orvosi érvényességek és oktatói képesítések.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveSubTab('students')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeSubTab === 'students'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Tanulók ({dbState.students.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('instructors')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeSubTab === 'instructors'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Oktatók ({dbState.instructors.length})</span>
            </button>
          </div>

          <button
            onClick={activeSubTab === 'students' ? handleOpenNewStudent : handleOpenNewInstructor}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-md shadow-amber-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{activeSubTab === 'students' ? 'Új Tanuló' : 'Új Oktató'}</span>
          </button>
        </div>
      </div>

      {/* Keresősáv */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          placeholder={activeSubTab === 'students' ? 'Keresés tanuló neve, telefonja vagy emailje szerint...' : 'Keresés oktató neve vagy igazolványszáma szerint...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
        />
      </div>

      {/* TANULÓK LISTÁJA */}
      {activeSubTab === 'students' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => {
            const instructor = dbState.instructors.find((i) => i.id === student.instructorId);
            const daysToMedical = getDaysUntil(student.medicalExamExpiry);
            const isMedicalUrgent = daysToMedical <= 45;
            const hoursPercent = Math.min(100, Math.round((student.completedHours / student.requiredHours) * 100));
            const kmPercent = Math.min(100, Math.round((student.completedKm / student.requiredKm) * 100));

            return (
              <div
                key={student.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-shadow space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {student.name}
                      </h3>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2 mt-0.5">
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          {student.category} kategória
                        </span>
                        <span>•</span>
                        <span>{instructor ? instructor.name : 'Nincs oktató kijelölve'}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        student.status === 'exam_ready'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : student.status === 'graduated'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {student.status === 'exam_ready'
                        ? 'Vizsgára kész'
                        : student.status === 'graduated'
                        ? 'Sikeres forgalmi vizsga'
                        : 'Aktív vezetés'}
                    </span>
                  </div>

                  {/* Elérhetőségek */}
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{student.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{student.email}</span>
                    </div>
                  </div>

                  {/* Kötelező órák és kilométerek progress bar */}
                  <div className="space-y-2 pt-1">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1 font-medium text-slate-700 dark:text-slate-300">
                        <span>Levezetett órák:</span>
                        <span className="font-bold">
                          {student.completedHours} / {student.requiredHours} óra ({hoursPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${hoursPercent}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1 font-medium text-slate-700 dark:text-slate-300">
                        <span>Levezetett távolság:</span>
                        <span className="font-bold">
                          {student.completedKm} / {student.requiredKm} km ({kmPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${kmPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Orvosi érvényesség és KRESZ státusz */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div
                      className={`p-2 rounded-lg border ${
                        isMedicalUrgent
                          ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-900 dark:text-red-200'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Orvosi lejár:
                      </span>
                      <span className="font-semibold">{student.medicalExamExpiry}</span>
                      {isMedicalUrgent && (
                        <span className="block text-[10px] font-bold text-red-600">
                          ⚠️ {daysToMedical > 0 ? `${daysToMedical} nap!` : 'LEJÁRT!'}
                        </span>
                      )}
                    </div>

                    <div className="p-2 rounded-lg border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        KRESZ Elmélet:
                      </span>
                      <span className="font-semibold">{student.theoryExamStatus}</span>
                      <span className="block text-[10px] text-slate-500">
                        Tandíj: {student.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Műveletek */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => onOpenEmailWithTemplate('medical', student)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold"
                    title="Emlékeztető email küldése"
                  >
                    <Mail className="w-3.5 h-3.5 text-amber-500" />
                    <span>Email Értesítő</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditStudent(student)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                      title="Szerkesztés"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Biztosan törölni szeretnéd a(z) ${student.name} nevű tanulót?`)) {
                          onDeleteStudent(student.id);
                        }
                      }}
                      className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950 text-red-600"
                      title="Törlés"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* OKTATÓK LISTÁJA */}
      {activeSubTab === 'instructors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInstructors.map((instructor) => {
            const assignedStudents = dbState.students.filter((s) => s.instructorId === instructor.id);
            const preferredCar = dbState.vehicles.find((v) => v.id === instructor.preferredVehicleId);
            const totalHoursTaught = dbState.lessons.filter(
              (l) => l.instructorId === instructor.id && l.status === 'completed'
            ).length;

            return (
              <div
                key={instructor.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-shadow space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
                        style={{ backgroundColor: instructor.color }}
                      >
                        {instructor.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                          {instructor.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono">
                          {instructor.licenseNumber}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        instructor.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {instructor.status === 'active' ? 'Aktív oktató' : 'Szabadságon'}
                    </span>
                  </div>

                  {/* Kategóriák és jármű */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400 font-medium">Képesítések:</span>
                      <div className="flex items-center space-x-1">
                        {instructor.categories.map((cat) => (
                          <span
                            key={cat}
                            className="px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[10px]"
                          >
                            {cat} kat.
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Car className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Preferált autó: <strong>{preferredCar ? `${preferredCar.plateNumber} (${preferredCar.brandModel})` : 'Nincs megadva'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{instructor.phone}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{instructor.email}</span>
                    </div>
                  </div>

                  {/* Statisztika doboz */}
                  <div className="grid grid-cols-2 gap-2 text-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Hozzárendelt Diákok
                      </span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {assignedStudents.length} fő
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Teljesített Órák
                      </span>
                      <span className="text-base font-bold text-amber-600 dark:text-amber-400">
                        {totalHoursTaught} óra
                      </span>
                    </div>
                  </div>
                </div>

                {/* Műveletek */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-1">
                  <button
                    onClick={() => handleOpenEditInstructor(instructor)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    title="Szerkesztés"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Biztosan törölni szeretnéd a(z) ${instructor.name} nevű oktatót?`)) {
                        onDeleteInstructor(instructor.id);
                      }
                    }}
                    className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950 text-red-600"
                    title="Törlés"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TANULÓ SZERKESZTŐ / ÚJ MODÁL */}
      {studentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingStudent ? 'Tanuló Adatlapjának Módosítása' : 'Új Tanuló Beiratkozása'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Tanuló teljes neve:
                </label>
                <input
                  type="text"
                  placeholder="Pl. Kiss Márton"
                  value={studentForm.name || ''}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Telefonszám:
                  </label>
                  <input
                    type="text"
                    value={studentForm.phone || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Email cím:
                  </label>
                  <input
                    type="email"
                    value={studentForm.email || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Kategória:
                  </label>
                  <select
                    value={studentForm.category}
                    onChange={(e) => setStudentForm({ ...studentForm, category: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="B">B (Személygépkocsi)</option>
                    <option value="A">A (Motorkerékpár)</option>
                    <option value="C">C (Tehergépkocsi)</option>
                    <option value="CE">CE (Nehéz pótkocsi)</option>
                    <option value="D">D (Autóbusz)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Hozzárendelt oktató:
                  </label>
                  <select
                    value={studentForm.instructorId}
                    onChange={(e) => setStudentForm({ ...studentForm, instructorId: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {dbState.instructors.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Levezetett órák / Kötelező:
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={studentForm.completedHours}
                      onChange={(e) => setStudentForm({ ...studentForm, completedHours: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <span>/</span>
                    <input
                      type="number"
                      value={studentForm.requiredHours}
                      onChange={(e) => setStudentForm({ ...studentForm, requiredHours: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Levezetett km / Kötelező km:
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={studentForm.completedKm}
                      onChange={(e) => setStudentForm({ ...studentForm, completedKm: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <span>/</span>
                    <input
                      type="number"
                      value={studentForm.requiredKm}
                      onChange={(e) => setStudentForm({ ...studentForm, requiredKm: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Orvosi alkalmassági lejárata:
                  </label>
                  <input
                    type="date"
                    value={studentForm.medicalExamExpiry}
                    onChange={(e) => setStudentForm({ ...studentForm, medicalExamExpiry: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    KRESZ Elméleti vizsga:
                  </label>
                  <select
                    value={studentForm.theoryExamStatus}
                    onChange={(e) => setStudentForm({ ...studentForm, theoryExamStatus: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Sikeres">Sikeres vizsga</option>
                    <option value="Folyamatban">Tanfolyam folyamatban</option>
                    <option value="Nem kezdte">Nem kezdte el</option>
                    <option value="Ismétlő">Ismétlő vizsgára vár</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Tandíj fizetés állapota:
                  </label>
                  <select
                    value={studentForm.paymentStatus}
                    onChange={(e) => setStudentForm({ ...studentForm, paymentStatus: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Rendezve">Minden tandíj rendezve</option>
                    <option value="Részletben">Részletfizetés folyamatban</option>
                    <option value="Hátralék">Hátralékos</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Oktatási státusz:
                  </label>
                  <select
                    value={studentForm.status}
                    onChange={(e) => setStudentForm({ ...studentForm, status: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="active">Aktív tanuló</option>
                    <option value="exam_ready">Forgalmi vizsgára bocsátva</option>
                    <option value="graduated">Levizsgázott (Sikeres)</option>
                    <option value="suspended">Szüneteltetve</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setStudentModalOpen(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Mégse
              </button>
              <button
                onClick={handleSaveStudent}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20"
              >
                {editingStudent ? 'Tanuló Módosítása' : 'Tanuló Rögzítése'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OKTATÓ SZERKESZTŐ / ÚJ MODÁL */}
      {instructorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingInstructor ? 'Oktató Adatainak Módosítása' : 'Új Oktató Felvétele'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Oktató teljes neve:
                </label>
                <input
                  type="text"
                  value={instructorForm.name || ''}
                  onChange={(e) => setInstructorForm({ ...instructorForm, name: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Oktatói igazolvány száma:
                </label>
                <input
                  type="text"
                  value={instructorForm.licenseNumber || ''}
                  onChange={(e) => setInstructorForm({ ...instructorForm, licenseNumber: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Telefonszám:
                  </label>
                  <input
                    type="text"
                    value={instructorForm.phone || ''}
                    onChange={(e) => setInstructorForm({ ...instructorForm, phone: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Email:
                  </label>
                  <input
                    type="email"
                    value={instructorForm.email || ''}
                    onChange={(e) => setInstructorForm({ ...instructorForm, email: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Preferált gépjármű:
                </label>
                <select
                  value={instructorForm.preferredVehicleId}
                  onChange={(e) => setInstructorForm({ ...instructorForm, preferredVehicleId: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {dbState.vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} ({v.brandModel})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Órarendi színkód:
                  </label>
                  <input
                    type="color"
                    value={instructorForm.color || '#3b82f6'}
                    onChange={(e) => setInstructorForm({ ...instructorForm, color: e.target.value })}
                    className="w-full h-9 p-1 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Státusz:
                  </label>
                  <select
                    value={instructorForm.status}
                    onChange={(e) => setInstructorForm({ ...instructorForm, status: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="active">Aktív</option>
                    <option value="leave">Szabadságon</option>
                    <option value="inactive">Inaktív</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setInstructorModalOpen(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Mégse
              </button>
              <button
                onClick={handleSaveInstructor}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20"
              >
                {editingInstructor ? 'Oktató Módosítása' : 'Oktató Rögzítése'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
