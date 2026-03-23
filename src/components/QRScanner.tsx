import { useEffect, useRef, useState } from 'react';
import { X, ScanLine } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScanned: (payload: { amount: number; category: string; person: string; date: string }) => void;
  onClose: () => void;
}

export function QRScanner({ onScanned, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const id = 'qr-reader';
    const scanner = new Html5Qrcode(id);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (decodedText) => {
        try {
          const payload = JSON.parse(decodedText);
          if (payload.amount && payload.person) {
            scanner.stop().catch(() => {});
            onScanned(payload);
            onClose();
          }
        } catch {
          setError('Invalid QR code. Try another.');
        }
      },
      () => {} // ignore frame errors
    ).then(() => setStarted(true))
      .catch((e) => setError(`Camera error: ${e?.message || 'Permission denied'}`));

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-sm flex flex-col items-center gap-4 p-6">
        <div className="w-full flex justify-between items-center">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <ScanLine size={22} /> Scan QR Code
          </h3>
          <button onClick={onClose}><X size={22} className="text-white/70" /></button>
        </div>

        <p className="text-sm text-white/60 text-center">
          Point your camera at a Chill-Arai split QR code to auto-record a borrowing.
        </p>

        <div id="qr-reader" className="w-full rounded-3xl overflow-hidden" style={{ minHeight: '280px' }} />

        {!started && !error && (
          <p className="text-white/50 animate-pulse text-sm">Starting camera...</p>
        )}
        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
