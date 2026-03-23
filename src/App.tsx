import { useState, useEffect, useCallback } from 'react';
import { Dashboard } from './components/Dashboard';
import { TransactionManager } from './components/TransactionManager';
import { LendingTracker } from './components/LendingTracker';
import { BorrowTracker } from './components/BorrowTracker';
import { TransactionForm, LendingForm, BorrowForm } from './components/Forms';
import { AuthScreen } from './components/AuthScreen';
import { PinSetup } from './components/PinSetup';
import { OcrScanner } from './components/OcrScanner';
import { SplitBill } from './components/SplitBill';
import { ExportPanel } from './components/ExportPanel';
import { QRShare } from './components/QRShare';
import { QRScanner } from './components/QRScanner';
import type { Transaction, Lending, Borrowing } from './types/database.types';
import { db, migrateFromLocalStorage } from './lib/db';
import { initGoogleAuth, fetchFromDrive, pushToDrive, mergeRecords, isGoogleConfigured } from './lib/driveSync';
import { useAppLock, authenticateWithBiometrics } from './hooks/useAppLock';
import {
  Wallet, Activity, Download, Users, Plus, Moon, Sun,
  FileText, ScanLine, SplitSquareHorizontal, QrCode, LogOut
} from 'lucide-react';
import { useOnlineStatus } from './hooks/useOnlineStatus';

type TabType = 'dashboard' | 'transactions' | 'lending' | 'borrowing';

