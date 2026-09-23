import * as XLSX from 'xlsx';
import { DatabaseState, Vehicle, Student, Instructor, Lesson } from '../types';
import { initialDatabase } from './mockData';

export function exportFullDatabaseToExcel(state: DatabaseState): void {
  const wb = XLSX.utils.book_new();

  // 1. Gépjárművek munkalap
  const vehiclesData = state.vehicles.map((v) => {
    const instructor = state.instructors.find((i) => i.id === v.currentInstructorId);
    return {
      'Rendszám': v.plateNumber,
      'Márka és Típus': v.brandModel,
      'Évjárat': v.year,
      'Kategória': v.category,
      'Váltó típus': v.transmission,
      'Km óra állás': v.currentKm,
      'Műszaki vizsga lejárata': v.motDate,
      'Állapot':
        v.status === 'active'
          ? 'Üzemképes'
          : v.status === 'in_use'
          ? 'Oktatásban (kint van)'
          : v.status === 'service'
          ? 'Szervizben'
          : 'Ideiglenesen kivonva',
      'Pótpedál': v.dualPedals ? 'Igen' : 'Nem',
      'Jelenlegi Oktató': instructor ? instructor.name : '-',
      'Kiadás ideje': v.checkoutTime ? v.checkoutTime.replace('T', ' ') : '-',
      'Kiadási kezdő km': v.checkoutKm || '-',
      'Megjegyzés': v.notes || '',
    };
  });
  const wsVehicles = XLSX.utils.json_to_sheet(vehiclesData);
  XLSX.utils.book_append_sheet(wb, wsVehicles, 'Gépjárművek');

  // 2. Oktatók munkalap
  const instructorsData = state.instructors.map((inst) => {
    const prefCar = state.vehicles.find((v) => v.id === inst.preferredVehicleId);
    return {
      'Oktató neve': inst.name,
      'Telefonszám': inst.phone,
      'Email': inst.email,
      'Oktatói igazolvány': inst.licenseNumber,
      'Kategóriák': inst.categories.join(', '),
      'Preferált jármű': prefCar ? `${prefCar.plateNumber} (${prefCar.brandModel})` : '-',
      'Státusz': inst.status === 'active' ? 'Aktív' : inst.status === 'leave' ? 'Szabadságon' : 'Inaktív',
      'Megjegyzés': inst.notes || '',
    };
  });
  const wsInstructors = XLSX.utils.json_to_sheet(instructorsData);
  XLSX.utils.book_append_sheet(wb, wsInstructors, 'Oktatók');

  // 3. Tanulók munkalap
  const studentsData = state.students.map((s) => {
    const inst = state.instructors.find((i) => i.id === s.instructorId);
    return {
      'Tanuló neve': s.name,
      'Telefonszám': s.phone,
      'Email': s.email,
      'Kategória': s.category,
      'Hozzárendelt Oktató': inst ? inst.name : '-',
      'Levezetett órák': `${s.completedHours} / ${s.requiredHours}`,
      'Levezetett km': `${s.completedKm} / ${s.requiredKm} km`,
      'Orvosi alkalmassági': s.medicalExamExpiry,
      'KRESZ elméleti vizsga': s.theoryExamStatus,
      'Tandíj befizetés': s.paymentStatus,
      'Státusz':
        s.status === 'active'
          ? 'Aktív tanuló'
          : s.status === 'exam_ready'
          ? 'Forgalmi vizsgára kész'
          : s.status === 'graduated'
          ? 'Levizsgázott'
          : 'Felfüggesztve',
      'Megjegyzés': s.notes || '',
    };
  });
  const wsStudents = XLSX.utils.json_to_sheet(studentsData);
  XLSX.utils.book_append_sheet(wb, wsStudents, 'Tanulók');

  // 4. Órarend munkalap
  const lessonsData = state.lessons.map((l) => {
    const inst = state.instructors.find((i) => i.id === l.instructorId);
    const stud = state.students.find((s) => s.id === l.studentId);
    const veh = state.vehicles.find((v) => v.id === l.vehicleId);
    return {
      'Dátum': l.date,
      'Időpont': `${l.startTime} - ${l.endTime}`,
      'Oktató': inst ? inst.name : '-',
      'Tanuló': stud ? stud.name : '-',
      'Gépkocsi': veh ? `${veh.plateNumber} (${veh.brandModel})` : '-',
      'Óra típusa': l.lessonType,
      'Státusz': l.status === 'completed' ? 'Teljesítve' : l.status === 'scheduled' ? 'Tervezett' : 'Lemondva',
      'Kezdő km': l.kmStart || '-',
      'Záró km': l.kmEnd || '-',
      'Megjegyzés': l.notes || '',
    };
  });
  const wsLessons = XLSX.utils.json_to_sheet(lessonsData);
  XLSX.utils.book_append_sheet(wb, wsLessons, 'Órarend');

  // 5. Tankolások munkalap
  const fuelData = state.fuelLogs.map((f) => {
    const veh = state.vehicles.find((v) => v.id === f.vehicleId);
    const inst = state.instructors.find((i) => i.id === f.instructorId);
    return {
      'Dátum': f.date,
      'Jármű': veh ? `${veh.plateNumber} (${veh.brandModel})` : '-',
      'Oktató': inst ? inst.name : '-',
      'Km óra állás': f.currentKm,
      'Tankolt mennyiség (liter)': f.liters,
      'Fizetett összeg (Ft)': f.totalCost,
      'Üzemanyag': f.fuelType,
      'Átlagfogyasztás (l/100km)': f.calculatedLitersPer100Km || '-',
    };
  });
  const wsFuel = XLSX.utils.json_to_sheet(fuelData);
  XLSX.utils.book_append_sheet(wb, wsFuel, 'Tankolások');

  // 6. Szerviz és karbantartás
  const maintData = state.maintenance.map((m) => {
    const veh = state.vehicles.find((v) => v.id === m.vehicleId);
    return {
      'Dátum': m.date,
      'Jármű': veh ? `${veh.plateNumber} (${veh.brandModel})` : '-',
      'Karbantartás típusa': m.type,
      'Leírás': m.description,
      'Szerviz műhely': m.workshop,
      'Költség (Ft)': m.cost,
      'Km állás szervizkor': m.kmAtService,
      'Állapot': m.status,
    };
  });
  const wsMaint = XLSX.utils.json_to_sheet(maintData);
  XLSX.utils.book_append_sheet(wb, wsMaint, 'Szerviz_Javítások');

  // 7. Tanfolyam Regisztrációk és Szerződések munkalap
  const regData = (state.courseRegistrations || []).map((r) => ({
    'Szerződésszám': r.contractNumber,
    'Dátum': r.date,
    'Tanuló Neve': r.studentName,
    'Anyja Neve': r.mothersName,
    'Személyi Ig. Szám': r.idCardNumber,
    'Lakcím': r.address,
    'Telefonszám': r.phone,
    'Email': r.email,
    'Kategória': r.category,
    'Tanfolyam': r.courseName,
    'Fizetési Konstrukció': r.paymentPlan,
    'Összes Tandíj (Ft)': r.totalFee,
    'Befizetett Előleg (Ft)': r.initialDeposit,
    'Aláírás Státusz': r.studentSignatureSvg ? 'Digitálisan aláírva' : 'Aláírásra vár',
    'Oktató': r.instructorName || '-',
  }));
  const wsReg = XLSX.utils.json_to_sheet(regData);
  XLSX.utils.book_append_sheet(wb, wsReg, 'Tanfolyam_Szerződések');

  const filename = `AutoSuli_Flotta_Adatbazis_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export async function parseExcelImport(file: File): Promise<{
  vehicles: Partial<Vehicle>[];
  students: Partial<Student>[];
  rawSheetNames: string[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetNames = workbook.SheetNames;

        const importedVehicles: Partial<Vehicle>[] = [];
        const importedStudents: Partial<Student>[] = [];

        // Keresünk járműves lapot
        const vehSheetName = sheetNames.find((s) =>
          s.toLowerCase().includes('járm') || s.toLowerCase().includes('auto') || s.toLowerCase().includes('gep')
        ) || sheetNames[0];

        if (vehSheetName) {
          const sheet = workbook.Sheets[vehSheetName];
          const rows: any[] = XLSX.utils.sheet_to_json(sheet);
          rows.forEach((r, idx) => {
            const plate = r['Rendszám'] || r['rendszam'] || r['Plate'] || r['Rendszam'];
            const brand = r['Márka és Típus'] || r['Tipus'] || r['Model'] || r['Tipus / Modell'];
            if (plate) {
              importedVehicles.push({
                id: `imp-veh-${Date.now()}-${idx}`,
                plateNumber: String(plate).toUpperCase().trim(),
                brandModel: brand ? String(brand) : 'Ismeretlen jármű',
                year: Number(r['Évjárat'] || r['Evjarat']) || 2020,
                category: (r['Kategória'] || r['Kategoria'] || 'B') as any,
                transmission: (r['Váltó típus'] || r['Valto'] || 'Manuális').includes('Auto') ? 'Automata' : 'Manuális',
                currentKm: Number(r['Km óra állás'] || r['Km']) || 0,
                motDate: r['Műszaki vizsga lejárata'] || r['Muszaki'] || new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
                motReminderDays: 30,
                dualPedals: true,
                status: 'active',
              });
            }
          });
        }

        // Keresünk tanulós lapot
        const studSheetName = sheetNames.find((s) =>
          s.toLowerCase().includes('tanul') || s.toLowerCase().includes('diak') || s.toLowerCase().includes('stud')
        );

        if (studSheetName) {
          const sheet = workbook.Sheets[studSheetName];
          const rows: any[] = XLSX.utils.sheet_to_json(sheet);
          rows.forEach((r, idx) => {
            const name = r['Tanuló neve'] || r['Nev'] || r['Name'];
            if (name) {
              importedStudents.push({
                id: `imp-stud-${Date.now()}-${idx}`,
                name: String(name),
                phone: String(r['Telefonszám'] || r['Telefon'] || '+36 30 000 0000'),
                email: String(r['Email'] || 'tanulo@autosuli.hu'),
                category: (r['Kategória'] || 'B') as any,
                completedHours: Number(r['Levezetett órák']) || 0,
                requiredHours: 30,
                completedKm: Number(r['Levezetett km']) || 0,
                requiredKm: 580,
                medicalExamExpiry: r['Orvosi alkalmassági'] || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
                theoryExamStatus: 'Sikeres',
                paymentStatus: 'Rendezve',
                status: 'active',
              });
            }
          });
        }

        resolve({
          vehicles: importedVehicles,
          students: importedStudents,
          rawSheetNames: sheetNames,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export const exportDatabaseToExcel = exportFullDatabaseToExcel;

export async function importDatabaseFromExcel(file: File): Promise<DatabaseState> {
  const parsed = await parseExcelImport(file);
  const currentDb: DatabaseState = {
    vehicles: parsed.vehicles.map((v, i) => ({
      id: v.id || `veh-${i}`,
      plateNumber: v.plateNumber || 'AA-BB-100',
      brandModel: v.brandModel || 'Oktatóautó',
      year: v.year || 2022,
      category: v.category || 'B',
      transmission: v.transmission || 'Manuális',
      currentKm: v.currentKm || 0,
      status: v.status || 'active',
      motDate: v.motDate || new Date().toISOString().slice(0, 10),
      motReminderDays: 30,
      dualPedals: true,
    })),
    students: parsed.students.map((s, i) => ({
      id: s.id || `stud-${i}`,
      name: s.name || 'Tanuló',
      phone: s.phone || '+36 30 000 0000',
      email: s.email || 'tanulo@email.hu',
      category: s.category || 'B',
      theoryExamStatus: 'Sikeres',
      medicalExamExpiry: s.medicalExamExpiry || new Date().toISOString().slice(0, 10),
      completedHours: s.completedHours || 0,
      requiredHours: 30,
      completedKm: s.completedKm || 0,
      requiredKm: 580,
      paymentStatus: 'Rendezve',
      status: 'active',
    })),
    instructors: [
      {
        id: 'inst-default',
        name: 'Vezető Oktató',
        phone: '+36 30 111 2222',
        email: 'oktato@autosuli.hu',
        licenseNumber: 'OKT-1001',
        categories: ['B'],
        status: 'active',
        color: '#f59e0b',
      },
    ],
    lessons: [],
    maintenance: [],
    fuelLogs: [],
    assignmentLogs: [],
    notifications: [],
    schoolCompany: initialDatabase.schoolCompany,
    courseOffers: initialDatabase.courseOffers,
    courseRegistrations: [],
    isEncrypted: false,
    lastSaved: new Date().toISOString(),
  };

  return currentDb;
}

