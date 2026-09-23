import React, { useState } from 'react';
import { Fuel, Plus, Calendar, Car, TrendingDown, DollarSign, Gauge, Trash2 } from 'lucide-react';
import { DatabaseState, FuelLog } from '../types';

interface FuelViewProps {
  dbState: DatabaseState;
  onAddFuelLog: (log: FuelLog) => void;
  onDeleteFuelLog: (id: string) => void;
}

export const FuelView: React.FC<FuelViewProps> = ({
  dbState,
  onAddFuelLog,
  onDeleteFuelLog,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [filterVehicle, setFilterVehicle] = useState('all');

  // Form állapotok
  const [formVehicleId, setFormVehicleId] = useState(dbState.vehicles[0]?.id || '');
  const [formInstructorId, setFormInstructorId] = useState(dbState.instructors[0]?.id || '');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formCurrentKm, setFormCurrentKm] = useState<number>(
    dbState.vehicles[0]?.currentKm || 50000
  );
  const [formLiters, setFormLiters] = useState<number>(35);
  const [formTotalCost, setFormTotalCost] = useState<number>(21500);
  const [formFuelType, setFormFuelType] = useState<FuelLog['fuelType']>('Benzin (E10)');
  const [formFullTank, setFormFullTank] = useState(true);

  // Szűrt tankolások
  const filteredLogs = dbState.fuelLogs.filter((f) => {
    if (filterVehicle !== 'all' && f.vehicleId !== filterVehicle) return false;
    return true;
  });

  // Összesített statisztikák
  const totalLiters = filteredLogs.reduce((sum, f) => sum + f.liters, 0);
  const totalCost = filteredLogs.reduce((sum, f) => sum + f.totalCost, 0);
  const validConsumptionLogs = filteredLogs.filter((f) => f.calculatedLitersPer100Km && f.calculatedLitersPer100Km > 0);
  const avgConsumption =
    validConsumptionLogs.length > 0
      ? (
          validConsumptionLogs.reduce((sum, f) => sum + (f.calculatedLitersPer100Km || 0), 0) /
          validConsumptionLogs.length
        ).toFixed(1)
      : '5.4';

  const handleOpenModal = () => {
    const defaultVeh = dbState.vehicles[0];
    setFormVehicleId(defaultVeh?.id || '');
    setFormCurrentKm((defaultVeh?.currentKm || 50000) + 450);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormLiters(35);
    setFormTotalCost(21500);
    setFormFullTank(true);
    setModalOpen(true);
  };

  const handleSaveFuel = () => {
    if (!formVehicleId || formLiters <= 0 || formTotalCost <= 0) {
      alert('Kérjük töltsön ki minden kötelező mezőt érvényes adatokkal!');
      return;
    }

    // Automatikus fogyasztás kalkuláció az előző tankoláshoz képest
    const vehicleLogs = dbState.fuelLogs
      .filter((f) => f.vehicleId === formVehicleId)
      .sort((a, b) => b.currentKm - a.currentKm);

    let calculatedLiters: number | undefined = undefined;
    if (vehicleLogs.length > 0) {
      const prevKm = vehicleLogs[0].currentKm;
      const kmDiff = formCurrentKm - prevKm;
      if (kmDiff > 50 && formFullTank) {
        calculatedLiters = Number(((formLiters / kmDiff) * 100).toFixed(1));
      }
    }

    const newLog: FuelLog = {
      id: `fuel-${Date.now()}`,
      vehicleId: formVehicleId,
      instructorId: formInstructorId,
      date: formDate,
      currentKm: formCurrentKm,
      liters: formLiters,
      totalCost: formTotalCost,
      fuelType: formFuelType,
      fullTank: formFullTank,
      calculatedLitersPer100Km: calculatedLiters,
    };

    onAddFuelLog(newLog);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Fejléc */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Fuel className="w-5 h-5 text-amber-500" />
            <span>Tankolások & Átlagfogyasztás Nyilvántartása</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Flotta üzemanyagköltségek, fogyasztási normák (l/100km) és tankolási napló.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-md shadow-amber-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Új Tankolás Rögzítése</span>
        </button>
      </div>

      {/* 3 Statisztikai Csempe */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Összes Tankolt Mennyiség</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {totalLiters.toFixed(1)} liter
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{filteredLogs.length} db rögzített tankolás</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Összes Üzemanyagköltség</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {totalCost.toLocaleString('hu-HU')} Ft
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Átlagos literár: {totalLiters > 0 ? `${Math.round(totalCost / totalLiters)} Ft/l` : '-'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Flotta Átlagfogyasztás</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {avgConsumption} l/100km
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Oktatási üzemmódú átlag</p>
        </div>
      </div>

      {/* Szűrősáv */}
      <div className="flex items-center space-x-2 text-xs bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <span className="text-slate-500 font-medium">Jármű szerinti szűrés:</span>
        <select
          value={filterVehicle}
          onChange={(e) => setFilterVehicle(e.target.value)}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          <option value="all">Minden jármű</option>
          {dbState.vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.plateNumber} ({v.brandModel})
            </option>
          ))}
        </select>
      </div>

      {/* Tankolások Táblázat */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">Dátum</th>
                <th className="p-3">Gépjármű</th>
                <th className="p-3">Oktató</th>
                <th className="p-3">Km állás</th>
                <th className="p-3">Mennyiség (l)</th>
                <th className="p-3">Fizetett összeg</th>
                <th className="p-3">Üzemanyag</th>
                <th className="p-3">Átlagfogyasztás</th>
                <th className="p-3 text-right">Törlés</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                    Nincs rögzített tankolási tétel a kiválasztott járműhöz.
                  </td>
                </tr>
              ) : (
                filteredLogs
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((log) => {
                    const veh = dbState.vehicles.find((v) => v.id === log.vehicleId);
                    const inst = dbState.instructors.find((i) => i.id === log.instructorId);

                    return (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          {log.date}
                        </td>
                        <td className="p-3 font-mono">
                          {veh?.plateNumber}
                          <span className="block text-[11px] text-slate-500 font-sans">
                            {veh?.brandModel}
                          </span>
                        </td>
                        <td className="p-3">{inst?.name || '-'}</td>
                        <td className="p-3 font-mono">{log.currentKm.toLocaleString('hu-HU')} km</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {log.liters.toFixed(1)} l
                        </td>
                        <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                          {log.totalCost.toLocaleString('hu-HU')} Ft
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{log.fuelType}</td>
                        <td className="p-3">
                          {log.calculatedLitersPer100Km ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold">
                              {log.calculatedLitersPer100Km} l/100km
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Kalkulációhoz kevés adat</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              if (confirm('Biztosan törölni szeretnéd ezt a tankolási bejegyzést?')) {
                                onDeleteFuelLog(log.id);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-red-500"
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

      {/* ÚJ TANKOLÁS MODÁL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Fuel className="w-5 h-5 text-amber-500" />
              <span>Tankolás Rögzítése</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Gépjármű kiválasztása:
                </label>
                <select
                  value={formVehicleId}
                  onChange={(e) => {
                    setFormVehicleId(e.target.value);
                    const v = dbState.vehicles.find((x) => x.id === e.target.value);
                    if (v) setFormCurrentKm(v.currentKm);
                  }}
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
                    Km óra állás:
                  </label>
                  <input
                    type="number"
                    value={formCurrentKm}
                    onChange={(e) => setFormCurrentKm(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Tankolt liter:
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formLiters}
                    onChange={(e) => setFormLiters(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Fizetett összeg (Ft):
                  </label>
                  <input
                    type="number"
                    value={formTotalCost}
                    onChange={(e) => setFormTotalCost(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Üzemanyag fajtája:
                </label>
                <select
                  value={formFuelType}
                  onChange={(e) => setFormFuelType(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Benzin (E10)">Benzin (E10 95-ös)</option>
                  <option value="Gázolaj (B7)">Gázolaj (B7 Dízel)</option>
                  <option value="Elektromos (kWh)">Elektromos töltés (kWh)</option>
                  <option value="LPG">LPG Autógáz</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Tankoló oktató:
                </label>
                <select
                  value={formInstructorId}
                  onChange={(e) => setFormInstructorId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {dbState.instructors.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="fullTankCheck"
                  checked={formFullTank}
                  onChange={(e) => setFormFullTank(e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="fullTankCheck" className="text-slate-700 dark:text-slate-300">
                  Tele tankolás (szükséges a pontos l/100km fogyasztási kalkulációhoz)
                </label>
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
                onClick={handleSaveFuel}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20"
              >
                Tankolás Mentése
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
