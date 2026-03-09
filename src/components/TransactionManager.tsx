import { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Trash2, Search, Calendar, X } from 'lucide-react';
import type { Transaction } from '../types/database.types';

interface TransactionManagerProps {
    transactions: Transaction[];
    onDelete: (id: string) => void;
}

export function TransactionManager({ transactions, onDelete }: TransactionManagerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    // Filter and Sort
    const filteredAndSortedTransactions = useMemo(() => {
        return transactions
            .filter((t) => {
                const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.category.toLowerCase().includes(searchQuery.toLowerCase());

                const txDate = new Date(t.created_at).setHours(0, 0, 0, 0);
                const isAfterStart = startDate ? txDate >= new Date(startDate).setHours(0, 0, 0, 0) : true;
                const isBeforeEnd = endDate ? txDate <= new Date(endDate).setHours(0, 0, 0, 0) : true;

                return matchesSearch && isAfterStart && isBeforeEnd;
            })
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [transactions, searchQuery, startDate, endDate]);

    return (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-6 flex-col gap-4 w-full transition-colors duration-300">

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-2">
                {/* Search Bar */}
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-all rounded-none py-2"
                    />
                </div>

                {/* Date Filters */}
                <div className="flex gap-2 items-center">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                            <Calendar size={18} />
                        </div>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="pl-10 text-sm bg-transparent border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-all rounded-none py-2"
                            aria-label="Start Date"
                        />
                    </div>
                    <span className="text-slate-400 dark:text-slate-500 font-medium text-sm px-1">to</span>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                            <Calendar size={18} />
                        </div>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="pl-10 text-sm bg-transparent border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-all rounded-none py-2"
                            aria-label="End Date"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-col gap-3 mt-4">
                {filteredAndSortedTransactions.length === 0 ? (
                    <div className="text-center p-8 text-slate-500 dark:text-slate-400 font-medium border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 transition-colors">
                        {transactions.length === 0 ? "No transactions found. Add one to get started." : "No transactions match your search."}
                    </div>
                ) : (
                    filteredAndSortedTransactions.map((t) => (
                        <div
                            key={t.id}
                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-all group"
                            onClick={() => setSelectedTransaction(t)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 border ${t.type === 'income' ? 'border-black text-black dark:border-white dark:text-white' : 'border-slate-400 text-slate-500 dark:border-slate-600 dark:text-slate-400'}`}>
                                    {t.type === 'income' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                                </div>
                                <div className="flex flex-col">
                                    <div className="font-bold text-slate-800 dark:text-slate-200 transition-colors">{t.description}</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 transition-colors">
                                        {t.category} • {new Date(t.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className={`font-bold text-lg transition-colors ${t.type === 'income' ? 'text-black dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                    {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(t.id);
                                    }}
                                    className="p-2 ml-2 text-slate-400 dark:text-slate-500 hover:text-black dark:hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete Transaction"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Transaction Details Modal */}
            {selectedTransaction && (
                <div
                    className="fixed inset-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-colors duration-300"
                    onClick={() => setSelectedTransaction(null)}
                >
                    <div
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-8 w-full max-w-md animate-fade-in flex-col gap-6 relative transition-colors duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="absolute top-6 right-6 text-slate-400 dark:text-slate-500 hover:text-black dark:hover:text-white p-1.5 transition-colors"
                            onClick={() => setSelectedTransaction(null)}
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center gap-4 text-center mt-2">
                            <div className={`p-4 border ${selectedTransaction.type === 'income' ? 'border-black text-black dark:border-white dark:text-white' : 'border-slate-500 text-slate-600 dark:border-slate-500 dark:text-slate-400'}`}>
                                {selectedTransaction.type === 'income' ? <ArrowDownRight size={32} /> : <ArrowUpRight size={32} />}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold tracking-tight text-black dark:text-white transition-colors">Transaction Details</h3>
                                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">{new Date(selectedTransaction.created_at).toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                        </div>

                        <div className="bg-transparent border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-4 mt-2 transition-colors">
                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 transition-colors">
                                <span className="text-slate-500 dark:text-slate-400 uppercase text-xs font-bold tracking-wider">Amount</span>
                                <span className={`text-xl font-bold ${selectedTransaction.type === 'income' ? 'text-black dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {selectedTransaction.type === 'income' ? '+' : '-'}₹{selectedTransaction.amount.toLocaleString()}
                                </span>
                            </div>

                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 transition-colors">
                                <span className="text-slate-500 dark:text-slate-400 uppercase text-xs font-bold tracking-wider">Category</span>
                                <span className="text-sm font-bold text-black dark:text-white transition-colors">
                                    {selectedTransaction.category}
                                </span>
                            </div>

                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 transition-colors">
                                <span className="text-slate-500 dark:text-slate-400 uppercase text-xs font-bold tracking-wider">Type</span>
                                <span className="text-black dark:text-white capitalize font-bold transition-colors">{selectedTransaction.type}</span>
                            </div>

                            <div className="flex flex-col gap-2 pt-1 transition-colors">
                                <span className="text-slate-500 dark:text-slate-400 uppercase text-xs font-bold tracking-wider">Description / Note</span>
                                <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 min-h-[60px] transition-colors">
                                    {selectedTransaction.description || <span className="text-slate-400 dark:text-slate-500 italic">No specific description provided.</span>}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-sm font-bold transition-colors">
                            <button
                                className="flex-1 py-3 bg-white dark:bg-slate-950 text-black dark:text-white border border-slate-200 dark:border-slate-700 hover:border-black dark:hover:border-white flex items-center justify-center gap-2 transition-colors"
                                onClick={() => setSelectedTransaction(null)}
                            >
                                Close
                            </button>
                            <button
                                className="flex-1 py-3 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-red-600 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-500 flex items-center justify-center gap-2 transition-colors"
                                onClick={() => {
                                    onDelete(selectedTransaction.id);
                                    setSelectedTransaction(null);
                                }}
                            >
                                <Trash2 size={18} /> Delete Record
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
