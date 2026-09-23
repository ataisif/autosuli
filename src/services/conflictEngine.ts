import { Lesson, ScheduleConflict, Instructor, Student, Vehicle } from '../types';

export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function isTimeOverlapping(
  dateA: string,
  startA: string,
  endA: string,
  dateB: string,
  startB: string,
  endB: string
): boolean {
  if (dateA !== dateB) return false;
  const startMinA = timeToMinutes(startA);
  const endMinA = timeToMinutes(endA);
  const startMinB = timeToMinutes(startB);
  const endMinB = timeToMinutes(endB);

  return startMinA < endMinB && endMinA > startMinB;
}

export function findConflictsForLesson(
  candidate: Lesson,
  allLessons: Lesson[],
  instructors: Instructor[],
  students: Student[],
  vehicles: Vehicle[]
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  const instructor = instructors.find((i) => i.id === candidate.instructorId);
  const student = students.find((s) => s.id === candidate.studentId);
  const vehicle = vehicles.find((v) => v.id === candidate.vehicleId);

  for (const existing of allLessons) {
    if (existing.id === candidate.id) continue;
    if (existing.status === 'cancelled') continue;

    if (
      isTimeOverlapping(
        candidate.date,
        candidate.startTime,
        candidate.endTime,
        existing.date,
        existing.startTime,
        existing.endTime
      )
    ) {
      const existingInstructor = instructors.find((i) => i.id === existing.instructorId);
      const existingStudent = students.find((s) => s.id === existing.studentId);
      const existingVehicle = vehicles.find((v) => v.id === existing.vehicleId);

      // 1. Oktatói ütközés (ugyanaz az oktató egyszerre több diáknak vagy tanfolyamnak tartana órát)
      if (candidate.instructorId && candidate.instructorId === existing.instructorId) {
        conflicts.push({
          id: `conflict-inst-${candidate.id}-${existing.id}`,
          type: 'instructor',
          severity: 'error',
          title: `Oktatói időpont ütközés: ${instructor?.name || 'Oktató'}`,
          description: `${instructor?.name || 'Az oktató'} ekkor (${candidate.date} ${candidate.startTime}-${candidate.endTime}) már órát tart a(z) ${existingStudent?.name || 'másik tanuló'} részére (${existing.lessonType})!`,
          lessonA: candidate,
          lessonB: existing,
        });
      }

      // 2. Tanulói ütközés (a tanuló egyszerre több kategóriát / órát végezne egyidőben)
      if (candidate.studentId && candidate.studentId === existing.studentId) {
        conflicts.push({
          id: `conflict-stud-${candidate.id}-${existing.id}`,
          type: 'student',
          severity: 'error',
          title: `Tanulói óra ütközés: ${student?.name || 'Tanuló'}`,
          description: `${student?.name || 'A diák'} már be van osztva egy másik órára (${existing.startTime}-${existing.endTime}, ${existing.lessonType}) ${existingInstructor?.name || 'oktatónál'}!`,
          lessonA: candidate,
          lessonB: existing,
        });
      }

      // 3. Jármű ütközés (ugyanaz az autó lenne kint két különböző órán egyidőben)
      if (candidate.vehicleId && candidate.vehicleId === existing.vehicleId) {
        conflicts.push({
          id: `conflict-veh-${candidate.id}-${existing.id}`,
          type: 'vehicle',
          severity: 'error',
          title: `Gépjármű ütközés: ${vehicle?.plateNumber || 'Jármű'}`,
          description: `A(z) ${vehicle?.brandModel} (${vehicle?.plateNumber}) gépkocsit már lefoglalták ${existing.startTime}-${existing.endTime} között (${existingInstructor?.name} részére)!`,
          lessonA: candidate,
          lessonB: existing,
        });
      }
    }
  }

  return conflicts;
}

export function findAllConflicts(
  allLessons: Lesson[],
  instructors: Instructor[],
  students: Student[],
  vehicles: Vehicle[]
): ScheduleConflict[] {
  const activeLessons = allLessons.filter((l) => l.status !== 'cancelled');
  const allConflicts: ScheduleConflict[] = [];
  const seenPairs = new Set<string>();

  for (let i = 0; i < activeLessons.length; i++) {
    for (let j = i + 1; j < activeLessons.length; j++) {
      const a = activeLessons[i];
      const b = activeLessons[j];

      if (isTimeOverlapping(a.date, a.startTime, a.endTime, b.date, b.startTime, b.endTime)) {
        const pairKey = [a.id, b.id].sort().join(':::');
        if (seenPairs.has(pairKey)) continue;

        const conflicts = findConflictsForLesson(a, [b], instructors, students, vehicles);
        if (conflicts.length > 0) {
          seenPairs.add(pairKey);
          allConflicts.push(...conflicts);
        }
      }
    }
  }

  return allConflicts;
}
