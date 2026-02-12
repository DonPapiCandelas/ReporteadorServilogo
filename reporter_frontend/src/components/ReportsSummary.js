// src/components/ReportsSummary.js
import React, { useState } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    Treemap
} from 'recharts';
import StatCard from './Dashboard/StatCard';

// Colors for Pie Chart
const COLORS_PIE = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

// --- TREEMAP TILE COMPONENT ---
const CustomTreemapContent = (props) => {
    const { x, y, width, height, name, value, fill } = props;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: fill,
                    stroke: '#121921',
                    strokeWidth: 2,
                }}
            />
            {width > 35 && height > 25 && (
                <foreignObject x={x} y={y} width={width} height={height}>
                    <div style={{
                        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                        height: '100%', width: '100%', overflow: 'hidden', color: '#fff', textAlign: 'center', lineHeight: '1',
                        padding: '2px', wordBreak: 'break-word'
                    }}>
                        <span style={{ fontWeight: 'bold', fontSize: width > 80 ? '11px' : '10px', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{name}</span>
                        {width > 60 && height > 35 && (
                            <span style={{ fontSize: width > 80 ? '10px' : '9px', marginTop: '2px', opacity: 0.95 }}>
                                ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                        )}
                    </div>
                </foreignObject>
            )}
        </g>
    );
};

// --- CUSTOM TOOLTIP ---
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const value = data.value !== undefined ? data.value : data.originalAmount;
        const currency = data.currency || data.name;

        return (
            <div className="bg-surface border border-border p-2 rounded shadow-lg z-50">
                <p className="font-bold text-text-main text-xs mb-1">{data.name}</p>
                <p className="text-xs text-text-sub">
                    Balance: <b className="text-white">${value?.toLocaleString() || '0'}</b>
                    <span className="text-[10px] ml-1">({currency})</span>
                </p>
                {data.riskPct !== undefined && (
                    <p className={`text-[10px] font-bold mt-1 ${data.isRisky ? 'text-danger' : 'text-success'}`}>
                        {data.isRisky ? '⚠️ HIGH RISK' : '✅ GOOD STANDING'} ({data.riskPct}%)
                    </p>
                )}
            </div>
        );
    }
    return null;
};

