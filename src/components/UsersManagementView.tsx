import React, { useState } from 'react';
import {
  Users,
  Shield,
  KeyRound,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  Search,
  Filter,
  AlertTriangle,
  Lock,
  Unlock,
  ChevronDown,
  Info,
  Calendar,
  Layers,
  Fuel,
  Car,
  FileSignature,
  Building,
  Check,
} from 'lucide-react';
import { AppUser, UserPermissions, AuditLogEntry, UserRole } from '../types';

interface UsersManagementViewProps {
  currentUser: AppUser;
  users: AppUser[];
  auditLogs: AuditLogEntry[];
  onAddUser: (user: AppUser) => void;
  onUpdateUser: (user: AppUser) => void;
  onDeleteUser: (userId: string) => void;
}

const DEFAULT_CLERK_PERMISSIONS: UserPermissions = {
  canRegisterCourses: true,
  canEditRegistrations: true,
  canPrintContracts: true,
  canCheckoutVehicles: true,
  canEditVehicles: false,
  canManageMaintenance: false,
  canManageLessons: true,
  canOverrideScheduleConflicts: false,
  canManageStudents: true,
  canManageInstructors: false,
  canManageFuel: true,
  canEditCompanyInfo: false,
  canExportImportExcel: false,
  canManageUsers: false,
  canViewAuditLogs: false,
};