function App() {
  const isOnline = useOnlineStatus();

  // ─── Theme (Phase 7: data-theme instead of class) ───
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.theme;
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    // keep tailwind dark: class in sync too
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.theme = isDarkMode ? 'dark' : 'light';
  }, [isDarkMode]);

  // ─── Navigation ───
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // ─── Phase 2 & 3: Auth/Security state ───
  const [firstRun] = useState(() => !localStorage.getItem('chill_arai_onboarded'));
  const [showAuth, setShowAuth] = useState(firstRun && isGoogleConfigured());
  const [googleToken, setGoogleToken] = useState<string | null>(
    () => sessionStorage.getItem('google_access_token')
  );
  const [encKey, setEncKey] = useState<CryptoKey | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [showLockScreen, setShowLockScreen] = useState(false);

  // ─── Data state (Phase 1: loaded from Dexie) ───
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lendings, setLendings] = useState<Lending[]>([]);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // ─── Modal state ───
  const [showTxForm, setShowTxForm] = useState(false);
  const [showLendingForm, setShowLendingForm] = useState(false);
  const [showBorrowForm, setShowBorrowForm] = useState(false);
  const [showOcr, setShowOcr] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showQrShare, setShowQrShare] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [qrPayload, setQrPayload] = useState<any>(null);
  const [ocrAmount, setOcrAmount] = useState<number | null>(null);

  // ─── Phase 3: App lock ───
  const { isLocked, unlock } = useAppLock({
    onUnlockRequired: () => setShowLockScreen(true),
  });

  const handleUnlock = async () => {
    try {
      const ok = await authenticateWithBiometrics();
      if (ok) { setShowLockScreen(false); unlock(); }
    } catch { /* fallback to PIN */ }
  };

  // ─── Phase 1: Load data from IndexedDB on mount ───
  useEffect(() => {
    (async () => {
      await migrateFromLocalStorage();
      const [txs, ls, bs] = await Promise.all([
        db.transactions.where('deleted').equals(0).toArray(),
        db.lendings.where('deleted').equals(0).toArray(),
        db.borrowings.where('deleted').equals(0).toArray(),
      ]);
      setTransactions(txs as Transaction[]);
      setLendings(ls as Lending[]);
      setBorrowings(bs as Borrowing[]);
      setDataLoaded(true);
    })();
  }, []);

  // ─── Phase 2: Google Drive Sync on connect/online ───
  useEffect(() => {
    if (!isOnline || !googleToken || !dataLoaded) return;
    syncWithDrive();
  }, [isOnline, googleToken, dataLoaded]);

  const syncWithDrive = useCallback(async () => {
    if (!googleToken) return;
    try {
      const remote = await fetchFromDrive(googleToken, encKey);
      if (!remote) {
        // First sync — push local state
        await pushLocalToDrive(googleToken);
        return;
      }

      // Merge: apply tombstone-aware timestamp-merge
      const mergedTx = mergeRecords(transactions, remote.transactions || []);
      const mergedL = mergeRecords(lendings, remote.lendings || []);
      const mergedB = mergeRecords(borrowings, remote.borrowings || []);

      // Update UI with active (non-deleted) records
      const activeTx = mergedTx.filter(t => !t.deleted);
      const activeL = mergedL.filter(l => !l.deleted);
      const activeB = mergedB.filter(b => !b.deleted);

      setTransactions(activeTx);
      setLendings(activeL);
      setBorrowings(activeB);

      await db.transactions.bulkPut(mergedTx);
      await db.lendings.bulkPut(mergedL);
      await db.borrowings.bulkPut(mergedB);

      await pushToDrive(googleToken, { transactions: mergedTx, lendings: mergedL, borrowings: mergedB }, encKey);
      navigator.vibrate?.([50, 100, 50]); // Phase 5: tactile on sync complete
    } catch (e) {
      console.error('Drive sync error:', e);
    }
  }, [googleToken, encKey, transactions, lendings, borrowings]);

  const pushLocalToDrive = async (token: string) => {
    const [txs, ls, bs] = await Promise.all([
      db.transactions.toArray(),
      db.lendings.toArray(),
      db.borrowings.toArray(),
    ]);
    await pushToDrive(token, { transactions: txs, lendings: ls, borrowings: bs }, encKey);
  };

  // ─── Handle URL Action Shortcuts (Phase 5: App Shortcuts) ───
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'add-expense') { setActiveTab('transactions'); setShowTxForm(true); }
    if (action === 'split-bill') setShowSplit(true);
  }, []);

  // ─────── CRUD Handlers ───────

  const now = () => new Date().toISOString();

  const handleAddTransaction = async (data: any) => {
    const dateToUse = data.date ? new Date(data.date).toISOString() : now();
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      created_at: dateToUse,
      updated_at: now(),
      deleted: false,
      ...data,
      date: undefined,
      amount: parseFloat(data.amount),
    };
    await db.transactions.add(newTx);
    setTransactions(prev => [...prev, newTx]);
    setShowTxForm(false);
    navigator.vibrate?.(50); // Phase 5
  };

  const handleDeleteTransaction = async (id: string) => {
    const ts = now();
    const tx = transactions.find(t => t.id === id);
    await db.transactions.update(id, { deleted: true, updated_at: ts });
    setTransactions(prev => prev.filter(t => t.id !== id));

    if (tx?.category === 'Lent Money') {
      const match = lendings.find(l => l.created_at === tx.created_at && l.amount === tx.amount);
      if (match) {
        await db.lendings.update(match.id, { deleted: true, updated_at: ts });
        setLendings(prev => prev.filter(l => l.id !== match.id));
      }
    } else if (tx?.category === 'Borrowed Money') {
      const match = borrowings.find(b => b.created_at === tx.created_at && b.amount === tx.amount);
      if (match) {
        await db.borrowings.update(match.id, { deleted: true, updated_at: ts });
        setBorrowings(prev => prev.filter(b => b.id !== match.id));
      }
    }
  };

  const handleAddLending = async (data: any) => {
    const dateToUse = data.date ? new Date(data.date).toISOString() : now();
    const newLending: Lending = {
      id: crypto.randomUUID(), created_at: dateToUse, updated_at: now(), deleted: false,
      status: 'pending', amount_paid: 0, due_date: null, ...data,
      date: undefined, amount: parseFloat(data.amount),
    };
    const newTx: Transaction = {
      id: crypto.randomUUID(), created_at: dateToUse, updated_at: now(), deleted: false,
      amount: newLending.amount, type: 'expense', category: 'Lent Money',
      description: `Lent to ${data.person_name}`,
    };
    await db.lendings.add(newLending);
    await db.transactions.add(newTx);
    setLendings(prev => [...prev, newLending]);
    setTransactions(prev => [...prev, newTx]);
    setShowLendingForm(false);
    navigator.vibrate?.(50);
  };

  const handleAddLendingPayment = async (id: string, paymentAmount: number) => {
    const rec = lendings.find(l => l.id === id);
    if (!rec) return;
    const newPaid = rec.amount_paid + paymentAmount;
    const newStatus: Lending['status'] = newPaid >= rec.amount ? 'settled' : 'partially_paid';
    const ts = now();
    const newTx: Transaction = {
      id: crypto.randomUUID(), created_at: ts, updated_at: ts, deleted: false,
      amount: paymentAmount, type: 'income', category: 'Lending Repayment',
      description: `Repayment from ${rec.person_name}`,
    };
    await db.lendings.update(id, { amount_paid: newPaid, status: newStatus, updated_at: ts });
    await db.transactions.add(newTx);
    setLendings(prev => prev.map(l => l.id === id ? { ...l, amount_paid: newPaid, status: newStatus } : l));
    setTransactions(prev => [...prev, newTx]);
    navigator.vibrate?.(50);
  };

  const handleDeleteLending = async (id: string) => {
    const ts = now();
    const rec = lendings.find(l => l.id === id);
    await db.lendings.update(id, { deleted: true, updated_at: ts });
    setLendings(prev => prev.filter(l => l.id !== id));
    if (rec) {
      const match = transactions.find(t => t.created_at === rec.created_at && t.amount === rec.amount && t.category === 'Lent Money');
      if (match) {
        await db.transactions.update(match.id, { deleted: true, updated_at: ts });
        setTransactions(prev => prev.filter(t => t.id !== match.id));
      }
    }
  };

  const handleAddBorrowing = async (data: any) => {
    const dateToUse = data.date ? new Date(data.date).toISOString() : now();
    const newBorrowing: Borrowing = {
      id: crypto.randomUUID(), created_at: dateToUse, updated_at: now(), deleted: false,
      status: 'pending', amount_paid: 0, due_date: null, ...data,
      date: undefined, amount: parseFloat(data.amount),
    };
    const newTx: Transaction = {
      id: crypto.randomUUID(), created_at: dateToUse, updated_at: now(), deleted: false,
      amount: newBorrowing.amount, type: 'income', category: 'Borrowed Money',
      description: `Borrowed from ${data.person_name}`,
    };
    await db.borrowings.add(newBorrowing);
    await db.transactions.add(newTx);
    setBorrowings(prev => [...prev, newBorrowing]);
    setTransactions(prev => [...prev, newTx]);
    setShowBorrowForm(false);
    navigator.vibrate?.(50);
  };

  const handleAddBorrowingPayment = async (id: string, paymentAmount: number) => {
    const rec = borrowings.find(b => b.id === id);
    if (!rec) return;
    const newPaid = rec.amount_paid + paymentAmount;
    const newStatus: Borrowing['status'] = newPaid >= rec.amount ? 'settled' : 'partially_paid';
    const ts = now();
    const newTx: Transaction = {
      id: crypto.randomUUID(), created_at: ts, updated_at: ts, deleted: false,
      amount: paymentAmount, type: 'expense', category: 'Borrowing Repayment',
      description: `Repaid ${rec.person_name}`,
    };
    await db.borrowings.update(id, { amount_paid: newPaid, status: newStatus, updated_at: ts });
    await db.transactions.add(newTx);
    setBorrowings(prev => prev.map(b => b.id === id ? { ...b, amount_paid: newPaid, status: newStatus } : b));
    setTransactions(prev => [...prev, newTx]);
    navigator.vibrate?.(50);
  };

  const handleDeleteBorrowing = async (id: string) => {
    const ts = now();
    const rec = borrowings.find(b => b.id === id);
    await db.borrowings.update(id, { deleted: true, updated_at: ts });
    setBorrowings(prev => prev.filter(b => b.id !== id));
    if (rec) {
      const match = transactions.find(t => t.created_at === rec.created_at && t.amount === rec.amount && t.category === 'Borrowed Money');
      if (match) {
        await db.transactions.update(match.id, { deleted: true, updated_at: ts });
        setTransactions(prev => prev.filter(t => t.id !== match.id));
      }
    }
  };

  // ─── Split Bill handler ───
  const handleSplit = async (expense: { amount: number; category: string; description: string }, lentTo: { name: string; amount: number }[]) => {
    await handleAddTransaction({ ...expense, type: 'expense' });
    for (const person of lentTo) {
      await handleAddLending({ person_name: person.name, amount: person.amount, description: expense.description });
    }
    // Show QR for first person
    if (lentTo.length > 0) {
      setQrPayload({ amount: lentTo[0].amount, category: expense.description, person: lentTo[0].name, date: now() });
      setShowQrShare(true);
    }
  };

  // ─── QR Scan result → borrow record ───
  const handleQrScanned = (payload: { amount: number; category: string; person: string; date: string }) => {
    handleAddBorrowing({ person_name: payload.person, amount: payload.amount, description: payload.category, date: payload.date });
  };

  const currentBalance = transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);

  // ─── Render ───

  // Phase 2 & 6: First-run auth flow
  if (showAuth) {
    return <AuthScreen
      onSignedIn={(token) => {
        setGoogleToken(token);
        sessionStorage.setItem('google_access_token', token);
        setShowAuth(false);
        setShowPin(true);
        initGoogleAuth();
        localStorage.setItem('chill_arai_onboarded', 'true');
      }}
      onSkip={() => {
        setShowAuth(false);
        localStorage.setItem('chill_arai_onboarded', 'true');
      }}
    />;
  }

  // Phase 3: PIN setup after first Google login
  if (showPin) {
    return <PinSetup mode="setup" onPinSet={(key) => { setEncKey(key); setShowPin(false); }} />;
  }

  // Phase 3: Lock screen
  if (isLocked && showLockScreen) {
    return (
      <div onClick={handleUnlock} className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 cursor-pointer"
        style={{ background: 'var(--bg-app)' }}>
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: 'var(--bg-header)' }}>
          <Wallet size={36} className="text-white" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Chill-Arai</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Tap to unlock with biometrics</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'transactions', label: 'Transactions', icon: Wallet },
    { id: 'lending', label: 'Lending', icon: Users },
    { id: 'borrowing', label: 'Borrowing', icon: Download },
  ] as const;

  return (
    <div className="flex flex-col md:flex-row h-full min-h-screen w-full transition-colors duration-300"
      style={{ background: 'var(--bg-app)', color: 'var(--text-primary)' }}>

      {/* ─── Sidebar (Desktop) ─── */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full flex-col py-8 px-3 z-50 border-r transition-all duration-300 ease-out w-20 hover:w-64 overflow-hidden group"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--glass-border)' }}>
        {/* Logo */}
        <div className="px-3 mb-10 flex items-center gap-4 whitespace-nowrap overflow-hidden">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ background: 'var(--bg-header)' }}>
            <Wallet size={20} className="text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100"
            style={{ color: 'var(--text-primary)' }}>
            Chill-Arai
          </span>
        </div>

        {/* Nav links */}
        <div className="flex flex-col gap-2 flex-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-4 px-3 py-3.5 rounded-xl transition-all duration-200 whitespace-nowrap overflow-hidden w-full text-left"
              style={{
                background: activeTab === id ? 'var(--bg-header)' : 'transparent',
                color: activeTab === id ? 'var(--text-header-amount)' : 'var(--text-secondary)',
              }}>
              <Icon size={20} className="shrink-0" />
              <span className="font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* Bottom actions */}
        <div className="flex flex-col gap-2 mt-auto">
          <button onClick={() => setShowExport(true)}
            className="flex items-center gap-4 px-3 py-3 rounded-xl transition-all whitespace-nowrap overflow-hidden w-full"
            style={{ color: 'var(--text-secondary)' }}>
            <FileText size={18} className="shrink-0" />
            <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">Export</span>
          </button>
          <button onClick={() => setIsDarkMode(d => !d)}
            className="flex items-center gap-4 px-3 py-3 rounded-xl transition-all whitespace-nowrap overflow-hidden w-full"
            style={{ color: 'var(--text-secondary)' }}>
            {isDarkMode ? <Sun size={18} className="shrink-0" /> : <Moon size={18} className="shrink-0" />}
            <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
          {googleToken && (
            <button onClick={() => { sessionStorage.removeItem('google_access_token'); setGoogleToken(null); }}
              className="flex items-center gap-4 px-3 py-3 rounded-xl transition-all whitespace-nowrap overflow-hidden w-full"
              style={{ color: 'var(--text-secondary)' }}>
              <LogOut size={18} className="shrink-0" />
              <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">Sign Out</span>
            </button>
          )}
          <div className="px-3 py-2 flex items-center gap-3">
            <div className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </div>
            <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap"
              style={{ color: 'var(--text-secondary)' }}>
              {googleToken ? 'Synced' : 'Local Only'}
            </span>
          </div>
        </div>
      </nav>

      {/* ─── Main Content ─── */}
      <main className="flex-1 md:ml-20 flex flex-col min-h-screen">

        {/* Global Header */}
        <header className="sticky top-0 z-40 px-4 md:px-8 pt-safe"
          style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--glass-border)' }}>
          <div className="flex justify-between items-center py-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'transactions' && 'Transactions'}
                {activeTab === 'lending' && 'Lending Log'}
                {activeTab === 'borrowing' && 'Borrowing Log'}
              </h2>
              <div className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>Welcome, Cherry!</div>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick action buttons (Power-ups) */}
              <button onClick={() => setShowQrScanner(true)} className="p-2.5 rounded-xl transition-all active:scale-90"
                style={{ background: 'var(--bg-icon)', color: 'var(--text-primary)' }} title="Scan QR Code">
                <ScanLine size={18} />
              </button>
              <button onClick={() => setShowSplit(true)} className="p-2.5 rounded-xl transition-all active:scale-90"
                style={{ background: 'var(--bg-icon)', color: 'var(--text-primary)' }} title="Split Bill">
                <SplitSquareHorizontal size={18} />
              </button>
              <button onClick={() => setShowOcr(true)} className="p-2.5 rounded-xl transition-all active:scale-90"
                style={{ background: 'var(--bg-icon)', color: 'var(--text-primary)' }} title="Scan Receipt">
                <QrCode size={18} />
              </button>

              {/* Balance */}
              <div className="px-4 py-2 rounded-xl hidden sm:flex items-baseline gap-2"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Balance</span>
                <span className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  ₹{currentBalance.toLocaleString()}
                </span>
              </div>

              {/* Mobile theme toggle */}
              <button onClick={() => setIsDarkMode(d => !d)}
                className="md:hidden p-2.5 rounded-xl transition-all active:scale-90"
                style={{ background: 'var(--bg-icon)', color: 'var(--text-primary)' }}>
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Add button */}
              {activeTab !== 'dashboard' && (
                <button
                  onClick={() => {
                    if (activeTab === 'transactions') setShowTxForm(true);
                    else if (activeTab === 'lending') setShowLendingForm(true);
                    else if (activeTab === 'borrowing') setShowBorrowForm(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95"
                  style={{ background: 'var(--bg-header)', color: 'var(--text-header-amount)' }}>
                  <Plus size={18} />
                  <span className="hidden sm:inline">Add New</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 pb-safe">
          {activeTab === 'dashboard' && (
            <Dashboard transactions={transactions} lendings={lendings} borrowings={borrowings} onNavigate={setActiveTab} />
          )}
          {activeTab === 'transactions' && (
            <TransactionManager transactions={transactions} onDelete={handleDeleteTransaction} />
          )}
          {activeTab === 'lending' && (
            <LendingTracker lendings={lendings} onAddPayment={handleAddLendingPayment} onDelete={handleDeleteLending} />
          )}
          {activeTab === 'borrowing' && (
            <BorrowTracker borrowings={borrowings} onAddPayment={handleAddBorrowingPayment} onDelete={handleDeleteBorrowing} />
          )}
        </div>
      </main>

      {/* ─── Bottom Navigation (Mobile) ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 pb-safe flex border-t"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--glass-border)' }}>
        {navItems.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all"
            style={{ color: activeTab === id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            <div className="p-1.5 rounded-xl transition-all"
              style={{ background: activeTab === id ? 'var(--bg-icon)' : 'transparent' }}>
              <Icon size={20} />
            </div>
            <span className="text-[10px] font-semibold">{label}</span>
          </button>
        ))}
      </nav>

      {/* ─── Floating Add Button (Mobile) ─── */}
      {activeTab !== 'dashboard' && (
        <button
          onClick={() => {
            if (activeTab === 'transactions') setShowTxForm(true);
            else if (activeTab === 'lending') setShowLendingForm(true);
            else setShowBorrowForm(true);
          }}
          className="md:hidden fixed bottom-24 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
          style={{ background: 'var(--bg-header)', color: 'var(--text-header-amount)' }}>
          <Plus size={26} />
        </button>
      )}

      {/* ─── Modals ─── */}
      {showTxForm && (
        <TransactionForm
          onSubmit={(data) => handleAddTransaction(ocrAmount ? { ...data, amount: ocrAmount } : data)}
          onCancel={() => { setShowTxForm(false); setOcrAmount(null); }}
          defaultAmount={ocrAmount ?? undefined}
        />
      )}
      {showLendingForm && <LendingForm onSubmit={handleAddLending} onCancel={() => setShowLendingForm(false)} />}
      {showBorrowForm && <BorrowForm onSubmit={handleAddBorrowing} onCancel={() => setShowBorrowForm(false)} />}
      {showOcr && (
        <OcrScanner
          onAmountExtracted={(amount) => { setOcrAmount(amount); setShowOcr(false); setShowTxForm(true); setActiveTab('transactions'); }}
          onClose={() => setShowOcr(false)}
        />
      )}
      {showSplit && <SplitBill onSplit={handleSplit} onClose={() => setShowSplit(false)} />}
      {showExport && <ExportPanel transactions={transactions} lendings={lendings} borrowings={borrowings} onClose={() => setShowExport(false)} />}
      {showQrShare && qrPayload && <QRShare payload={qrPayload} onClose={() => setShowQrShare(false)} />}
      {showQrScanner && <QRScanner onScanned={handleQrScanned} onClose={() => setShowQrScanner(false)} />}
    </div>
  );
}

export default App;
