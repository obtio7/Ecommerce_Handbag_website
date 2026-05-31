import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, TrendingUp, Package, DollarSign, RefreshCw } from 'lucide-react';

interface ReportData {
  period: { start: string; end: string };
  summary: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    totalItemsSold: number;
  };
  ordersByStatus: { status: string; count: number }[];
  topProducts: { name: string; unitsSold: number; revenue: number }[];
  dailyBreakdown: { date: string; orders: number; revenue: number }[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const SalesReports: React.FC = () => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/admin/reports/sales?startDate=${startDate}&endDate=${endDate}`, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch report data');
      }
      
      const data = await res.json();
      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleGenerateReport = () => {
    fetchReport();
  };

  const handleDownloadCSV = () => {
    if (!reportData) return;
    
    // Generate CSV content
    let csv = 'Sales Report\n';
    csv += `Period: ${formatDate(reportData.period.start)} to ${formatDate(reportData.period.end)}\n\n`;
    
    csv += 'Summary\n';
    csv += `Total Orders,${reportData.summary.totalOrders}\n`;
    csv += `Total Revenue,${reportData.summary.totalRevenue}\n`;
    csv += `Average Order Value,${reportData.summary.averageOrderValue.toFixed(2)}\n`;
    csv += `Total Items Sold,${reportData.summary.totalItemsSold}\n\n`;
    
    csv += 'Orders by Status\n';
    csv += 'Status,Count\n';
    reportData.ordersByStatus.forEach(item => {
      csv += `${item.status},${item.count}\n`;
    });
    csv += '\n';
    
    csv += 'Top Products\n';
    csv += 'Product,Units Sold,Revenue\n';
    reportData.topProducts.forEach(item => {
      csv += `"${item.name}",${item.unitsSold},${item.revenue}\n`;
    });
    csv += '\n';
    
    csv += 'Daily Breakdown\n';
    csv += 'Date,Orders,Revenue\n';
    reportData.dailyBreakdown.forEach(item => {
      csv += `${item.date},${item.orders},${item.revenue}\n`;
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${startDate}-to-${endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    if (!reportData) return;
    
    setDownloading(true);
    
    try {
      const res = await fetch(`/api/admin/reports/sales/pdf?startDate=${startDate}&endDate=${endDate}`, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-report-${startDate}-to-${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      // Fallback: Generate a simple HTML-based printable report
      generatePrintableReport();
    } finally {
      setDownloading(false);
    }
  };

  const generatePrintableReport = () => {
    if (!reportData) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Sales Report - Zarevielle</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #5A5A40; font-size: 28px; margin-bottom: 8px; }
    h2 { color: #5A5A40; font-size: 18px; margin-top: 32px; border-bottom: 2px solid #5A5A40; padding-bottom: 8px; }
    .period { color: #666; font-size: 14px; margin-bottom: 32px; }
    .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 32px; }
    .summary-card { background: #FDFBF7; padding: 20px; border-radius: 8px; }
    .summary-card .label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
    .summary-card .value { font-size: 24px; color: #5A5A40; font-weight: bold; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { text-align: left; padding: 12px 8px; border-bottom: 2px solid #5A5A40; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888; }
    td { padding: 12px 8px; border-bottom: 1px solid #eee; font-size: 14px; }
    .text-right { text-align: right; }
    .footer { margin-top: 48px; text-align: center; color: #888; font-size: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>ZAREVIELLE</h1>
  <p class="period">Sales Report: ${formatDate(reportData.period.start)} — ${formatDate(reportData.period.end)}</p>
  
  <div class="summary-grid">
    <div class="summary-card">
      <div class="label">Total Orders</div>
      <div class="value">${reportData.summary.totalOrders}</div>
    </div>
    <div class="summary-card">
      <div class="label">Total Revenue</div>
      <div class="value">${formatCurrency(reportData.summary.totalRevenue)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Average Order Value</div>
      <div class="value">${formatCurrency(reportData.summary.averageOrderValue)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Items Sold</div>
      <div class="value">${reportData.summary.totalItemsSold}</div>
    </div>
  </div>
  
  <h2>Orders by Status</h2>
  <table>
    <thead>
      <tr>
        <th>Status</th>
        <th class="text-right">Count</th>
      </tr>
    </thead>
    <tbody>
      ${reportData.ordersByStatus.map(item => `
        <tr>
          <td>${item.status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td>
          <td class="text-right">${item.count}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <h2>Top Products</h2>
  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th class="text-right">Units Sold</th>
        <th class="text-right">Revenue</th>
      </tr>
    </thead>
    <tbody>
      ${reportData.topProducts.slice(0, 10).map(item => `
        <tr>
          <td>${item.name}</td>
          <td class="text-right">${item.unitsSold}</td>
          <td class="text-right">${formatCurrency(item.revenue)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <h2>Daily Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th class="text-right">Orders</th>
        <th class="text-right">Revenue</th>
      </tr>
    </thead>
    <tbody>
      ${reportData.dailyBreakdown.map(item => `
        <tr>
          <td>${formatDate(item.date)}</td>
          <td class="text-right">${item.orders}</td>
          <td class="text-right">${formatCurrency(item.revenue)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
    <p>© 2026 Zarevielle Studio. All Rights Reserved.</p>
  </div>
  
  <script>window.print();</script>
</body>
</html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-text-dark flex items-center gap-2">
            <FileText size={24} className="text-primary" />
            Sales Reports
          </h1>
          <p className="text-sm text-text-dark/60 mt-1">Generate and download sales reports</p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-surface rounded-lg border border-border-tan p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-text-dark/60 mb-1.5">Start Date</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dark/40" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-border-tan rounded-md bg-white text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-dark/60 mb-1.5">End Date</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dark/40" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-border-tan rounded-md bg-white text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <TrendingUp size={16} />}
            Generate Report
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading && !reportData && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="animate-spin text-primary" />
        </div>
      )}

      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface rounded-lg p-5 border border-border-tan">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Package size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-text-dark/60 uppercase tracking-wide">Total Orders</p>
                  <p className="text-2xl font-serif text-text-dark">{reportData.summary.totalOrders}</p>
                </div>
              </div>
            </div>
            <div className="bg-surface rounded-lg p-5 border border-border-tan">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-text-dark/60 uppercase tracking-wide">Total Revenue</p>
                  <p className="text-2xl font-serif text-primary">{formatCurrency(reportData.summary.totalRevenue)}</p>
                </div>
              </div>
            </div>
            <div className="bg-surface rounded-lg p-5 border border-border-tan">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-text-dark/60 uppercase tracking-wide">Avg Order Value</p>
                  <p className="text-2xl font-serif text-text-dark">{formatCurrency(reportData.summary.averageOrderValue)}</p>
                </div>
              </div>
            </div>
            <div className="bg-surface rounded-lg p-5 border border-border-tan">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Package size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-text-dark/60 uppercase tracking-wide">Items Sold</p>
                  <p className="text-2xl font-serif text-text-dark">{reportData.summary.totalItemsSold}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border-tan text-text-dark text-sm font-medium rounded-md hover:bg-secondary/50 transition-colors"
            >
              <Download size={16} />
              Download CSV
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {downloading ? <RefreshCw size={16} className="animate-spin" /> : <FileText size={16} />}
              Download PDF
            </button>
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders by Status */}
            <div className="bg-surface rounded-lg border border-border-tan overflow-hidden">
              <div className="px-5 py-4 border-b border-border-tan">
                <h3 className="text-base font-serif text-text-dark">Orders by Status</h3>
              </div>
              <div className="divide-y divide-border-tan">
                {reportData.ordersByStatus.map(item => (
                  <div key={item.status} className="px-5 py-3 flex items-center justify-between">
                    <span className="text-sm text-text-dark capitalize">{item.status.replace(/-/g, ' ')}</span>
                    <span className="text-sm font-medium text-text-dark">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-surface rounded-lg border border-border-tan overflow-hidden">
              <div className="px-5 py-4 border-b border-border-tan">
                <h3 className="text-base font-serif text-text-dark">Top Products</h3>
              </div>
              <div className="divide-y divide-border-tan">
                {reportData.topProducts.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-primary/10 rounded-full text-primary text-xs flex items-center justify-center font-medium">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-text-dark">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-text-dark">{formatCurrency(item.revenue)}</p>
                      <p className="text-xs text-text-dark/50">{item.unitsSold} units</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Daily Breakdown Table */}
          <div className="bg-surface rounded-lg border border-border-tan overflow-hidden">
            <div className="px-5 py-4 border-b border-border-tan">
              <h3 className="text-base font-serif text-text-dark">Daily Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="text-left px-5 py-3 font-medium text-text-dark/70">Date</th>
                    <th className="text-right px-5 py-3 font-medium text-text-dark/70">Orders</th>
                    <th className="text-right px-5 py-3 font-medium text-text-dark/70">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-tan">
                  {reportData.dailyBreakdown.map(item => (
                    <tr key={item.date} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-5 py-3 text-text-dark">{formatDate(item.date)}</td>
                      <td className="px-5 py-3 text-right text-text-dark">{item.orders}</td>
                      <td className="px-5 py-3 text-right text-text-dark font-medium">{formatCurrency(item.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesReports;
