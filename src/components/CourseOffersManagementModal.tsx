import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  Clock,
  Navigation,
  CreditCard,
  Car,
  Truck,
  Bike,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { CourseOffer, VehicleCategory, DesignTemplateId } from '../types';

interface CourseOffersManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseOffers: CourseOffer[];
  onAddCourse: (course: CourseOffer) => void;
  onUpdateCourse: (course: CourseOffer) => void;
  onDeleteCourse: (courseId: string) => void;
  onResetCourses: () => void;
  onSelectCourseAfterCreate?: (courseId: string) => void;
  currentTheme?: DesignTemplateId;
}

const CATEGORY_PRESETS: { code: VehicleCategory; label: string; icon: string; defaultHours: number; defaultKm: number; defaultPrice: number }[] = [
  { code: 'AM', label: 'Segédmotor (AM)', icon: 'bike', defaultHours: 10, defaultKm: 100, defaultPrice: 130000 },
  { code: 'A1', label: 'Kismotor (A1 - 125cm³)', icon: 'bike', defaultHours: 16, defaultKm: 240, defaultPrice: 195000 },
  { code: 'A2', label: 'Középkategóriás motor (A2)', icon: 'bike', defaultHours: 22, defaultKm: 350, defaultPrice: 245000 },
  { code: 'A', label: 'Nagymotor (A - Korlátlan)', icon: 'bike', defaultHours: 26, defaultKm: 390, defaultPrice: 285000 },
  { code: 'B', label: 'Személygépkocsi (B)', icon: 'car', defaultHours: 30, defaultKm: 580, defaultPrice: 345000 },
  { code: 'BE', label: 'Nehézpótkocsi (B+E)', icon: 'car', defaultHours: 14, defaultKm: 280, defaultPrice: 210000 },
  { code: 'C', label: 'Tehergépkocsi (C)', icon: 'truck', defaultHours: 30, defaultKm: 580, defaultPrice: 420000 },
  { code: 'CE', label: 'Nehézpótkocsi (C+E)', icon: 'truck', defaultHours: 16, defaultKm: 300, defaultPrice: 260000 },
  { code: 'D', label: 'Autóbusz (D)', icon: 'truck', defaultHours: 30, defaultKm: 580, defaultPrice: 490000 },
  { code: 'DE', label: 'Autóbusz pótkocsi (D+E)', icon: 'truck', defaultHours: 14, defaultKm: 280, defaultPrice: 270000 },
  { code: 'T', label: 'Mezőgazdasági vontató (T)', icon: 'truck', defaultHours: 24, defaultKm: 360, defaultPrice: 250000 },
];

