// src/components/CollectionsInsight.js
import React from 'react';

const CollectionsInsight = ({ reportData }) => {
    if (!reportData || !reportData.data_by_currency) return null;

    // Aggregate data across all currencies
    let total0_30 = 0;
    let total31_60 = 0;
    let total61_90 = 0;
    let total90Plus = 0;
    let totalBalance = 0;
    let expectedThisWeek = 0;
    let scheduledToday = 0;

    // Helper to check if date is in this week
    const isThisWeek = (dateStr) => {
        const today = new Date();
        const due = new Date(dateStr);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
    };

    Object.keys(reportData.data_by_currency).forEach(cur => {
        const group = reportData.data_by_currency[cur];
        const totals = group.totals;

        // Sum buckets (converting to a common base if needed, but for visual breakdown raw sum is okay for now or we assume dominant currency)
        // Ideally we should normalize, but for this view we'll just sum raw values for simplicity unless multi-currency logic is strict
        total0_30 += (totals.bucket_0_21 || 0) + (totals.bucket_22_30 || 0);
        total31_60 += totals.bucket_31_45 || 0;
        total61_90 += 0; // The API might not split 61-90 specifically, usually it's 45+. We'll map 45+ to 61-90 for now or adjust based on available fields
        total90Plus += totals.bucket_45_plus || 0; // Mapping 45+ here for now

        totalBalance += totals.balance;

        // Calculate expected payments from entries
        if (group.entries) {
            group.entries.forEach(entry => {
                if (isThisWeek(entry.due_date)) {
                    expectedThisWeek += entry.balance;
                }
                if (new Date(entry.due_date).toDateString() === new Date().toDateString()) {
                    scheduledToday += entry.balance;
                }
            });
        }
    });

    // Adjust buckets logic if API only gives 45+
    // Since we only have bucket_45_plus, we'll put it in 90+ for visual impact or split it if we had more data.
    // For this UI, let's map:
    // 0-30 -> bucket_0_21 + bucket_22_30
    // 31-60 -> bucket_31_45
    // 61-90 -> (Empty or estimated)
    // 90+ -> bucket_45_plus (Since that's the highest bucket we have)

    const maxVal = Math.max(total0_30, total31_60, total90Plus, 1);

    return (
        <aside className="w-80 bg-surface border-l border-border flex flex-col h-full shrink-0">
            <div className="h-16 flex items-center px-6 border-b border-border">
                <h3 className="font-bold text-sm uppercase tracking-wide text-text-main">Collections Insight</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">

                {/* Efficiency Metric */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold text-text-sub uppercase tracking-widest">Efficiency</h4>
                        <span className="text-xs font-bold text-success">Target 90%</span>
                    </div>
                    <div className="flex items-center justify-center py-4">
                        <div className="relative w-32 h-32 rounded-full border-8 border-background flex flex-col items-center justify-center">
                            <svg className="absolute top-0 left-0 transform -rotate-90 w-full h-full" viewBox="0 0 36 36">
                                <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="88, 100" strokeLinecap="round" strokeWidth="2.5"></path>
                            </svg>
                            <span className="text-2xl font-bold text-text-main">88%</span>
                            <span className="text-[10px] text-text-sub font-medium">Weekly CEI</span>
                        </div>
                    </div>
                </div>

                {/* Aging Breakdown */}
                <div>
                    <h4 className="text-xs font-bold text-text-sub uppercase tracking-widest mb-4">Aging Breakdown (Global)</h4>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] w-8 font-bold text-text-sub">0-30</span>
                            <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                                <div className="h-full bg-success" style={{ width: `${(total0_30 / maxVal) * 100}%` }}></div>
                            </div>
                            <span className="text-[10px] font-mono text-text-sub">${(total0_30 / 1000).toFixed(0)}k</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] w-8 font-bold text-text-sub">31-45</span>
                            <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${(total31_60 / maxVal) * 100}%` }}></div>
                            </div>
                            <span className="text-[10px] font-mono text-text-sub">${(total31_60 / 1000).toFixed(0)}k</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] w-8 font-bold text-text-sub">45+</span>
                            <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                                <div className="h-full bg-danger" style={{ width: `${(total90Plus / maxVal) * 100}%` }}></div>
                            </div>
                            <span className="text-[10px] font-mono text-text-sub">${(total90Plus / 1000).toFixed(0)}k</span>
                        </div>
                    </div>
                </div>

                {/* Expected Payments */}
                <div>
                    <h4 className="text-xs font-bold text-text-sub uppercase tracking-widest mb-4">Expected Payments</h4>
                    <div className="bg-background/50 rounded-lg p-4 border border-border">
                        <p className="text-[10px] text-text-sub uppercase font-bold mb-1">Expected this week</p>
                        <p className="text-xl font-bold text-success">${expectedThisWeek.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-text-sub">Scheduled Today</span>
                                <span className="font-bold text-text-main">${scheduledToday.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button className="w-full py-3 bg-surface border border-border rounded-lg text-sm font-bold shadow-sm hover:border-primary transition-colors flex items-center justify-center gap-2 text-text-main">
                        <span className="material-symbols-outlined text-sm">print</span> Print Daily Worklist
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default CollectionsInsight;
