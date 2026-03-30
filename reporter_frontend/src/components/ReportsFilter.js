// src/components/ReportsFilter.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, startOfMonth, endOfMonth } from 'date-fns';

function ReportsFilter({ onRunReport, onDownloadExcel, onDownloadPdf, onDownloadHtml }) {
  // Filter Mode: 'to_date', 'date_range'
  const [filterMode, setFilterMode] = useState('to_date');

  // Date States
  const [asOfDate, setAsOfDate] = useState(new Date()); // For "To Date" mode
  const [startDate, setStartDate] = useState(startOfMonth(new Date())); // For "Date Range" (Days)
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));   // For "Date Range" (Days)

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
    const filters = {
      customer_id: selectedCustomer ? selectedCustomer.value : null,
      customer_name: selectedCustomer ? selectedCustomer.label : "(All Customers)",
      filter_mode: 'to_date', // Default
      as_of: format(new Date(), 'yyyy-MM-dd')
    };

    if (filterMode === 'to_date') {
      filters.filter_mode = 'to_date';
      filters.end_date = format(asOfDate, 'yyyy-MM-dd');
      filters.as_of = filters.end_date;
      filters.start_date = null;
    } else if (filterMode === 'date_range') {
      filters.filter_mode = 'date_range';
      filters.start_date = format(startDate, 'yyyy-MM-dd');
      filters.end_date = format(endDate, 'yyyy-MM-dd');
      filters.as_of = filters.end_date;
    }
    return filters;
  };

  const handleRunClick = () => { onRunReport(getFilters()); };
  const handleDownloadExcelClick = () => { onDownloadExcel(getFilters()); };
  const handleDownloadPdfClick = () => { onDownloadPdf(getFilters()); };
  const handleDownloadHtmlClick = () => { onDownloadHtml(getFilters()); };

  // Custom Styles for React Select
  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: 'rgb(var(--color-background))',
      borderColor: 'rgb(var(--color-border))',
      color: 'rgb(var(--color-text-main))',
      minHeight: '38px',
      fontSize: '0.875rem',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'rgb(var(--color-surface))',
      border: '1px solid rgb(var(--color-border))',
      zIndex: 50 // Ensure high z-index
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? 'rgb(var(--color-surface-lighter))' : 'rgb(var(--color-surface))',
      color: 'rgb(var(--color-text-main))',
      fontSize: '0.875rem',
      cursor: 'pointer',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'rgb(var(--color-text-main))',
    }),
    input: (provided) => ({
      ...provided,
      color: 'rgb(var(--color-text-main))',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'rgb(var(--color-text-sub))',
    }),
  };

  const modeOptions = [
    { value: 'to_date', label: 'Cut-off Date' },
    { value: 'date_range', label: 'Date Range' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row items-end gap-4 w-full">

        {/* Filter Mode */}
        <div className="w-full md:w-48">
          <label className="block text-[10px] font-bold text-text-sub uppercase tracking-wider mb-1">Filter Mode</label>
          <Select
            options={modeOptions}
            value={modeOptions.find(o => o.value === filterMode)}
            onChange={(opt) => setFilterMode(opt.value)}
            styles={customSelectStyles}
            isSearchable={false}
          />
        </div>

        {filterMode === 'to_date' && (
          <div className="w-full md:w-auto">
            <label className="block text-[10px] font-bold text-text-sub uppercase tracking-wider mb-1">Cut-off Date (To)</label>
            <DatePicker
              selected={asOfDate}
              onChange={(date) => setAsOfDate(date)}
              dateFormat="MM/dd/yyyy"
              className="w-full md:w-32 bg-background border border-border rounded px-3 py-2 text-sm text-text-main focus:border-primary outline-none"
            />
          </div>
        )}

        {filterMode === 'date_range' && (
          <div className="flex items-center gap-2">
            <div>
              <label className="block text-[10px] font-bold text-text-sub uppercase tracking-wider mb-1">From</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                dateFormat="MM/dd/yyyy"
                selectsStart
                startDate={startDate}
                endDate={endDate}
                className="w-28 bg-background border border-border rounded px-3 py-2 text-sm text-text-main focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-sub uppercase tracking-wider mb-1">To</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                dateFormat="MM/dd/yyyy"
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                className="w-28 bg-background border border-border rounded px-3 py-2 text-sm text-text-main focus:border-primary outline-none"
              />
            </div>
          </div>
        )}

        {/* Customer Select */}
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
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={handleRunClick} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded transition-colors shadow-lg shadow-primary/20">
          Generate Report
        </button>
        <div className="h-8 w-px bg-border mx-2"></div>
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