const DEFAULT_ADMIN_PERMISSIONS: UserPermissions = {
  canRegisterCourses: true,
  canEditRegistrations: true,
  canPrintContracts: true,
  canCheckoutVehicles: true,
  canEditVehicles: true,
  canManageMaintenance: true,
  canManageLessons: true,
  canOverrideScheduleConflicts: true,
  canManageStudents: true,
  canManageInstructors: true,
  canManageFuel: true,
  canEditCompanyInfo: true,
  canExportImportExcel: true,
  canManageUsers: true,
  canViewAuditLogs: true,
};

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  currentUser,
  users,
  auditLogs,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  // Felhasználó szerkesztési form állapot
  const [editForm, setEditForm] = useState<AppUser>({
    id: '',
    username: '',
    fullName: '',
    email: '',
    role: 'clerk',
    passwordHash: '',
    active: true,
    avatarColor: 'from-sky-500 to-blue-600',
    createdAt: new Date().toISOString(),
    permissions: { ...DEFAULT_CLERK_PERMISSIONS },
  });

  // Audit log szűrők
  const [auditFilterUser, setAuditFilterUser] = useState<string>('all');
  const [auditFilterModule, setAuditFilterModule] = useState<string>('all');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');

  const isAdmin = currentUser.role === 'admin';

  const handleOpenNewUser = () => {
    const newUser: AppUser = {
      id: `usr-${Date.now()}`,
      username: '',
      fullName: '',
      email: '',
      role: 'clerk',
      passwordHash: 'ugyvitel123',
      active: true,
      avatarColor: 'from-teal-500 to-emerald-600',
      createdAt: new Date().toISOString(),
      permissions: { ...DEFAULT_CLERK_PERMISSIONS },
    };
    setEditForm(newUser);
    setIsNewUser(true);
    setIsEditingModalOpen(true);
  };

  const handleOpenEditUser = (user: AppUser) => {
    setEditForm(JSON.parse(JSON.stringify(user)));
    setIsNewUser(false);
    setIsEditingModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.username.trim() || !editForm.fullName.trim()) return;

    if (isNewUser) {
      onAddUser(editForm);
    } else {
      onUpdateUser(editForm);
    }
    setIsEditingModalOpen(false);
  };

  const handleTogglePermission = (key: keyof UserPermissions) => {
    setEditForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key],
      },
    }));
  };

  const handleRoleChange = (role: UserRole) => {
    setEditForm((prev) => ({
      ...prev,
      role,
      permissions: role === 'admin' ? { ...DEFAULT_ADMIN_PERMISSIONS } : { ...DEFAULT_CLERK_PERMISSIONS },
    }));
  };

  // Szűrt audit napló
  const filteredAuditLogs = auditLogs
    .filter((log) => {
      if (auditFilterUser !== 'all' && log.userId !== auditFilterUser) return false;
      if (auditFilterModule !== 'all' && log.module !== auditFilterModule) return false;
      if (auditSearchQuery.trim()) {
        const query = auditSearchQuery.toLowerCase();
        return (
          log.details.toLowerCase().includes(query) ||
          log.username.toLowerCase().includes(query) ||
          (log.targetName && log.targetName.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      {/* Fejléc és tabválasztó */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Felhasználók Kezelése & Tevékenységnapló (Audit)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Adminisztrátori és ügyviteli dolgozói hozzáférések, jogosultsági mátrix és eseménykövetés
          </p>
        </div>

        {/* Tabok */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'users'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span>Felhasználók & Jogosultságok ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'audit'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>Tevékenységnapló (Audit) ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* 1. TAB: FELHASZNÁLÓK & JOGOSULTSÁGOK */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Az adminisztrátor korlátozhatja vagy kiterjesztheti, hogy az ügyviteli munkatársak mely funkciókhoz férhetnek hozzá.
            </div>

            {isAdmin && (
              <button
                onClick={handleOpenNewUser}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Új Felhasználó Hozzáadása</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((u) => {
              const isCurrent = currentUser.id === u.id;
              const permCount = Object.values(u.permissions).filter(Boolean).length;
              const totalPerms = Object.keys(u.permissions).length;

              return (
                <div
                  key={u.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-xs transition-all relative overflow-hidden flex flex-col justify-between ${
                    isCurrent
                      ? 'border-amber-500/80 ring-1 ring-amber-500/30'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-bl-lg">
                      Jelenlegi felhasználó
                    </div>
                  )}

                  <div>
                    {/* Profil Fejléc */}
                    <div className="flex items-start space-x-3 mb-4">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${u.avatarColor} flex items-center justify-center text-white text-base font-bold shadow-md`}
                      >
                        {u.fullName.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                            {u.fullName}
                          </h3>
                        </div>
                        <span className="text-xs text-slate-500 truncate block">
                          @{u.username} • {u.email}
                        </span>
                        <div className="mt-1 flex items-center space-x-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                              u.role === 'admin'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                            }`}
                          >
                            {u.role === 'admin' ? 'Rendszergazda' : 'Ügyviteli Dolgozó'}
                          </span>
                          <span
                            className={`text-[10px] flex items-center space-x-1 ${
                              u.active ? 'text-emerald-500' : 'text-slate-400'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            <span>{u.active ? 'Aktív' : 'Inaktív'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Jogosultságok gyors áttekintése */}
                    <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-4 text-[11px]">
                      <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
                        <span>Aktív jogosultságok:</span>
                        <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                          {permCount} / {totalPerms} engedélyezve
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all"
                          style={{ width: `${(permCount / totalPerms) * 100}%` }}
                        />
                      </div>
                      <div className="pt-1 flex flex-wrap gap-1">
                        {u.permissions.canRegisterCourses && (
                          <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            Szerződéskötés
                          </span>
                        )}
                        {u.permissions.canCheckoutVehicles && (
                          <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            Jármű kiadás
                          </span>
                        )}
                        {u.permissions.canManageLessons && (
                          <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            Órarend
                          </span>
                        )}
                        {u.permissions.canManageStudents && (
                          <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            Tanulók
                          </span>
                        )}
                        {u.permissions.canManageFuel && (
                          <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            Tankolás
                          </span>
                        )}
                        {u.permissions.canManageUsers && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-[10px] text-amber-800 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-700">
                            Felhasználókezelés
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Műveletek gomb */}
                  {isAdmin && (
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400">
                        {u.lastLoginAt ? `Utolsó belépés: ${new Date(u.lastLoginAt).toLocaleDateString('hu-HU')}` : 'Még nem lépett be'}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center space-x-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Jogok & Módosítás</span>
                        </button>
                        {users.length > 1 && !isCurrent && (
                          <button
                            onClick={() => {
                              if (confirm(`Biztosan törölni szeretné a(z) "${u.fullName}" felhasználót?`)) {
                                onDeleteUser(u.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                            title="Felhasználó törlése"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. TAB: TEVÉKENYSÉGNAPLÓ (AUDIT LOG) */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Szűrők és kereső */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                placeholder="Keresés művelet leírásában, felhasználóban vagy célpontban..."
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={auditFilterUser}
                onChange={(e) => setAuditFilterUser(e.target.value)}
                className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="all">Minden felhasználó</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.username})
                  </option>
                ))}
              </select>

              <select
                value={auditFilterModule}
                onChange={(e) => setAuditFilterModule(e.target.value)}
                className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="all">Minden modul</option>
                <option value="AUTH">Belépés / Kijelentkezés</option>
                <option value="USERS">Felhasználókezelés</option>
                <option value="REGISTRATION">Tanfolyam Regisztráció</option>
                <option value="VEHICLES">Jármű Flotta</option>
                <option value="SCHEDULE">Órarend</option>
                <option value="STUDENTS">Tanulók</option>
                <option value="INSTRUCTORS">Oktatók</option>
                <option value="FUEL">Tankolás</option>
                <option value="MAINTENANCE">Szerviz</option>
                <option value="COMPANY">Cégadatok</option>
              </select>
            </div>
          </div>

          {/* Audit lista táblázat */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Időbélyegzett Eseménynapló ({filteredAuditLogs.length} bejegyzés)
              </span>
              <span>Ki, mikor és milyen adatmódosítást végzett a rendszerben</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
              {filteredAuditLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Nincs a szűrésnek megfelelő tevékenységi bejegyzés.
                </div>
              ) : (
                filteredAuditLogs.map((log) => {
                  const date = new Date(log.timestamp);
                  const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
                    date.getDate()
                  ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(
                    2,
                    '0'
                  )}:${String(date.getSeconds()).padStart(2, '0')}`;

                  return (
                    <div
                      key={log.id}
                      className="p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                            log.action === 'CREATE' || log.action === 'SIGN'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : log.action === 'UPDATE' || log.action === 'CHECKOUT' || log.action === 'CHECKIN'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                              : log.action === 'DELETE'
                              ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {log.action}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {log.username}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                log.userRole === 'admin'
                                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                                  : 'bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300'
                              }`}
                            >
                              {log.userRole === 'admin' ? 'Admin' : 'Ügyvitel'}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                              {log.module}
                            </span>
                          </div>

                          <p className="text-slate-700 dark:text-slate-300 mt-1 font-medium">
                            {log.details}
                          </p>
                        </div>
                      </div>

                      <div className="text-right sm:text-right text-[11px] text-slate-400 font-mono shrink-0 pl-7 sm:pl-0">
                        {formattedDate}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* JOGOSULTSÁG ÉS FELHASZNÁLÓ SZERKESZTŐ MODÁL */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center space-x-2.5">
                <Shield className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {isNewUser ? 'Új Rendszerfelhasználó Létrehozása' : `Felhasználó & Jogosultságok: ${editForm.fullName}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
              {/* Alapadatok */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teljes Név *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    placeholder="pl. Kis Katalin (Ügyvitel)"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Felhasználónév (Bejelentkezéshez) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value.toLowerCase().trim() })}
                    placeholder="pl. kkatalin"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Cím *
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="katalin@autosuli.hu"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jelszó
                  </label>
                  <input
                    type="text"
                    value={editForm.passwordHash}
                    onChange={(e) => setEditForm({ ...editForm, passwordHash: e.target.value })}
                    placeholder="Jelszó módosítása..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Szerepkör és Aktív állapot */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Szerepkör és Hozzáférési Szint
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('admin')}
                    className={`p-3 rounded-xl border text-left flex items-start space-x-3 transition-all ${
                      editForm.role === 'admin'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs flex items-center space-x-1.5">
                        <span>Adminisztrátor (Rendszergazda)</span>
                        {editForm.role === 'admin' && <Check className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        Teljeskörű felügyelet, minden adatmódosítási jog, felhasználókezelés és audit napló.
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('clerk')}
                    className={`p-3 rounded-xl border text-left flex items-start space-x-3 transition-all ${
                      editForm.role === 'clerk'
                        ? 'border-sky-500 bg-sky-500/10 text-sky-900 dark:text-sky-200'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Briefcase className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs flex items-center space-x-1.5">
                        <span>Ügyviteli Dolgozó</span>
                        {editForm.role === 'clerk' && <Check className="w-3.5 h-3.5 text-sky-500" />}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        Napi operációs munka, alább egyénileg testreszabható munkafolyamat engedélyekkel.
                      </span>
                    </div>
                  </button>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="userActiveCheck"
                    checked={editForm.active}
                    onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500"
                  />
                  <label htmlFor="userActiveCheck" className="text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                    Felhasználói fiók aktív (Bejelentkezés engedélyezett)
                  </label>
                </div>
              </div>

              {/* JOGOSULTSÁGI MÁTRIX */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Engedélyezett Munkafolyamatok & Adatmódosítási Jogok
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditForm((p) => ({ ...p, permissions: { ...DEFAULT_ADMIN_PERMISSIONS } }))}
                      className="text-[10px] text-amber-600 hover:underline"
                    >
                      Mind engedélyezése
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditForm((p) => ({
                          ...p,
                          permissions: {
                            canRegisterCourses: false,
                            canEditRegistrations: false,
                            canPrintContracts: false,
                            canCheckoutVehicles: false,
                            canEditVehicles: false,
                            canManageMaintenance: false,
                            canManageLessons: false,
                            canOverrideScheduleConflicts: false,
                            canManageStudents: false,
                            canManageInstructors: false,
                            canManageFuel: false,
                            canEditCompanyInfo: false,
                            canExportImportExcel: false,
                            canManageUsers: false,
                            canViewAuditLogs: false,
                          },
                        }))
                      }
                      className="text-[10px] text-slate-500 hover:underline"
                    >
                      Mind letiltása
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Tanfolyamok */}
                  <label className="flex items-start space-x-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.permissions.canRegisterCourses}
                      onChange={() => handleTogglePermission('canRegisterCourses')}
                      className="mt-0.5 rounded text-amber-500"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Tanfolyam Regisztráció & Aláírás
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Új tanulói szerződések felvitele és digitális aláíratása
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start space-x-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.permissions.canEditRegistrations}
                      onChange={() => handleTogglePermission('canEditRegistrations')}
                      className="mt-0.5 rounded text-amber-500"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Szerződések Módosítása / Törlése
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Meglévő tanfolyami szerződések adatainak javítása
                      </span>
                    </div>
                  </label>

                  {/* Járművek */}
                  <label className="flex items-start space-x-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.permissions.canCheckoutVehicles}
                      onChange={() => handleTogglePermission('canCheckoutVehicles')}
                      className="mt-0.5 rounded text-amber-500"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Jármű Kiadás & Visszavétel
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Oktatóknak történő napi gépkocsi kiadás és leadás rögzítése
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start space-x-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.permissions.canEditVehicles}
                      onChange={() => handleTogglePermission('canEditVehicles')}
                      className="mt-0.5 rounded text-amber-500"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Jármű Törzsadat & Kivonás
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Új jármű felvétele, forgalomból kivonása és újra üzembehelyezése
                      </span>
                    </div>
                  </label>

                  {/* Órarend */}
                  <label className="flex items-start space-x-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.permissions.canManageLessons}
                      onChange={() => handleTogglePermission('canManageLessons')}
                      className="mt-0.5 rounded text-amber-500"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Órarend Szerkesztés & Órák
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Vezetési órák rögzítése, áthelyezése, törlése
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start space-x-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.permissions.canOverrideScheduleConflicts}
                      onChange={() => handleTogglePermission('canOverrideScheduleConflicts')}
                      className="mt-0.5 rounded text-amber-500"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Órarendi Ütközések Felülbírálása
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Figyelmeztetés ellenére óra engedélyezése ütközéskor
                      </span>
                    </div>
                  </label>

                  {/* Tanulók és oktatók */}
                  <label className="flex items-start space-x-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.permissions.canManageStudents}
                      onChange={() => handleTogglePermission('canManageStudents')}
                      className="mt-0.5 rounded text-amber-500"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Tanulói Nyilvántartás Kezelése
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Tanulók felvétele, órák és km állás frissítése
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start space-x-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.permissions.canManageInstructors}
                      onChange={() => handleTogglePermission('canManageInstructors')}
                      className="mt-0.5 rounded text-amber-500"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Oktatói Törzs Módosítása
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Oktatók felvétele, törlése, oktatói engedélyszámok
                      </span>
                    </div>
                  </label>

                  {/* Tankolás és karbantartás */}
                  <label className="flex items-start space-x-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.permissions.canManageFuel}
                      onChange={() => handleTogglePermission('canManageFuel')}
                      className="mt-0.5 rounded text-amber-500"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Tankolások & Üzemanyag Bizonylatok
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Tankolási számlák rögzítése és fogyasztásnaplózás
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start space-x-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.permissions.canManageMaintenance}
                      onChange={() => handleTogglePermission('canManageMaintenance')}
                      className="mt-0.5 rounded text-amber-500"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Szerviz & Műszaki Vizsga Ügyintézés
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Javítási tételek és műszaki vizsga dátumok karbantartása
                      </span>
                    </div>
                  </label>

                  {/* Rendszeradmin */}
                  <label className="flex items-start space-x-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.permissions.canEditCompanyInfo}
                      onChange={() => handleTogglePermission('canEditCompanyInfo')}
                      className="mt-0.5 rounded text-amber-500"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Cégadatok & Szerződési Záradék
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Autósiskola hivatalos adatainak és bankszámlájának szerkesztése
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start space-x-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.permissions.canExportImportExcel}
                      onChange={() => handleTogglePermission('canExportImportExcel')}
                      className="mt-0.5 rounded text-amber-500"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Excel Import / Export & Mentés
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Teljes adatbázis kiexportálása Excel vagy titkosított mentés formájában
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Mentés gombok */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                >
                  {isNewUser ? 'Felhasználó Mentése' : 'Jogosultságok Mentése'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
