// src/components/DashboardCharts.js
import React from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Treemap
} from 'recharts';
import './DashboardCharts.css';

const COLORS_CURRENCY = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// --- COMPONENTE DE LA TARJETA (Los cuadros) ---
const CustomizedTreemapContent = (props) => {
    const { x, y, width, height, name, value } = props;

    // --- PRUEBA DE DEBUG: TODO ROJO ---
    // Si ves esto rojo, los cambios SI se están aplicando.
    const fillColor = '#ff0000';
    const strokeColor = '#ffffff';

    // Solo mostramos texto si el cuadro es suficientemente grande
    const showText = width > 35 && height > 35;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx={4}
                ry={4}
                style={{
                    fill: fillColor, // <--- AQUÍ ESTÁ EL ROJO FORZADO
                    stroke: strokeColor,
                    strokeWidth: 2,
                }}
            />
            {showText && (
                <text
                    x={x + width / 2}
                    y={y + height / 2 - 6}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={12}
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                >
                    {name.length > 10 ? name.substring(0, 10) + '..' : name}
                </text>
            )}
            {showText && (
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 12}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.9)"
                    fontSize={11}
                    style={{ pointerEvents: 'none' }}
                >
                    ${value ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}
                </text>
            )}
        </g>
    );
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                <p style={{ fontWeight: 'bold', margin: 0, color: 'red' }}>MODO PRUEBA (TODO ROJO)</p>
                <p style={{ fontWeight: 'bold', margin: 0 }}>{data.name}</p>
                <p style={{ margin: 0 }}>Total Debt: <b>${data.value.toLocaleString()}</b></p>
            </div>
        );
    }
    return null;
};

const DashboardCharts = ({ reportData }) => {
    if (!reportData || !reportData.data_by_currency) return null;

    const currencyData = Object.keys(reportData.data_by_currency).map(currencyCode => ({
        name: currencyCode,
        value: reportData.data_by_currency[currencyCode].totals.balance
    }));

    let allCustomers = [];
    Object.keys(reportData.data_by_currency).forEach(currency => {
        const group = reportData.data_by_currency[currency];
        Object.entries(group.aging_summary).forEach(([custName, summary]) => {
            if (summary.total_balance > 1) {
                allCustomers.push({
                    name: custName,
                    value: summary.total_balance,
                    bucket_31_45: summary.bucket_31_45,
                    bucket_45_plus: summary.bucket_45_plus,
                });
            }
        });
    });

    allCustomers.sort((a, b) => b.value - a.value);
    const treemapData = allCustomers.slice(0, 30);
    const top10Data = allCustomers.slice(0, 10);

    return (
        <div className="dashboard-charts-container">
            <div className="charts-row">
                <div className="chart-card donut-card">
                    <h3 className="chart-title">By Currency</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                            <Pie
                                data={currencyData}
                                cx="50%" cy="50%"
                                innerRadius={50} outerRadius={70}
                                paddingAngle={5} dataKey="value"
                            >
                                {currencyData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS_CURRENCY[index % COLORS_CURRENCY.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card bar-card">
                    <h3 className="chart-title">Top 10 Debtors</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={top10Data} layout="vertical" margin={{ left: 5, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={15} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* TREEMAP - ZONA DE PRUEBAS */}
            <div className="treemap-card" style={{ height: '500px', padding: '10px' }}>
                <h3 className="chart-title" style={{ color: 'red' }}>Mapa de Riesgo (PRUEBA DE COLOR)</h3>

                <ResponsiveContainer width="100%" height="85%">
                    <Treemap
                        data={treemapData}
                        dataKey="value"
                        stroke="#fff"
                        fill="#fff"
                        isAnimationActive={false}
                        content={<CustomizedTreemapContent />}
                    >
                        <Tooltip content={<CustomTooltip />} />
                    </Treemap>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default DashboardCharts;