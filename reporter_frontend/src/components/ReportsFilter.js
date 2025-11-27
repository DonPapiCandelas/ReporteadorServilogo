// src/components/ReportsFilter.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';
import './ReportsFilter.css';

function ReportsFilter({ onRunReport, onDownloadExcel, onDownloadPdf, onDownloadHtml }) {
  const [asOfDate, setAsOfDate] = useState(new Date());
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get('/api/reports/filters/customers');
        const options = response.data.map(customer => ({
          value: customer.id,
          label: customer.name
        }));
        setCustomerOptions(options);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching customers:", err);
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const getFilters = () => {
    const formattedDate = format(asOfDate, 'yyyy-MM-dd');
    return {
      as_of: formattedDate,
      customer_id: selectedCustomer ? selectedCustomer.value : null,
      customer_name: selectedCustomer ? selectedCustomer.label : "(All Customers)"
    };
  };

  const handleRunClick = () => { onRunReport(getFilters()); };
  const handleDownloadExcelClick = () => { onDownloadExcel(getFilters()); };
  const handleDownloadPdfClick = () => { onDownloadPdf(getFilters()); };
  const handleDownloadHtmlClick = () => { onDownloadHtml(getFilters()); };

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label htmlFor="asOfDate">Cut-off Date</label>
        <DatePicker
          id="asOfDate"
          selected={asOfDate}
          onChange={(date) => setAsOfDate(date)}
          dateFormat="MM/dd/yyyy"
          className="date-picker"
        />
      </div>

      <div className="filter-group filter-group-customer">
        <label htmlFor="customer">Customer (Optional)</label>
        <Select
          id="customer"
          options={customerOptions}
          onChange={setSelectedCustomer}
          value={selectedCustomer}
          isLoading={isLoading}
          isClearable={true}
          isSearchable={true}
          placeholder={isLoading ? "Loading..." : "Select Customer..."}
          className="customer-select"
          classNamePrefix="select"
        />
      </div>

      <div className="button-group">
        <button onClick={handleRunClick} className="run-report-button">
          Generate Report
        </button>
        <button onClick={handleDownloadExcelClick} className="download-button excel" title="Download Excel">
          XLSX
        </button>
        <button onClick={handleDownloadPdfClick} className="download-button pdf" title="Download PDF">
          PDF
        </button>
        <button onClick={handleDownloadHtmlClick} className="download-button html" title="Download HTML">
          HTML
        </button>
      </div>
    </div>
  );
}

export default ReportsFilter;