import React, { useState, useEffect } from 'react';
import {
  Building2,
  Save,
  CheckCircle2,
  Phone,
  Mail,
  Globe,
  MapPin,
  CreditCard,
  UserCheck,
  FileBadge,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { SchoolCompanyInfo } from '../types';

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyInfo: SchoolCompanyInfo;
  onSaveCompanyInfo: (newInfo: SchoolCompanyInfo) => void;
}

export const CompanySettingsModal: React.FC<CompanySettingsModalProps> = ({
  isOpen,
  onClose,
  companyInfo,
  onSaveCompanyInfo,
}) => {
  const [formData, setFormData] = useState<SchoolCompanyInfo>(companyInfo);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(companyInfo);
      setIsSaved(false);
    }
  }, [isOpen, companyInfo]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCompanyInfo(formData);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  const handleResetDefaults = () => {
    if (confirm('Visszaállítja a cégadatokat az alapértelmezett beállításokra?')) {
      const defaults: SchoolCompanyInfo = {
        schoolName: 'AutoSuli Gépjárművezető-képző Iskola',
        companyName: 'AutoSuli Képzési és Szolgáltató Kft.',
        registrationNumber: '01-09-987654',
        taxNumber: '12345678-2-41',
        accreditationNumber: 'KAV/2021/B-0042',
        address: '1117 Budapest, Október huszonharmadika u. 8-10.',
        phone: '+36 1 456 7890',
        email: 'iroda@autosuli-kepzes.hu',
        website: 'https://autosuli-kepzes.hu',
        representativeName: 'Kovács Zoltán (Iskolavezető)',
        bankAccountNumber: '11705008-20456123-00000000 (OTP Bank)',
        termsText:
          'A Képző Szerv vállalja, hogy a választott kategóriás elméleti és gyakorlati képzést a hatályos 24/2005. (IV. 21.) GKM rendelet előírásainak megfelelően biztosítja. A Tanuló kijelenti, hogy az orvosi alkalmassági igazolással rendelkezik, a Képzési Szerződés feltételeit és a házirendet maradéktalanul elfogadja.',
      };
      setFormData(defaults);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Fejléc */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Képző Intézmény & Cégadatok Szerkesztése
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A regisztrációs szerződésekben és fejlécben megjelenő hivatalos adatok
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Űrlap */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {isSaved && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Cégadatok sikeresen mentve! Az új szerződésekben azonnal frissül.</span>
            </div>
          )}

          {/* Iskola & Cégnév */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Autósiskola / Képző szerv neve *
              </label>
              <input
                type="text"
                name="schoolName"
                required
                value={formData.schoolName}
                onChange={handleChange}
                placeholder="Pl: AutoSuli Autósiskola"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hivatalos cégnév (Kft., Bt., Egyéni vállalkozó) *
              </label>
              <input
                type="text"
                name="companyName"
                required
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Pl: AutoSuli Oktató Kft."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>
          </div>

          {/* Hivatalos azonosítók */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Adószám *
              </label>
              <input
                type="text"
                name="taxNumber"
                required
                value={formData.taxNumber}
                onChange={handleChange}
                placeholder="12345678-2-41"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cégjegyzékszám / Nyilvántartási szám
              </label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder="01-09-987654"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Képzési engedély / Akkreditációs szám
              </label>
              <input
                type="text"
                name="accreditationNumber"
                value={formData.accreditationNumber}
                onChange={handleChange}
                placeholder="KAV/2021/B-0042"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>
          </div>

          {/* Székhely cím és Iskolavezető */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Székhely / Ügyfélszolgálati cím *</span>
                </span>
              </label>
              <input
                type="text"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                placeholder="1117 Budapest, Példa u. 12."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span className="flex items-center space-x-1">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Iskolavezető / Hivatalos Képviselő *</span>
                </span>
              </label>
              <input
                type="text"
                name="representativeName"
                required
                value={formData.representativeName}
                onChange={handleChange}
                placeholder="Kovács Zoltán (Iskolavezető)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>
          </div>

          {/* Kapcsolati adatok */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span className="flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Telefonszám</span>
                </span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+36 1 456 7890"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span className="flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Hivatalos Email</span>
                </span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="iroda@autosuli.hu"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span className="flex items-center space-x-1">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>Weboldal</span>
                </span>
              </label>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://autosuli.hu"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>
          </div>

          {/* Bankszámla */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span className="flex items-center space-x-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Tandíj Fizetési Bankszámlaszám</span>
              </span>
            </label>
            <input
              type="text"
              name="bankAccountNumber"
              value={formData.bankAccountNumber}
              onChange={handleChange}
              placeholder="11705008-20456123-00000000 (OTP Bank)"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
            />
          </div>

          {/* Szerződési feltételek szövege */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span className="flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Képzési Szerződés Általános Záradéka & Feltételei</span>
              </span>
            </label>
            <textarea
              name="termsText"
              rows={4}
              value={formData.termsText || ''}
              onChange={handleChange}
              placeholder="A felnőttképzési szerződésben megjelenő alapértelmezett jogi és fizetési feltételek..."
              className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Ez a szöveg automatikusan belekerül minden újonnan kitöltött és nyomtatott képzési szerződésbe.
            </p>
          </div>

          {/* Gombok */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Alapértékek betöltése</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Mégse
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-md shadow-amber-600/20 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Cégadatok Mentése</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
