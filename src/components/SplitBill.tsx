import { useState } from 'react';
import { Users, Plus, Minus, X } from 'lucide-react';

interface SplitBillProps {
  onSplit: (expense: { amount: number; category: string; description: string }, lentTo: { name: string; amount: number }[]) => void;
  onClose: () => void;
}

export function SplitBill({ onSplit, onClose }: SplitBillProps) {
  const [total, setTotal] = useState('');
  const [billName, setBillName] = useState('');
  const [names, setNames] = useState<string[]>(['']);

  const addPerson = () => setNames(n => [...n, '']);
  const removePerson = (i: number) => setNames(n => n.filter((_, idx) => idx !== i));
  const updateName = (i: number, val: string) => setNames(n => n.map((name, idx) => idx === i ? val : name));

  const totalAmount = parseFloat(total) || 0;
  const filled = names.filter(n => n.trim());
  const perPersonCount = filled.length + 1; // +1 for the user themselves
  const share = perPersonCount > 0 ? totalAmount / perPersonCount : 0;

  const handleConfirm = () => {
    if (!total || !billName || filled.length === 0) return;
    onSplit(
      { amount: share, category: 'Split Bill', description: `${billName} (split ${perPersonCount} ways)` },
      filled.map(name => ({ name, amount: share }))
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-sm rounded-t-3xl p-6 flex flex-col gap-5 animate-fade-in max-h-[85vh] overflow-y-auto"
        style={{ background: 'var(--bg-surface, #FFFFFF)' }}>
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Split the Damage</h3>
          <button onClick={onClose}><X size={22} style={{ color: 'var(--text-secondary)' }} /></button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-secondary)' }}>What was it?</label>
            <input
              type="text"
              value={billName}
              onChange={e => setBillName(e.target.value)}
              placeholder="e.g. Dinner, Movies, Trip..."
              className="w-full rounded-xl px-4 py-3 font-medium border"
              style={{ background: 'var(--bg-app)', color: 'var(--text-primary)', borderColor: 'rgba(0,0,0,0.1)' }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-secondary)' }}>Total Bill (₹)</label>
            <input
              type="number"
              inputMode="decimal"
              value={total}
              onChange={e => setTotal(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl px-4 py-3 font-bold text-lg border"
              style={{ background: 'var(--bg-app)', color: 'var(--text-primary)', borderColor: 'rgba(0,0,0,0.1)' }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Who else?</label>
            <button onClick={addPerson} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-90"
              style={{ background: 'var(--bg-icon)', color: 'var(--text-primary)' }}>
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {names.map((name, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={name}
                  onChange={e => updateName(i, e.target.value)}
                  placeholder={`Person ${i + 1}`}
                  className="flex-1 rounded-xl px-4 py-3 font-medium border"
                  style={{ background: 'var(--bg-app)', color: 'var(--text-primary)', borderColor: 'rgba(0,0,0,0.1)' }}
                />
                {names.length > 1 && (
                  <button onClick={() => removePerson(i)} className="p-2 rounded-xl"
                    style={{ background: 'var(--bg-app)', color: 'var(--text-secondary)' }}>
                    <Minus size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {totalAmount > 0 && filled.length > 0 && (
          <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-icon, #FEF1D5)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} style={{ color: 'var(--text-primary)' }} />
              <span className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Each person pays</span>
            </div>
            <p className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              ₹{share.toFixed(2)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              {perPersonCount} people · ₹{totalAmount.toLocaleString()} total
            </p>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={!total || !billName || filled.length === 0}
          className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'var(--bg-header, #1B1914)', color: '#FFF' }}
        >
          Split & Record
        </button>
      </div>
    </div>
  );
}
