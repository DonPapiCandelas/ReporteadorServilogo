// src/components/ReportsPage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import MainLayout from './MainLayout';
import ReportsFilter from './ReportsFilter';
import ReportsSummary from './ReportsSummary';
import ReportsDetails from './ReportsDetails';

const downloadFile = async (url, filters, defaultFilename) => {
  try {
    const response = await axios.post(url, filters, { responseType: 'blob' });
    const contentDisposition = response.headers['content-disposition'];
    let filename = defaultFilename;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="([^"]+)"/);
      if (match && match.length === 2) filename = match[1];
    }
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(new Blob([response.data]));
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    return null;
  } catch (err) {
    console.error("Download error:", err);
    return "Error downloading file.";
  }
};

function ReportsPage() {
  const { companyKey } = useAuth();
  // Datos GLOBALES (Nunca cambian con el filtro manual)
  const [globalSummaryData, setGlobalSummaryData] = useState(null);

  // Datos FILTRADOS (Solo para Detalles)
  const [filteredReportData, setFilteredReportData] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary');

  // AL CARGAR: Obtener datos globales de TODOS los clientes
  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const globalFilters = { as_of: today, customer_id: null, customer_name: 'All' };
        const response = await axios.post('/api/reports/receivables-preview', globalFilters);
        setGlobalSummaryData(response.data);
      } catch (e) {
        console.error("Error fetching global summary", e);
      }
    };
    fetchGlobalData();
  }, [companyKey]); // Re-fetch when company changes

  // AL FILTRAR: Solo actualizar datos de DETALLES
  const handleRunReport = async (filters) => {
    setIsLoading(true);
    setError('');
    setFilteredReportData(null);

    // Cambiar a pestaña Detalles automáticamente para ver el resultado
    if (activeTab === 'summary') setActiveTab('details');

    try {
      const response = await axios.post('/api/reports/receivables-preview', filters);
      setFilteredReportData(response.data);
      setIsLoading(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error running report');
      setIsLoading(false);
    }
  };

  const handleDownloadExcel = (filters) => downloadFile('/api/reports/receivables-download-excel', filters, "report.xlsx");
  const handleDownloadPdf = (filters) => downloadFile('/api/reports/receivables-download-pdf', filters, "report.pdf");
  const handleDownloadHtml = (filters) => downloadFile('/api/reports/receivables-download-html', filters, "report.html");

  return (
    <MainLayout title="Accounts Receivable">

      {/* Filters Section */}
      <div className="bg-surface border border-border rounded-md p-4 mb-4 shadow-sm">
        <ReportsFilter
          onRunReport={handleRunReport}
          onDownloadExcel={handleDownloadExcel}
          onDownloadPdf={handleDownloadPdf}
          onDownloadHtml={handleDownloadHtml}
        />
      </div>

      <div className="report-content">
        {isLoading && <div className="text-center p-4 text-primary font-mono animate-pulse">Loading data...</div>}
        {error && <div className="text-danger p-2 border border-danger/20 bg-danger/10 rounded mb-4">{error}</div>}

        {/* TABS */}
        <div className="flex items-center bg-surface border border-border p-1 rounded-md w-fit mb-4">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-1.5 text-[11px] font-bold rounded-[4px] transition-colors uppercase tracking-wider ${activeTab === 'summary'
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-sub hover:text-white'
              }`}
          >
            Global Summary
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-1.5 text-[11px] font-bold rounded-[4px] transition-colors uppercase tracking-wider ${activeTab === 'details'
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-sub hover:text-white'
              }`}
          >
            Detailed Search
          </button>
        </div>

        {/* CONTENT */}
        {activeTab === 'summary' && (
          /* Siempre usa globalSummaryData */
          globalSummaryData ? (
            <ReportsSummary reportData={globalSummaryData} />
          ) : (
            <div className="p-4 text-text-sub font-mono text-sm">Loading Global Summary...</div>
          )
        )}

        {activeTab === 'details' && (
          /* Usa filteredReportData */
          filteredReportData ? (
            <ReportsDetails reportData={filteredReportData} />
          ) : (
            <div className="p-8 text-center border border-dashed border-border rounded-lg">
              <p className="text-text-sub text-sm">Use the filters above and click "Generate Report" to see specific details.</p>
            </div>
          )
        )}
      </div>

    </MainLayout>
  );
}

export default ReportsPage;