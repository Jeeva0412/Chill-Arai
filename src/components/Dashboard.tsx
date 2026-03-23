import { TrendingUp, TrendingDown, Users, Download } from 'lucide-react';
import type { Transaction, Lending, Borrowing } from '../types/database.types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardProps {
    transactions: Transaction[];
    lendings: Lending[];
    borrowings: Borrowing[];
    onNavigate: (tab: 'dashboard' | 'transactions' | 'lending' | 'borrowing') => void;
}

export function Dashboard({ transactions, lendings, borrowings, onNavigate }: DashboardProps) {
    const totalIncome = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalLent = lendings.reduce((sum, l) => sum + (l.amount - l.amount_paid), 0);
    const totalBorrowed = borrowings.reduce((sum, b) => sum + (b.amount - b.amount_paid), 0);

    // Data Aggregation for Charts
    const expensesByCategory = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

    const expenseData = Object.entries(expensesByCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const incomesByCategory = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

    const incomeData = Object.entries(incomesByCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Color Palettes (Monochromatic)
    const EXPENSE_COLORS = ['#111827', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb'];
    const INCOME_COLORS = ['#000000', '#1f2937', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb'];

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg">
                    <p className="text-slate-800 font-bold m-0 text-sm">{`${payload[0].name}`}</p>
                    <p className="text-black font-extrabold m-0 mt-1">{`₹${payload[0].value.toLocaleString()}`}</p>
                </div>
            );
        }
        return null;
    };
    return (
        <div className="flex-col gap-6 animate-fade-in w-full">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>

                {/* Revenue/Income Card */}
                <div style={{ background: 'var(--bg-icon)', borderRadius: '1.25rem' }}
                    className="p-6 flex-col gap-2 relative overflow-hidden transition-colors duration-300">
                    <div className="flex justify-between items-center text-sm font-semibold mb-2 uppercase tracking-wide"
                        style={{ color: 'var(--text-secondary)' }}>
                        <span>Revenue</span>
                        <div style={{ background: 'var(--bg-icon)', borderRadius: '50%' }} className="p-1.5">
                            <TrendingDown size={16} style={{ color: 'var(--accent-primary)' }} />
                        </div>
                    </div>
                    <div className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        ₹{totalIncome.toLocaleString()}
                    </div>
                </div>

                {/* Expense Card */}
                <div
                    onClick={() => onNavigate('transactions')}
                    style={{ background: 'var(--bg-icon)', borderRadius: '1.25rem' }}
                    className="p-6 flex-col gap-2 relative overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg"
                    title="View Transactions"
                >
                    <div className="flex justify-between items-center text-sm font-semibold mb-2 uppercase tracking-wide"
                        style={{ color: 'var(--text-secondary)' }}>
                        <span>Expenses</span>
                        <div style={{ background: 'var(--bg-icon)', borderRadius: '50%' }} className="p-1.5">
                            <TrendingUp size={16} style={{ color: 'var(--accent-primary)' }} />
                        </div>
                    </div>
                    <div className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        ₹{totalExpense.toLocaleString()}
                    </div>
                </div>

                {/* Lent Card */}
                <div
                    onClick={() => onNavigate('lending')}
                    style={{ background: 'var(--bg-icon)', borderRadius: '1.25rem' }}
                    className="p-6 flex-col gap-2 relative overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg"
                    title="View Lending Logs"
                >
                    <div className="flex justify-between items-center text-sm font-semibold mb-2 uppercase tracking-wide"
                        style={{ color: 'var(--text-secondary)' }}>
                        <span>Total Lent Out</span>
                        <div style={{ background: 'var(--bg-icon)', borderRadius: '50%' }} className="p-1.5">
                            <Users size={16} style={{ color: 'var(--accent-primary)' }} />
                        </div>
                    </div>
                    <div className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        ₹{totalLent.toLocaleString()}
                    </div>
                </div>

                {/* Borrowed Card */}
                <div
                    onClick={() => onNavigate('borrowing')}
                    style={{ background: 'var(--bg-icon)', borderRadius: '1.25rem' }}
                    className="p-6 flex-col gap-2 relative overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg"
                    title="View Borrowing Logs"
                >
                    <div className="flex justify-between items-center text-sm font-semibold mb-2 uppercase tracking-wide"
                        style={{ color: 'var(--text-secondary)' }}>
                        <span>Total Borrowed</span>
                        <div style={{ background: 'var(--bg-app)', borderRadius: '50%' }} className="p-1.5">
                            <Download size={16} style={{ color: 'var(--accent-primary)' }} />
                        </div>
                    </div>
                    <div className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        ₹{totalBorrowed.toLocaleString()}
                    </div>
                </div>

            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

                {/* Expense Chart */}
                <div style={{ background: 'var(--bg-icon)', borderColor: 'var(--glass-border)' }} className="border rounded-2xl p-6 flex-col gap-4 transition-colors duration-300">
                    <h3 className="text-lg font-bold text-black dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 mb-2 transition-colors">Expense Breakdown</h3>
                    {expenseData.length > 0 ? (
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={expenseData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {expenseData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value) => <span className="text-slate-700 dark:text-slate-300 font-medium ml-1 transition-colors">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center font-medium rounded-2xl transition-colors"
                            style={{ background: 'var(--bg-app)', color: 'var(--text-secondary)' }}>
                            No expenses recorded yet.
                        </div>
                    )}
                </div>

                {/* Income Chart */}
                <div style={{ background: 'var(--bg-icon)', borderColor: 'var(--glass-border)' }} className="border rounded-2xl p-6 flex-col gap-4 transition-colors duration-300">
                    <h3 className="text-lg font-bold text-black dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 mb-2 transition-colors">Income Sources</h3>
                    {incomeData.length > 0 ? (
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={incomeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {incomeData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={INCOME_COLORS[index % INCOME_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value) => <span className="text-slate-700 dark:text-slate-300 font-medium ml-1 transition-colors">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center font-medium rounded-2xl transition-colors"
                            style={{ background: 'var(--bg-app)', color: 'var(--text-secondary)' }}>
                            No income recorded yet.
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
