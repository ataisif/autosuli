import React, { useState, useMemo } from 'react';
import {
  Clock,
  Calendar as CalendarIcon,
  Plus,
  AlertTriangle,
  Printer,
  FileDown,
  User,
  Car,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  CalendarPlus,
  Info,
} from 'lucide-react';
import { DatabaseState, Lesson, LessonType, ScheduleConflict } from '../types';
import { findConflictsForLesson, findAllConflicts } from '../services/conflictEngine';
import { exportLessonToCalendar } from '../services/notificationService';

interface ScheduleViewProps {
  dbState: DatabaseState;
  onAddLesson: (lesson: Lesson) => void;
  onUpdateLesson: (lesson: Lesson) => void;
  onDeleteLesson: (id: string) => void;
  onPrint: () => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  dbState,
  onAddLesson,
  onUpdateLesson,
  onDeleteLesson,
  onPrint,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [filterInstructor, setFilterInstructor] = useState<string>('all');
  const [filterStudent, setFilterStudent] = useState<string>('all');
  const [filterVehicle, setFilterVehicle] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'list'>('week');

  // Szerkesztő / Új óra modál
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // Form állapotok
  const [formDate, setFormDate] = useState(selectedDate);
  const [formStartTime, setFormStartTime] = useState('10:00');
  const [formEndTime, setFormEndTime] = useState('11:30');
  const [formInstructorId, setFormInstructorId] = useState(dbState.instructors[0]?.id || '');
  const [formStudentId, setFormStudentId] = useState(dbState.students[0]?.id || '');
  const [formVehicleId, setFormVehicleId] = useState(dbState.vehicles[0]?.id || '');
  const [formLessonType, setFormLessonType] = useState<LessonType>('Városi vezetés');
  const [formStatus, setFormStatus] = useState<'scheduled' | 'completed' | 'cancelled'>('scheduled');
  const [formNotes, setFormNotes] = useState('');

  // Összes globális ütközés keresése a jelenlegi adatbázisban
  const globalConflicts = useMemo(() => {
    return findAllConflicts(
      dbState.lessons,
      dbState.instructors,
      dbState.students,
      dbState.vehicles
    );
  }, [dbState.lessons, dbState.instructors, dbState.students, dbState.vehicles]);

  // Jelölt óra valós idejű ütközései a szerkesztő modálban
  const currentFormConflicts = useMemo(() => {
    if (!modalOpen) return [];
    const candidate: Lesson = {
      id: editingLesson ? editingLesson.id : 'candidate-temp',
      date: formDate,
      startTime: formStartTime,
      endTime: formEndTime,
      instructorId: formInstructorId,
      studentId: formStudentId,
      vehicleId: formVehicleId,
      lessonType: formLessonType,
      status: formStatus,
    };
    return findConflictsForLesson(
      candidate,
      dbState.lessons,
      dbState.instructors,
      dbState.students,
      dbState.vehicles
    );
  }, [
    modalOpen,
    editingLesson,
    formDate,
    formStartTime,
    formEndTime,
    formInstructorId,
    formStudentId,
    formVehicleId,
    formLessonType,
    formStatus,
    dbState.lessons,
    dbState.instructors,
    dbState.students,
    dbState.vehicles,
  ]);

