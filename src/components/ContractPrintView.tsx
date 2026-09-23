import React, { useRef } from 'react';
import {
  FileText,
  Printer,
  Mail,
  X,
  CheckCircle2,
  Building2,
  User,
  Calendar,
  CreditCard,
  FileCheck,
} from 'lucide-react';
import { CourseRegistration, SchoolCompanyInfo } from '../types';

interface ContractPrintViewProps {
  registration: CourseRegistration;
  schoolInfo: SchoolCompanyInfo;
  onClose: () => void;
  onSendEmail: (reg: CourseRegistration) => void;
}

export const ContractPrintView: React.FC<ContractPrintViewProps> = ({
  registration,
  schoolInfo,
  onClose,
  onSendEmail,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Modál vezérlősáv (Nyomtatáskor elrejtve) */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 no-print">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Felnőttképzési Tanfolyami Szerződés
              </h3>
              <p className="text-xs text-slate-500">
                Szerződésszám: {registration.contractNumber} • {registration.studentName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onSendEmail(registration)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Továbbítás a feleknek emailben"
            >
              <Mail className="w-4 h-4 text-sky-500" />
              <span>Email továbbítás</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/20 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Nyomtatás / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hivatalos Szerződés Dokumentum Lap (A4 arányú, tiszta fehér hátterű nyomtatásra optimalizálva) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div
            ref={printRef}
            className="contract-sheet bg-white text-slate-900 w-full max-w-[210mm] p-8 sm:p-10 shadow-lg rounded-xl border border-slate-200 sm:min-h-[297mm] flex flex-col justify-between text-[13px] leading-relaxed"
          >
            <div>
              {/* Fejléc cégadatokkal */}
              <div className="border-b-2 border-slate-900 pb-4 mb-6">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h1 className="text-xl font-extrabold uppercase tracking-wide text-slate-900">
                      {schoolInfo.schoolName}
                    </h1>
                    <p className="text-xs font-medium text-slate-600">
                      {schoolInfo.companyName} • Cégjsz.: {schoolInfo.registrationNumber || '-'} • Adószám: {schoolInfo.taxNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      Engedélyszám: {schoolInfo.accreditationNumber || '-'} • Székhely: {schoolInfo.address}
                    </p>
                    <p className="text-xs text-slate-500">
                      Tel: {schoolInfo.phone} • Email: {schoolInfo.email}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded font-mono text-xs font-bold">
                      {registration.contractNumber}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Kelt: {registration.date}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cím */}
              <div className="text-center my-4">
                <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 underline underline-offset-4">
                  FELNŐTTKÉPZÉSI TANFOLYAMI SZERZŐDÉS
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  gépjárművezető képzésben történő részvételre
                </p>
              </div>

              {/* Szerződő felek adatai */}
              <div className="space-y-4 my-6">
                {/* 1. Képző szerv */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <span className="font-bold text-slate-800 block mb-1">
                    1. KÉPZŐ SZERV (a továbbiakban: Iskola):
                  </span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div><span className="text-slate-500">Név:</span> <span className="font-semibold">{schoolInfo.companyName}</span></div>
                    <div><span className="text-slate-500">Képviseletében:</span> <span className="font-semibold">{schoolInfo.representativeName}</span></div>
                    <div><span className="text-slate-500">Székhely:</span> {schoolInfo.address}</div>
                    <div><span className="text-slate-500">Adószám:</span> {schoolInfo.taxNumber}</div>
                    <div><span className="text-slate-500">Képzési engedély:</span> {schoolInfo.accreditationNumber}</div>
                    <div><span className="text-slate-500">Bankszámlaszám:</span> <span className="font-mono">{schoolInfo.bankAccountNumber}</span></div>
                  </div>
                </div>

                {/* 2. Tanuló */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <span className="font-bold text-slate-800 block mb-1">
                    2. KÉPZÉSBEN RÉSZTVEVŐ SZEMÉLY (a továbbiakban: Tanuló):
                  </span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div><span className="text-slate-500">Tanuló teljes neve:</span> <span className="font-semibold">{registration.studentName}</span></div>
                    <div><span className="text-slate-500">Születési név:</span> {registration.birthName || registration.studentName}</div>
                    <div><span className="text-slate-500">Anyja születési neve:</span> <span className="font-semibold">{registration.mothersName || '-'}</span></div>
                    <div><span className="text-slate-500">Születési hely és idő:</span> {registration.birthPlace || '-'}, {registration.birthDate || '-'}</div>
                    <div><span className="text-slate-500">Személyi ig. száma:</span> <span className="font-mono font-semibold">{registration.idCardNumber || '-'}</span></div>
                    <div><span className="text-slate-500">Állandó lakcím:</span> {registration.address}</div>
                    <div><span className="text-slate-500">Telefonszám:</span> {registration.phone}</div>
                    <div><span className="text-slate-500">Email cím:</span> {registration.email}</div>
                    <div><span className="text-slate-500">Orvosi alkalmassági lejárata:</span> <span className="font-semibold">{registration.medicalExamExpiry || '-'}</span></div>
                    <div><span className="text-slate-500">Meglévő kategóriák:</span> {registration.hasExistingLicense || 'Nincs'}</div>
                  </div>
                </div>
              </div>

              {/* 3. Képzés részletei és díjazás */}
              <div className="border border-slate-200 rounded-lg p-3 my-4 text-xs">
                <span className="font-bold text-slate-800 block mb-1">
                  3. A KÉPZÉS MEGNEVEZÉSE ÉS PÉNZÜGYI FELTÉTELEK:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700 mt-2">
                  <div className="bg-slate-100 p-2 rounded">
                    <span className="text-[11px] text-slate-500 block">Képzés kategóriája</span>
                    <span className="font-bold text-amber-700 text-sm">"{registration.category}" Kategória</span>
                  </div>
                  <div className="bg-slate-100 p-2 rounded">
                    <span className="text-[11px] text-slate-500 block">Képzés megnevezése</span>
                    <span className="font-semibold text-slate-900">{registration.courseName}</span>
                  </div>
                  <div className="bg-slate-100 p-2 rounded">
                    <span className="text-[11px] text-slate-500 block">Összes képzési díj</span>
                    <span className="font-bold text-slate-900 text-sm">{registration.totalFee.toLocaleString('hu-HU')} Ft</span>
                  </div>
                  <div className="bg-slate-100 p-2 rounded">
                    <span className="text-[11px] text-slate-500 block">Befizetett előleg/részlet</span>
                    <span className="font-bold text-emerald-700 text-sm">{registration.initialDeposit.toLocaleString('hu-HU')} Ft</span>
                  </div>
                </div>

                <div className="mt-3 flex justify-between items-center text-[12px] bg-amber-50 p-2 rounded border border-amber-200">
                  <div>
                    <span className="font-semibold text-amber-900">Választott fizetési ütemezés: </span>
                    <span className="text-amber-800">{registration.paymentPlan}</span>
                  </div>
                  {registration.instructorName && (
                    <div>
                      <span className="font-semibold text-amber-900">Beosztott oktató: </span>
                      <span className="text-amber-800">{registration.instructorName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Jogok és kötelezettségek záradék */}
              <div className="my-4 text-[11px] text-slate-600 leading-relaxed border-t border-slate-200 pt-3">
                <span className="font-bold text-slate-800 block mb-1">
                  4. SZERZŐDÉSI FELTÉTELEK ÉS NYILATKOZATOK:
                </span>
                <p className="mb-2">
                  {schoolInfo.termsText ||
                    'A Képző Szerv vállalja az elméleti és gyakorlati felkészítést a hatályos jogszabályok szerint. A Tanuló kijelenti, hogy az adatlapján szereplő adatok a valóságnak megfelelnek, rendelkezik érvényes orvosi alkalmasságival, a Házirendet és vizsgakövetelményeket megismerte és elfogadja.'}
                </p>
                <p>
                  A felek jelen felnőttképzési szerződést elolvasták, annak tartalmát megértették, és mint akaratukkal mindenben megegyezőt az érintőképernyős/digitális felületen, joghatályosan aláírták.
                </p>
              </div>
            </div>

            {/* Digitális Aláírások területe */}
            <div className="mt-8 pt-4 border-t-2 border-slate-800">
              <div className="flex justify-between items-end gap-8">
                {/* Iskola képviselője aláírás */}
                <div className="flex-1 text-center">
                  <div className="h-20 flex items-center justify-center border-b border-dashed border-slate-400 mb-1">
                    {registration.representativeSignatureSvg ? (
                      <img
                        src={registration.representativeSignatureSvg}
                        alt="Képviselő Aláírás"
                        className="max-h-16 max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-slate-400 italic">Digitálisan hitelesítve</span>
                    )}
                  </div>
                  <span className="font-bold text-xs block text-slate-900">
                    {schoolInfo.representativeName}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Képző Szerv / Iskolavezető
                  </span>
                </div>

                {/* Dátum & Hitelesítés bélyegző */}
                <div className="shrink-0 text-center px-4 pb-2">
                  <div className="w-16 h-16 rounded-full border-2 border-slate-300 flex flex-col items-center justify-center text-[9px] text-slate-500 uppercase mx-auto">
                    <span>Hivatalos</span>
                    <span className="font-bold text-slate-700">AutoSuli</span>
                    <span>Digitális</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {registration.signedAt
                      ? new Date(registration.signedAt).toLocaleDateString('hu-HU')
                      : registration.date}
                  </span>
                </div>

                {/* Tanuló aláírása */}
                <div className="flex-1 text-center">
                  <div className="h-20 flex items-center justify-center border-b border-dashed border-slate-400 mb-1">
                    {registration.studentSignatureSvg ? (
                      <img
                        src={registration.studentSignatureSvg}
                        alt="Tanuló Aláírás"
                        className="max-h-16 max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-slate-400 italic">Nincs aláírva</span>
                    )}
                  </div>
                  <span className="font-bold text-xs block text-slate-900">
                    {registration.studentName}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Képzésben Résztvevő Tanuló
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
