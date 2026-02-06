// components/EarningsChart.js
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function EarningsChart({ monthlyData }) {
    if (!monthlyData || monthlyData.length === 0) {
        return (
            <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px dashed #cbd5e1'
            }}>
                <p style={{ color: '#94a3b8', margin: 0 }}>No earnings data yet</p>
                <p style={{ color: '#cbd5e1', fontSize: '14px', marginTop: '8px' }}>
                    Complete some lessons to see your earnings chart
                </p>
            </div>
        );
    }

    // Format month labels (e.g., "2026-02" → "Feb 2026")
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const labels = monthlyData.map(item => {
        const [year, month] = item.month.split('-');
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    });

    const amounts = monthlyData.map(item => item.amount);

    const data = {
        labels,
        datasets: [
            {
                label: 'Monthly Earnings (£)',
                data: amounts,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: '#0f172a',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                borderColor: '#1e293b',
                borderWidth: 1,
                displayColors: false,
                callbacks: {
                    label: function (context) {
                        return `£${context.parsed.y.toFixed(2)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: '#f1f5f9',
                    drawBorder: false
                },
                ticks: {
                    color: '#64748b',
                    callback: function (value) {
                        return '£' + value;
                    }
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#64748b'
                }
            }
        }
    };

    return (
        <div style={{ height: '300px', width: '100%' }}>
            <Line data={data} options={options} />
        </div>
    );
}