  // Heti napok számítása a kiválasztott dátum alapján
  const weekDays = useMemo(() => {
    const curr = new Date(selectedDate);
    const day = curr.getDay(); // 0 is Sunday, 1 is Monday...
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(curr.setDate(diff));

    const days: { dateStr: string; dayName: string; formatted: string }[] = [];
    const hungarianDays = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const str = d.toISOString().slice(0, 10);
      days.push({
        dateStr: str,
        dayName: hungarianDays[i],
        formatted: `${d.getMonth() + 1}. ${d.getDate()}.`,
      });
    }
    return days;
  }, [selectedDate]);

  // Szűrt órák
  const filteredLessons = useMemo(() => {
    return dbState.lessons.filter((l) => {
      if (filterInstructor !== 'all' && l.instructorId !== filterInstructor) return false;
      if (filterStudent !== 'all' && l.studentId !== filterStudent) return false;
      if (filterVehicle !== 'all' && l.vehicleId !== filterVehicle) return false;

      if (viewMode === 'day') {
        return l.date === selectedDate;
      }
      if (viewMode === 'week') {
        return weekDays.some((w) => w.dateStr === l.date);
      }
      return true; // list mode shows all or filtered
    });
  }, [dbState.lessons, filterInstructor, filterStudent, filterVehicle, viewMode, selectedDate, weekDays]);

  const handleOpenNewLesson = (presetDate?: string) => {
    setEditingLesson(null);
    setFormDate(presetDate || selectedDate);
    setFormStartTime('10:00');
    setFormEndTime('11:30');
    setFormInstructorId(dbState.instructors[0]?.id || '');
    setFormStudentId(dbState.students[0]?.id || '');
    setFormVehicleId(dbState.vehicles[0]?.id || '');
    setFormLessonType('Városi vezetés');
    setFormStatus('scheduled');
    setFormNotes('');
    setModalOpen(true);
  };

  const handleOpenEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormDate(lesson.date);
    setFormStartTime(lesson.startTime);
    setFormEndTime(lesson.endTime);
    setFormInstructorId(lesson.instructorId);
    setFormStudentId(lesson.studentId);
    setFormVehicleId(lesson.vehicleId);
    setFormLessonType(lesson.lessonType);
    setFormStatus(lesson.status);
    setFormNotes(lesson.notes || '');
    setModalOpen(true);
  };

  const handleSaveForm = () => {
    if (!formDate || !formStartTime || !formEndTime) {
      alert('Kérjük adja meg a dátumot és az időintervallumot!');
      return;
    }

    if (formStartTime >= formEndTime) {
      alert('A befejezési időpontnak későbbinek kell lennie a kezdésnél!');
      return;
    }

    if (currentFormConflicts.length > 0) {
      const confirmSave = confirm(
        `FIGYELEM: A rendszer ${currentFormConflicts.length} db óra ütközést észlelt!\n\n` +
          currentFormConflicts.map((c) => `• ${c.description}`).join('\n\n') +
          `\n\nBiztosan el kívánja menteni az órát az ütközések ellenére is?`
      );
      if (!confirmSave) return;
    }

    const lessonData: Lesson = {
      id: editingLesson ? editingLesson.id : `les-${Date.now()}`,
      date: formDate,
      startTime: formStartTime,
      endTime: formEndTime,
      instructorId: formInstructorId,
      studentId: formStudentId,
      vehicleId: formVehicleId,
      lessonType: formLessonType,
      status: formStatus,
      notes: formNotes,
    };

    if (editingLesson) {
      onUpdateLesson(lessonData);
    } else {
      onAddLesson(lessonData);
    }

    setModalOpen(false);
  };

  const changeDateByDays = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  return (
    <div className="space-y-5">
      {/* Nyomtatási Fejléc (Kizárólag nyomtatáskor / PDF mentéskor látható) */}
      <div className="print-only mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">AutoSuli - Hivatalos Vezetési Órarend & Beosztás</h1>
        <p className="text-sm text-gray-600">
          Kelt: {new Date().toLocaleDateString('hu-HU')} | Időszak: {weekDays[0]?.dateStr} - {weekDays[6]?.dateStr}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Szűrés: Oktató: {dbState.instructors.find((i) => i.id === filterInstructor)?.name || 'Összes'} | 
          Tanuló: {dbState.students.find((s) => s.id === filterStudent)?.name || 'Összes'}
        </p>
      </div>

      {/* Fő vezérlősáv: Cím, Szűrők, Nyomtatás */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span>Iskolai Órarend & Intelligens Ütközésvizsgáló</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Oktatók és tanulók beosztása valós idejű oktatói, tanulói és jármű ütközésellenőrzéssel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Nézetváltó gombok */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'week' ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Heti nézet
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'day' ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Napi nézet
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Lista nézet
            </button>
          </div>

          <button
            onClick={onPrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
            title="Órarend nyomtatása vagy PDF mentése"
          >
            <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>Nyomtatás / PDF</span>
          </button>

          <button
            onClick={() => handleOpenNewLesson()}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-md shadow-amber-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Új Óra Beosztása</span>
          </button>
        </div>
      </div>

      {/* GLOBÁLIS ÜTKÖZÉS JELZŐ SÁV (ha vannak ütközések a rendszerben) */}
      {globalConflicts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-red-900 dark:text-red-200 no-print">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">
              Figyelem: {globalConflicts.length} db aktív időpont ütközés van az órarendben!
            </div>
            <p className="text-[11px] opacity-90">
              A rendszer észlelte, hogy egy oktató egyszerre több órára van beosztva, vagy egy tanuló/jármű egyszerre két helyen szerepel:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] pt-1">
              {globalConflicts.map((c) => (
                <li key={c.id}>
                  <strong>{c.title}:</strong> {c.description}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Dátum léptető és Szűrősáv */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs no-print">
        {/* Dátumválasztó és léptető */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => changeDateByDays(viewMode === 'week' ? -7 : -1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          />

          <button
            onClick={() => changeDateByDays(viewMode === 'week' ? 7 : 1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
          >
            Ma
          </button>
        </div>

        {/* Szűrők: Oktató, Tanuló, Jármű */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center space-x-1">
            <span className="text-slate-500">Oktató:</span>
            <select
              value={filterInstructor}
              onChange={(e) => setFilterInstructor(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">Minden oktató</option>
              {dbState.instructors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-slate-500">Tanuló:</span>
            <select
              value={filterStudent}
              onChange={(e) => setFilterStudent(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">Minden tanuló</option>
              {dbState.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-slate-500">Jármű:</span>
            <select
              value={filterVehicle}
              onChange={(e) => setFilterVehicle(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">Minden autó</option>
              {dbState.vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* HETI NÉZET */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const dayLessons = filteredLessons
              .filter((l) => l.date === day.dateStr)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            const isToday = day.dateStr === new Date().toISOString().slice(0, 10);

            return (
              <div
                key={day.dateStr}
                className={`rounded-2xl border p-3 flex flex-col justify-between space-y-2 min-h-[320px] print-break-inside-avoid ${
                  isToday
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Nap fejléce */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      {day.dayName}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {day.formatted}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenNewLesson(day.dateStr)}
                    className="p-1 rounded-md text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 no-print"
                    title="Óra hozzáadása ezen a napon"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Nap órái */}
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {dayLessons.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic text-center py-8">Nincs óra</p>
                  ) : (
                    dayLessons.map((lesson) => {
                      const instructor = dbState.instructors.find((i) => i.id === lesson.instructorId);
                      const student = dbState.students.find((s) => s.id === lesson.studentId);
                      const vehicle = dbState.vehicles.find((v) => v.id === lesson.vehicleId);
                      const hasConflict = globalConflicts.some(
                        (c) => c.lessonA.id === lesson.id || c.lessonB.id === lesson.id
                      );

                      return (
                        <div
                          key={lesson.id}
                          style={{
                            borderLeftColor: hasConflict ? '#ef4444' : instructor?.color || '#3b82f6',
                          }}
                          className={`p-2.5 rounded-xl border border-l-4 text-xs space-y-1 transition-all ${
                            hasConflict
                              ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-900 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-slate-800 dark:text-slate-200">
                              {lesson.startTime} - {lesson.endTime}
                            </span>
                            {hasConflict && (
                              <span className="text-[10px] font-bold text-red-600 animate-pulse" title="Ütközés észlelve!">
                                ⚠️ ÜTKÖZÉS
                              </span>
                            )}
                          </div>

                          <div className="font-semibold text-slate-900 dark:text-white truncate">
                            {student?.name || 'Ismeretlen diák'}
                          </div>

                          <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                            Oktató: <strong>{instructor?.name}</strong>
                          </div>

                          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                            <span>{vehicle?.plateNumber}</span>
                            <span className="font-medium text-amber-600 dark:text-amber-400">
                              {lesson.lessonType.split(' ')[0]}
                            </span>
                          </div>

                          {/* Műveleti gombok */}
                          <div className="pt-1.5 flex items-center justify-end space-x-1 border-t border-slate-200/50 dark:border-slate-700/50 no-print">
                            <button
                              onClick={() => exportLessonToCalendar(lesson, instructor, student, vehicle)}
                              className="p-1 rounded text-slate-400 hover:text-blue-500"
                              title="Beírás naptárba (.ics letöltés)"
                            >
                              <CalendarPlus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleOpenEditLesson(lesson)}
                              className="p-1 rounded text-slate-400 hover:text-amber-500"
                              title="Szerkesztés"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Biztosan törölni szeretnéd ezt a vezetési órát?')) {
                                  onDeleteLesson(lesson.id);
                                }
                              }}
                              className="p-1 rounded text-slate-400 hover:text-red-500"
                              title="Törlés"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="text-[10px] text-slate-400 text-right pt-1 border-t border-slate-100 dark:border-slate-800">
                  {dayLessons.length} óra
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LISTA / NAPI TÁBLÁZATOS NÉZET */}
      {(viewMode === 'list' || viewMode === 'day') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3">Dátum & Idő</th>
                  <th className="p-3">Tanuló</th>
                  <th className="p-3">Oktató</th>
                  <th className="p-3">Gépjármű</th>
                  <th className="p-3">Óra Típusa</th>
                  <th className="p-3">Státusz</th>
                  <th className="p-3">Ütközés</th>
                  <th className="p-3 text-right no-print">Műveletek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLessons.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                      Nincs megjeleníthető vezetési óra a megadott feltételekkel.
                    </td>
                  </tr>
                ) : (
                  filteredLessons
                    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))
                    .map((lesson) => {
                      const instructor = dbState.instructors.find((i) => i.id === lesson.instructorId);
                      const student = dbState.students.find((s) => s.id === lesson.studentId);
                      const vehicle = dbState.vehicles.find((v) => v.id === lesson.vehicleId);
                      const conflict = globalConflicts.find(
                        (c) => c.lessonA.id === lesson.id || c.lessonB.id === lesson.id
                      );

                      return (
                        <tr
                          key={lesson.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                            conflict ? 'bg-red-50/50 dark:bg-red-950/20' : ''
                          }`}
                        >
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">
                            {lesson.date} ({lesson.startTime} - {lesson.endTime})
                          </td>
                          <td className="p-3 font-medium">
                            {student?.name || 'Ismeretlen'}
                            <span className="block text-[11px] text-slate-500 font-normal">
                              {student?.phone}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {instructor?.name}
                            </span>
                          </td>
                          <td className="p-3 font-mono">
                            {vehicle?.plateNumber}
                            <span className="block text-[11px] text-slate-500 font-sans">
                              {vehicle?.brandModel}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-amber-700 dark:text-amber-400">
                            {lesson.lessonType}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                lesson.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : lesson.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              }`}
                            >
                              {lesson.status === 'completed'
                                ? 'Teljesítve'
                                : lesson.status === 'cancelled'
                                ? 'Lemondva'
                                : 'Tervezett'}
                            </span>
                          </td>
                          <td className="p-3">
                            {conflict ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" title={conflict.description}>
                                <AlertTriangle className="w-3 h-3" />
                                <span>Ütközés!</span>
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                                Rendben ✓
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right space-x-1 no-print">
                            <button
                              onClick={() => exportLessonToCalendar(lesson, instructor, student, vehicle)}
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600"
                              title="Naptárba írás (.ics)"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditLesson(lesson)}
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                              title="Szerkesztés"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Biztosan törölni szeretnéd ezt a vezetési órát?')) {
                                  onDeleteLesson(lesson.id);
                                }
                              }}
                              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950 text-red-600"
                              title="Törlés"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ÚJ ÓRA / SZERKESZTŐ MODÁL (VALÓS IDEJŰ ÜTKÖZÉSVIZSGÁLATTAL) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingLesson ? 'Vezetési Óra Módosítása' : 'Új Vezetési Óra Rögzítése'}
                </h3>
                <p className="text-xs text-slate-500">
                  Időpontok, diák, oktató és gépjármű beosztása ütközésvizsgálattal
                </p>
              </div>
            </div>

            {/* Valós idejű ütközés figyelmeztető doboz a modálban */}
            {currentFormConflicts.length > 0 && (
              <div className="bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-900 p-3 rounded-xl text-xs space-y-1 text-red-900 dark:text-red-200">
                <div className="font-bold flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Ütközés figyelmeztetés ({currentFormConflicts.length} db)!</span>
                </div>
                {currentFormConflicts.map((c, i) => (
                  <p key={i} className="text-[11px] pl-5">
                    • <strong>{c.title}:</strong> {c.description}
                  </p>
                ))}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Dátum:
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Kezdés (HH:MM):
                  </label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Befejezés:
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Oktató kiválasztása:
                </label>
                <select
                  value={formInstructorId}
                  onChange={(e) => setFormInstructorId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {dbState.instructors.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.categories.join(', ')} kategória)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Tanuló kiválasztása:
                </label>
                <select
                  value={formStudentId}
                  onChange={(e) => setFormStudentId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {dbState.students.map((stud) => (
                    <option key={stud.id} value={stud.id}>
                      {stud.name} ({stud.category} kat. - {stud.completedHours}/{stud.requiredHours} óra)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Gépjármű beosztása:
                </label>
                <select
                  value={formVehicleId}
                  onChange={(e) => setFormVehicleId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {dbState.vehicles.map((veh) => (
                    <option key={veh.id} value={veh.id}>
                      {veh.plateNumber} ({veh.brandModel} - {veh.category} kat.)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Óra típusa:
                  </label>
                  <select
                    value={formLessonType}
                    onChange={(e) => setFormLessonType(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Alapoktatás (tanpálya)">Alapoktatás (tanpálya)</option>
                    <option value="Városi vezetés">Városi vezetés</option>
                    <option value="Országúti vezetés">Országúti vezetés</option>
                    <option value="Éjszakai vezetés">Éjszakai vezetés</option>
                    <option value="Gyakorló óra">Gyakorló óra</option>
                    <option value="Hatósági Forgalmi Vizsga">Hatósági Forgalmi Vizsga</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Státusz:
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="scheduled">Tervezett</option>
                    <option value="completed">Teljesítve</option>
                    <option value="cancelled">Lemondva</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Megjegyzés / Tananyag részlet:
                </label>
                <input
                  type="text"
                  placeholder="Pl. Körforgalmak, sávváltás, parkolási feladatok..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Mégse
              </button>
              <button
                onClick={handleSaveForm}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20"
              >
                {editingLesson ? 'Módosítás Mentése' : 'Óra Rögzítése'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
