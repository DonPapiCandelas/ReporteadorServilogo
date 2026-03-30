// src/components/ReportsDetails.js
import React, { useState } from 'react';

const ReportsDetails = ({ reportData }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    if (!reportData) return null;

    // Flatten entries for the table
    let allEntries = [];
    Object.keys(reportData.data_by_currency).forEach(cur => {
        const group = reportData.data_by_currency[cur];
        if (group.entries) {
            allEntries = [...allEntries, ...group.entries.map(e => ({ ...e, currency: cur }))];
        }
    });

    // Filter entries
    const filteredEntries = allEntries.filter(entry =>
        entry.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.folio.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination
    const itemsPerPage = 100;
    const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentEntries = filteredEntries.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
    };

    // Helper to format YYYY-MM-DD to MM/DD/YYYY without timezone shift
    const validDate = (dateStr) => {
        if (!dateStr || dateStr === 'None') return '-';
        // Assume dateStr is YYYY-MM-DD
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[1]}/${parts[2]}/${parts[0]}`;
        }
        return dateStr;
    };

    return (
        <div className="bg-surface border border-border rounded-md shadow-sm overflow-hidden">

            {/* Toolbar */}
            <div className="p-4 flex flex-wrap items-center justify-between gap-4 bg-surface border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input
                            className="w-80 h-10 bg-background border border-border rounded-lg pl-10 text-sm text-text-main focus:border-primary outline-none transition-colors"
                            placeholder="Search customer, reference, invoice #..."
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-sub text-xl">search</span>
                    </div>
                    <div className="text-xs text-text-sub">
                        <span className="font-bold">{filteredEntries.length}</span> documents found
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-auto max-h-[600px]">
                <table className="w-full border-collapse text-left">
                    <thead className="sticky top-0 z-10 bg-background border-b border-border">
                        <tr>
                            <th className="px-4 py-3 text-xs font-bold text-text-sub uppercase tracking-wider">Customer</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-sub uppercase tracking-wider">Reference</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-sub uppercase tracking-wider">Document</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-sub uppercase tracking-wider">No.</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-sub uppercase tracking-wider">Invoice Date</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-sub uppercase tracking-wider">Arrival Date</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-sub uppercase tracking-wider">Due Date</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-sub uppercase tracking-wider text-center">Credit Days</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-sub uppercase tracking-wider">Currency</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-sub uppercase tracking-wider text-right">Total</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-sub uppercase tracking-wider text-right">Paid</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-sub uppercase tracking-wider text-right">Balance</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-sub uppercase tracking-wider text-center">Days Elapsed</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-sub uppercase tracking-wider text-center">Days Overdue</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {currentEntries.map((entry, idx) => {
                            const isOverdue = entry.days_since > 45;
                            const isCritical = entry.days_since > 90;

                            return (
                                <tr key={idx} className={`hover:bg-background/50 transition-colors ${isCritical ? 'bg-danger/5' : isOverdue ? 'bg-warning/5' : ''}`}>
                                    <td className="px-4 py-3 text-sm text-text-main font-medium">{entry.customer_name}</td>
                                    <td className="px-4 py-3 text-xs text-text-sub font-mono">{entry.reference || '-'}</td>
                                    <td className="px-4 py-3 text-xs text-text-main">{entry.module}</td>
                                    <td className="px-4 py-3 text-xs text-text-main font-mono">{entry.folio}</td>
                                    <td className="px-4 py-3 text-xs text-text-sub">{validDate(entry.invoice_date)}</td>
                                    <td className="px-4 py-3 text-xs text-text-sub">{validDate(entry.arrival_date)}</td>
                                    <td className="px-4 py-3 text-xs text-text-sub">{validDate(entry.due_date)}</td>
                                    <td className="px-4 py-3 text-xs text-text-sub text-center">{entry.credit_days || '-'}</td>
                                    <td className="px-4 py-3 text-xs text-text-main font-mono text-center">
                                        <span className="bg-background px-2 py-0.5 rounded border border-border">{entry.currency}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-sm text-text-main">
                                        ${entry.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-sm text-text-sub">
                                        ${entry.paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-sm font-bold text-text-main">
                                        ${entry.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${isCritical ? 'bg-danger/10 text-danger border border-danger/20' :
                                            isOverdue ? 'bg-warning/10 text-warning border border-warning/20' :
                                                'bg-success/10 text-success border border-success/20'
                                            }`}>
                                            {entry.days_since}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${entry.days_overdue > 0 ? 'text-danger' : 'text-success'
                                            }`}>
                                            {entry.days_overdue}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer Pagination */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-background/30">
                <div className="text-xs text-text-sub">
                    Showing <span className="font-bold">{startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredEntries.length)}</span> of <span className="font-bold">{filteredEntries.length}</span> documents
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded bg-background border border-border text-text-sub disabled:opacity-50 hover:bg-surface text-xs font-medium"
                    >
                        Previous
                    </button>
                    <span className="text-xs font-bold text-text-main">Page {currentPage} of {totalPages || 1}</span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="px-3 py-1 rounded bg-background border border-border text-text-sub disabled:opacity-50 hover:bg-surface text-xs font-medium"
                    >
                        Next
                    </button>
                </div>
            </div>

        </div>
    );
};

export default ReportsDetails;