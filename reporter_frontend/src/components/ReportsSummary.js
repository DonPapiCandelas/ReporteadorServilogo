// src/components/ReportsSummary.js
import React, { useState } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
    Treemap
} from 'recharts';

// Colors for Pie Chart and Top 10
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
                    fill: fill, // Uses calculated color (Red/Green)
                    stroke: '#fff',
                    strokeWidth: 2,
                }}
            />
            {/* Show text only if it fits comfortably */}
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
        return (
            <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', color: '#333' }}>{data.name}</p>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Balance: <b>${data.value.toLocaleString()}</b> <span style={{ fontSize: '0.8em', color: '#666' }}>({data.currency})</span></p>
                {/* Risk Status */}
                {data.riskPct !== undefined && (
                    <p style={{ margin: '5px 0 0 0', fontWeight: 'bold', color: data.isRisky ? '#dc2626' : '#16a34a' }}>
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

    // --- 2. TREEMAP DATA (MOSAICS) ---
    // Collect ALL customers and calculate color logic HERE
    let allClients = [];
    currencies.forEach((cur) => {
        const group = reportData.data_by_currency[cur];

        const entries = Object.keys(group.aging_summary).map((c) => {
            const summary = group.aging_summary[c];

            // --- TRAFFIC LIGHT LOGIC ---
            const oldDebt = (summary.bucket_31_45 || 0) + (summary.bucket_45_plus || 0);
            const total = summary.total_balance || 1;
            const riskRatio = oldDebt / total;
            const isRisky = riskRatio > 0.40; // 40% Rule

            return {
                name: c,
                value: summary.total_balance,
                currency: cur,
                // Tooltip data
                riskPct: (riskRatio * 100).toFixed(0),
                isRisky: isRisky,
                // Assign FINAL color here
                fill: isRisky ? '#dc2626' : '#16a34a' // Red vs Green
            };
        });

        // Filter out negative or zero balances to prevent chart errors
        const validEntries = entries.filter(e => e.value > 1);
        allClients = [...allClients, ...validEntries];
    });

    // Sort by value so larger tiles appear top-left
    allClients.sort((a, b) => b.value - a.value);

    // Recharts Structure
    const treemapData = [{
        name: 'Portfolio',
        children: allClients
    }];

    const handleRateChange = (cur, val) => setRates(prev => ({ ...prev, [cur]: parseFloat(val) || 0 }));

    return (
        <div className="summary-container" style={{ display: 'flex', flexDirection: 'column', gap: '25px', padding: '10px' }}>

            {/* 1. INPUTS RATES */}
            <div style={{ background: '#f8fafc', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 'bold', color: '#475569', fontSize: '0.85rem' }}>Display Rates:</span>
                {currencies.map(cur => (
                    <div key={cur} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>{cur}:</label>
                        <input type="number" value={rates[cur]} onChange={(e) => handleRateChange(cur, e.target.value)} style={{ width: '50px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                    </div>
                ))}
            </div>

            {/* 2. KPI CARDS */}
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                {currencies.map((cur, idx) => (
                    <div key={cur} style={{
                        flex: 1, minWidth: '180px', background: 'white', padding: '15px 20px', borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: `4px solid ${COLORS_PIE[idx % COLORS_PIE.length]}`
                    }}>
                        <h4 style={{ margin: 0, color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Total AR ({cur})</h4>
                        <p style={{ margin: '5px 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                            ${reportData.data_by_currency[cur].totals.balance.toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>

            {/* 3. PIE + TOP 10 BARS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 500px))', gap: '20px', justifyContent: 'start' }}>

                {/* Pie Chart */}
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '10px', color: '#374151' }}>Currency Exposure</h3>
                    <div style={{ height: '250px', display: 'flex', alignItems: 'center' }}>
                        <ResponsiveContainer width="50%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="normalizedValue" paddingAngle={4}>
                                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />)}
                                </Pie>
                                <Tooltip formatter={(val, name, props) => [`$${props.payload.originalAmount.toLocaleString()}`, name]} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ width: '50%', fontSize: '0.75rem', paddingLeft: '10px' }}>
                            {pieData.map((item, index) => (
                                <div key={item.name} style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e5e7eb' }}>
                                    <span style={{ color: COLORS_PIE[index % COLORS_PIE.length], fontWeight: 'bold' }}>{item.name}</span>
                                    <div style={{ textAlign: 'right' }}>
                                        <span>{totalNormalized > 0 ? ((item.normalizedValue / totalNormalized) * 100).toFixed(1) : 0}%</span>
                                        <div style={{ color: '#9ca3af', fontSize: '0.7rem' }}>${item.originalAmount.toLocaleString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top 10 Bars */}
                {currencies.map((cur, idx) => {
                    const group = reportData.data_by_currency[cur];
                    const customers = Object.keys(group.aging_summary).map(c => ({
                        name: c.length > 15 ? c.substring(0, 15) + '...' : c,
                        fullName: c,
                        value: group.aging_summary[c].total_balance
                    })).sort((a, b) => b.value - a.value).slice(0, 10);

                    if (customers.length === 0) return null;

                    return (
                        <div key={cur} style={{ background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '10px', color: '#374151' }}>Top 10 Customers ({cur})</h3>
                            <div style={{ height: '250px' }}>
                                <ResponsiveContainer>
                                    <BarChart data={customers} layout="vertical" margin={{ left: 0, right: 35, bottom: 0, top: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fill: '#64748b' }} />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(val) => `$${val.toLocaleString()}`} />
                                        <Bar dataKey="value" fill={COLORS_PIE[idx % COLORS_PIE.length]} radius={[0, 4, 4, 0]} barSize={15}>
                                            <LabelList dataKey="value" position="right" formatter={(val) => `$${val.toLocaleString()}`} fontSize={9} fill="#64748b" />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* 4. GIANT TREEMAP (With Red/Green logic) */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '2px', color: '#374151' }}>Global Portfolio Risk Map</h3>
                        <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0 }}>All Customers</p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem' }}>
                        <span style={{ color: '#dc2626', fontWeight: 'bold' }}>■ High Risk (>40% Overdue)</span>
                        <span style={{ color: '#16a34a', fontWeight: 'bold' }}>■ Good Standing</span>
                    </div>
                </div>

                {/* 600px Height */}
                <div style={{ height: '600px', width: '100%' }}>
                    <ResponsiveContainer>
                        <Treemap
                            data={treemapData}
                            dataKey="value"
                            // ratio={4 / 3} // Removed ratio to let Recharts optimize fill
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