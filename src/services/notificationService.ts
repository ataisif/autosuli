import { Vehicle, Student, Lesson, Instructor } from '../types';

export interface SystemAlert {
  id: string;
  type: 'mot' | 'medical' | 'conflict' | 'service';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  targetId: string;
  dateStr?: string;
  data: any;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Ez a böngésző nem támogatja az asztali értesítéseket.');
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

export const requestDesktopNotificationPermission = requestNotificationPermission;

export function sendDesktopNotification(
  title: string,
  options?: string | { body?: string; icon?: string }
): boolean {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') {
    try {
      const body = typeof options === 'string' ? options : options?.body || '';
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
      return true;
    } catch (e) {
      console.error('Desktop notification error:', e);
      return false;
    }
  }
  return false;
}

export function evaluateSystemAlerts(state: {
  vehicles: Vehicle[];
  students: Student[];
  lessons: Lesson[];
  instructors: Instructor[];
}): SystemAlert[] {
  const alerts: SystemAlert[] = [];
  const today = new Date().toISOString().slice(0, 10);
  const getDaysUntil = (targetDateStr: string) => {
    const target = new Date(targetDateStr).getTime();
    const cur = new Date(today).getTime();
    return Math.ceil((target - cur) / (1000 * 60 * 60 * 24));
  };

  // Műszaki vizsga lejárati ellenőrzés
  state.vehicles.forEach((v) => {
    if (v.status !== 'deregistered') {
      const daysLeft = getDaysUntil(v.motDate);
      if (daysLeft < 0) {
        alerts.push({
          id: `alert-mot-exp-${v.id}`,
          type: 'mot',
          severity: 'critical',
          title: `LEJÁRT MŰSZAKI VIZSGA! (${v.plateNumber})`,
          description: `A(z) ${v.plateNumber} rendszámú ${v.brandModel} műszaki vizsgája lejárt (${v.motDate})! A gépkocsi nem vehet részt oktatásban.`,
          targetId: v.id,
          dateStr: v.motDate,
          data: v,
        });
      } else if (daysLeft <= 30) {
        alerts.push({
          id: `alert-mot-warn-${v.id}`,
          type: 'mot',
          severity: daysLeft <= 10 ? 'critical' : 'warning',
          title: `Műszaki vizsga esedékes: ${v.plateNumber} (${daysLeft} nap maradt)`,
          description: `A(z) ${v.plateNumber} (${v.brandModel}) műszaki vizsgája ${v.motDate}-n lejár. Időpontfoglalás szükséges a vizsgaállomáson.`,
          targetId: v.id,
          dateStr: v.motDate,
          data: v,
        });
      }
    }
  });

  // Tanulók orvosi alkalmassági ellenőrzés
  state.students.forEach((s) => {
    if (s.status === 'active' || s.status === 'exam_ready') {
      const daysLeft = getDaysUntil(s.medicalExamExpiry);
      if (daysLeft < 0) {
        alerts.push({
          id: `alert-med-exp-${s.id}`,
          type: 'medical',
          severity: 'critical',
          title: `LEJÁRT ORVOSI ALKALMASSÁGI (${s.name})`,
          description: `${s.name} tanuló orvosi alkalmasságija lejárt (${s.medicalExamExpiry})! Vezetési óra nem tartható.`,
          targetId: s.id,
          dateStr: s.medicalExamExpiry,
          data: s,
        });
      } else if (daysLeft <= 45) {
        alerts.push({
          id: `alert-med-warn-${s.id}`,
          type: 'medical',
          severity: 'warning',
          title: `Orvosi alkalmassági lejár: ${s.name} (${daysLeft} nap)`,
          description: `${s.name} orvosi igazolása ${s.medicalExamExpiry}-ig érvényes. Kérjük küldjön emlékeztetőt!`,
          targetId: s.id,
          dateStr: s.medicalExamExpiry,
          data: s,
        });
      }
    }
  });

  return alerts;
}

