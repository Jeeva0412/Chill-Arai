import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import type { Borrowing } from '../types/database.types';

interface BorrowTrackerProps {
    borrowings: Borrowing[];
    onUpdateStatus: (id: string, currentStatus: string) => void;
    onDelete: (id: string) => void;
}

export function BorrowTracker({ borrowings, onUpdateStatus, onDelete }: BorrowTrackerProps) {
    const [expandedPerson, setExpandedPerson] = useState<string | null>(null);

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

    return (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-6 flex-col gap-4 w-full transition-colors duration-300">
            <div className="flex flex-col gap-4 mt-2 w-full">
                {Object.keys(groupedBorrowings).length === 0 ? (
                    <div className="w-full text-center p-8 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 transition-colors">
                        You haven't borrowed money from anyone yet.
                    </div>
                ) : (
                    Object.entries(groupedBorrowings).map(([personName, personBorrowings]) => {
                        const totalRemaining = personBorrowings.reduce((sum, b) => sum + (b.amount - b.amount_paid), 0);
                        const allSettled = personBorrowings.every(b => b.status === 'settled');
                        const isExpanded = expandedPerson === personName;

                        return (
                            <div key={personName} className={`bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-0 relative overflow-hidden transition-all duration-300 ${allSettled ? 'opacity-50' : ''}`}>

                                {/* Header / Summary Card */}
                                <div
                                    className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                                    onClick={() => toggleExpand(personName)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-bold text-xl transition-colors">
                                            {personName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-xl text-black dark:text-white transition-colors">{personName}</div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 transition-colors">
                                                {personBorrowings.length} Record{personBorrowings.length !== 1 ? 's' : ''} {allSettled ? '(All Repaid)' : ''}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 transition-colors">Total Owed</div>
                                            <div className={`text-2xl font-bold transition-colors ${allSettled ? 'text-slate-400 dark:text-slate-500' : 'text-black dark:text-white'}`}>
                                                ₹{totalRemaining.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 p-2 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors">
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

                                                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                                    <div className="text-right shrink-0">
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5 transition-colors">Amount</div>
                                                        <div className="font-bold text-lg text-black dark:text-white transition-colors">₹{b.amount.toLocaleString()}</div>
                                                    </div>

                                                    {b.status !== 'settled' && (
                                                        <button
                                                            className="shrink-0 w-32 py-2 px-3 border border-black dark:border-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors text-black dark:text-white text-sm font-bold flex items-center justify-center gap-1.5"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onUpdateStatus(b.id, b.status);
                                                            }}
                                                        >
                                                            <CheckCircle2 size={16} /> Repay
                                                        </button>
                                                    )}

                                                    <button
                                                        className="shrink-0 py-2 px-3 border border-slate-200 dark:border-slate-800 hover:border-black dark:hover:border-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold"
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
