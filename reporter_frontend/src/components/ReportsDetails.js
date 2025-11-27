// src/components/ReportsDetails.js
import React from 'react';
import ReportView from './ReportView';

const ReportsDetails = ({ reportData }) => {
    if (!reportData) return null;

    return (
        <div className="details-container" style={{ padding: '10px' }}>

            {/* SOLO LA TABLA */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '15px', color: '#374151', fontWeight: '600' }}>
                    Detailed Transactions Ledger
                </h3>
                <ReportView reportData={reportData} />
            </div>

        </div>
    );
};

export default ReportsDetails;