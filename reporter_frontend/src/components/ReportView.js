// src/components/ReportView.js
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Registramos los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Un 'helper' para formatear números como moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

// Componente principal del visualizador
function ReportView({ reportData }) {
  const currencies = Object.keys(reportData.data_by_currency);

  return (
    <div className="space-y-8">
      {currencies.map((currency) => {
        const data = reportData.data_by_currency[currency];
        return (
          <CurrencySection
            key={currency}
            currency={currency}
            data={data}
          />
        );
      })}
    </div>
  );
}

// --- Sub-Componente: Sección por Moneda ---
function CurrencySection({ currency, data }) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b border-border pb-2">
        Summary for {currency}
      </h2>

      {/* 1. El Resumen de Antigüedad (Gráfica y Totales) */}
      <AgingSummary data={data.aging_summary} />

      {/* 2. La Tabla de Entradas (El detalle) */}
      <h3 className="text-xs font-bold uppercase tracking-widest text-text-sub mt-6 mb-2">
        Detailed Entries ({data.entries.length} items)
      </h3>
      <EntriesTable entries={data.entries} />
    </div>
  );
}

// --- Sub-Componente: Resumen de Antigüedad (¡La Gráfica!) ---
function AgingSummary({ data }) {
  // 1. Sumamos los totales de todos los clientes
  const grandTotal = Object.values(data).reduce(
    (acc, summary) => {
      acc.total_balance += summary.total_balance;
      acc.not_yet_due += summary.not_yet_due;
      acc.bucket_0_21 += summary.bucket_0_21;
      acc.bucket_22_30 += summary.bucket_22_30;
      acc.bucket_31_45 += summary.bucket_31_45;
      acc.bucket_45_plus += summary.bucket_45_plus;
      return acc;
    },
    { total_balance: 0, not_yet_due: 0, bucket_0_21: 0, bucket_22_30: 0, bucket_31_45: 0, bucket_45_plus: 0 }
  );

  // 2. Preparamos los datos para el gráfico de barras
  const chartData = {
    labels: ['Not Yet Due', '0-21 Days', '22-30 Days', '31-45 Days', '45+ Days'],
    datasets: [
      {
        label: 'Balance by Aging',
        data: [
          grandTotal.not_yet_due,
          grandTotal.bucket_0_21,
          grandTotal.bucket_22_30,
          grandTotal.bucket_31_45,
          grandTotal.bucket_45_plus,
        ],
        backgroundColor: [
          '#10b981', // Success (Green)
          '#facc15', // Yellow
          '#f59e0b', // Warning (Orange)
          '#f43f5e', // Danger (Red)
          '#be123c', // Dark Red
        ],
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#121921',
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        borderColor: '#2d3a4b',
        borderWidth: 1,
        callbacks: {
          label: (context) => formatCurrency(context.parsed.y)
        }
      }
    },
    scales: {
      y: {
        grid: { color: '#2d3a4b' },
        ticks: {
          color: '#94a3b8',
          font: { size: 10, family: 'JetBrains Mono' },
          callback: (value) => formatCurrency(value)
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { size: 10, family: 'Inter' }
        }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* El Total General */}
      <div className="card-dense flex flex-col justify-center items-center md:col-span-1">
        <span className="text-[10px] uppercase tracking-wider text-text-sub font-bold mb-1">Total Outstanding Balance</span>
        <strong className="text-2xl font-mono text-primary">{formatCurrency(grandTotal.total_balance)}</strong>
      </div>

      {/* La Gráfica de Barras */}
      <div className="card-dense md:col-span-2 h-48">
        <Bar options={chartOptions} data={chartData} />
      </div>
    </div>
  );
}

// --- Sub-Componente: Tabla de Entradas ---
function EntriesTable({ entries }) {
  return (
    <div className="overflow-x-auto border border-border rounded-md">
      <table className="w-full mini-table">
        <thead className="bg-surface-lighter">
          <tr>
            <th className="px-3 py-2">Customer</th>
            <th className="px-3 py-2">Reference</th>
            <th className="px-3 py-2">Doc</th>
            <th className="px-3 py-2">Inv. Date</th>
            <th className="px-3 py-2">Due Date</th>
            <th className="px-3 py-2 text-center">Days</th>
            <th className="px-3 py-2 text-right">Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {entries.map((entry, index) => (
            <tr key={`${entry.folio}-${index}`} className="hover:bg-surface-lighter/50 transition-colors">
              <td className="px-3 py-1.5 text-text-main font-bold">{entry.customer_name}</td>
              <td className="px-3 py-1.5 text-text-sub">{entry.reference}</td>
              <td className="px-3 py-1.5 text-text-sub">{entry.module}</td>
              <td className="px-3 py-1.5 text-text-sub">{entry.invoice_date}</td>
              <td className="px-3 py-1.5 text-text-sub">{entry.due_date}</td>
              <td className={`px-3 py-1.5 text-center font-bold ${entry.days_since > 30 ? 'text-danger' : 'text-success'}`}>
                {entry.days_since}
              </td>
              <td className="px-3 py-1.5 text-right font-mono text-text-main">
                {formatCurrency(entry.balance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ReportView;