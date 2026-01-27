import React from 'react';

const StatCard = ({ label, value, sparklineData, color = "primary" }) => {
    // Map color prop to Tailwind classes
    const colorClasses = {
        primary: "bg-primary",
        success: "bg-success",
        danger: "bg-danger",
        warning: "bg-warning"
    };

    return (
        <div className="card-dense flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
                <div>
                    <p className="data-label">{label}</p>
                    <p className="data-value">{value}</p>
                </div>
                <div className="text-right">
                    {/* Sparkline Simulation */}
                    <div className="sparkline-container mt-1">
                        {[...Array(5)].map((_, i) => {
                            // Random height for visual effect if no data provided
                            const heightClass = sparklineData ? `h-${sparklineData[i]}` : `h-${Math.floor(Math.random() * 4) + 2}`;
                            const isLast = i === 4;

                            // Tailwind doesn't support dynamic class names like h-${val} well without safelisting, 
                            // so we'll use inline styles for height to be safe.
                            const hPercent = sparklineData ? sparklineData[i] : (Math.random() * 60 + 20);

                            return (
                                <div
                                    key={i}
                                    className={`spark-bar ${isLast ? colorClasses[color] : colorClasses[color].replace('bg-', 'bg-opacity-40 bg-')}`}
                                    style={{ height: `${hPercent}%` }}
                                ></div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatCard;
