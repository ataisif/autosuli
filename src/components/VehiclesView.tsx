import React, { useState } from 'react';
import {
  Car,
  Plus,
  KeyRound,
  Wrench,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Mail,
  Edit2,
  Trash2,
  CheckCircle2,
  FileText,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Archive,
} from 'lucide-react';
import { DatabaseState, Vehicle, VehicleStatus, MaintenanceRecord } from '../types';
import { exportMotToCalendar } from '../services/notificationService';

interface VehiclesViewProps {
  dbState: DatabaseState;
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onAddVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onCheckoutVehicle: (vehicleId: string, instructorId: string, startKm: number, notes?: string) => void;
  onCheckinVehicle: (vehicleId: string, endKm: number, notes?: string) => void;
  onAddMaintenance: (record: MaintenanceRecord) => void;
  onOpenEmailWithTemplate: (type: 'mot' | 'medical' | 'schedule', data: any) => void;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({
  dbState,
  onUpdateVehicle,
  onAddVehicle,
  onDeleteVehicle,
  onCheckoutVehicle,
  onCheckinVehicle,
  onAddMaintenance,
  onOpenEmailWithTemplate,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modál állapotok
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [checkoutModalVehicle, setCheckoutModalVehicle] = useState<Vehicle | null>(null);
  const [checkinModalVehicle, setCheckinModalVehicle] = useState<Vehicle | null>(null);
  const [deregisterModalVehicle, setDeregisterModalVehicle] = useState<Vehicle | null>(null);
  const [maintenanceModalVehicle, setMaintenanceModalVehicle] = useState<Vehicle | null>(null);
  const [viewMaintenanceVehicle, setViewMaintenanceVehicle] = useState<Vehicle | null>(null);

  // Űrlap állapotok
  const [checkoutInstructorId, setCheckoutInstructorId] = useState(dbState.instructors[0]?.id || '');
  const [checkoutKm, setCheckoutKm] = useState<number>(0);
  const [checkoutNotes, setCheckoutNotes] = useState('');

  const [checkinKm, setCheckinKm] = useState<number>(0);
  const [checkinNotes, setCheckinNotes] = useState('');

  const [deregisterReason, setDeregisterReason] = useState('Időszakos oktatási szüneteltetés / vizsgafelkészítés');
  const [deregisterDate, setDeregisterDate] = useState(new Date().toISOString().slice(0, 10));

  const [maintType, setMaintType] = useState<MaintenanceRecord['type']>('Időszakos kötelező szerviz');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintWorkshop, setMaintWorkshop] = useState('Hivatalos Flottaszerviz Kft.');
  const [maintCost, setMaintCost] = useState<number>(35000);
  const [maintKm, setMaintKm] = useState<number>(0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const getDaysUntil = (targetDateStr: string) => {
    const target = new Date(targetDateStr).getTime();
    const today = new Date(todayStr).getTime();
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  };

  const filteredVehicles = dbState.vehicles.filter((v) => {
    const matchesSearch =
      v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.brandModel.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterStatus === 'in_use') return v.status === 'in_use';
    if (filterStatus === 'service') return v.status === 'service';
    if (filterStatus === 'deregistered') return v.status === 'deregistered';
    if (filterStatus === 'mot_urgent') {
      const days = getDaysUntil(v.motDate);
      return days <= 30;
    }
    if (filterStatus === 'active') return v.status === 'active';
    return true;
  });

  const handleOpenCheckout = (veh: Vehicle) => {
    setCheckoutModalVehicle(veh);
    setCheckoutInstructorId(veh.currentInstructorId || dbState.instructors[0]?.id || '');
    setCheckoutKm(veh.currentKm);
    setCheckoutNotes('');
  };

  const handleSaveCheckout = () => {
    if (!checkoutModalVehicle) return;
    onCheckoutVehicle(checkoutModalVehicle.id, checkoutInstructorId, checkoutKm, checkoutNotes);
    setCheckoutModalVehicle(null);
  };

  const handleOpenCheckin = (veh: Vehicle) => {
    setCheckinModalVehicle(veh);
    setCheckinKm(veh.checkoutKm ? veh.checkoutKm + 25 : veh.currentKm + 25);
    setCheckinNotes('Gépkocsi rendben, üzemanyag szint megfelelő.');
  };

  const handleSaveCheckin = () => {
    if (!checkinModalVehicle) return;
    onCheckinVehicle(checkinModalVehicle.id, checkinKm, checkinNotes);
    setCheckinModalVehicle(null);
  };

  const handleDeregister = () => {
    if (!deregisterModalVehicle) return;
    onUpdateVehicle({
      ...deregisterModalVehicle,
      status: 'deregistered',
      deregistrationDate: deregisterDate,
      deregistrationReason: deregisterReason,
    });
    setDeregisterModalVehicle(null);
  };

  const handleReactivate = (veh: Vehicle) => {
    onUpdateVehicle({
      ...veh,
      status: 'active',
      reactivationDate: new Date().toISOString().slice(0, 10),
      deregistrationReason: undefined,
    });
  };

  const handleOpenMaintenance = (veh: Vehicle) => {
    setMaintenanceModalVehicle(veh);
    setMaintKm(veh.currentKm);
    setMaintDesc('');
  };

  const handleSaveMaintenance = () => {
    if (!maintenanceModalVehicle) return;
    const newRecord: MaintenanceRecord = {
      id: `maint-${Date.now()}`,
      vehicleId: maintenanceModalVehicle.id,
      date: new Date().toISOString().slice(0, 10),
      type: maintType,
      description: maintDesc || `${maintType} elvégezve a járművön.`,
      workshop: maintWorkshop,
      cost: maintCost,
      kmAtService: maintKm,
      status: 'Folyamatban',
    };
    onAddMaintenance(newRecord);
    // Beállítjuk szerviz státuszra ha nem kivonva van
    if (maintenanceModalVehicle.status !== 'deregistered') {
      onUpdateVehicle({
        ...maintenanceModalVehicle,
        status: 'service',
        currentKm: maintKm > maintenanceModalVehicle.currentKm ? maintKm : maintenanceModalVehicle.currentKm,
      });
    }
    setMaintenanceModalVehicle(null);
  };

  return (
    <div className="space-y-6">
      {/* Fejléc és Szűrők */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Car className="w-5 h-5 text-amber-500" />
            <span>Gépjármű Flotta Nyilvántartás</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Műszaki vizsgák esedékessége, oktatói kintlét, forgalomból kivonások, javítások és állapotok.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setEditingVehicle({
                id: `veh-${Date.now()}`,
                plateNumber: '',
                brandModel: '',
                year: 2023,
                category: 'B',
                transmission: 'Manuális',
                currentKm: 10000,
                status: 'active',
                motDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
                motReminderDays: 30,
                dualPedals: true,
                notes: '',
              });
              setIsNewModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-md shadow-amber-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Új Gépjármű Hozzáadása</span>
          </button>
        </div>
      </div>

      {/* Keresés és Státusz Szűrő fülek */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Keresés rendszám vagy típus szerint..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center space-x-1 w-full sm:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Összes' },
            { id: 'in_use', label: 'Oktatásban (Kint)' },
            { id: 'mot_urgent', label: 'Műszaki esedékes (<30 nap)' },
            { id: 'service', label: 'Szervizben' },
            { id: 'deregistered', label: 'Forgalomból kivonva' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filterStatus === tab.id
                  ? 'bg-amber-500 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Jármű Kártyák Rácsa */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles.map((vehicle) => {
          const daysLeft = getDaysUntil(vehicle.motDate);
          const isExpired = daysLeft <= 0;
          const isUrgent = daysLeft <= 30;
          const instructor = dbState.instructors.find((i) => i.id === vehicle.currentInstructorId);
          const maintCount = dbState.maintenance.filter((m) => m.vehicleId === vehicle.id).length;

          return (
            <div
              key={vehicle.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4 relative overflow-hidden"
            >
              {/* Felső csík és alapinfók */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-md font-mono font-bold text-sm bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                      {vehicle.plateNumber}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {vehicle.category} kat.
                    </span>
                    {vehicle.dualPedals && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium" title="Oktatói pótpedállal felszerelve">
                        Pótpedál ✓
                      </span>
                    )}
                  </div>

                  {/* Státusz Jelvény */}
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      vehicle.status === 'in_use'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse'
                        : vehicle.status === 'service'
                        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800'
                        : vehicle.status === 'deregistered'
                        ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {vehicle.status === 'in_use'
                      ? 'Oktatásban (Kint)'
                      : vehicle.status === 'service'
                      ? 'Szervizben'
                      : vehicle.status === 'deregistered'
                      ? 'Forgalomból kivonva'
                      : 'Üzemképes (Szabad)'}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {vehicle.brandModel}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-3 mt-1">
                    <span>{vehicle.year}</span>
                    <span>•</span>
                    <span>{vehicle.transmission}</span>
                    <span>•</span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                      {vehicle.currentKm.toLocaleString('hu-HU')} km
                    </span>
                  </div>
                </div>

                {/* Műszaki vizsga kártyarészlet */}
                <div
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                    isExpired
                      ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-900 dark:text-red-200'
                      : isUrgent
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Műszaki vizsga: {vehicle.motDate}</span>
                    </div>
                    <div className="text-[11px] font-semibold">
                      {isExpired ? '⚠️ LEJÁRT!' : `${daysLeft} nap van hátra`}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => exportMotToCalendar(vehicle)}
                      className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                      title="Műszaki vizsga naptárba írása (.ics letöltés)"
                    >
                      <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    </button>
                    <button
                      onClick={() => onOpenEmailWithTemplate('mot', vehicle)}
                      className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                      title="Műszaki vizsga értesítő küldése emailben"
                    >
                      <Mail className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    </button>
                  </div>
                </div>

                {/* Oktatásban / Kint lévő állapot adatai */}
                {vehicle.status === 'in_use' && (
                  <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs space-y-1 text-amber-950 dark:text-amber-200">
                    <div className="font-bold flex items-center space-x-1">
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>Kint lévő oktató: {instructor?.name || 'Ismeretlen'}</span>
                    </div>
                    <div className="text-[11px] opacity-80 flex items-center justify-between">
                      <span>Kiadva: {vehicle.checkoutTime?.replace('T', ' ') || '-'}</span>
                      <span>Kezdő km: {vehicle.checkoutKm || vehicle.currentKm} km</span>
                    </div>
                  </div>
                )}

                {/* Kivonva részletek */}
                {vehicle.status === 'deregistered' && (
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1 text-slate-700 dark:text-slate-300">
                    <div className="font-semibold flex items-center space-x-1 text-slate-900 dark:text-white">
                      <Archive className="w-3.5 h-3.5" />
                      <span>Kivonva: {vehicle.deregistrationDate || '-'}</span>
                    </div>
                    <p className="text-[11px] italic">{vehicle.deregistrationReason || 'Nincs indoklás megadva'}</p>
                  </div>
                )}
              </div>

              {/* Alsó műveleti gombok */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {vehicle.status === 'in_use' ? (
                    <button
                      onClick={() => handleOpenCheckin(vehicle)}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Visszahozatal Rögzítése</span>
                    </button>
                  ) : vehicle.status === 'deregistered' ? (
                    <button
                      onClick={() => handleReactivate(vehicle)}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Újra Üzembehelyezés</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenCheckout(vehicle)}
                      disabled={vehicle.status === 'service'}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-semibold shadow-xs"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Kiadás Oktatónak</span>
                    </button>
                  )}

                  {vehicle.status !== 'deregistered' && (
                    <button
                      onClick={() => {
                        setDeregisterModalVehicle(vehicle);
                        setDeregisterReason('Időszakos oktatási szüneteltetés / vizsgafelkészítés');
                        setDeregisterDate(new Date().toISOString().slice(0, 10));
                      }}
                      className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs"
                      title="Forgalomból ideiglenes kivonás"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenMaintenance(vehicle)}
                    className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs"
                    title="Új javítás vagy szerviz rögzítése"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setViewMaintenanceVehicle(vehicle)}
                    className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs"
                    title={`Szervizelőzmények megtekintése (${maintCount} db)`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      setEditingVehicle(vehicle);
                      setIsNewModalOpen(false);
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    title="Jármű adatainak szerkesztése"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Biztosan törölni szeretnéd a(z) ${vehicle.plateNumber} rendszámú járművet?`)) {
                        onDeleteVehicle(vehicle.id);
                      }
                    }}
                    className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400"
                    title="Jármű törlése"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* JÁRMŰ KIADÁSA MODÁL */}
      {checkoutModalVehicle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Gépjármű Kiadása Oktatónak
                </h3>
                <p className="text-xs text-slate-500">
                  {checkoutModalVehicle.plateNumber} - {checkoutModalVehicle.brandModel}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Oktató kiválasztása:
                </label>
                <select
                  value={checkoutInstructorId}
                  onChange={(e) => setCheckoutInstructorId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {dbState.instructors.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.licenseNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Induló kilométeróra állás:
                </label>
                <input
                  type="number"
                  value={checkoutKm}
                  onChange={(e) => setCheckoutKm(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Megjegyzés / Cél:
                </label>
                <input
                  type="text"
                  placeholder="Pl. Városi és országúti vezetés délelőtt..."
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setCheckoutModalVehicle(null)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Mégse
              </button>
              <button
                onClick={handleSaveCheckout}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20"
              >
                Kiadás Rögzítése
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VISSZAHOZATAL RÖGZÍTÉSE MODÁL */}
      {checkinModalVehicle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Jármű Visszahozatala Telephelyre
                </h3>
                <p className="text-xs text-slate-500">
                  {checkinModalVehicle.plateNumber} - {checkinModalVehicle.brandModel}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">
                <span>Induló km állás: </span>
                <strong>{checkinModalVehicle.checkoutKm || checkinModalVehicle.currentKm} km</strong>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Visszahozatali (záró) km óra állás:
                </label>
                <input
                  type="number"
                  value={checkinKm}
                  onChange={(e) => setCheckinKm(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Megtett távolság: {checkinKm - (checkinModalVehicle.checkoutKm || checkinModalVehicle.currentKm)} km
                </p>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Állapot feljegyzés / Megjegyzés:
                </label>
                <textarea
                  rows={2}
                  value={checkinNotes}
                  onChange={(e) => setCheckinNotes(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setCheckinModalVehicle(null)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Mégse
              </button>
              <button
                onClick={handleSaveCheckin}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
              >
                Visszahozatal Mentése
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORGALOMBÓL KIVONÁS MODÁL */}
      {deregisterModalVehicle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Ideiglenes Forgalomból Kivonás
                </h3>
                <p className="text-xs text-slate-500">
                  {deregisterModalVehicle.plateNumber} - {deregisterModalVehicle.brandModel}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Kivonás dátuma:
                </label>
                <input
                  type="date"
                  value={deregisterDate}
                  onChange={(e) => setDeregisterDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Kivonás indoklása:
                </label>
                <textarea
                  rows={3}
                  value={deregisterReason}
                  onChange={(e) => setDeregisterReason(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setDeregisterModalVehicle(null)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Mégse
              </button>
              <button
                onClick={handleDeregister}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white shadow-md"
              >
                Kivonás Végrehajtása
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ÚJ SZERVIZ / JAVÍTÁS RÖGZÍTÉSE MODÁL */}
      {maintenanceModalVehicle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950 text-red-600">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Javítás / Szerviz Felvétele
                </h3>
                <p className="text-xs text-slate-500">
                  {maintenanceModalVehicle.plateNumber} ({maintenanceModalVehicle.brandModel})
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Karbantartás / Javítás jellege:
                </label>
                <select
                  value={maintType}
                  onChange={(e) => setMaintType(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Időszakos kötelező szerviz">Időszakos kötelező szerviz</option>
                  <option value="Fékjavítás">Fékjavítás</option>
                  <option value="Kuplung/Váltó">Kuplung / Váltó</option>
                  <option value="Olajcsere">Olajcsere & Szűrők</option>
                  <option value="Gumicsere">Gumicsere (szezonális)</option>
                  <option value="Műszaki felkészítés">Műszaki felkészítés</option>
                  <option value="Pótpedál karbantartás">Pótpedál karbantartás</option>
                  <option value="Karosszéria/Fényezés">Karosszéria / Fényezés</option>
                  <option value="Egyéb javítás">Egyéb javítás</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Részletes leírás / Hiba:
                </label>
                <textarea
                  rows={2}
                  placeholder="Pl. Kuplung csúszik, kinyomócsapágy zörög..."
                  value={maintDesc}
                  onChange={(e) => setMaintDesc(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Költség (Ft):
                  </label>
                  <input
                    type="number"
                    value={maintCost}
                    onChange={(e) => setMaintCost(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Km óra állás:
                  </label>
                  <input
                    type="number"
                    value={maintKm}
                    onChange={(e) => setMaintKm(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Szervizműhely neve:
                </label>
                <input
                  type="text"
                  value={maintWorkshop}
                  onChange={(e) => setMaintWorkshop(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setMaintenanceModalVehicle(null)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Mégse
              </button>
              <button
                onClick={handleSaveMaintenance}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20"
              >
                Szervizbe Adás Mentése
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SZERVIZELŐZMÉNYEK MODÁL */}
      {viewMaintenanceVehicle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Szerviz & Javítás Előzmények
                  </h3>
                  <p className="text-xs text-slate-500">
                    {viewMaintenanceVehicle.plateNumber} ({viewMaintenanceVehicle.brandModel})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewMaintenanceVehicle(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {dbState.maintenance.filter((m) => m.vehicleId === viewMaintenanceVehicle.id).length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic text-center py-6">
                Nincs még rögzített szerviz vagy javítási előzmény ehhez a járműhöz.
              </p>
            ) : (
              <div className="space-y-3 text-xs">
                {dbState.maintenance
                  .filter((m) => m.vehicleId === viewMaintenanceVehicle.id)
                  .map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">{m.type}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            m.status === 'Befejezett'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{m.description}</p>
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span>Dátum: {m.date}</span>
                        <span>Műhely: {m.workshop}</span>
                        <span>Km: {m.kmAtService} km</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {m.cost.toLocaleString('hu-HU')} Ft
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ÚJ GÉPJÁRMŰ / SZERKESZTÉS MODÁL */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isNewModalOpen ? 'Új Gépjármű Felvétele' : 'Gépjármű Adatainak Szerkesztése'}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Rendszám:
                  </label>
                  <input
                    type="text"
                    placeholder="Pl. AA-BC-123"
                    value={editingVehicle.plateNumber}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, plateNumber: e.target.value.toUpperCase() })
                    }
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Kategória:
                  </label>
                  <select
                    value={editingVehicle.category}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, category: e.target.value as any })
                    }
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="B">B (Személygépkocsi)</option>
                    <option value="A">A (Motorkerékpár)</option>
                    <option value="C">C (Tehergépkocsi)</option>
                    <option value="CE">CE (Nehéz pótkocsi)</option>
                    <option value="D">D (Autóbusz)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Márka és Típus:
                </label>
                <input
                  type="text"
                  placeholder="Pl. Toyota Yaris 1.5 Hybrid"
                  value={editingVehicle.brandModel}
                  onChange={(e) =>
                    setEditingVehicle({ ...editingVehicle, brandModel: e.target.value })
                  }
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Évjárat:
                  </label>
                  <input
                    type="number"
                    value={editingVehicle.year}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, year: Number(e.target.value) })
                    }
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Váltó:
                  </label>
                  <select
                    value={editingVehicle.transmission}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, transmission: e.target.value as any })
                    }
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Manuális">Manuális</option>
                    <option value="Automata">Automata</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Km óra állás:
                  </label>
                  <input
                    type="number"
                    value={editingVehicle.currentKm}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, currentKm: Number(e.target.value) })
                    }
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Műszaki vizsga lejárata:
                  </label>
                  <input
                    type="date"
                    value={editingVehicle.motDate}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, motDate: e.target.value })
                    }
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Alapértelmezett állapot:
                  </label>
                  <select
                    value={editingVehicle.status}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, status: e.target.value as any })
                    }
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="active">Üzemképes (Telephelyen)</option>
                    <option value="in_use">Oktatásban (Kint)</option>
                    <option value="service">Szervizben</option>
                    <option value="deregistered">Ideiglenesen kivonva</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="dualPedalsCheck"
                  checked={editingVehicle.dualPedals}
                  onChange={(e) =>
                    setEditingVehicle({ ...editingVehicle, dualPedals: e.target.checked })
                  }
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="dualPedalsCheck" className="font-medium text-slate-700 dark:text-slate-300">
                  Oktatói pótpedállal és pótfékkel felszerelve (hivatalos műbizonylat)
                </label>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Egyéb megjegyzések:
                </label>
                <textarea
                  rows={2}
                  value={editingVehicle.notes || ''}
                  onChange={(e) =>
                    setEditingVehicle({ ...editingVehicle, notes: e.target.value })
                  }
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setEditingVehicle(null)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Mégse
              </button>
              <button
                onClick={() => {
                  if (!editingVehicle.plateNumber.trim()) {
                    alert('Kérjük adja meg a gépjármű rendszámát!');
                    return;
                  }
                  if (isNewModalOpen) {
                    onAddVehicle(editingVehicle);
                  } else {
                    onUpdateVehicle(editingVehicle);
                  }
                  setEditingVehicle(null);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20"
              >
                {isNewModalOpen ? 'Gépjármű Mentése' : 'Módosítások Mentése'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
