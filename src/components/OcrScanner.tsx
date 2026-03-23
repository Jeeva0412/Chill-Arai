import { useState, useRef } from 'react';
import { Camera, X, CheckCircle } from 'lucide-react';
import { createWorker } from 'tesseract.js';

interface OcrScannerProps {
  onAmountExtracted: (amount: number) => void;
  onClose: () => void;
}

export function OcrScanner({ onAmountExtracted, onClose }: OcrScannerProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [extracted, setExtracted] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    setStatus('processing');
    try {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      // Extract all currency/total amounts from text
      const amounts = [...text.matchAll(/(?:total|amount|rs\.?|₹|inr)?\s*[\d,]+\.?\d*/gi)]
        .map(m => parseFloat(m[0].replace(/[^0-9.]/g, '')))
        .filter(n => !isNaN(n) && n > 0);

      const best = amounts.length > 0 ? Math.max(...amounts) : null;
      setExtracted(best);
      setStatus(best ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-sm rounded-t-3xl p-6 flex flex-col gap-5 animate-fade-in"
        style={{ background: 'var(--bg-surface, #FFFFFF)' }}>
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Scan Receipt</h3>
          <button onClick={onClose}><X size={22} style={{ color: 'var(--text-secondary)' }} /></button>
        </div>

        {!preview && (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full h-40 rounded-2xl flex flex-col items-center justify-center gap-3 border-2 border-dashed transition-all active:scale-95"
            style={{ borderColor: 'var(--text-secondary)', color: 'var(--text-secondary)' }}
          >
            <Camera size={32} />
            <span className="font-semibold">Tap to capture / upload receipt</span>
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {preview && (
          <img src={preview} className="w-full h-48 object-cover rounded-2xl" alt="receipt preview" />
        )}

        {status === 'processing' && (
          <p className="text-center animate-pulse font-medium" style={{ color: 'var(--text-secondary)' }}>
            Reading receipt...
          </p>
        )}

        {status === 'done' && extracted !== null && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 p-4 rounded-2xl" style={{ background: 'var(--bg-icon, #FEF1D5)' }}>
              <CheckCircle size={20} style={{ color: 'var(--text-primary)' }} />
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Detected: ₹{extracted.toLocaleString()}
              </span>
            </div>
            <button
              onClick={() => { onAmountExtracted(extracted); onClose(); }}
              className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95"
              style={{ background: 'var(--bg-header, #1B1914)', color: '#FFF' }}
            >
              Use This Amount
            </button>
          </div>
        )}

        {status === 'error' && (
          <p className="text-center text-red-500 font-medium">
            Could not extract amount. Try a clearer image.
          </p>
        )}
      </div>
    </div>
  );
}
