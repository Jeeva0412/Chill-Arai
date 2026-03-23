import { useState } from 'react';
import { Lock } from 'lucide-react';
import { deriveKey } from '../lib/crypto';

interface PinSetupProps {
  onPinSet: (key: CryptoKey) => void;
  mode: 'setup' | 'unlock';
}

export function PinSetup({ onPinSet, mode }: PinSetupProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      handleSubmit(next);
    }
  };

  const handleSubmit = async (finalPin: string) => {
    setLoading(true);
    setError('');
    try {
      const key = await deriveKey(finalPin);
      onPinSet(key);
    } catch {
      setError('Failed to derive key. Try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'var(--bg-app, #FDF7EC)' }}>
      <div className="flex flex-col items-center gap-8 animate-fade-in p-6 max-w-xs w-full">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--bg-header, #1B1914)' }}>
          <Lock size={28} className="text-white" />
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary, #1B1914)' }}>
            {mode === 'setup' ? 'Create Your PIN' : 'Enter Your PIN'}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary, #A1A1A1)' }}>
            {mode === 'setup'
              ? 'This PIN encrypts your cloud backup.'
              : 'Enter your PIN to unlock'}
          </p>
        </div>

        {/* PIN dots */}
        <div className="flex gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 ${i < pin.length ? 'scale-125' : 'scale-100'}`}
              style={{ background: i < pin.length ? 'var(--text-primary, #1B1914)' : 'var(--text-secondary, #A1A1A1)', opacity: i < pin.length ? 1 : 0.3 }}
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {/* Keypad */}
        {!loading && (
          <div className="grid grid-cols-3 gap-4 w-full">
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d) => (
              <button
                key={d}
                onClick={() => d === '⌫' ? setPin(p => p.slice(0, -1)) : d && handleDigit(d)}
                disabled={!d && d !== '0'}
                className="h-16 rounded-2xl text-xl font-bold transition-all active:scale-90"
                style={{
                  background: d ? 'var(--bg-surface, #FFFFFF)' : 'transparent',
                  color: 'var(--text-primary, #1B1914)',
                  boxShadow: d ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                {d}
              </button>
            ))}
          </div>
        )}

        {loading && <p style={{ color: 'var(--text-secondary)' }} className="animate-pulse">Securing...</p>}
      </div>
    </div>
  );
}
