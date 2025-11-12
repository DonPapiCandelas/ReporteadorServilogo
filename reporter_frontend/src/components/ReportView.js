// src/components/ReportView.js
import React from 'react';
import './ReportView.css';

// ¡Importamos las herramientas para las gráficas!
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
    currency: 'USD', // (Mostraremos el símbolo $, pero el valor es genérico)
  }).format(value);
};

// Componente principal del visualizador
function ReportView({ reportData }) {
  // reportData es el JSON gigante de tu API, 
  // ej: { data_by_currency: { "USD": {...}, "MXN": {...} } }

  // Extraemos las claves de las monedas (ej. ["USD", "MXN"])
  const currencies = Object.keys(reportData.data_by_currency);

  return (
    <div className="report-view-container">
      {currencies.map((currency) => {
        // Obtenemos los datos de esta moneda específica
        const data = reportData.data_by_currency[currency];

        // Pasamos los datos a nuestros sub-componentes
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
// (Esto crea una sección para USD, otra para MXN, etc.)
function CurrencySection({ currency, data }) {
  return (
    <div className="currency-section">
      <h2 className="currency-title">Summary for {currency}</h2>

      {/* 1. El Resumen de Antigüedad (Gráfica y Totales) */}
      <AgingSummary data={data.aging_summary} />

      {/* 2. La Tabla de Entradas (El detalle) */}
      <h3 className="table-title">Detailed Entries ({data.entries.length} items)</h3>
      <EntriesTable entries={data.entries} />
    </div>
  );
}

// --- Sub-Componente: Resumen de Antigüedad (¡La Gráfica!) ---
function AgingSummary({ data }) {
  // 'data' aquí es el objeto 'aging_summary': { "Cliente A": {...}, "Cliente B": {...} }

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
    // Valores iniciales
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
          '#22c55e', // Verde
          '#facc15', // Amarillo
          '#f97316', // Naranja
          '#ef4444', // Rojo
          '#b91c1c', // Rojo oscuro
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Accounts Receivable Aging Summary',
        font: { size: 16 }
      },
      tooltip: {
        callbacks: {
          label: (context) => formatCurrency(context.parsed.y)
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => formatCurrency(value)
        }
      }
    }
  };

  return (
    <div className="aging-summary">
      {/* El Total General */}
      <div className="total-balance-card">
        <span>Total Outstanding Balance</span>
        <strong>{formatCurrency(grandTotal.total_balance)}</strong>
      </div>

      {/* La Gráfica de Barras */}
      <div className="chart-container">
        <Bar options={chartOptions} data={chartData} />
      </div>
    </div>
  );
}

// --- Sub-Componente: Tabla de Entradas ---
function EntriesTable({ entries }) {
  return (
    <div className="table-container">
      <table className="entries-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Reference</th>
            <th>Doc</th>
            <th>Inv. Date</th>
            <th>Due Date</th>
            <th>Days</th>
            <th className="text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr key={`${entry.folio}-${index}`}>
              <td>{entry.customer_name}</td>
              <td>{entry.reference}</td>
              <td>{entry.module}</td>
              <td>{entry.invoice_date}</td>
              <td>{entry.due_date}</td>
              <td className="text-center">{entry.days_since}</td>
              <td className="text-right">{formatCurrency(entry.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ReportView;