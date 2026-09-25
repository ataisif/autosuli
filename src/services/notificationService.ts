import {
  Vehicle,
  Student,
  Lesson,
  Instructor,
  CalendarClient,
  EmailClientMode,
  DatabaseState,
  CalendarSyncSettings,
  AutoEmailReminderSettings,
  EmailReminderLog,
} from '../types';

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

export interface CalendarEventData {
  id?: string;
  title: string;
  description: string;
  location?: string;
  startDate: string; // YYYY-MM-DD vagy YYYY-MM-DDTHH:mm
  endDate?: string;
  categories?: string;
  alarmDaysAhead?: number[];
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

/* =========================================================================
   NAPTÁR SZINKRONIZÁCIÓS MOTOR (GMAIL, OUTLOOK, THUNDERBIRD, ICAL)
   ========================================================================= */

// 1. Google Naptár esemény link készítő
export function createGoogleCalendarUrl(event: CalendarEventData): string {
  const isAllDay = !event.startDate.includes('T');
  let datesParam = '';

  if (isAllDay) {
    const startStr = event.startDate.replace(/-/g, '');
    // All-day: start/end exclusive
    const startDateObj = new Date(event.startDate);
    const nextDay = new Date(startDateObj.getTime() + 86400000).toISOString().slice(0, 10).replace(/-/g, '');
    datesParam = `${startStr}/${nextDay}`;
  } else {
    const cleanStart = event.startDate.replace(/[-:]/g, '');
    const cleanEnd = event.endDate ? event.endDate.replace(/[-:]/g, '') : cleanStart;
    datesParam = `${cleanStart}00Z/${cleanEnd}00Z`;
  }

  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const params = new URLSearchParams({
    text: event.title,
    dates: datesParam,
    details: event.description,
    location: event.location || 'AutoSuli Iskolaközpont',
  });

  return `${base}&${params.toString()}`;
}

// 2. Outlook / Microsoft 365 Naptár esemény link készítő
export function createOutlookCalendarUrl(event: CalendarEventData, isOffice365 = false): string {
  const isAllDay = !event.startDate.includes('T');
  const host = isOffice365 ? 'outlook.office.com' : 'outlook.live.com';
  const startdt = isAllDay ? `${event.startDate}T08:00:00` : `${event.startDate}:00`;
  const enddt = isAllDay
    ? `${event.startDate}T18:00:00`
    : event.endDate
    ? `${event.endDate}:00`
    : `${event.startDate}:00`;

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description,
    startdt,
    enddt,
    location: event.location || 'AutoSuli',
  });

  return `https://${host}/calendar/0/deeplink/compose?${params.toString()}`;
}

// 3. iCalendar (.ics) generálás egyetlen eseményhez
export function generateICalendarEvent(
  event: CalendarEventData,
  alarmDaysAhead: number[] = [14, 7, 1]
): string {
  return generateMultiEventICS([event], 'AutoSuli Határidők', alarmDaysAhead);
}

