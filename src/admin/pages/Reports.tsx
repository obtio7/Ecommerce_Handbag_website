import React, { useState, useCallback } from 'react';
import { FileText, Download, Calendar, Loader2, TrendingUp, Package, DollarSign, Users } from 'lucide-react';

interface ReportData {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    totalCustomers: number;
  };
  ordersByStatus: { status: string; count: number; revenue: number }[];
  topProducts: { productId: string; productName: string; unitsSold: number; revenue: number }[];
  dailyData: { date: string; orders: number; revenue: number }[];
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const Reports: React.FC = () => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const res = await fetch(`/api/admin/reports?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch report data');
      const data = await res.json();
      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load report');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  const downloadPdf = async () => {
    if (!reportData) return;
    setIsGeneratingPdf(true);
    try {
      const params = new URLSearchParams({ startDate, endDate, format: 'pdf' });
      const res = await fetch(`/api/admin/reports/download?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to generate PDF');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zarevielle-report-${startDate}-to-${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || 'Failed to download PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const downloadCsv = async () => {
    if (!reportData) return;
    try {
      const params = new URLSearchParams({ startDate, endDate, format: 'csv' });
      const res = await fetch(`/api/admin/reports/download?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to generate CSV');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zarevielle-report-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || 'Failed to download CSV');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-text-dark">Sales Reports</h1>
          <p className="text-sm text-text-dark/60 mt-1">Generate and download sales reports</p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-surface rounded-lg border border-border-tan p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-text-dark/70 mb-1.5">Start Date</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dark/40" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-9 pr-4 py-2 border border-border-tan rounded-md bg-white text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-dark/70 mb-1.5">End Date</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dark/40" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-9 pr-4 py-2 border border-border-tan rounded-md bg-white text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
          <button
            onClick={fetchReport}
            disabled={isLoading}
            className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            Generate Report
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Report Content */}
      {reportData && (
        <>
          {/* Download Buttons */}
          <div className="flex gap-3">
            <button
              onClick={downloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Download PDF
            </button>
            <button
              onClick={downloadCsv}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              Download CSV
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface rounded-lg p-5 border border-border-tan">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Package size={18} className="text-blue-600" />
                </div>
                <span className="text-xs font-medium text-text-dark/60 uppercase tracking-wide">Total Orders</span>
              </div>
              <p className="text-3xl font-serif text-text-dark">{reportData.summary.totalOrders}</p>
            </div>
            <div className="bg-surface rounded-lg p-5 border border-border-tan">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign size={18} className="text-green-600" />
                </div>
                <span className="text-xs font-medium text-text-dark/60 uppercase tracking-wide">Total Revenue</span>
              </div>
              <p className="text-3xl font-serif text-primary">{formatCurrency(reportData.summary.totalRevenue)}</p>
            </div>
            <div className="bg-surface rounded-lg p-5 border border-border-tan">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <TrendingUp size={18} className="text-purple-600" />
                </div>
                <span className="text-xs font-medium text-text-dark/60 uppercase tracking-wide">Avg Order Value</span>
              </div>
              <p className="text-3xl font-serif text-text-dark">{formatCurrency(reportData.summary.averageOrderValue)}</p>
            </div>
            <div className="bg-surface rounded-lg p-5 border border-border-tan">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Users size={18} className="text-orange-600" />
                </div>
                <span className="text-xs font-medium text-text-dark/60 uppercase tracking-wide">Unique Customers</span>
              </div>
              <p className="text-3xl font-serif text-text-dark">{reportData.summary.totalCustomers}</p>
            </div>
          </div>

          {/* Orders by Status */}
          <div className="bg-surface rounded-lg border border-border-tan overflow-hidden">
            <div className="px-5 py-4 border-b border-border-tan">
              <h3 className="text-base font-serif text-text-dark">Orders by Status</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="text-left px-5 py-3 font-medium text-text-dark/70">Status</th>
                    <th className="text-right px-5 py-3 font-medium text-text-dark/70">Orders</th>
                    <th className="text-right px-5 py-3 font-medium text-text-dark/70">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-tan">
                  {reportData.ordersByStatus.map((item) => (
                    <tr key={item.status} className="hover:bg-secondary/30">
                      <td className="px-5 py-3 text-text-dark capitalize">{item.status.replace(/-/g, ' ')}</td>
                      <td className="px-5 py-3 text-right text-text-dark">{item.count}</td>
                      <td className="px-5 py-3 text-right text-text-dark font-medium">{formatCurrency(item.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-surface rounded-lg border border-border-tan overflow-hidden">
            <div className="px-5 py-4 border-b border-border-tan">
              <h3 className="text-base font-serif text-text-dark">Top Selling Products</h3>
            </div>
            {reportData.topProducts.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-text-dark/50">
                No product sales data for this period
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/50">
                      <th className="text-left px-5 py-3 font-medium text-text-dark/70">Product</th>
                      <th className="text-right px-5 py-3 font-medium text-text-dark/70">Units Sold</th>
                      <th className="text-right px-5 py-3 font-medium text-text-dark/70">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-tan">
                    {reportData.topProducts.slice(0, 10).map((item, index) => (
                      <tr key={item.productId} className="hover:bg-secondary/30">
                        <td className="px-5 py-3 text-text-dark">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                              {index + 1}
                            </span>
                            {item.productName}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right text-text-dark">{item.unitsSold}</td>
                        <td className="px-5 py-3 text-right text-text-dark font-medium">{formatCurrency(item.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Daily Breakdown */}
          {reportData.dailyData.length > 0 && (
            <div className="bg-surface rounded-lg border border-border-tan overflow-hidden">
              <div className="px-5 py-4 border-b border-border-tan">
                <h3 className="text-base font-serif text-text-dark">Daily Breakdown</h3>
              </div>
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-secondary/80 backdrop-blur-sm">
                    <tr>
                      <th className="text-left px-5 py-3 font-medium text-text-dark/70">Date</th>
                      <th className="text-right px-5 py-3 font-medium text-text-dark/70">Orders</th>
                      <th className="text-right px-5 py-3 font-medium text-text-dark/70">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-tan">
                    {reportData.dailyData.map((item) => (
                      <tr key={item.date} className="hover:bg-secondary/30">
                        <td className="px-5 py-3 text-text-dark">{formatDate(item.date)}</td>
                        <td className="px-5 py-3 text-right text-text-dark">{item.orders}</td>
                        <td className="px-5 py-3 text-right text-text-dark font-medium">{formatCurrency(item.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!reportData && !isLoading && (
        <div className="bg-surface rounded-lg border border-border-tan p-12 text-center">
          <FileText size={48} className="mx-auto text-text-dark/20 mb-4" />
          <h3 className="text-lg font-serif text-text-dark mb-2">No Report Generated</h3>
          <p className="text-sm text-text-dark/60">Select a date range and click "Generate Report" to view sales data.</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
