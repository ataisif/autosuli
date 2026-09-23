import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, Undo2 } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  signeeName?: string;
  signeeRole?: string;
  value?: string; // data URL or SVG
  onChange: (dataUrl: string) => void;
  disabled?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  label,
  signeeName,
  signeeRole,
  value,
  onChange,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!value);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ha van meglévő érték (pl. betöltésnél)
    if (value && isEmpty) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setIsEmpty(false);
      };
      img.src = value;
    }
  }, [value, isEmpty]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Scale canvas pixels to viewport pixels
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mentés előzménybe
    setHistory((prev) => [...prev.slice(-5), canvas.toDataURL()]);

    const { x, y } = getCoordinates(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e293b'; // Sötét kékesszürke tinta
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    // Megakadályozzuk az oldal görgetését érintőképernyőn
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || disabled) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange('');
  };

  const handleUndo = () => {
    if (history.length === 0) {
      handleClear();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prevData = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      onChange(canvas.toDataURL('image/png'));
    };
    img.src = prevData;
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
            {label}
          </span>
          {(signeeName || signeeRole) && (
            <span className="text-[11px] text-slate-500 block">
              {signeeName ? `${signeeName} ` : ''}
              {signeeRole ? `(${signeeRole})` : ''}
            </span>
          )}
        </div>
        {!disabled && (
          <div className="flex items-center space-x-1.5 no-print">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              title="Visszavonás"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[11px] font-medium transition-colors"
              title="Aláírás törlése"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Törlés</span>
            </button>
          </div>
        )}
      </div>

      <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white shadow-inner touch-none">
        {/* Háttér segédvonal és érintőképernyő segédlet */}
        <div className="absolute inset-x-4 bottom-5 border-b border-slate-300 pointer-events-none select-none flex justify-between text-[10px] text-slate-400">
          <span>✕ Írja alá érintéssel vagy egérrel</span>
          <span className="font-mono">digitális szignó</span>
        </div>

        <canvas
          ref={canvasRef}
          width={460}
          height={130}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-32 cursor-crosshair block"
        />

        {!isEmpty && (
          <div className="absolute top-2 right-2 flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 text-[10px] font-medium pointer-events-none">
            <Check className="w-3 h-3" />
            <span>Aláírva</span>
          </div>
        )}
      </div>
    </div>
  );
};
