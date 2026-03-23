import { useState } from 'react';
import { FileText, Download, X } from 'lucide-react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import type { Transaction, Lending, Borrowing } from '../types/database.types';

interface ExportPanelProps {
  transactions: Transaction[];
  lendings: Lending[];
  borrowings: Borrowing[];
  onClose: () => void;
}

export function ExportPanel({ transactions, lendings, borrowings, onClose }: ExportPanelProps) {
  const [status, setStatus] = useState('');

  const exportCSV = () => {
    const txCsv = Papa.unparse(transactions.filter(t => !t.deleted).map(t => ({
      Type: t.type,
      Amount: t.amount,
      Category: t.category,
      Description: t.description,
      Date: new Date(t.created_at).toLocaleDateString(),
    })));

    const lCsv = Papa.unparse(lendings.filter(l => !l.deleted).map(l => ({
      Person: l.person_name,
      LentAmount: l.amount,
      PaidBack: l.amount_paid,
      Remaining: l.amount - l.amount_paid,
      Status: l.status,
      Description: l.description,
      Date: new Date(l.created_at).toLocaleDateString(),
    })));

    const bCsv = Papa.unparse(borrowings.filter(b => !b.deleted).map(b => ({
      Person: b.person_name,
      BorrowedAmount: b.amount,
      PaidBack: b.amount_paid,
      Remaining: b.amount - b.amount_paid,
      Status: b.status,
      Description: b.description,
      Date: new Date(b.created_at).toLocaleDateString(),
    })));

    const fullCsv = `--- TRANSACTIONS ---\n${txCsv}\n\n--- LENDING LOG ---\n${lCsv}\n\n--- BORROWING LOG ---\n${bCsv}`;
    const blob = new Blob([fullCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `chill-arai-export-${Date.now()}.csv`);
    setStatus('CSV downloaded!');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleDateString();
    doc.setFontSize(20);
    doc.text('Chill-Arai Financial Report', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Generated: ${now}`, 14, 28);

    let y = 40;
    const addSection = (title: string, rows: string[][], headers: string[]) => {
      doc.setFontSize(13);
      doc.setTextColor(30, 30, 30);
      doc.text(title, 14, y);
      y += 6;
      doc.setFontSize(8);
      doc.setTextColor(80);
      doc.text(headers.join('  |  '), 14, y);
      y += 5;
      doc.setTextColor(30);
      doc.setFontSize(9);
      rows.forEach(row => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(row.join('  |  '), 14, y);
        y += 5;
      });
      y += 8;
    };

    addSection('Transactions', transactions.filter(t => !t.deleted).map(t => [
      t.type.toUpperCase(), `₹${t.amount}`, t.category, t.description.slice(0, 30), new Date(t.created_at).toLocaleDateString()
    ]), ['Type', 'Amount', 'Category', 'Description', 'Date']);

    addSection('Lending Log', lendings.filter(l => !l.deleted).map(l => [
      l.person_name, `₹${l.amount}`, `₹${l.amount_paid}`, l.status, new Date(l.created_at).toLocaleDateString()
    ]), ['Person', 'Lent', 'Paid Back', 'Status', 'Date']);

    addSection('Borrowing Log', borrowings.filter(b => !b.deleted).map(b => [
      b.person_name, `₹${b.amount}`, `₹${b.amount_paid}`, b.status, new Date(b.created_at).toLocaleDateString()
    ]), ['Person', 'Borrowed', 'Paid Back', 'Status', 'Date']);

    doc.save(`chill-arai-report-${Date.now()}.pdf`);
    setStatus('PDF downloaded!');
  };

  const triggerDownload = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-sm rounded-t-3xl p-6 flex flex-col gap-5 animate-fade-in"
        style={{ background: 'var(--bg-surface, #FFFFFF)' }}>
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Export Data</h3>
          <button onClick={onClose}><X size={22} style={{ color: 'var(--text-secondary)' }} /></button>
        </div>

        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Download a full audit trail of all your transactions, lending, and borrowing records.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={exportCSV}
            className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 border-2"
            style={{ borderColor: 'var(--text-primary)', color: 'var(--text-primary)', background: 'transparent' }}
          >
            <FileText size={20} /> Export as CSV
          </button>
          <button
            onClick={exportPDF}
            className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95"
            style={{ background: 'var(--bg-header, #1B1914)', color: '#FFF' }}
          >
            <Download size={20} /> Export as PDF
          </button>
        </div>

        {status && (
          <p className="text-center text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            ✓ {status}
          </p>
        )}
      </div>
    </div>
  );
}
