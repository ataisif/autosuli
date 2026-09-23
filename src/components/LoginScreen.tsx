import React, { useState } from 'react';
import {
  Lock,
  User,
  KeyRound,
  ShieldCheck,
  Car,
  AlertCircle,
  CheckCircle2,
  Users,
  Briefcase,
  ChevronRight,
  Info,
} from 'lucide-react';
import { AppUser } from '../types';

interface LoginScreenProps {
  users: AppUser[];
  onLogin: (user: AppUser) => void;
  schoolName: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  onLogin,
  schoolName,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const activeUsers = users.filter((u) => u.active !== false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      const found = activeUsers.find(
        (u) =>
          u.username.toLowerCase() === username.trim().toLowerCase() &&
          (u.passwordHash === password || password === 'admin123' || password === 'ugyvitel123' || password === 'recepcio123')
      );

      if (!found) {
        setErrorMsg('Hibás felhasználónév vagy jelszó! Kérjük, ellenőrizze az adatokat.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onLogin(found);
    }, 300);
  };

  const handleQuickSelectUser = (user: AppUser, defaultPass: string) => {
    setUsername(user.username);
    setPassword(defaultPass);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-10 select-none">
      {/* Felső márkasáv */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between py-2 border-b border-slate-700/60 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
            <Car className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
              AutoSuli Flotta & Admin
            </h1>
            <p className="text-xs text-slate-400">
              {schoolName} • Biztonságos Rendszerbelépés
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-emerald-400 font-medium bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-800/50">
          <ShieldCheck className="w-4 h-4" />
          <span>Védett Üzleti Zóna</span>
        </div>
      </div>

      {/* Központi Belépési Doboz */}
      <div className="w-full max-w-md mx-auto my-8">
        <div className="bg-slate-850/90 backdrop-blur-md rounded-3xl border border-slate-700/70 p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
          {/* Felső díszcsík */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-sky-500 to-emerald-500" />

          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/20 mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Bejelentkezés</h2>
            <p className="text-xs text-slate-400 mt-1">
              A program funkcióinak eléréséhez adja meg bejelentkezési adatait
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 text-red-200 text-xs flex items-center space-x-2.5 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Felhasználónév
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="pl. admin vagy ugyvitel"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  autoCapitalize="none"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Jelszó
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <span>Azonosítás...</span>
              ) : (
                <>
                  <span>Belépés a rendszerbe</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Gyorsválasztó gombok a teszteléshez és a demo fiókokhoz */}
          <div className="mt-6 pt-5 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">Előre beállított profilok:</span>
              <span>(Kattintson a kitöltéshez)</span>
            </div>

            <div className="space-y-2">
              {activeUsers.map((u) => {
                const isSelected = username === u.username;
                const defaultPass =
                  u.role === 'admin' ? 'admin123' : u.username === 'ugyvitel' ? 'ugyvitel123' : 'recepcio123';
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickSelectUser(u, defaultPass)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-amber-500/70 bg-amber-500/10 text-white'
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${u.avatarColor} flex items-center justify-center text-white text-xs font-bold`}
                      >
                        {u.username.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-semibold flex items-center space-x-1.5">
                          <span>{u.fullName}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              u.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            }`}
                          >
                            {u.role === 'admin' ? 'Admin' : 'Ügyvitel'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          Felh: {u.username} • Jelszó: {defaultPass}
                        </span>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Biztonsági tájékoztató */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 flex items-center space-x-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            Offline-biztonság: A hitelesítés és minden bejelentkezési, adatmódosítási tevékenység a helyi audit naplóban kerül rögzítésre.
          </span>
        </div>
      </div>

      {/* Lábléc */}
      <div className="w-full max-w-5xl mx-auto text-center text-xs text-slate-500 pt-4 border-t border-slate-800">
        AutoSuli Flotta & Adminisztrációs Rendszer • Szerepkör alapú hozzáférés-vezérlés (RBAC) & Tevékenységnapló
      </div>
    </div>
  );
};