// 4. Többeseményes iCalendar (.ics) generálás Thunderbird / Outlook / Apple / Google naptárakhoz
export function generateMultiEventICS(
  events: CalendarEventData[],
  calendarName = 'AutoSuli Flotta & Adminisztráció',
  alarmDaysAhead: number[] = [14, 7, 1]
): string {
  const cleanDate = (d: string) => d.replace(/[-:]/g, '');
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const vEvents = events.map((event) => {
    let dtStart = '';
    let dtEnd = '';
    const isAllDay = !event.startDate.includes('T');

    if (!isAllDay) {
      dtStart = cleanDate(event.startDate) + '00';
      dtEnd = event.endDate ? cleanDate(event.endDate) + '00' : dtStart;
    } else {
      dtStart = cleanDate(event.startDate);
      dtEnd = cleanDate(event.startDate);
    }

    const uid = event.id || `autosuli-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@autosuli.hu`;

    // Thunderbird és Outlook VALARM blokkok generálása
    const daysToUse = event.alarmDaysAhead || alarmDaysAhead;
    const alarms = daysToUse
      .map((days) => {
        return [
          'BEGIN:VALARM',
          `TRIGGER:-P${days}D`,
          'ACTION:DISPLAY',
          `DESCRIPTION:Figyelmeztetés (${days} nappal előtte): ${event.title}`,
          'END:VALARM',
        ].join('\r\n');
      })
      .join('\r\n');

    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      isAllDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART:${dtStart}`,
      isAllDay ? `DTEND;VALUE=DATE:${dtEnd}` : `DTEND:${dtEnd}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
      event.location ? `LOCATION:${event.location}` : 'LOCATION:AutoSuli Tanpálya / Flotta',
      event.categories ? `CATEGORIES:${event.categories}` : 'CATEGORIES:AutoSuli,Határidő',
      'STATUS:CONFIRMED',
      alarms,
      'END:VEVENT',
    ]
      .filter(Boolean)
      .join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AutoSuli Flotta & Admin//Thunderbird Gmail Outlook Sync//HU',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarName}`,
    `X-WR-TIMEZONE:Europe/Budapest`,
    ...vEvents,
    'END:VCALENDAR',
  ].join('\r\n');
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

/* =========================================================================
   EMAIL KLIENS INTEGRÁCIÓK (GMAIL, OUTLOOK, THUNDERBIRD MAILTO / EML)
   ========================================================================= */

export function createGmailComposeUrl(to: string, subject: string, body: string, bcc?: string): string {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to,
    su: subject,
    body,
  });
  if (bcc) {
    params.set('bcc', bcc);
  }
  return `https://mail.google.com/mail/?${params.toString()}`;
}

export function createOutlookComposeUrl(to: string, subject: string, body: string, isOffice365 = false): string {
  const host = isOffice365 ? 'outlook.office.com' : 'outlook.live.com';
  const params = new URLSearchParams({
    to,
    subject,
    body,
  });
  return `https://${host}/mail/0/deeplink/compose?${params.toString()}`;
}

export function createMailtoUrl(to: string, subject: string, body: string, bcc?: string): string {
  const encSubject = encodeURIComponent(subject);
  const encBody = encodeURIComponent(body);
  const bccPart = bcc ? `&bcc=${encodeURIComponent(bcc)}` : '';
  return `mailto:${to}?subject=${encSubject}&body=${encBody}${bccPart}`;
}

