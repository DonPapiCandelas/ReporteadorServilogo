// src/components/ReportsPage.js
import React, { useState } from 'react';
import axios from 'axios';
import ReportsFilter from './ReportsFilter';
import ReportView from './ReportView';


// Función genérica para manejar la descarga de archivos (¡sin cambios!)
const downloadFile = async (url, filters, defaultFilename) => {
  try {
    const response = await axios.post(
      url,
      filters,
      { responseType: 'blob' }
    );
    const contentDisposition = response.headers['content-disposition'];
    let filename = defaultFilename;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
      if (filenameMatch && filenameMatch.length === 2) {
        filename = filenameMatch[1];
      }
    }
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(new Blob([response.data]));
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(link.href);
    return null; // Éxito

  } catch (err) {
    console.error("Error downloading file:", err);
    if (err.response && err.response.data.type === 'application/json') {
       try {
          const errorJson = JSON.parse(await err.response.data.text());
          return errorJson.detail || "Error downloading file.";
       } catch (e) {
          return "An error occurred while downloading the file.";
       }
    } else {
       return "An error occurred while downloading the file.";
    }
  }
};

function ReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRunReport = async (filters) => {
    console.log("Running report preview with filters:", filters);
    setIsLoading(true);
    setError('');
    setReportData(null); 
    try {
      const response = await axios.post(
        '/api/reports/receivables-preview',
        filters
      );
      setReportData(response.data);
      setIsLoading(false);
    } catch (err) {
      console.error("Error running report:", err);
      if (err.response && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('An unknown error occurred while running the report.');
      }
      setIsLoading(false);
    }
  };

  const handleDownloadExcel = async (filters) => {
    setError('');
    const downloadError = await downloadFile(
      '/api/reports/receivables-download-excel',
      filters,
      "report.xlsx"
    );
    if (downloadError) setError(downloadError);
  };

  const handleDownloadPdf = async (filters) => {
    setError('');
    const downloadError = await downloadFile(
      '/api/reports/receivables-download-pdf',
      filters,
      "report.pdf"
    );
    if (downloadError) setError(downloadError);
  };

  // --- ¡NUEVA LÓGICA DE DESCARGA DE HTML! ---
  const handleDownloadHtml = async (filters) => {
    setError('');
    const downloadError = await downloadFile(
      '/api/reports/receivables-download-html',
      filters,
      "report.html"
    );
    if (downloadError) setError(downloadError);
  };

  return (
    <div className="reports-page-container">
      <h1>Accounts Receivable Aging</h1>

      {/* ¡Pasamos las CUATRO funciones! */}
      <ReportsFilter 
        onRunReport={handleRunReport} 
        onDownloadExcel={handleDownloadExcel}
        onDownloadPdf={handleDownloadPdf}
        onDownloadHtml={handleDownloadHtml}
      />

      <div className="report-content">
        {isLoading && (
          <div className="loading-message">Loading report data...</div>
        )}
        {error && (
          <div className="error-message">{error}</div>
        )}
        {reportData && (
          <ReportView reportData={reportData} />
        )}
      </div>
    </div>
  );
}

export default ReportsPage;