const ReportsSummary = ({ reportData }) => {
    const [rates, setRates] = useState({ MXN: 1, USD: 20, CAD: 14.5, EUR: 21 });

    if (!reportData || !reportData.data_by_currency) return <div>Loading Summary...</div>;
    const currencies = Object.keys(reportData.data_by_currency);

    // --- 1. PIE CHART DATA ---
    const pieData = currencies.map(cur => {
        const amount = reportData.data_by_currency[cur].totals.balance;
        const rate = rates[cur] || 1;
        return { name: cur, originalAmount: amount, normalizedValue: amount * rate };
    });
    const totalNormalized = pieData.reduce((acc, item) => acc + item.normalizedValue, 0);

    // --- 2. TREEMAP DATA ---
    let allClients = [];


    currencies.forEach((cur) => {
        const group = reportData.data_by_currency[cur];

        // For Treemap
        const entries = Object.keys(group.aging_summary).map((c) => {
            const summary = group.aging_summary[c];
            const oldDebt = (summary.bucket_31_45 || 0) + (summary.bucket_45_plus || 0);
            const total = summary.total_balance || 1;
            const riskRatio = oldDebt / total;
            const isRisky = riskRatio > 0.40;

            return {
                name: c,
                value: summary.total_balance,
                currency: cur,
                riskPct: (riskRatio * 100).toFixed(0),
                isRisky: isRisky,
                fill: isRisky ? '#f43f5e' : '#10b981'
            };
        });
        const validEntries = entries.filter(e => e.value > 1);
        allClients = [...allClients, ...validEntries];

    });

    allClients.sort((a, b) => b.value - a.value);



    const treemapData = [{ name: 'Portfolio', children: allClients }];
    const handleRateChange = (cur, val) => setRates(prev => ({ ...prev, [cur]: parseFloat(val) || 0 }));

    return (
        <div className="space-y-6">

            {/* 1. INPUTS RATES */}
            <div className="bg-surface border border-border p-3 rounded-md flex items-center gap-4 flex-wrap">
                <span className="font-bold text-text-sub text-xs uppercase tracking-wider">Display Rates:</span>
                {currencies.map(cur => (
                    <div key={cur} className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-text-sub">{cur}:</label>
                        <input
                            type="number"
                            value={rates[cur]}
                            onChange={(e) => handleRateChange(cur, e.target.value)}
                            className="w-16 bg-background border border-border rounded px-2 py-1 text-[10px] text-text-main focus:border-primary outline-none"
                        />
                    </div>
                ))}
            </div>

            {/* 2. KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {currencies.map((cur, idx) => (
                    <div key={cur} className="h-32">
                        <StatCard
                            label={`Total AR (${cur})`}
                            value={`$${reportData.data_by_currency[cur].totals.balance.toLocaleString()}`}
                            color={['primary', 'success', 'warning', 'danger'][idx % 4]}
                        />
                    </div>
                ))}
            </div>

            {/* 3. TOP 10 CUSTOMERS & AGING BUCKETS */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* Top 10 Customers (Progress Bars) - ALL CURRENCIES */}
                {currencies.map((cur) => {
                    const group = reportData.data_by_currency[cur];
                    const customers = Object.keys(group.aging_summary).map(c => ({
                        name: c,
                        value: group.aging_summary[c].total_balance
                    })).sort((a, b) => b.value - a.value).slice(0, 5);

                    const maxVal = customers[0]?.value || 1;

                    return (
                        <div key={`top-${cur}`} className="bg-surface border border-border rounded-md p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-text-main uppercase text-sm tracking-wide">Top 5 Customers ({cur})</h3>
                                <button className="text-text-sub hover:text-primary"><span className="material-symbols-outlined text-lg">more_horiz</span></button>
                            </div>
                            <div className="space-y-4">
                                {customers.map((c, i) => (
                                    <div key={i} className="flex items-center gap-4 text-xs">
                                        <div className="w-32 text-right text-text-sub truncate font-medium" title={c.name}>{c.name}</div>
                                        <div className="flex-1 bg-background rounded-full h-3 overflow-hidden border border-border/50">
                                            <div
                                                className="bg-primary h-full rounded-full"
                                                style={{ width: `${(c.value / maxVal) * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="w-20 font-mono text-text-main text-right">${c.value.toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {/* Aging Buckets (Visual Bars) - ALL CURRENCIES */}
                {currencies.map((cur) => {
                    const group = reportData.data_by_currency[cur];
                    // Calculate bucket totals from aging_summary (sum across all customers)
                    let b0_21 = 0, b22_30 = 0, b31_45 = 0, b45_plus = 0;
                    if (group.aging_summary) {
                        Object.values(group.aging_summary).forEach(summary => {
                            b0_21 += summary.bucket_0_21 || 0;
                            b22_30 += summary.bucket_22_30 || 0;
                            b31_45 += summary.bucket_31_45 || 0;
                            b45_plus += summary.bucket_45_plus || 0;
                        });
                    }
                    const maxBucket = Math.max(b0_21, b22_30, b31_45, b45_plus) || 1;
                    const hasData = (b0_21 + b22_30 + b31_45 + b45_plus) > 0;
                    if (!hasData) return null;

                    return (
                        <div key={`aging-${cur}`} className="bg-surface border border-border rounded-md p-5 shadow-sm">
                            <h3 className="font-bold text-text-main uppercase text-sm tracking-wide mb-6">Aging Buckets ({cur})</h3>
                            <div className="flex items-end justify-between h-40 gap-2 px-2">
                                {/* 0-21 */}
                                <div className="flex flex-col items-center gap-2 group w-1/4 h-full justify-end">
                                    <div className="text-[10px] font-bold text-success opacity-0 group-hover:opacity-100 transition-opacity">${(b0_21 / 1000).toFixed(0)}k</div>
                                    <div className="w-full bg-background/50 rounded-t-lg relative h-32 border border-border/50 flex items-end">
                                        <div className="w-full bg-success hover:bg-success/80 transition-all rounded-t-lg" style={{ height: `${Math.max((b0_21 / maxBucket) * 100, 2)}%` }}></div>
                                    </div>
                                    <div className="text-[10px] font-bold text-text-sub">0-21</div>
                                </div>
                                {/* 22-30 */}
                                <div className="flex flex-col items-center gap-2 group w-1/4 h-full justify-end">
                                    <div className="text-[10px] font-bold text-warning opacity-0 group-hover:opacity-100 transition-opacity">${(b22_30 / 1000).toFixed(0)}k</div>
                                    <div className="w-full bg-background/50 rounded-t-lg relative h-32 border border-border/50 flex items-end">
                                        <div className="w-full bg-warning hover:bg-warning/80 transition-all rounded-t-lg" style={{ height: `${Math.max((b22_30 / maxBucket) * 100, 2)}%` }}></div>
                                    </div>
                                    <div className="text-[10px] font-bold text-text-sub">22-30</div>
                                </div>
                                {/* 31-45 */}
                                <div className="flex flex-col items-center gap-2 group w-1/4 h-full justify-end">
                                    <div className="text-[10px] font-bold text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">${(b31_45 / 1000).toFixed(0)}k</div>
                                    <div className="w-full bg-background/50 rounded-t-lg relative h-32 border border-border/50 flex items-end">
                                        <div className="w-full bg-orange-500 hover:bg-orange-400 transition-all rounded-t-lg" style={{ height: `${Math.max((b31_45 / maxBucket) * 100, 2)}%` }}></div>
                                    </div>
                                    <div className="text-[10px] font-bold text-text-sub">31-45</div>
                                </div>
                                {/* 45+ */}
                                <div className="flex flex-col items-center gap-2 group w-1/4 h-full justify-end">
                                    <div className="text-[10px] font-bold text-danger opacity-0 group-hover:opacity-100 transition-opacity">${(b45_plus / 1000).toFixed(0)}k</div>
                                    <div className="w-full bg-background/50 rounded-t-lg relative h-32 border border-border/50 flex items-end">
                                        <div className="w-full bg-danger hover:bg-danger/80 transition-all rounded-t-lg" style={{ height: `${Math.max((b45_plus / maxBucket) * 100, 2)}%` }}></div>
                                    </div>
                                    <div className="text-[10px] font-bold text-text-sub">45+</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>



            {/* 5. GIANT TREEMAP */}
            <div className="bg-surface border border-border rounded-md p-4 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-sub">Global Portfolio Risk Map</h3>
                        <p className="text-[10px] text-text-sub font-mono mt-0.5">All Customers</p>
                    </div>
                    <div className="flex gap-4 text-[10px]">
                        <span className="text-danger font-bold flex items-center gap-1"><span className="size-2 bg-danger rounded-sm"></span> High Risk (>40% Overdue)</span>
                        <span className="text-success font-bold flex items-center gap-1"><span className="size-2 bg-success rounded-sm"></span> Good Standing</span>
                    </div>
                </div>

                <div className="h-[500px] w-full">
                    <ResponsiveContainer>
                        <Treemap
                            data={treemapData}
                            dataKey="value"
                            stroke="#fff"
                            fill="#fff"
                            content={<CustomTreemapContent />}
                        >
                            <Tooltip content={<CustomTooltip />} />
                        </Treemap>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
};

export default ReportsSummary;