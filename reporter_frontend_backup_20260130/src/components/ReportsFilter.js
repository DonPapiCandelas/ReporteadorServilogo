// src/components/ReportsFilter.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';

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

  // Custom Styles for React Select
  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: '#0a0f14', // bg-background
      borderColor: '#2d3a4b', // border-border
      color: '#e2e8f0', // text-main
      minHeight: '38px',
      fontSize: '0.875rem',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: '#121921', // bg-surface
      border: '1px solid #2d3a4b',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#1e2936' : '#121921',
      color: '#e2e8f0',
      fontSize: '0.875rem',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#e2e8f0',
    }),
    input: (provided) => ({
      ...provided,
      color: '#e2e8f0',
    }),
  };

  return (
    <div className="flex flex-col md:flex-row items-end gap-4">
      <div className="w-full md:w-auto">
        <label htmlFor="asOfDate" className="block text-[10px] font-bold text-text-sub uppercase tracking-wider mb-1">Cut-off Date</label>
        <div className="relative">
          <DatePicker
            id="asOfDate"
            selected={asOfDate}
            onChange={(date) => setAsOfDate(date)}
            dateFormat="MM/dd/yyyy"
            className="w-full md:w-32 bg-background border border-border rounded px-3 py-2 text-sm text-text-main focus:border-primary outline-none"
          />
        </div>
      </div>

      <div className="w-full md:w-64">
        <label htmlFor="customer" className="block text-[10px] font-bold text-text-sub uppercase tracking-wider mb-1">Customer (Optional)</label>
        <Select
          id="customer"
          options={customerOptions}
          onChange={setSelectedCustomer}
          value={selectedCustomer}
          isLoading={isLoading}
          isClearable={true}
          isSearchable={true}
          placeholder={isLoading ? "Loading..." : "Select Customer..."}
          styles={customSelectStyles}
        />
      </div>

      <div className="flex gap-2 mt-4 md:mt-0 flex-wrap">
        <button onClick={handleRunClick} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded transition-colors shadow-lg shadow-primary/20">
          Generate Report
        </button>
        <button onClick={handleDownloadExcelClick} className="px-3 py-2 bg-success hover:bg-success/80 text-white text-xs font-bold rounded transition-colors" title="Download Excel">
          XLSX
        </button>
        <button onClick={handleDownloadPdfClick} className="px-3 py-2 bg-danger hover:bg-danger/80 text-white text-xs font-bold rounded transition-colors" title="Download PDF">
          PDF
        </button>
        <button onClick={handleDownloadHtmlClick} className="px-3 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded transition-colors" title="Download HTML">
          HTML
        </button>
      </div>
    </div>
  );
}

export default ReportsFilter;