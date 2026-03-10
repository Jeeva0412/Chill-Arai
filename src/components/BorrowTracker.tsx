import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import type { Borrowing } from '../types/database.types';

interface BorrowTrackerProps {
    borrowings: Borrowing[];
    onAddPayment: (id: string, amount: number) => void;
    onDelete: (id: string) => void;
}

export function BorrowTracker({ borrowings, onAddPayment, onDelete }: BorrowTrackerProps) {
    const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
    const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<string>('');

    // Group borrowings by person_name
    const groupedBorrowings = borrowings.reduce((acc, current) => {
        if (!acc[current.person_name]) {
            acc[current.person_name] = [];
        }
        acc[current.person_name].push(current);
        return acc;
    }, {} as Record<string, Borrowing[]>);

    // Sort each group's borrowings by date (newest first)
    Object.keys(groupedBorrowings).forEach(person => {
        groupedBorrowings[person].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    });

    const toggleExpand = (personName: string) => {
        if (expandedPerson === personName) {
            setExpandedPerson(null);
        } else {
            setExpandedPerson(personName);
        }
    };

    const [showSettled, setShowSettled] = useState(false);

    // Filter grouped borrowings based on showSettled state
    const displayGroups = Object.entries(groupedBorrowings).filter(([, personBorrowings]) => {
        const allSettled = personBorrowings.every(b => b.status === 'settled');
        return showSettled || !allSettled;
    });

    const overallTotalBorrowed = borrowings
        .filter(b => b.status !== 'settled')
        .reduce((sum, b) => sum + (b.amount - b.amount_paid), 0);

    return (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex-col gap-4 w-full transition-colors duration-300">
            {overallTotalBorrowed > 0 && (
                <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center sm:text-left mb-2 transition-colors duration-300">
                    <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl font-medium">
                        You have overall totally borrowed <span className="font-extrabold text-black dark:text-white text-2xl md:text-3xl tracking-tight">₹{overallTotalBorrowed.toLocaleString()}</span> in total.
                    </p>
                </div>
            )}

            {borrowings.some(b => b.status === 'settled') && (
                <div className="flex justify-end mb-2">
                    <button
                        onClick={() => setShowSettled(!showSettled)}
                        className="text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors underline"
                    >
                        {showSettled ? 'Hide Settled Accounts' : 'Show Settled Accounts'}
                    </button>
                </div>
            )}
            <div className="flex flex-col gap-4 mt-2 w-full">
                {displayGroups.length === 0 ? (
                    <div className="w-full text-center p-8 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 transition-colors">
                        {borrowings.length === 0 ? "You haven't borrowed money from anyone yet." : "No active borrowing accounts."}
                    </div>
                ) : (
                    displayGroups.map(([personName, personBorrowings]) => {
                        const totalRemaining = personBorrowings.reduce((sum, b) => sum + (b.amount - b.amount_paid), 0);
                        const allSettled = personBorrowings.every(b => b.status === 'settled');
                        const isExpanded = expandedPerson === personName;

                        return (
                            <div key={personName} className={`bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col gap-0 relative overflow-hidden transition-all duration-300 ${allSettled ? 'opacity-50' : ''}`}>

                                {/* Header / Summary Card */}
                                <div
                                    className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                                    onClick={() => toggleExpand(personName)}
                                >
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <div className="w-12 h-12 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-bold text-xl shrink-0 transition-colors">
                                            {personName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-xl text-black dark:text-white truncate transition-colors">{personName}</div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate transition-colors">
                                                {personBorrowings.length} Record{personBorrowings.length !== 1 ? 's' : ''} {allSettled ? '(All Repaid)' : ''}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 sm:gap-6 mt-1 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                                        <div className="text-left sm:text-right">
                                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 transition-colors">Total Owed</div>
                                            <div className={`text-2xl font-bold transition-colors ${allSettled ? 'text-slate-400 dark:text-slate-500' : 'text-black dark:text-white'}`}>
                                                ₹{totalRemaining.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-full p-2 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors shrink-0">
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Individual Records List */}
                                <div className={`transition-all duration-300 bg-white dark:bg-slate-950 w-full ${isExpanded ? 'max-h-[1000px] border-t border-slate-200 dark:border-slate-800' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                    <div className="p-4 flex flex-col gap-3">
                                        {personBorrowings.map((b) => (
                                            <div key={b.id} className={`bg-white dark:bg-slate-950 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b last:border-0 border-slate-100 dark:border-slate-800 transition-colors ${b.status === 'settled' ? 'opacity-50 bg-slate-50 dark:bg-slate-900' : ''}`}>

                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 transition-colors">{new Date(b.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                        {b.status === 'settled' && (
                                                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 flex items-center gap-1 transition-colors">
                                                                <CheckCircle2 size={10} /> Repaid
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-slate-600 dark:text-slate-400 break-words mt-1 transition-colors">
                                                        <span className="text-slate-400 dark:text-slate-500 font-semibold transition-colors">Purpose: </span>
                                                        {b.description || 'No description provided'}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col md:flex-row items-end md:items-center gap-4 w-full md:w-auto justify-between md:justify-end mt-4 md:mt-0">
                                                    <div className="flex gap-4 w-full md:w-auto justify-between md:justify-end">
                                                        <div className="text-right shrink-0">
                                                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5 transition-colors">Total Owed</div>
                                                            <div className="font-bold text-lg text-black dark:text-white transition-colors">₹{b.amount.toLocaleString()}</div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5 transition-colors">Repaid</div>
                                                            <div className="font-bold text-lg text-emerald-600 dark:text-emerald-500 transition-colors">₹{b.amount_paid.toLocaleString()}</div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5 transition-colors">Left</div>
                                                            <div className="font-bold text-lg text-rose-600 dark:text-rose-500 transition-colors">₹{(b.amount - b.amount_paid).toLocaleString()}</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 mt-2 md:mt-0 w-full md:w-auto justify-end">
                                                        {b.status !== 'settled' && selectedPaymentId !== b.id && (
                                                            <button
                                                                className="shrink-0 py-2 px-4 border border-black dark:border-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black rounded-xl transition-colors text-black dark:text-white text-sm font-bold flex items-center justify-center gap-1.5"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedPaymentId(b.id);
                                                                    setPaymentAmount((b.amount - b.amount_paid).toString());
                                                                }}
                                                            >
                                                                <CheckCircle2 size={16} /> Repay Amount
                                                            </button>
                                                        )}

                                                        {selectedPaymentId === b.id && (
                                                            <div className="flex items-center gap-2 animate-fade-in origin-right">
                                                                <div className="relative">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium font-sans">₹</span>
                                                                    <input
                                                                        type="number"
                                                                        value={paymentAmount}
                                                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                                                        className="w-24 pl-7 pr-2 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all outline-none font-bold text-black dark:text-white"
                                                                        autoFocus
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        max={b.amount - b.amount_paid}
                                                                        min={1}
                                                                    />
                                                                </div>
                                                                <button
                                                                    className="bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const amount = parseFloat(paymentAmount);
                                                                        if (!isNaN(amount) && amount > 0) {
                                                                            onAddPayment(b.id, amount);
                                                                            setSelectedPaymentId(null);
                                                                        }
                                                                    }}
                                                                >
                                                                    Confirm
                                                                </button>
                                                                <button
                                                                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1.5 text-sm font-bold transition-colors"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedPaymentId(null);
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        )}

                                                        <button
                                                            className="shrink-0 py-2 px-3 border border-slate-200 dark:border-slate-800 hover:border-black dark:hover:border-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black rounded-xl transition-colors text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDelete(b.id);
                                                            }}
                                                            title="Delete Record"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>

                                                    <button
                                                        className="shrink-0 py-2 px-3 border border-slate-200 dark:border-slate-800 hover:border-black dark:hover:border-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black rounded-xl transition-colors text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDelete(b.id);
                                                        }}
                                                        title="Delete Record"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
