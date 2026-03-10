import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { TransactionManager } from './components/TransactionManager';
import { LendingTracker } from './components/LendingTracker';
import { BorrowTracker } from './components/BorrowTracker';
import { TransactionForm, LendingForm, BorrowForm } from './components/Forms';
import type { Transaction, Lending, Borrowing } from './types/database.types';
import { supabase } from './lib/supabase';
import { Wallet, Activity, Download, Users, Plus, Moon, Sun } from 'lucide-react';
import { useOnlineStatus } from './hooks/useOnlineStatus';

type Mutation = {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: 'transactions' | 'lendings' | 'borrowings';
  payload: any;
  targetId?: string;
};

function App() {
  const isOnline = useOnlineStatus();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'lending' | 'borrowing'>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      return true;
    }
    return false;
  });

  // State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const local = localStorage.getItem('moneyflow_tx');
    return local ? JSON.parse(local) : [];
  });
  const [lendings, setLendings] = useState<Lending[]>(() => {
    const local = localStorage.getItem('moneyflow_lendings');
    return local ? JSON.parse(local) : [];
  });
  const [borrowings, setBorrowings] = useState<Borrowing[]>(() => {
    const local = localStorage.getItem('moneyflow_borrowings');
    return local ? JSON.parse(local) : [];
  });

  const [offlineQueue, setOfflineQueue] = useState<Mutation[]>(() => {
    const local = localStorage.getItem('chill_arai_offline_queue');
    return local ? JSON.parse(local) : [];
  });

  // Modals
  const [showTxForm, setShowTxForm] = useState(false);
  const [showLendingForm, setShowLendingForm] = useState(false);
  const [showBorrowForm, setShowBorrowForm] = useState(false);

  // Sync state to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('moneyflow_tx', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('moneyflow_lendings', JSON.stringify(lendings));
  }, [lendings]);

  useEffect(() => {
    localStorage.setItem('moneyflow_borrowings', JSON.stringify(borrowings));
  }, [borrowings]);

  useEffect(() => {
    localStorage.setItem('chill_arai_offline_queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  // Load fresh data from Supabase if online
  useEffect(() => {
    if (isOnline && import.meta.env.VITE_SUPABASE_URL) {
      fetchData();
      syncQueue();
    }
  }, [isOnline]);

  const fetchData = async () => {
    try {
      const { data: txData } = await supabase.from('transactions').select('*');
      const { data: lData } = await supabase.from('lendings').select('*');
      const { data: bData } = await supabase.from('borrowings').select('*');

      if (txData) setTransactions(txData);
      if (lData) setLendings(lData);
      if (bData) setBorrowings(bData);
    } catch (error) {
      console.error('Error fetching fresh data:', error);
    }
  };

  const syncQueue = async () => {
    if (offlineQueue.length === 0) return;

    const queue = [...offlineQueue];
    const failedOnes: Mutation[] = [];

    for (const mutation of queue) {
      try {
        if (mutation.type === 'INSERT') {
          await supabase.from(mutation.table).insert([mutation.payload]);
        } else if (mutation.type === 'UPDATE') {
          await supabase.from(mutation.table).update(mutation.payload).eq('id', mutation.targetId);
        } else if (mutation.type === 'DELETE') {
          await supabase.from(mutation.table).delete().eq('id', mutation.targetId);
        }
      } catch (error) {
        console.error('Failed to sync mutation:', mutation, error);
        failedOnes.push(mutation);
      }
    }

    setOfflineQueue(failedOnes);
  };

  const executeMutation = async (mutation: Mutation) => {
    // 1. Optimistic Update Local Storage is handled by other state effects
    if (isOnline && import.meta.env.VITE_SUPABASE_URL) {
      try {
        if (mutation.type === 'INSERT') {
          await supabase.from(mutation.table).insert([mutation.payload]);
        } else if (mutation.type === 'UPDATE') {
          await supabase.from(mutation.table).update(mutation.payload).eq('id', mutation.targetId);
        } else if (mutation.type === 'DELETE') {
          await supabase.from(mutation.table).delete().eq('id', mutation.targetId);
        }
        return true;
      } catch (error) {
        console.error('Mutation failed, adding to queue:', mutation, error);
        setOfflineQueue(prev => [...prev, mutation]);
        return false;
      }
    } else {
      setOfflineQueue(prev => [...prev, mutation]);
      return true;
    }
  };

  // Sync dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleAddTransaction = async (data: any) => {
    const { date, ...restData } = data;
    const dateToUse = date ? new Date(date).toISOString() : new Date().toISOString();
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      created_at: dateToUse,
      ...restData
    };

    setTransactions((prev) => [...prev, newTx]);
    setShowTxForm(false);

    executeMutation({
      id: crypto.randomUUID(),
      type: 'INSERT',
      table: 'transactions',
      payload: newTx
    });
  };

  const handleAddLending = async (data: any) => {
    const { date, ...restData } = data;
    const dateToUse = date ? new Date(date).toISOString() : new Date().toISOString();
    const newLending: Lending = {
      id: crypto.randomUUID(),
      created_at: dateToUse,
      status: 'pending',
      amount_paid: 0,
      due_date: null,
      ...restData
    };

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      created_at: dateToUse,
      amount: data.amount,
      type: 'expense',
      category: 'Lent Money',
      description: `Lent to ${data.person_name}`
    };

    setLendings((prev) => [...prev, newLending]);
    setTransactions((prev) => [...prev, newTx]);
    setShowLendingForm(false);

    executeMutation({
      id: crypto.randomUUID(),
      type: 'INSERT',
      table: 'lendings',
      payload: newLending
    });
    executeMutation({
      id: crypto.randomUUID(),
      type: 'INSERT',
      table: 'transactions',
      payload: newTx
    });
  };

  const handleAddLendingPayment = async (id: string, paymentAmount: number) => {
    const recordToUpdate = lendings.find(l => l.id === id);
    if (!recordToUpdate) return;

    const newAmountPaid = recordToUpdate.amount_paid + paymentAmount;
    const newStatus = newAmountPaid >= recordToUpdate.amount ? 'settled' : 'partially_paid';
    const currentTime = new Date().toISOString();

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      created_at: currentTime,
      amount: paymentAmount,
      type: 'income',
      category: 'Lending Repayment',
      description: `Repayment from ${recordToUpdate.person_name}`
    };

    setLendings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, amount_paid: newAmountPaid, status: newStatus as any } : l))
    );
    setTransactions((prev) => [...prev, newTx]);

    executeMutation({
      id: crypto.randomUUID(),
      type: 'UPDATE',
      table: 'lendings',
      targetId: id,
      payload: { amount_paid: newAmountPaid, status: newStatus }
    });
    executeMutation({
      id: crypto.randomUUID(),
      type: 'INSERT',
      table: 'transactions',
      payload: newTx
    });
  };

  const handleAddBorrowing = async (data: any) => {
    const { date, ...restData } = data;
    const dateToUse = date ? new Date(date).toISOString() : new Date().toISOString();
    const newBorrowing: Borrowing = {
      id: crypto.randomUUID(),
      created_at: dateToUse,
      status: 'pending',
      amount_paid: 0,
      due_date: null,
      ...restData
    };

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      created_at: dateToUse,
      amount: data.amount,
      type: 'income',
      category: 'Borrowed Money',
      description: `Borrowed from ${data.person_name}`
    };

    setBorrowings((prev) => [...prev, newBorrowing]);
    setTransactions((prev) => [...prev, newTx]);
    setShowBorrowForm(false);

    executeMutation({
      id: crypto.randomUUID(),
      type: 'INSERT',
      table: 'borrowings',
      payload: newBorrowing
    });
    executeMutation({
      id: crypto.randomUUID(),
      type: 'INSERT',
      table: 'transactions',
      payload: newTx
    });
  };

  const handleAddBorrowingPayment = async (id: string, paymentAmount: number) => {
    const recordToUpdate = borrowings.find(b => b.id === id);
    if (!recordToUpdate) return;

    const newAmountPaid = recordToUpdate.amount_paid + paymentAmount;
    const newStatus = newAmountPaid >= recordToUpdate.amount ? 'settled' : 'partially_paid';
    const currentTime = new Date().toISOString();

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      created_at: currentTime,
      amount: paymentAmount,
      type: 'expense',
      category: 'Borrowing Repayment',
      description: `Repaid ${recordToUpdate.person_name}`
    };

    setBorrowings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, amount_paid: newAmountPaid, status: newStatus as any } : b))
    );
    setTransactions((prev) => [...prev, newTx]);

    executeMutation({
      id: crypto.randomUUID(),
      type: 'UPDATE',
      table: 'borrowings',
      targetId: id,
      payload: { amount_paid: newAmountPaid, status: newStatus }
    });
    executeMutation({
      id: crypto.randomUUID(),
      type: 'INSERT',
      table: 'transactions',
      payload: newTx
    });
  };

  const handleDeleteBorrowing = async (id: string) => {
    const borrowing = borrowings.find(b => b.id === id);
    setBorrowings((prev) => prev.filter((b) => b.id !== id));

    executeMutation({
      id: crypto.randomUUID(),
      type: 'DELETE',
      table: 'borrowings',
      targetId: id,
      payload: null
    });

    if (borrowing) {
      const matchingTx = transactions.find(t => t.created_at === borrowing.created_at && t.amount === borrowing.amount && t.category === 'Borrowed Money');
      if (matchingTx) {
        setTransactions((prev) => prev.filter((t) => t.id !== matchingTx.id));
        executeMutation({
          id: crypto.randomUUID(),
          type: 'DELETE',
          table: 'transactions',
          targetId: matchingTx.id,
          payload: null
        });
      }
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const tx = transactions.find(t => t.id === id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    executeMutation({
      id: crypto.randomUUID(),
      type: 'DELETE',
      table: 'transactions',
      targetId: id,
      payload: null
    });

    if (tx) {
      if (tx.category === 'Lent Money') {
        const matchingLending = lendings.find(l => l.created_at === tx.created_at && l.amount === tx.amount);
        if (matchingLending) {
          setLendings((prev) => prev.filter((l) => l.id !== matchingLending.id));
          executeMutation({
            id: crypto.randomUUID(),
            type: 'DELETE',
            table: 'lendings',
            targetId: matchingLending.id,
            payload: null
          });
        }
      } else if (tx.category === 'Borrowed Money') {
        const matchingBorrowing = borrowings.find(b => b.created_at === tx.created_at && b.amount === tx.amount);
        if (matchingBorrowing) {
          setBorrowings((prev) => prev.filter((b) => b.id !== matchingBorrowing.id));
          executeMutation({
            id: crypto.randomUUID(),
            type: 'DELETE',
            table: 'borrowings',
            targetId: matchingBorrowing.id,
            payload: null
          });
        }
      }
    }
  };

  const handleDeleteLending = async (id: string) => {
    const lending = lendings.find(l => l.id === id);
    setLendings((prev) => prev.filter((l) => l.id !== id));

    executeMutation({
      id: crypto.randomUUID(),
      type: 'DELETE',
      table: 'lendings',
      targetId: id,
      payload: null
    });

    if (lending) {
      const matchingTx = transactions.find(t => t.created_at === lending.created_at && t.amount === lending.amount && t.category === 'Lent Money');
      if (matchingTx) {
        setTransactions((prev) => prev.filter((t) => t.id !== matchingTx.id));
        executeMutation({
          id: crypto.randomUUID(),
          type: 'DELETE',
          table: 'transactions',
          targetId: matchingTx.id,
          payload: null
        });
      }
    }
  };

  const currentBalance = transactions.reduce((acc, t) => {
    return t.type === 'income' ? acc + t.amount : acc - t.amount;
  }, 0);

  return (
    <div className="flex flex-col md:flex-row h-full min-h-screen w-full bg-bg-primary dark:bg-slate-950 text-text-primary dark:text-slate-50 transition-colors duration-300">
      {/* Sidebar / Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full h-16 md:h-[calc(100vh-3rem)] md:relative md:w-20 md:hover:w-64 bg-white dark:bg-slate-950 border-t md:border-t-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-row md:flex-col md:sticky md:top-6 z-50 overflow-hidden md:py-6 text-slate-800 dark:text-slate-200 transition-all duration-300 ease-out group md:my-6 md:ml-6 pb-safe">

        {/* Workspace Selector / Logo (Desktop Only) */}
        <div className="px-5 mb-10 mt-2 items-center whitespace-nowrap hidden md:flex">
          <div className="p-2.5 bg-black dark:bg-white rounded-xl shadow-md shrink-0 transition-transform duration-500 ease-in-out">
            <Wallet size={22} className="text-white dark:text-black" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col ml-4 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 delay-100">
            <span className="text-xl font-extrabold tracking-tight text-black dark:text-white uppercase">Chill-arai</span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-row md:flex-col gap-1 md:gap-3 px-2 md:px-3 w-full h-full md:h-auto justify-around items-center md:items-stretch">
          <button
            className={`flex flex-col md:flex-row items-center justify-center md:justify-start px-2 py-1 md:px-4 md:py-3.5 w-full rounded-lg text-center md:text-left transition-all duration-300 overflow-hidden ${activeTab === 'dashboard'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 hover:text-black dark:hover:text-white'
              }`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity size={22} className={`shrink-0 transition-transform duration-300 ${activeTab === 'dashboard' ? 'scale-110' : ''}`} />
            <span className="text-[10px] md:text-base mt-1 md:mt-0 ml-0 md:ml-4 font-semibold whitespace-nowrap md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
              Dashboard
            </span>
          </button>

          <button
            className={`flex flex-col md:flex-row items-center justify-center md:justify-start px-2 py-1 md:px-4 md:py-3.5 w-full rounded-lg text-center md:text-left transition-all duration-300 overflow-hidden ${activeTab === 'transactions'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 hover:text-black dark:hover:text-white'
              }`}
            onClick={() => setActiveTab('transactions')}
          >
            <Wallet size={22} className={`shrink-0 transition-transform duration-300 ${activeTab === 'transactions' ? 'scale-110' : ''}`} />
            <span className="text-[10px] md:text-base mt-1 md:mt-0 ml-0 md:ml-4 font-semibold whitespace-nowrap md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 md:delay-75">
              Transactions
            </span>
          </button>

          <button
            className={`flex flex-col md:flex-row items-center justify-center md:justify-start px-2 py-1 md:px-4 md:py-3.5 w-full rounded-lg text-center md:text-left transition-all duration-300 overflow-hidden ${activeTab === 'lending'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 hover:text-black dark:hover:text-white'
              }`}
            onClick={() => setActiveTab('lending')}
          >
            <Users size={22} className={`shrink-0 transition-transform duration-300 ${activeTab === 'lending' ? 'scale-110' : ''}`} />
            <span className="text-[10px] md:text-base mt-1 md:mt-0 ml-0 md:ml-4 font-semibold whitespace-nowrap md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 md:delay-150">
              Lending Logs
            </span>
          </button>

          <button
            className={`flex flex-col md:flex-row items-center justify-center md:justify-start px-2 py-1 md:px-4 md:py-3.5 w-full rounded-lg text-center md:text-left transition-all duration-300 overflow-hidden ${activeTab === 'borrowing'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 hover:text-black dark:hover:text-white'
              }`}
            onClick={() => setActiveTab('borrowing')}
          >
            <Download size={22} className={`shrink-0 transition-transform duration-300 ${activeTab === 'borrowing' ? 'scale-110' : ''}`} />
            <span className="text-[10px] md:text-base mt-1 md:mt-0 ml-0 md:ml-4 font-semibold whitespace-nowrap md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 md:delay-200">
              Borrowing Logs
            </span>
          </button>
        </div>

        {/* Bottom Actions (Desktop Only Theme Toggle in Sidebar) */}
        <div className="mt-auto px-3 mb-8 w-full hidden md:block">
          <button
            onClick={toggleTheme}
            className="flex items-center px-4 py-3.5 w-full rounded-lg text-left transition-all duration-300 overflow-hidden bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <div className="shrink-0 flex items-center justify-center relative w-[22px] h-[22px]">
              <Sun size={20} className={`absolute transition-all duration-300 ${isDarkMode ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0'}`} />
              <Moon size={20} className={`absolute transition-all duration-300 ${isDarkMode ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'}`} />
            </div>
            <span className="ml-4 font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
        </div>

        {/* Bottom Status (Pushed to absolute bottom, Desktop Only) */}
        <div className="hidden md:flex absolute pl-6 bottom-4 w-full items-center h-8">
          <div className="flex items-center absolute left-8">
            <div className="relative flex h-3 w-3 shrink-0" title="System Active">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </div>
          </div>
          <span className="ml-[34px] font-bold text-sm text-slate-600 dark:text-slate-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
            Active
          </span>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto relative flex flex-col pt-6 md:pt-8 pb-24 md:pb-8">

        {/* Global Header Elements */}
        <div className="w-full flex justify-between items-start md:items-center mb-6 md:mb-10 z-40 bg-transparent border-b border-slate-200 dark:border-slate-800 pb-4 md:pb-6 flex-col md:flex-row gap-4 md:gap-0">
          <div className="flex flex-col w-full md:w-auto">
            <div className="flex justify-between items-center md:block">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold flex items-center gap-2 text-black dark:text-white tracking-tighter transition-colors">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'transactions' && 'Recent Transactions'}
                {activeTab === 'lending' && 'Lending Log'}
                {activeTab === 'borrowing' && 'Borrowing Log'}
              </h2>
              {/* Mobile Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="md:hidden p-2 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
            <div className="text-sm md:text-lg text-slate-500 dark:text-slate-400 font-medium mt-1 transition-colors">Welcome, Cherry!</div>
          </div>

          <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-between md:justify-end">
            {/* Actions */}
            {activeTab === 'transactions' && (
              <button className="flex items-center justify-center bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black font-semibold transition-all shadow-lg hover:shadow-xl fixed bottom-24 right-6 md:static md:bottom-auto md:left-auto md:translate-x-0 rounded-full md:rounded-xl p-4 md:py-2 md:px-4 z-50 gap-0 md:gap-2" onClick={() => setShowTxForm(true)}>
                <Plus size={24} className="md:w-[18px] md:h-[18px]" /> <span className="hidden md:inline">Add New</span>
              </button>
            )}
            {activeTab === 'lending' && (
              <button className="flex items-center justify-center bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black font-semibold transition-all shadow-lg hover:shadow-xl fixed bottom-24 right-6 md:static md:bottom-auto md:left-auto md:translate-x-0 rounded-full md:rounded-xl p-4 md:py-2 md:px-4 z-50 gap-0 md:gap-2" onClick={() => setShowLendingForm(true)}>
                <Plus size={24} className="md:w-[18px] md:h-[18px]" /> <span className="hidden md:inline">Add New</span>
              </button>
            )}
            {activeTab === 'borrowing' && (
              <button className="flex items-center justify-center bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black font-semibold transition-all shadow-lg hover:shadow-xl fixed bottom-24 right-6 md:static md:bottom-auto md:left-auto md:translate-x-0 rounded-full md:rounded-xl p-4 md:py-2 md:px-4 z-50 gap-0 md:gap-2" onClick={() => setShowBorrowForm(true)}>
                <Plus size={24} className="md:w-[18px] md:h-[18px]" /> <span className="hidden md:inline">Add New</span>
              </button>
            )}

            {/* Balance Text instead of bulky card */}
            <div className="px-4 py-2 flex items-baseline gap-2">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wide transition-colors">Balance</span>
              <span className="text-xl font-bold text-black dark:text-white transition-colors">₹{currentBalance.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {activeTab === 'dashboard' && <Dashboard transactions={transactions} lendings={lendings} borrowings={borrowings} onNavigate={setActiveTab} />}

        {activeTab === 'transactions' && (
          <TransactionManager
            transactions={transactions}
            onDelete={handleDeleteTransaction}
          />
        )}

        {activeTab === 'lending' && (
          <LendingTracker
            lendings={lendings}
            onAddPayment={handleAddLendingPayment}
            onDelete={handleDeleteLending}
          />
        )}

        {activeTab === 'borrowing' && (
          <BorrowTracker
            borrowings={borrowings}
            onAddPayment={handleAddBorrowingPayment}
            onDelete={handleDeleteBorrowing}
          />
        )}
      </main>

      {/* Modals */}
      {showTxForm && <TransactionForm onSubmit={handleAddTransaction} onCancel={() => setShowTxForm(false)} />}
      {showLendingForm && <LendingForm onSubmit={handleAddLending} onCancel={() => setShowLendingForm(false)} />}
      {showBorrowForm && <BorrowForm onSubmit={handleAddBorrowing} onCancel={() => setShowBorrowForm(false)} />}
    </div>
  );
}

export default App;
