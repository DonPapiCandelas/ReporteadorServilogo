// src/components/ReportsPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import Layout from './Layout';
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
  }, []);

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
    <Layout title="Accounts Receivable">

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <ReportsFilter
          onRunReport={handleRunReport}
          onDownloadExcel={handleDownloadExcel}
          onDownloadPdf={handleDownloadPdf}
          onDownloadHtml={handleDownloadHtml}
        />
      </div>

      <div className="report-content">
        {isLoading && <div className="loading-message" style={{ padding: '20px', textAlign: 'center' }}>Loading data...</div>}
        {error && <div className="error-message" style={{ color: 'red', padding: '10px' }}>{error}</div>}

        {/* TABS */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('summary')}
            style={{
              padding: '12px 24px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold',
              borderBottom: activeTab === 'summary' ? '3px solid #2563eb' : '3px solid transparent',
              color: activeTab === 'summary' ? '#2563eb' : '#6b7280',
            }}
          >
            Global Summary
          </button>
          <button
            onClick={() => setActiveTab('details')}
            style={{
              padding: '12px 24px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold',
              borderBottom: activeTab === 'details' ? '3px solid #2563eb' : '3px solid transparent',
              color: activeTab === 'details' ? '#2563eb' : '#6b7280',
            }}
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
            <div style={{ padding: 20 }}>Loading Global Summary...</div>
          )
        )}

        {activeTab === 'details' && (
          /* Usa filteredReportData */
          filteredReportData ? (
            <ReportsDetails reportData={filteredReportData} />
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
              Use the filters above and click "Generate Report" to see specific details.
            </div>
          )
        )}
      </div>

    </Layout>
  );
}

export default ReportsPage;