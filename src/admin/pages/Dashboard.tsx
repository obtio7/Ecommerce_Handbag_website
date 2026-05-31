import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, TrendingUp, Package, ShoppingCart, DollarSign, Users } from 'lucide-react';

interface AnalyticsData {
  ordersPlaced: number;
  ordersShipped: number;
  totalTransactions: number;
  totalRevenue: number;
  perProductRevenue: { productId: string; productName: string; amount: number; unitsSold: number }[];
  dailyTrend: { date: string; orders: number; revenue: number }[];
  lowStockProducts?: { _id: string; name: string; totalStock: number; variants: { color: string; stock: number }[] }[];
  recentOrders?: { _id: string; customerEmail: string; totalAmount: number; status: string; createdAt: string }[];
  totalCustomers?: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function getDefaultDates() {
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  const endDate = startDate;
  return { startDate, endDate };
}

/** Simple SVG polyline chart component */
function LineChart({
  data,
  dataKey,
  label,
  color,
  formatValue,
}: {
  data: { date: string; [key: string]: any }[];
  dataKey: string;
  label: string;
  color: string;
  formatValue: (v: number) => string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-text-dark/50 text-sm">
        No data available for this range
      </div>
    );
  }

  const values = data.map((d) => d[dataKey] as number);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  const width = 400;
  const height = 160;
  const padding = { top: 20, right: 20, bottom: 30, left: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = padding.left + (data.length === 1 ? chartWidth / 2 : (i / (data.length - 1)) * chartWidth);
    const y = padding.top + chartHeight - ((values[i] - minVal) / range) * chartHeight;
    return `${x},${y}`;
  });

  const polylinePoints = points.join(' ');

  // Create area fill path
  const firstX = padding.left + (data.length === 1 ? chartWidth / 2 : 0);
  const lastX = padding.left + (data.length === 1 ? chartWidth / 2 : chartWidth);
  const bottomY = padding.top + chartHeight;
  const areaPath = `M ${firstX},${bottomY} L ${points.map((p) => p).join(' L ')} L ${lastX},${bottomY} Z`;

  return (
    <div className="w-full">
      <h4 className="text-sm font-medium text-text-dark/70 mb-2">{label}</h4>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label={`${label} chart`}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = padding.top + chartHeight - frac * chartHeight;
          return (
            <line
              key={frac}
              x1={padding.left}
              y1={y}
              x2={padding.left + chartWidth}
              y2={y}
              stroke="#D6C9B0"
              strokeWidth="0.5"
              strokeDasharray="4,4"
            />
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill={color} opacity="0.1" />

        {/* Line */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, i) => {
          const [cx, cy] = point.split(',').map(Number);
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r="3" fill={color} />
              <title>{`${formatDate(data[i].date)}: ${formatValue(values[i])}`}</title>
            </g>
          );
        })}

        {/* X-axis labels (show first, middle, last) */}
        {data.length > 0 && (
          <>
            <text
              x={padding.left}
              y={height - 5}
              fontSize="9"
              fill="#5A5A40"
              textAnchor="start"
            >
              {formatDate(data[0].date)}
            </text>
            {data.length > 2 && (
              <text
                x={padding.left + chartWidth / 2}
                y={height - 5}
                fontSize="9"
                fill="#5A5A40"
                textAnchor="middle"
              >
                {formatDate(data[Math.floor(data.length / 2)].date)}
              </text>
            )}
            {data.length > 1 && (
              <text
                x={padding.left + chartWidth}
                y={height - 5}
                fontSize="9"
                fill="#5A5A40"
                textAnchor="end"
              >
                {formatDate(data[data.length - 1].date)}
              </text>
            )}
          </>
        )}

        {/* Y-axis labels */}
        <text x={padding.left} y={padding.top - 5} fontSize="9" fill="#5A5A40" textAnchor="start">
          {formatValue(maxVal)}
        </text>
        <text x={padding.left} y={padding.top + chartHeight + 2} fontSize="9" fill="#5A5A40" textAnchor="start">
          {formatValue(minVal)}
        </text>
      </svg>
    </div>
  );
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(getDefaultDates().startDate);
  const [endDate, setEndDate] = useState(getDefaultDates().endDate);

  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/admin/analytics?${params.toString()}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch analytics (${res.status})`);
      }

      const analyticsData: AnalyticsData = await res.json();
      setData(analyticsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  // Initial fetch and auto-refresh every 60 seconds
  useEffect(() => {
    fetchAnalytics();

    const interval = setInterval(() => {
      fetchAnalytics();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchAnalytics();
  };

  // Validate max 90-day range
  const validateDateRange = (start: string, end: string): boolean => {
    if (!start || !end) return true;
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= 90 && diffDays >= 0;
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (!validateDateRange(value, endDate)) {
      // Auto-adjust end date to be within 90 days
      const maxEnd = new Date(new Date(value).getTime() + 90 * 24 * 60 * 60 * 1000);
      setEndDate(maxEnd.toISOString().split('T')[0]);
    }
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    if (!validateDateRange(startDate, value)) {
      // Auto-adjust start date to be within 90 days
      const minStart = new Date(new Date(value).getTime() - 90 * 24 * 60 * 60 * 1000);
      setStartDate(minStart.toISOString().split('T')[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-text-dark">Dashboard</h1>
          <p className="text-sm text-text-dark/60 mt-1">Analytics overview</p>
        </div>

        {/* Date range picker */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="px-3 py-2 text-sm border border-border-tan rounded-md bg-white text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            aria-label="Start date"
          />
          <span className="text-text-dark/50 text-sm">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="px-3 py-2 text-sm border border-border-tan rounded-md bg-white text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            aria-label="End date"
          />
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && !data && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <svg
              className="animate-spin h-8 w-8 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm text-text-dark/60">Loading analytics...</span>
          </div>
        </div>
      )}

      {/* Dashboard content */}
      {data && (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Orders Placed */}
            <div className="bg-surface rounded-lg p-5 border border-border-tan card-shadow">
              <p className="text-xs font-medium text-text-dark/60 uppercase tracking-wide">
                Orders Placed
              </p>
              <p className="mt-2 text-3xl font-serif text-text-dark">
                {data.ordersPlaced}
              </p>
            </div>

            {/* Orders Shipped */}
            <div className="bg-surface rounded-lg p-5 border border-border-tan card-shadow">
              <p className="text-xs font-medium text-text-dark/60 uppercase tracking-wide">
                Orders Shipped
              </p>
              <p className="mt-2 text-3xl font-serif text-text-dark">
                {data.ordersShipped}
              </p>
            </div>

            {/* Transactions */}
            <div className="bg-surface rounded-lg p-5 border border-border-tan card-shadow">
              <p className="text-xs font-medium text-text-dark/60 uppercase tracking-wide">
                Transactions
              </p>
              <p className="mt-2 text-3xl font-serif text-text-dark">
                {data.totalTransactions}
              </p>
            </div>

            {/* Total Revenue */}
            <div className="bg-surface rounded-lg p-5 border border-border-tan card-shadow">
              <p className="text-xs font-medium text-text-dark/60 uppercase tracking-wide">
                Total Revenue
              </p>
              <p className="mt-2 text-3xl font-serif text-primary">
                {formatCurrency(data.totalRevenue)}
              </p>
            </div>
          </div>

          {/* Charts section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface rounded-lg p-5 border border-border-tan card-shadow">
              <LineChart
                data={data.dailyTrend}
                dataKey="orders"
                label="Orders per Day"
                color="#5A5A40"
                formatValue={(v) => String(v)}
              />
            </div>
            <div className="bg-surface rounded-lg p-5 border border-border-tan card-shadow">
              <LineChart
                data={data.dailyTrend}
                dataKey="revenue"
                label="Revenue per Day"
                color="#8C7851"
                formatValue={(v) => formatCurrency(v)}
              />
            </div>
          </div>

          {/* Per-product revenue table */}
          <div className="bg-surface rounded-lg border border-border-tan card-shadow overflow-hidden">
            <div className="px-5 py-4 border-b border-border-tan flex items-center justify-between">
              <h3 className="text-base font-serif text-text-dark flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" />
                Top Products by Revenue
              </h3>
            </div>
            {data.perProductRevenue.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-text-dark/50">
                No product revenue data for this period
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/50">
                      <th className="text-left px-5 py-3 font-medium text-text-dark/70">
                        Product
                      </th>
                      <th className="text-right px-5 py-3 font-medium text-text-dark/70">
                        Units Sold
                      </th>
                      <th className="text-right px-5 py-3 font-medium text-text-dark/70">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-tan">
                    {data.perProductRevenue.slice(0, 10).map((item, index) => (
                      <tr key={item.productId} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-5 py-3 text-text-dark">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                              {index + 1}
                            </span>
                            {item.productName}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right text-text-dark/70">
                          {item.unitsSold || '—'}
                        </td>
                        <td className="px-5 py-3 text-right text-text-dark font-medium">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Low Stock Alerts */}
          {data.lowStockProducts && data.lowStockProducts.length > 0 && (
            <div className="bg-surface rounded-lg border border-red-200 card-shadow overflow-hidden">
              <div className="px-5 py-4 border-b border-red-200 bg-red-50">
                <h3 className="text-base font-serif text-red-700 flex items-center gap-2">
                  <AlertTriangle size={18} />
                  Low Stock Alert ({data.lowStockProducts.length} products)
                </h3>
              </div>
              <div className="divide-y divide-border-tan">
                {data.lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product._id} className="px-5 py-3 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                    <div>
                      <Link 
                        to={`/admin/products/${product._id}/edit`}
                        className="font-medium text-text-dark hover:text-primary transition-colors"
                      >
                        {product.name}
                      </Link>
                      <div className="text-xs text-text-dark/50 mt-0.5">
                        {product.variants.map(v => `${v.color}: ${v.stock}`).join(' · ')}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.totalStock === 0 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {product.totalStock === 0 ? 'Out of Stock' : `${product.totalStock} left`}
                    </span>
                  </div>
                ))}
                {data.lowStockProducts.length > 5 && (
                  <Link 
                    to="/admin/products" 
                    className="block px-5 py-3 text-center text-sm text-primary hover:bg-secondary/30 transition-colors"
                  >
                    View all {data.lowStockProducts.length} low stock products →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Recent Orders */}
          {data.recentOrders && data.recentOrders.length > 0 && (
            <div className="bg-surface rounded-lg border border-border-tan card-shadow overflow-hidden">
              <div className="px-5 py-4 border-b border-border-tan flex items-center justify-between">
                <h3 className="text-base font-serif text-text-dark flex items-center gap-2">
                  <ShoppingCart size={18} className="text-primary" />
                  Recent Orders
                </h3>
                <Link to="/admin/orders" className="text-sm text-primary hover:underline">
                  View all →
                </Link>
              </div>
              <div className="divide-y divide-border-tan">
                {data.recentOrders.slice(0, 5).map((order) => (
                  <Link 
                    key={order._id} 
                    to={`/admin/orders/${order._id}`}
                    className="px-5 py-3 flex items-center justify-between hover:bg-secondary/30 transition-colors block"
                  >
                    <div>
                      <p className="font-medium text-text-dark text-sm">
                        #{order._id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-text-dark/50 mt-0.5">
                        {order.customerEmail}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-text-dark text-sm">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status.replace(/-/g, ' ')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