export function generateEmailTemplate(
  type: 'mot' | 'medical' | 'schedule' | 'contract',
  data: any,
  companyInfo?: any
): { recipient: string; subject: string; body: string } {
  if (type === 'contract') {
    const reg = data as any;
    const c = companyInfo || {
      schoolName: 'AutoSuli Gépjárművezető-képző Iskola',
      companyName: 'AutoSuli Képzési és Szolgáltató Kft.',
      phone: '+36 1 456 7890',
      email: 'iroda@autosuli-kepzes.hu',
      representativeName: 'Kovács Zoltán (Iskolavezető)',
    };

    return {
      recipient: reg?.email || '',
      subject: `Aláírt Felnőttképzési Tanfolyami Szerződés - ${reg?.contractNumber || 'AutoSuli'} (${reg?.studentName || ''})`,
      body: `Tisztelt ${reg?.studentName || 'Tanuló'}!\n\nEzúton továbbítjuk a(z) ${c.schoolName} (${c.companyName}) által kiállított és mindkét fél által digitálisan aláírt Tanfolyam Regisztrációs Szerződését.\n\nSzerződés száma: ${reg?.contractNumber || '-'}\nKépzés megnevezése: ${reg?.courseName || '-'}\nKategória: ${reg?.category || '-'}\nKépzési díj: ${reg?.totalFee?.toLocaleString('hu-HU') || '-'} Ft\nBefizetett kezdőrészlet: ${reg?.initialDeposit?.toLocaleString('hu-HU') || '-'} Ft\nVálasztott fizetési ütemezés: ${reg?.paymentPlan || '-'}\nAláírás időpontja: ${reg?.signedAt ? new Date(reg.signedAt).toLocaleString('hu-HU') : new Date().toLocaleDateString('hu-HU')}\n\nA szerződés elektronikus másolata archiválva lett iskolánk nyilvántartásában. Kérjük, őrizze meg ezt az értesítést!\n\nKapcsolat & Ügyfélszolgálat:\n${c.schoolName}\nCím: ${c.address || ''}\nTelefon: ${c.phone || ''}\nEmail: ${c.email || ''}\nKépviselő: ${c.representativeName || ''}\n\nSikeres felkészülést kívánunk a tanfolyamhoz!`,
    };
  }

  if (type === 'mot') {
    const v = data as Vehicle;
    return {
      recipient: 'muszaki-vizsgaallomas@autoszerviz.hu',
      subject: `Műszaki vizsga időpont egyeztetés - ${v?.plateNumber || ''} (${v?.brandModel || ''})`,
      body: `Tisztelt Vizsgaállomás / Szerviz!\n\nSzeretnénk időpontot egyeztetni az alábbi tanulóvezetői oktató gépjárművünk esedékes időszakos műszaki vizsgájára:\n\n• Gépkocsi rendszáma: ${v?.plateNumber || '-'}\n• Típusa: ${v?.brandModel || '-'}\n• Évjárat: ${v?.year || '-'}\n• Jelenlegi km óra állás: ${v?.currentKm || '-'} km\n• Jelenlegi műszaki lejárata: ${v?.motDate || '-'}\n• Megjegyzés: Kettős pedálrendszerrel szerelt oktatójármű\n\nKérjük, jelezzék a legközelebbi szabad vizsgaidőpontokat!\n\nÜdvözlettel,\nAutoSuli Adminisztráció\nTelefon: +36 1 234 5678`,
    };
  }

  if (type === 'medical') {
    const s = data as Student;
    return {
      recipient: s?.email || 'tanulo@email.hu',
      subject: `Fontos: Esedékes orvosi alkalmassági megújítása - AutoSuli`,
      body: `Kedves ${s?.name || 'Tanuló'}!\n\nTájékoztatunk, hogy az autósiskolánk nyilvántartása szerint a jogosítvány megszerzéséhez szükséges I. csoportú orvosi alkalmassági véleményed érvényessége ${s?.medicalExamExpiry || 'hamarosan'} lejár.\n\nA jogszabályok értelmében kizárólag érvényes orvosi alkalmasságival vehetsz részt a gyakorlati vezetési órákon és bocsátható vagy forgalmi vizsgára.\n\nKérjük, keresd fel a háziorvosodat a megújítás céljából, és az új igazolás másolatát juttasd el iskolánk ügyfélszolgálatára!\n\nÜdvözlettel és sikeres felkészülést kívánva,\nAutoSuli Gépjárművezető-képző Iskola`,
    };
  }

  // schedule email
  const l = data as Lesson;
  return {
    recipient: 'tanulo@email.hu',
    subject: `Vezetési óra emlékeztető: ${l?.date || ''} ${l?.startTime || ''}`,
    body: `Kedves Tanulónk!\n\nEmlékeztetünk a következő gyakorlati vezetési órádra:\n\n• Időpont: ${l?.date || ''} (${l?.startTime || ''} - ${l?.endTime || ''})\n• Óra jellege: ${l?.lessonType || 'Gyakorlati vezetés'}\n\nKérjük, a megbeszélt találkozási helyszínen pontosan jelenj meg nálad lévő érvényes személyi igazolvánnyal és vezetési kartonnal!\n\nÜdvözlettel,\nAutoSuli Oktatói Csapat`,
  };
}

