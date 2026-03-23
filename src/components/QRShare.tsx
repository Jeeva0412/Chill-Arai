import { X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface QRShareProps {
  payload: {
    amount: number;
    category: string;
    person: string;
    date: string;
  };
  onClose: () => void;
}

export function QRShare({ payload, onClose }: QRShareProps) {
  const qrData = JSON.stringify(payload);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-sm rounded-t-3xl p-6 flex flex-col items-center gap-5 animate-fade-in"
        style={{ background: 'var(--bg-surface, #FFFFFF)' }}>
        <div className="w-full flex justify-between items-center">
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Share Split</h3>
          <button onClick={onClose}><X size={22} style={{ color: 'var(--text-secondary)' }} /></button>
        </div>

        <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
          Ask <strong>{payload.person}</strong> to scan this QR — it'll add a borrowing record to their app instantly.
        </p>

        <div className="p-5 rounded-3xl" style={{ background: 'var(--bg-icon, #FEF1D5)' }}>
          <QRCodeSVG
            value={qrData}
            size={200}
            bgColor="transparent"
            fgColor="var(--bg-header, #1B1914)"
            level="M"
          />
        </div>

        <div className="w-full p-4 rounded-2xl" style={{ background: 'var(--bg-app)' }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>Amount</span>
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>₹{payload.amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span style={{ color: 'var(--text-secondary)' }}>For</span>
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{payload.category}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
