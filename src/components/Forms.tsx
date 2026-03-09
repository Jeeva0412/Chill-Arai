import { useState } from 'react';
import type { TransactionType } from '../types/database.types';

export function TransactionForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
    const [type, setType] = useState<TransactionType>('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !category || !description) return;

        onSubmit({
            type,
            amount: parseFloat(amount),
            category,
            description
        });
    };

    return (
        <div className="fixed inset-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-colors">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-8 w-full max-w-md animate-fade-in flex-col gap-6 transition-colors">
                <h2 className="text-2xl font-bold tracking-tight mb-2 border-b border-slate-100 dark:border-slate-800 pb-4 dark:text-white transition-colors">New Transaction</h2>

                <form onSubmit={handleSubmit} className="flex-col gap-4">
                    <div className="flex gap-2 mb-6">
                        <button
                            type="button"
                            className={`flex-1 py-2.5 font-semibold text-sm transition-colors border ${type === 'expense' ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'bg-transparent text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'}`}
                            onClick={() => setType('expense')}
                        >
                            Expense
                        </button>
                        <button
                            type="button"
                            className={`flex-1 py-2.5 font-semibold text-sm transition-colors border ${type === 'income' ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'bg-transparent text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'}`}
                            onClick={() => setType('income')}
                        >
                            Income
                        </button>
                    </div>

                    <div className="mb-4 text-slate-800 dark:text-slate-200 transition-colors">
                        <label className="dark:text-slate-300">Amount (₹)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="dark:bg-slate-950 dark:border-slate-700 dark:text-white dark:focus:ring-white dark:focus:border-white transition-colors"
                            required
                        />
                    </div>

                    <div className="mb-4 text-slate-800 dark:text-slate-200 transition-colors">
                        <label className="dark:text-slate-300">Category</label>
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="e.g. Groceries, Salary..."
                            className="dark:bg-slate-950 dark:border-slate-700 dark:text-white dark:focus:ring-white dark:focus:border-white transition-colors"
                            required
                        />
                    </div>

                    <div className="mb-4 text-slate-800 dark:text-slate-200 transition-colors">
                        <label className="dark:text-slate-300">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What was this for?"
                            rows={2}
                            className="dark:bg-slate-950 dark:border-slate-700 dark:text-white dark:focus:ring-white dark:focus:border-white transition-colors"
                            required
                        />
                    </div>

                    <div className="flex gap-4 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 transition-colors">
                        <button type="button" className="btn btn-secondary flex-1 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors" onClick={onCancel}>Cancel</button>
                        <button type="submit" className="btn btn-primary flex-1 dark:bg-white dark:text-black dark:hover:bg-slate-200 transition-colors">Save Record</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function LendingForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
    const [personName, setPersonName] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !personName || !description) return;

        onSubmit({
            person_name: personName,
            amount: parseFloat(amount),
            description
        });
    };

    return (
        <div className="fixed inset-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-colors">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-8 w-full max-w-md animate-fade-in flex-col gap-6 transition-colors">
                <h2 className="text-2xl font-bold tracking-tight mb-2 border-b border-slate-100 dark:border-slate-800 pb-4 dark:text-white transition-colors">Record New Loan</h2>

                <form onSubmit={handleSubmit} className="flex-col gap-4">
                    <div className="mb-4 text-slate-800 dark:text-slate-200 transition-colors">
                        <label className="dark:text-slate-300">Who did you lend to?</label>
                        <input
                            type="text"
                            value={personName}
                            onChange={(e) => setPersonName(e.target.value)}
                            placeholder="Person's Name"
                            className="dark:bg-slate-950 dark:border-slate-700 dark:text-white dark:focus:ring-white dark:focus:border-white transition-colors"
                            required
                        />
                    </div>

                    <div className="mb-4 text-slate-800 dark:text-slate-200 transition-colors">
                        <label className="dark:text-slate-300">Amount (₹)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="dark:bg-slate-950 dark:border-slate-700 dark:text-white dark:focus:ring-white dark:focus:border-white transition-colors"
                            required
                        />
                    </div>

                    <div className="mb-4 text-slate-800 dark:text-slate-200 transition-colors">
                        <label className="dark:text-slate-300">Purpose / Note</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Why did they need it?"
                            rows={2}
                            className="dark:bg-slate-950 dark:border-slate-700 dark:text-white dark:focus:ring-white dark:focus:border-white transition-colors"
                            required
                        />
                    </div>

                    <div className="flex gap-4 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 transition-colors">
                        <button type="button" className="btn btn-secondary flex-1 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors" onClick={onCancel}>Cancel</button>
                        <button type="submit" className="btn btn-primary flex-1 dark:bg-white dark:text-black dark:hover:bg-slate-200 transition-colors">Record Lent Money</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function BorrowForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
    const [personName, setPersonName] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !personName || !description) return;

        onSubmit({
            person_name: personName,
            amount: parseFloat(amount),
            description
        });
    };

    return (
        <div className="fixed inset-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-colors">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-8 w-full max-w-md animate-fade-in flex-col gap-6 transition-colors">
                <h2 className="text-2xl font-bold tracking-tight mb-2 border-b border-slate-100 dark:border-slate-800 pb-4 dark:text-white transition-colors">Record Borrowing</h2>

                <form onSubmit={handleSubmit} className="flex-col gap-4">
                    <div className="mb-4 text-slate-800 dark:text-slate-200 transition-colors">
                        <label className="dark:text-slate-300">Who did you borrow from?</label>
                        <input
                            type="text"
                            value={personName}
                            onChange={(e) => setPersonName(e.target.value)}
                            placeholder="Person's Name"
                            className="dark:bg-slate-950 dark:border-slate-700 dark:text-white dark:focus:ring-white dark:focus:border-white transition-colors"
                            required
                        />
                    </div>

                    <div className="mb-4 text-slate-800 dark:text-slate-200 transition-colors">
                        <label className="dark:text-slate-300">Amount (₹)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="dark:bg-slate-950 dark:border-slate-700 dark:text-white dark:focus:ring-white dark:focus:border-white transition-colors"
                            required
                        />
                    </div>

                    <div className="mb-4 text-slate-800 dark:text-slate-200 transition-colors">
                        <label className="dark:text-slate-300">Purpose / Note</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Why did you borrow it?"
                            rows={2}
                            className="dark:bg-slate-950 dark:border-slate-700 dark:text-white dark:focus:ring-white dark:focus:border-white transition-colors"
                            required
                        />
                    </div>

                    <div className="flex gap-4 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 transition-colors">
                        <button type="button" className="btn btn-secondary flex-1 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors" onClick={onCancel}>Cancel</button>
                        <button type="submit" className="btn btn-primary flex-1 dark:bg-white dark:text-black dark:hover:bg-slate-200 transition-colors">Record Borrowed Money</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
