import React, { useState, useEffect } from 'react';
import { Mail, Send, X, Copy, Check, ExternalLink, Download } from 'lucide-react';
import {
  generateEmailTemplate,
  createGmailComposeUrl,
  createOutlookComposeUrl,
  createMailtoUrl,
  downloadEMLFile,
} from '../services/notificationService';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateType: 'mot' | 'medical' | 'schedule' | 'contract';
  targetData: any;
  companyInfo?: any;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  templateType,
  targetData,
  companyInfo,
}) => {
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);
  const [sentSuccess, setSentSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && targetData) {
      const template = generateEmailTemplate(templateType, targetData, companyInfo);
      setToEmail(template.recipient);
      setSubject(template.subject);
      setBody(template.body);
      setSentSuccess(null);
    }
  }, [isOpen, templateType, targetData, companyInfo]);

  if (!isOpen) return null;

  const handleSendGmail = () => {
    const url = createGmailComposeUrl(toEmail, subject, body);
    window.open(url, '_blank', 'noopener,noreferrer');
    setSentSuccess('Megnyitva a Google Gmail Web felületén!');
  };

  const handleSendOutlook = () => {
    const url = createOutlookComposeUrl(toEmail, subject, body);
    window.open(url, '_blank', 'noopener,noreferrer');
    setSentSuccess('Megnyitva az Outlook Web felületén!');
  };

  const handleSendThunderbird = () => {
    const mailtoUrl = createMailtoUrl(toEmail, subject, body);
    window.location.href = mailtoUrl;
    setSentSuccess('Átadva a Thunderbird / Rendszer alapértelmezett levelezőjének!');
  };

  const handleDownloadEML = () => {
    downloadEMLFile(
      `Email_${subject.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30)}.eml`,
      toEmail,
      companyInfo?.email || 'iroda@autosuli-kepzes.hu',
      subject,
      body
    );
    setSentSuccess('EML levélfájl letöltve (Thunderbird-del közvetlenül megnyitható)!');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(`Címzett: ${toEmail}\nTárgy: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Fejléc */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Határidős Email Értesítő Küldése
              </h3>
              <p className="text-xs text-slate-500">
                Gmail, Outlook és Thunderbird kliensekkel kompatibilis értesítő
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Mezők */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {sentSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{sentSuccess}</span>
            </div>
          )}

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
              Címzett email címe:
            </label>
            <input
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
              Email Tárgya:
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Üzenet szövege:
              </label>
              <button
                onClick={handleCopyText}
                className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 hover:underline"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Kimásolva!' : 'Szöveg másolása'}</span>
              </button>
            </div>
            <textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-sans leading-relaxed"
            />
          </div>

          {/* Választható Kliens Gyorsgombok */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Közvetlen Megnyitás / Küldés Klienssel:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={handleSendGmail}
                className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-300 font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Gmail</span>
              </button>

              <button
                type="button"
                onClick={handleSendOutlook}
                className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 dark:text-blue-300 font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Outlook</span>
              </button>

              <button
                type="button"
                onClick={handleSendThunderbird}
                className="p-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 dark:text-sky-300 font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Thunderbird</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadEML}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                title="Letöltés .EML fájlként"
              >
                <Download className="w-3.5 h-3.5" />
                <span>.EML Fájl</span>
              </button>
            </div>
          </div>
        </div>

        {/* Műveletek Lábléc */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
          <button
            onClick={handleCopyText}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center space-x-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Vágólapra másolás</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Bezárás
            </button>
            <button
              onClick={handleSendThunderbird}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Megnyitás Alapértelmezettben</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