export const CourseOffersManagementModal: React.FC<CourseOffersManagementModalProps> = ({
  isOpen,
  onClose,
  courseOffers,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onResetCourses,
  onSelectCourseAfterCreate,
}) => {
  const [editingCourse, setEditingCourse] = useState<CourseOffer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Űrlap állapot
  const [formCategory, setFormCategory] = useState<VehicleCategory>('B');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formName, setFormName] = useState('');
  const [formTheoryHours, setFormTheoryHours] = useState(28);
  const [formPracticeHours, setFormPracticeHours] = useState(30);
  const [formRequiredKm, setFormRequiredKm] = useState(580);
  const [formBasePrice, setFormBasePrice] = useState(345000);
  const [formExamFee, setFormExamFee] = useState(26000);
  const [formDescription, setFormDescription] = useState('');
  const [formPaymentOptions, setFormPaymentOptions] = useState('Egyösszegben (kedvezménnyel), 3 részletben kamatmentesen, Óránkénti elszámolás');
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  // Új kurzus szerkesztő megnyitása
  const handleOpenCreateForm = (presetCategory?: typeof CATEGORY_PRESETS[0]) => {
    setEditingCourse(null);
    setFormError('');
    if (presetCategory) {
      setFormCategory(presetCategory.code);
      setFormCustomCategory('');
      setFormName(`${presetCategory.code} Kategóriás Tanfolyam`);
      setFormTheoryHours(presetCategory.code.startsWith('A') ? 22 : 28);
      setFormPracticeHours(presetCategory.defaultHours);
      setFormRequiredKm(presetCategory.defaultKm);
      setFormBasePrice(presetCategory.defaultPrice);
      setFormExamFee(26000);
      setFormDescription(`${presetCategory.label} felkészítés teljes hatósági vizsgakövetelményekkel.`);
    } else {
      setFormCategory('B');
      setFormCustomCategory('');
      setFormName('');
      setFormTheoryHours(28);
      setFormPracticeHours(30);
      setFormRequiredKm(580);
      setFormBasePrice(345000);
      setFormExamFee(26000);
      setFormDescription('');
    }
    setFormPaymentOptions('Egyösszegben, 3 részletben, Óránkénti fizetés');
    setIsFormOpen(true);
  };

  // Meglévő kurzus szerkesztése
  const handleOpenEditForm = (course: CourseOffer) => {
    setEditingCourse(course);
    setFormError('');
    setFormCategory(course.category);
    setFormCustomCategory(CATEGORY_PRESETS.some((p) => p.code === course.category) ? '' : course.category);
    setFormName(course.name);
    setFormTheoryHours(course.theoryHours);
    setFormPracticeHours(course.practiceHours);
    setFormRequiredKm(course.requiredKm);
    setFormBasePrice(course.basePrice);
    setFormExamFee(course.examFee);
    setFormDescription(course.description);
    setFormPaymentOptions(course.paymentOptions.join(', '));
    setIsFormOpen(true);
  };

  // Kurzus duplikálása sablonként
  const handleDuplicateCourse = (course: CourseOffer) => {
    setEditingCourse(null);
    setFormError('');
    setFormCategory(course.category);
    setFormCustomCategory(CATEGORY_PRESETS.some((p) => p.code === course.category) ? '' : course.category);
    setFormName(`${course.name} (Másolat)`);
    setFormTheoryHours(course.theoryHours);
    setFormPracticeHours(course.practiceHours);
    setFormRequiredKm(course.requiredKm);
    setFormBasePrice(course.basePrice);
    setFormExamFee(course.examFee);
    setFormDescription(course.description);
    setFormPaymentOptions(course.paymentOptions.join(', '));
    setIsFormOpen(true);
  };

  // Űrlap mentése
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Kérjük, adja meg a tanfolyam nevét!');
      return;
    }
    const finalCategory = formCategory === 'OTHER' ? (formCustomCategory.trim().toUpperCase() || 'EGYEDI') : formCategory;
    if (!finalCategory) {
      setFormError('Kérjük, válasszon vagy adjon meg egy kategóriát!');
      return;
    }

    const optionsArray = formPaymentOptions
      .split(',')
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);

    if (editingCourse) {
      const updated: CourseOffer = {
        ...editingCourse,
        name: formName.trim(),
        category: finalCategory,
        theoryHours: Number(formTheoryHours) || 0,
        practiceHours: Number(formPracticeHours) || 0,
        requiredKm: Number(formRequiredKm) || 0,
        basePrice: Number(formBasePrice) || 0,
        examFee: Number(formExamFee) || 0,
        description: formDescription.trim(),
        paymentOptions: optionsArray.length > 0 ? optionsArray : ['Egyösszegben'],
      };
      onUpdateCourse(updated);
    } else {
      const newCourseId = `course-${finalCategory.toLowerCase()}-${Date.now().toString(36)}`;
      const newCourse: CourseOffer = {
        id: newCourseId,
        name: formName.trim(),
        category: finalCategory,
        theoryHours: Number(formTheoryHours) || 0,
        practiceHours: Number(formPracticeHours) || 0,
        requiredKm: Number(formRequiredKm) || 0,
        basePrice: Number(formBasePrice) || 0,
        examFee: Number(formExamFee) || 0,
        description: formDescription.trim() || `${finalCategory} kategóriás gépjárművezetői tanfolyam`,
        paymentOptions: optionsArray.length > 0 ? optionsArray : ['Egyösszegben'],
      };
      onAddCourse(newCourse);
      if (onSelectCourseAfterCreate) {
        onSelectCourseAfterCreate(newCourseId);
      }
    }

    setIsFormOpen(false);
    setEditingCourse(null);
  };

  // Szűrt lista
  const filteredCourses = courseOffers.filter((c) => {
    const matchCat = filterCategory === 'all' || c.category === filterCategory;
    const matchQuery =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Fejléc */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl theme-bg-primary text-white flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                  Képzési Kategóriák & Választható Tanfolyamok
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold theme-badge">
                  {courseOffers.length} tanfolyam
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Új jogosítvány kategóriák felvétele, tandíjak, kötelező óraszámok és részletfizetési lehetőségek kezelése
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tartalom */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* Gyorsműveletek sáv */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenCreateForm()}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl theme-btn-primary font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Új Tanfolyam / Kategória Felvétele</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Biztosan visszaállítja az alapértelmezett autósiskolai tanfolyamokat (B, A, C, CE)?')) {
                    onResetCourses();
                  }
                }}
                className="flex items-center space-x-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                title="Gyári kategóriák visszaállítása"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Alapértékek Visszaállítása</span>
              </button>
            </div>

            {/* Keresőmező */}
            <div className="relative w-full sm:w-60">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Keresés név vagy kategória szerint..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 text-xs"
              />
              <BookOpen className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Gyors sablon gombok új kategória felvételéhez */}
          {!isFormOpen && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Gyors Kategória Hozzáadás (Kattintson az előre kitöltéshez):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_PRESETS.map((preset) => {
                  const alreadyExists = courseOffers.some((c) => c.category === preset.code);
                  return (
                    <button
                      key={preset.code}
                      onClick={() => handleOpenCreateForm(preset)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                        alreadyExists
                          ? 'border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          : 'border-dashed border-amber-400 dark:border-amber-600 bg-amber-500/5 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15'
                      }`}
                      title={preset.label}
                    >
                      {preset.icon === 'bike' ? (
                        <Bike className="w-3 h-3 text-slate-400" />
                      ) : preset.icon === 'truck' ? (
                        <Truck className="w-3 h-3 text-slate-400" />
                      ) : (
                        <Car className="w-3 h-3 text-slate-400" />
                      )}
                      <span>+ {preset.code}</span>
                      <span className="text-[10px] opacity-70">({preset.label.split(' ')[0]})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Szerkesztő / Új hozzáadása Panel */}
          {isFormOpen && (
            <div className="bg-slate-50 dark:bg-slate-850 p-4 sm:p-5 rounded-2xl border-2 theme-border-primary shadow-lg space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 theme-text-primary" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {editingCourse ? `Tanfolyam Szerkesztése: ${editingCourse.name}` : 'Új Képzési Kategória / Tanfolyam Létrehozása'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveForm} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Kategória kiválasztása */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kategória Kódja *
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => {
                        const val = e.target.value as VehicleCategory;
                        setFormCategory(val);
                        // Ha még üres a név, kitöltjük a kategória alapján
                        if (!formName || formName.includes('Kategóriás')) {
                          setFormName(`${val} Kategóriás Tanfolyam`);
                        }
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    >
                      <optgroup label="Személygépkocsi & Utánfutó">
                        <option value="B">B - Személygépkocsi</option>
                        <option value="BE">BE - Személygépkocsi nehézpótkocsi</option>
                      </optgroup>
                      <optgroup label="Motorkerékpár">
                        <option value="AM">AM - Moped / Segédmotor</option>
                        <option value="A1">A1 - Kismotorkerékpár (125 cm³)</option>
                        <option value="A2">A2 - Középkategóriás motor (max 35 kW)</option>
                        <option value="A">A - Nagymotor (Korlátlan)</option>
                      </optgroup>
                      <optgroup label="Tehergépkocsi & Nehézgép">
                        <option value="C">C - Tehergépkocsi</option>
                        <option value="CE">CE - Nehézpótkocsi</option>
                        <option value="D">D - Autóbusz</option>
                        <option value="DE">DE - Autóbusz pótkocsi</option>
                        <option value="T">T - Traktor & Vontató</option>
                      </optgroup>
                      <optgroup label="Egyéb">
                        <option value="OTHER">Egyedi kategória megadása...</option>
                      </optgroup>
                    </select>
                  </div>

                  {formCategory === 'OTHER' && (
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Egyedi Kategória Betűjele *
                      </label>
                      <input
                        type="text"
                        value={formCustomCategory}
                        onChange={(e) => setFormCustomCategory(e.target.value.toUpperCase())}
                        placeholder="Pl. C1, C1E, D1, K..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                        required
                      />
                    </div>
                  )}

                  {/* Tanfolyam Hivatalos Neve */}
                  <div className={formCategory === 'OTHER' ? 'sm:col-span-1' : 'sm:col-span-2'}>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tanfolyam Hivatalos Megnevezése *
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Pl. B Kategóriás Személygépkocsi-vezetői Tanfolyam"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                {/* Óraszámok és Kötelező távolság */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Elméleti Óraszám (tanóra)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={formTheoryHours}
                        onChange={(e) => setFormTheoryHours(Number(e.target.value))}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 font-mono"
                      />
                      <span className="absolute right-2.5 top-2 text-slate-400">óra</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Kötelező Gyakorlati Óra (tanóra)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={formPracticeHours}
                        onChange={(e) => setFormPracticeHours(Number(e.target.value))}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 font-mono"
                      />
                      <span className="absolute right-2.5 top-2 text-slate-400">óra</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Kötelező Menettávolság (km)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={formRequiredKm}
                        onChange={(e) => setFormRequiredKm(Number(e.target.value))}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 font-mono"
                      />
                      <span className="absolute right-2.5 top-2 text-slate-400">km</span>
                    </div>
                  </div>
                </div>

                {/* Tandíjak és Hatósági díjak */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Alap Képzési Tandíj (Ft) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={formBasePrice}
                        onChange={(e) => setFormBasePrice(Number(e.target.value))}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 font-mono font-bold"
                        required
                      />
                      <span className="absolute right-2.5 top-2 text-slate-400">Ft</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Hatósági Vizsgadíj (Ft)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={formExamFee}
                        onChange={(e) => setFormExamFee(Number(e.target.value))}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 font-mono"
                      />
                      <span className="absolute right-2.5 top-2 text-slate-400">Ft</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Összes Fizetendő Költség
                    </label>
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-center">
                      {(Number(formBasePrice) + Number(formExamFee)).toLocaleString('hu-HU')} Ft
                    </div>
                  </div>
                </div>

                {/* Részletfizetési konstrukciók */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Választható Részletfizetési és Konstrukciós Opciók (Vesszővel elválasztva)
                  </label>
                  <input
                    type="text"
                    value={formPaymentOptions}
                    onChange={(e) => setFormPaymentOptions(e.target.value)}
                    placeholder="Pl. Egyösszegben (5% kedvezmény), 2 részletben, 3 részletben kamatmentesen"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Ezek a választási lehetőségek fognak megjelenni a beiratkozási űrlapon és a felnőttképzési szerződésben.
                  </span>
                </div>

                {/* Tájékoztató / Leírás */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanfolyam Leírása & Tájékoztató Szöveg
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Rövid leírás a felkészítésről, tanpályás alapoktatásról, elméleti modulról..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                {/* Mentés és Mégse Gombok */}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingCourse(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Mégse
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl theme-btn-primary font-bold shadow-md flex items-center space-x-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingCourse ? 'Módosítások Mentése' : 'Tanfolyam Rögzítése'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Meglévő kurzusok listája */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                Rendszerben Rögzített Képzések ({filteredCourses.length} db):
              </span>
              <span className="text-[11px] text-slate-500">
                A beiratkozáskor a tanuló ezek közül a tanfolyamok közül tud választani
              </span>
            </div>

            {filteredCourses.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500">
                <BookOpen className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="font-semibold">Nem található tanfolyam a keresési feltételekkel.</p>
                <button
                  type="button"
                  onClick={() => handleOpenCreateForm()}
                  className="mt-3 inline-flex items-center space-x-1 px-4 py-2 rounded-xl theme-btn-primary font-bold text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Új Tanfolyam Létrehozása</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredCourses.map((course) => {
                  const isCatBike = ['AM', 'A1', 'A2', 'A'].includes(course.category);
                  const isCatTruck = ['C', 'CE', 'D', 'DE', 'T'].includes(course.category);

                  return (
                    <div
                      key={course.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs flex flex-col justify-between space-y-3 transition-all group"
                    >
                      <div>
                        {/* Felső sáv: Kategória badge és gombok */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-9 h-9 rounded-xl theme-bg-light theme-text-primary flex items-center justify-center font-bold text-sm shrink-0 border theme-border-primary">
                              {isCatBike ? (
                                <Bike className="w-4 h-4" />
                              ) : isCatTruck ? (
                                <Truck className="w-4 h-4" />
                              ) : (
                                <Car className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-0.5 rounded-md font-mono font-extrabold text-xs theme-badge">
                                  {course.category}
                                </span>
                                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                                  {course.name}
                                </h4>
                              </div>
                            </div>
                          </div>

                          {/* Műveletek */}
                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDuplicateCourse(course)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Másolás új kategóriaként"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditForm(course)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                              title="Szerkesztés"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(course.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              title="Törlés"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Leírás */}
                        {course.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                            {course.description}
                          </p>
                        )}

                        {/* Törlési megerősítés ablakocska */}
                        {deleteConfirmId === course.id && (
                          <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 flex items-center justify-between text-xs">
                            <span className="text-red-800 dark:text-red-300 font-semibold">
                              Biztosan törli ezt a tanfolyamot?
                            </span>
                            <div className="flex items-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                              >
                                Mégse
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteCourse(course.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="px-2 py-1 rounded bg-red-600 text-white font-bold"
                              >
                                Törlés
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Főbb paraméterek */}
                        <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {course.theoryHours} elm. / <strong className="text-slate-800 dark:text-slate-200">{course.practiceHours} gyak. óra</strong>
                            </span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
                            <Navigation className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              Min: <strong className="text-slate-800 dark:text-slate-200">{course.requiredKm} km</strong>
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                              {course.basePrice.toLocaleString('hu-HU')} Ft
                            </span>
                            {course.examFee > 0 && (
                              <span className="block text-[10px] text-slate-400">
                                + {course.examFee.toLocaleString('hu-HU')} Ft vizsga
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Fizetési konstrukciók tag-ek */}
                      {course.paymentOptions && course.paymentOptions.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1 text-[10px]">
                          {course.paymentOptions.map((opt, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Lábléc */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
          <span className="text-slate-500 text-[11px]">
            A módosítások azonnal beépülnek a szerződéskészítőbe és az Excel exportba.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-xs"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
};
