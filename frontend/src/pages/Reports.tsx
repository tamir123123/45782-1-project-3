import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { vacationsApi } from '../services/api';
import { ReportData } from '../types';
import './Reports.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await vacationsApi.getReport();
      setReportData(data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      await vacationsApi.downloadCSV();
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  };

  const chartData = {
    labels: reportData.map((item) => item.destination),
    datasets: [
      {
        label: 'Followers',
        data: reportData.map((item) => item.followersCount),
        backgroundColor: 'rgba(8, 145, 178, 0.7)',
        borderColor: 'rgba(8, 145, 178, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Vacations Report',
        font: {
          size: 20,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1>Vacations Report</h1>
        <div className="header-actions">
          <button className="btn-download" onClick={handleDownloadCSV}>
            📥 Download CSV
          </button>
          <button className="btn-back" onClick={() => navigate('/vacations')}>
            ← Back to Vacations
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading report...</div>
      ) : (
        <div className="chart-container">
          {reportData.length > 0 ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <div className="no-data">No data available</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