// iCalendar (.ics) exportálás naptárba íráshoz (Windows Naptár, Outlook, Google Calendar)
export function generateICalendarEvent(event: {
  title: string;
  description: string;
  location?: string;
  startDate: string; // YYYY-MM-DD vagy YYYY-MM-DDTHH:mm
  endDate?: string;
}): string {
  const cleanDate = (d: string) => d.replace(/[-:]/g, '');
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  let dtStart = '';
  let dtEnd = '';

  if (event.startDate.includes('T')) {
    dtStart = cleanDate(event.startDate) + '00';
    dtEnd = event.endDate ? cleanDate(event.endDate) + '00' : dtStart;
  } else {
    // Egész napos esemény (pl. Műszaki vizsga határideje)
    dtStart = cleanDate(event.startDate);
    dtEnd = cleanDate(event.startDate);
  }

  const uid = `autosuli-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@autosuli.local`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AutoSuli Flotta & Admin//HU',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    event.startDate.includes('T') ? `DTSTART:${dtStart}` : `DTSTART;VALUE=DATE:${dtStart}`,
    event.startDate.includes('T') ? `DTEND:${dtEnd}` : `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    event.location ? `LOCATION:${event.location}` : '',
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Emlékeztető: ${event.title}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

export function downloadICSFile(filename: string, icsContent: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Naptárba írás: Műszaki vizsga
export function exportMotToCalendar(vehicle: Vehicle): void {
  const ics = generateICalendarEvent({
    title: `Műszaki vizsga határidő: ${vehicle.plateNumber} (${vehicle.brandModel})`,
    description: `Gépjármű: ${vehicle.brandModel}\\nRendszám: ${vehicle.plateNumber}\\nÉvjárat: ${vehicle.year}\\nKm állás: ${vehicle.currentKm} km\\n\\nKérjük gondoskodjon a vizsgaállomásra történő bejelentésről és a jármű felkészítéséről!`,
    startDate: vehicle.motDate,
    location: 'Gépjármű Műszaki Vizsgaállomás',
  });
  downloadICSFile(`Muszaki_Vizsga_${vehicle.plateNumber}.ics`, ics);
}

// Naptárba írás: Vezetési óra
export function exportLessonToCalendar(
  lesson: Lesson,
  instructor?: Instructor,
  student?: Student,
  vehicle?: Vehicle
): void {
  const startDateTime = `${lesson.date}T${lesson.startTime}`;
  const endDateTime = `${lesson.date}T${lesson.endTime}`;
  const ics = generateICalendarEvent({
    title: `Vezetés: ${student?.name || 'Tanuló'} - ${lesson.lessonType}`,
    description: `Tanuló: ${student?.name || '-'} (${student?.phone || ''})\\nOktató: ${instructor?.name || '-'} (${instructor?.phone || ''})\\nJármű: ${vehicle?.plateNumber || ''} ${vehicle?.brandModel || ''}\\nÓratípus: ${lesson.lessonType}\\nMegjegyzés: ${lesson.notes || '-'}`,
    startDate: startDateTime,
    endDate: endDateTime,
    location: 'Autósiskola tanpálya / Telephely',
  });
  downloadICSFile(`Vezetes_${lesson.date}_${lesson.startTime}.ics`, ics);
}

// Email összeállító segédfüggvények
export function createMailtoUrl(to: string, subject: string, body: string): string {
  const encSubject = encodeURIComponent(subject);
  const encBody = encodeURIComponent(body);
  return `mailto:${to}?subject=${encSubject}&body=${encBody}`;
}
