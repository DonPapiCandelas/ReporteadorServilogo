// src/components/DashboardCharts.js
import React from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Treemap
} from 'recharts';
import './DashboardCharts.css'; // <--- IMPORTANTE: Importar el CSS

const COLORS_CURRENCY = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const CustomizedContent = (props) => {
    const { root, depth, x, y, width, height, index, name, value } = props;
    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: index < 3 ? '#ef4444' : '#3b82f6',
                    stroke: '#fff',
                    strokeWidth: 2 / (depth + 1e-10),
                    strokeOpacity: 1 / (depth + 1e-10),
                }}
            />
            {width > 50 && height > 30 && (
                <text x={x + width / 2} y={y + height / 2} textAnchor="middle" fill="#fff" fontSize={12}>
                    {name}
                </text>
            )}
            {width > 50 && height > 30 && (
                <text x={x + width / 2} y={y + height / 2 + 14} textAnchor="middle" fill="#fff" fontSize={10}>
                    ${value.toLocaleString()}
                </text>
            )}
        </g>
    );
};

const DashboardCharts = ({ reportData }) => {
    if (!reportData || !reportData.data_by_currency) return null;

    // Preparar datos (Igual que antes)
    const currencyData = Object.keys(reportData.data_by_currency).map(currencyCode => ({
        name: currencyCode,
        value: reportData.data_by_currency[currencyCode].totals.balance
    }));

    let allCustomers = [];
    Object.keys(reportData.data_by_currency).forEach(currency => {
        const group = reportData.data_by_currency[currency];
        const customers = Object.keys(group.aging_summary).map(custName => ({
            name: custName,
            balance: group.aging_summary[custName].total_balance,
            currency: currency
        }));
        allCustomers = [...allCustomers, ...customers];
    });
    allCustomers.sort((a, b) => b.balance - a.balance);
    const top10Data = allCustomers.slice(0, 10);

    return (
        <div className="dashboard-charts-container">

            {/* FILA SUPERIOR: DONA Y BARRAS */}
            <div className="charts-row">

                {/* GRÁFICA 1: DONA */}
                <div className="chart-card donut-card">
                    <h3 className="chart-title">Deuda por Moneda</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                            <Pie
                                data={currencyData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
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

                {/* GRÁFICA 2: BARRAS */}
                <div className="chart-card bar-card">
                    <h3 className="chart-title">Top 10 Clientes Deudores</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={top10Data} layout="vertical" margin={{ left: 10, right: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            <Bar dataKey="balance" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* FILA INFERIOR: TREEMAP */}
            <div className="treemap-card">
                <h3 className="chart-title" style={{ marginBottom: '5px' }}>Mapa de Deuda (Treemap)</h3>
                <p className="chart-subtitle">Los cuadros rojos son tus 3 deudores más grandes.</p>
                <ResponsiveContainer width="100%" height="85%">
                    <Treemap
                        data={top10Data}
                        dataKey="balance"
                        aspectRatio={4 / 1}
                        stroke="#fff"
                        content={<CustomizedContent />}
                    >
                        <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    </Treemap>
                </ResponsiveContainer>
            </div>

        </div>
    );
};

export default DashboardCharts;