// RFC-822 formátumú EML levél generálása, amit a Mozilla Thunderbird vagy Outlook duplakattintással azonnal megnyit elküldésre
export function generateEMLFileContent(
  to: string,
  from: string,
  subject: string,
  body: string,
  bcc?: string
): string {
  const dateStr = new Date().toUTCString();
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    bcc ? `Bcc: ${bcc}` : '',
    `Date: ${dateStr}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8; format=flowed',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: AutoSuli Thunderbird/Outlook Bridge v2.6',
    '',
    body,
  ].filter((l) => l !== '');

  return lines.join('\r\n');
}

export function downloadEMLFile(
  filename: string,
  to: string,
  from: string,
  subject: string,
  body: string,
  bcc?: string
): void {
  const content = generateEMLFileContent(to, from, subject, body, bcc);
  const blob = new Blob([content], { type: 'message/rfc822;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.eml') ? filename : `${filename}.eml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Kliensben megnyitás univerzális segédfüggvény
export function openCalendarEventInClient(
  event: CalendarEventData,
  client: CalendarClient = 'gmail'
): void {
  if (client === 'gmail') {
    const url = createGoogleCalendarUrl(event);
    window.open(url, '_blank', 'noopener,noreferrer');
  } else if (client === 'outlook') {
    const url = createOutlookCalendarUrl(event);
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    // thunderbird vagy ics
    const ics = generateICalendarEvent(event);
    const cleanTitle = event.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
    downloadICSFile(`Thunderbird_${cleanTitle}.ics`, ics);
  }
}

export function openEmailInClient(
  to: string,
  subject: string,
  body: string,
  clientMode: EmailClientMode = 'gmail',
  bcc?: string,
  from = 'iroda@autosuli-kepzes.hu'
): void {
  if (clientMode === 'gmail') {
    const url = createGmailComposeUrl(to, subject, body, bcc);
    window.open(url, '_blank', 'noopener,noreferrer');
  } else if (clientMode === 'outlook') {
    const url = createOutlookComposeUrl(to, subject, body);
    window.open(url, '_blank', 'noopener,noreferrer');
  } else if (clientMode === 'thunderbird' || clientMode === 'mailto') {
    const mailto = createMailtoUrl(to, subject, body, bcc);
    window.location.href = mailto;
  } else {
    // direct szimuláció
    console.log('[AutoSuli Email Engine] Direct dispatch to:', to, subject);
  }
}

/* =========================================================================
   HATÁRIDŐK ÖSSZESÍTÉSE ÉS KÖTEGELT EXPORT
   ========================================================================= */

export function compileAllDeadlinesAsEvents(
  state: DatabaseState,
  settings?: CalendarSyncSettings
): CalendarEventData[] {
  const events: CalendarEventData[] = [];
  const s = settings || state.calendarSyncSettings || {
    preferredClient: 'gmail',
    autoSyncMot: true,
    autoSyncMedical: true,
    autoSyncLessons: true,
    autoSyncMaintenance: true,
    reminderDaysAhead: [30, 15, 7, 1],
    calendarName: 'AutoSuli Határidők',
    defaultAlarmMinutes: 1440,
  };

  // 1. Műszaki vizsgák
  if (s.autoSyncMot) {
    state.vehicles.forEach((v) => {
      if (v.status !== 'deregistered' && v.motDate) {
        events.push({
          id: `mot-${v.id}-${v.motDate}`,
          title: `⚠️ Műszaki vizsga: ${v.plateNumber} (${v.brandModel})`,
          description: `Gépjármű műszaki érvényesség lejárata: ${v.motDate}\n• Rendszám: ${v.plateNumber}\n• Típus: ${v.brandModel}\n• Km: ${v.currentKm} km\n\nIdőpont-egyeztetés szükséges a vizsgaállomáson!`,
          location: 'Műszaki Vizsgaállomás',
          startDate: v.motDate,
          categories: 'Műszaki Vizsga,AutoSuli',
          alarmDaysAhead: s.reminderDaysAhead,
        });
      }
    });
  }

  // 2. Tanulói orvosi alkalmasságiak
  if (s.autoSyncMedical) {
    state.students.forEach((stud) => {
      if ((stud.status === 'active' || stud.status === 'exam_ready') && stud.medicalExamExpiry) {
        events.push({
          id: `med-${stud.id}-${stud.medicalExamExpiry}`,
          title: `🩺 Orvosi lejárat: ${stud.name} (${stud.category})`,
          description: `Tanuló orvosi alkalmasságijának lejárata: ${stud.medicalExamExpiry}\n• Név: ${stud.name}\n• Kategória: ${stud.category}\n• Telefon: ${stud.phone}\n• Email: ${stud.email}\n\nÉrvényes orvosi nélkül nem vezethet!`,
          location: 'Háziorvosi rendelő / AutoSuli',
          startDate: stud.medicalExamExpiry,
          categories: 'Tanulói Orvosi,AutoSuli',
          alarmDaysAhead: s.reminderDaysAhead,
        });
      }
    });
  }

  // 3. Gyakorlati órák (következő 14 nap)
  if (s.autoSyncLessons) {
    state.lessons.forEach((l) => {
      if (l.status === 'scheduled') {
        const student = state.students.find((st) => st.id === l.studentId);
        const instructor = state.instructors.find((i) => i.id === l.instructorId);
        const vehicle = state.vehicles.find((v) => v.id === l.vehicleId);

        events.push({
          id: `lesson-${l.id}`,
          title: `🚗 Vezetés: ${student?.name || 'Tanuló'} (${l.lessonType})`,
          description: `Oktatási óra\n• Tanuló: ${student?.name} (${student?.phone || ''})\n• Oktató: ${instructor?.name} (${instructor?.phone || ''})\n• Autó: ${vehicle?.plateNumber} ${vehicle?.brandModel}\n• Megjegyzés: ${l.notes || '-'}`,
          location: 'AutoSuli Rutinpálya / Találkozási pont',
          startDate: `${l.date}T${l.startTime}`,
          endDate: `${l.date}T${l.endTime}`,
          categories: 'Vezetési Óra,AutoSuli',
          alarmDaysAhead: [1],
        });
      }
    });
  }

  return events;
}

// Naptárba írás: Műszaki vizsga adott klienssel
export function exportMotToCalendar(vehicle: Vehicle, client: CalendarClient = 'gmail'): void {
  const event: CalendarEventData = {
    id: `mot-${vehicle.id}`,
    title: `Műszaki vizsga határidő: ${vehicle.plateNumber} (${vehicle.brandModel})`,
    description: `Gépjármű: ${vehicle.brandModel}\nRendszám: ${vehicle.plateNumber}\nÉvjárat: ${vehicle.year}\nKm állás: ${vehicle.currentKm} km\nMűszaki lejárata: ${vehicle.motDate}\n\nKérjük gondoskodjon a vizsgaállomásra történő bejelentésről és a jármű felkészítéséről!`,
    startDate: vehicle.motDate,
    location: 'Gépjármű Műszaki Vizsgaállomás',
    categories: 'Műszaki Vizsga',
  };
  openCalendarEventInClient(event, client);
}

// Naptárba írás: Tanulói orvosi adott klienssel
export function exportMedicalToCalendar(student: Student, client: CalendarClient = 'gmail'): void {
  const event: CalendarEventData = {
    id: `med-${student.id}`,
    title: `Orvosi alkalmassági lejár: ${student.name}`,
    description: `Tanuló neve: ${student.name}\nKategória: ${student.category}\nTelefon: ${student.phone}\nEmail: ${student.email}\nOrvosi érvényesség vége: ${student.medicalExamExpiry}\n\nKérjük ellenőrizze az új orvosi igazolás leadását!`,
    startDate: student.medicalExamExpiry,
    location: 'Háziorvos / AutoSuli',
    categories: 'Tanulói Orvosi',
  };
  openCalendarEventInClient(event, client);
}

// Naptárba írás: Vezetési óra
export function exportLessonToCalendar(
  lesson: Lesson,
  instructor?: Instructor,
  student?: Student,
  vehicle?: Vehicle,
  client: CalendarClient = 'gmail'
): void {
  const startDateTime = `${lesson.date}T${lesson.startTime}`;
  const endDateTime = `${lesson.date}T${lesson.endTime}`;
  const event: CalendarEventData = {
    id: `lesson-${lesson.id}`,
    title: `Vezetés: ${student?.name || 'Tanuló'} - ${lesson.lessonType}`,
    description: `Tanuló: ${student?.name || '-'} (${student?.phone || ''})\nOktató: ${instructor?.name || '-'} (${instructor?.phone || ''})\nJármű: ${vehicle?.plateNumber || ''} ${vehicle?.brandModel || ''}\nÓratípus: ${lesson.lessonType}\nMegjegyzés: ${lesson.notes || '-'}`,
    startDate: startDateTime,
    endDate: endDateTime,
    location: 'Autósiskola tanpálya / Telephely',
    categories: 'Vezetési Óra',
  };
  openCalendarEventInClient(event, client);
}

/* =========================================================================
   AUTOMATIKUS EMAIL EMLÉKEZTETŐ MOTOR (AUTOMATION RUNNER)
   ========================================================================= */

export interface AutoReminderResult {
  updatedState: DatabaseState;
  motRemindersSent: number;
  medRemindersSent: number;
  newLogs: EmailReminderLog[];
  messages: string[];
}

export function runAutomatedEmailReminders(
  state: DatabaseState,
  forceAll = false,
  targetClientMode?: EmailClientMode
): AutoReminderResult {
  const todayStr = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();
  const settings: AutoEmailReminderSettings = state.autoEmailSettings || {
    enabled: true,
    clientMode: 'gmail',
    checkFrequency: 'daily',
    lastRunDate: '',
    motRecipientEmail: state.schoolCompany.email || 'muszaki@autosuli.hu',
    bccSchoolAdmin: true,
    schoolAdminEmail: state.schoolCompany.email || 'iroda@autosuli-kepzes.hu',
    motThresholdDays: 30,
    medicalThresholdDays: 45,
    sendDuplicateIntervalDays: 7,
    senderName: state.schoolCompany.schoolName || 'AutoSuli Flotta & Admin',
  };

  const clientMode = targetClientMode || settings.clientMode || 'gmail';
  const existingLogs: EmailReminderLog[] = state.emailReminderLogs || [];
  const newLogs: EmailReminderLog[] = [];
  const messages: string[] = [];

  const getDaysUntil = (targetDateStr: string) => {
    const target = new Date(targetDateStr).getTime();
    const cur = new Date(todayStr).getTime();
    return Math.ceil((target - cur) / (1000 * 60 * 60 * 24));
  };

  // Segédfüggvény: ellenőrzi, hogy kiküldtünk-e már emlékeztetőt az elmúlt X napban
  const hasSentRecently = (targetId: string, type: 'mot' | 'medical') => {
    if (forceAll) return false;
    const cooldownDays = settings.sendDuplicateIntervalDays || 7;
    const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
    const nowTime = new Date().getTime();

    return existingLogs.some((log) => {
      if (log.targetId === targetId && log.type === type) {
        const logTime = new Date(log.timestamp).getTime();
        return nowTime - logTime < cooldownMs;
      }
      return false;
    });
  };

  let motCount = 0;
  let medCount = 0;

  // 1. MŰSZAKI VIZSGÁK ELLENŐRZÉSE
  state.vehicles.forEach((vehicle) => {
    if (vehicle.status !== 'deregistered' && vehicle.motDate) {
      const daysLeft = getDaysUntil(vehicle.motDate);
      if (daysLeft <= settings.motThresholdDays) {
        if (!hasSentRecently(vehicle.id, 'mot')) {
          motCount++;
          const subject =
            settings.customMotSubject ||
            `Műszaki vizsga figyelmeztetés: ${vehicle.plateNumber} (${daysLeft > 0 ? `${daysLeft} nap maradt` : 'LEJÁRT!'})`;

          const recipient = settings.motRecipientEmail || 'muszaki@autoszerviz.hu';
          const bcc = settings.bccSchoolAdmin ? settings.schoolAdminEmail : undefined;

          const defaultBody = [
            `Tisztelt Műszaki Szolgálat / Címzett!`,
            ``,
            `Az AutoSuli gépjárműflotta felügyeleti rendszere riasztást adott ki az alábbi oktató gépjármű műszaki vizsgájának esedékességéről:`,
            ``,
            `• Gépjármű: ${vehicle.brandModel}`,
            `• Rendszám: ${vehicle.plateNumber}`,
            `• Évjárat: ${vehicle.year}`,
            `• Jelenlegi km állás: ${vehicle.currentKm} km`,
            `• Műszaki vizsga lejárata: ${vehicle.motDate} (${daysLeft > 0 ? `${daysLeft} nap múlva lejár` : 'MÁR LEJÁRT!'})`,
            `• Jármű állapota: ${vehicle.status === 'in_use' ? 'Oktatásban (Kiadva)' : 'Telephelyen elérhető'}`,
            `• Megjegyzés: ${vehicle.notes || 'Nincs külön megjegyzés'}`,
            ``,
            `Kérjük, gondoskodjon a szervizfelkészítésről és a vizsgaidőpont véglegesítéséről!`,
            ``,
            `Üdvözlettel,`,
            `${settings.senderName || 'AutoSuli Flotta Rendszer'}`,
          ].join('\n');

          const body = settings.customMotBody ? settings.customMotBody : defaultBody;

          // Ha direct mode, nem nyit új ablakot, de szimulálva naplózza
          if (clientMode !== 'direct') {
            openEmailInClient(recipient, subject, body, clientMode, bcc);
          }

          const logEntry: EmailReminderLog = {
            id: `log-mot-${vehicle.id}-${Date.now()}`,
            timestamp: nowIso,
            targetId: vehicle.id,
            targetName: `${vehicle.plateNumber} (${vehicle.brandModel})`,
            type: 'mot',
            recipient,
            subject,
            clientUsed: clientMode,
            status: clientMode === 'direct' ? 'sent' : 'opened_in_client',
            notes: `Műszaki érvényesség: ${vehicle.motDate} (${daysLeft} nap)`,
          };

          newLogs.push(logEntry);
          messages.push(`Műszaki vizsga emlékeztető: ${vehicle.plateNumber} -> ${recipient}`);
        }
      }
    }
  });

  // 2. TANULÓI ORVOSI ALKALMASSÁGIAK ELLENŐRZÉSE
  state.students.forEach((student) => {
    if ((student.status === 'active' || student.status === 'exam_ready') && student.medicalExamExpiry) {
      const daysLeft = getDaysUntil(student.medicalExamExpiry);
      if (daysLeft <= settings.medicalThresholdDays) {
        if (!hasSentRecently(student.id, 'medical')) {
          medCount++;
          const recipient = student.email || settings.schoolAdminEmail || 'tanulo@email.hu';
          const bcc = settings.bccSchoolAdmin ? settings.schoolAdminEmail : undefined;
          const subject =
            settings.customMedicalSubject ||
            `Fontos: Orvosi alkalmassági vélemény megújítása - ${student.name} (AutoSuli)`;

          const defaultBody = [
            `Kedves ${student.name}!`,
            ``,
            `Tájékoztatunk, hogy az autósiskolánk nyilvántartása szerint a(z) ${student.category} kategóriás jogosítványhoz szükséges I. csoportú orvosi alkalmassági véleményed érvényessége ${student.medicalExamExpiry}-n (${daysLeft > 0 ? `${daysLeft} nap múlva` : 'már'} lejár).`,
            ``,
            `A hatályos közlekedési jogszabályok értelmében kizárólag érvényes orvosi igazolással rendelkező tanuló vezethet forgalomban és bocsátható hatósági vizsgára.`,
            ``,
            `Kérjük, mielőbb keresd fel a háziorvosodat a vizsgálat elvégzésére, és az új orvosi igazolást hozd be az iskola irodájába vagy küldd el válaszlevélben!`,
            ``,
            `Jelenlegi tanulói státuszod: ${student.status === 'exam_ready' ? 'Vizsgára bocsátható' : 'Aktív képzésben'}`,
            `Levezetett órák száma: ${student.completedHours} / ${student.requiredHours} óra`,
            ``,
            `Sikeres felkészülést és balesetmentes vezetést kívánunk!`,
            ``,
            `Üdvözlettel,`,
            `${settings.senderName || state.schoolCompany.schoolName || 'AutoSuli Képzési Központ'}`,
            `Telefon: ${state.schoolCompany.phone}`,
            `Cím: ${state.schoolCompany.address}`,
          ].join('\n');

          const body = settings.customMedicalBody ? settings.customMedicalBody : defaultBody;

          if (clientMode !== 'direct') {
            openEmailInClient(recipient, subject, body, clientMode, bcc);
          }

          const logEntry: EmailReminderLog = {
            id: `log-med-${student.id}-${Date.now()}`,
            timestamp: nowIso,
            targetId: student.id,
            targetName: student.name,
            type: 'medical',
            recipient,
            subject,
            clientUsed: clientMode,
            status: clientMode === 'direct' ? 'sent' : 'opened_in_client',
            notes: `Orvosi lejár: ${student.medicalExamExpiry} (${daysLeft} nap)`,
          };

          newLogs.push(logEntry);
          messages.push(`Tanulói orvosi emlékeztető: ${student.name} -> ${recipient}`);
        }
      }
    }
  });

  const updatedSettings: AutoEmailReminderSettings = {
    ...settings,
    lastRunDate: todayStr,
  };

  const updatedLogs = [...newLogs, ...existingLogs].slice(0, 100); // Legutóbbi 100 log megőrzése

  // Szintén rögzítünk egy értesítést a dbState.notifications listába
  const updatedNotifications = [...state.notifications];
  if (newLogs.length > 0) {
    updatedNotifications.unshift({
      id: `notif-${Date.now()}`,
      title: `⚡ Automata email emlékeztetők (${newLogs.length} db feldolgozva)`,
      message: `${motCount} db műszaki vizsga és ${medCount} db tanulói orvosi értesítés kiküldve (${clientMode.toUpperCase()} módban).`,
      type: 'info',
      date: nowIso,
      sentAsDesktop: true,
      sentAsEmail: true,
    });
  }

  const updatedState: DatabaseState = {
    ...state,
    autoEmailSettings: updatedSettings,
    emailReminderLogs: updatedLogs,
    notifications: updatedNotifications,
  };

  return {
    updatedState,
    motRemindersSent: motCount,
    medRemindersSent: medCount,
    newLogs,
    messages,
  };
}
