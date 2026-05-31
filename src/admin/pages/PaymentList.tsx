import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

interface Payment {
  _id: string;
  orderId: string;
  razorpayPaymentId?: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  method?: string;
  customerEmail: string;
  createdAt: string;
}

interface PaymentsResponse {
  data: Payment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totalRevenue: number;
}

const STATUS_OPTIONS = ['all', 'paid', 'failed', 'pending', 'refunded'] as const;

const statusBadgeClasses: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  refunded: 'bg-purple-100 text-purple-800',
};

const PaymentList: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '20');

      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (startDate) {
        params.set('startDate', startDate);
      }
      if (endDate) {
        params.set('endDate', endDate);
      }

      const res = await fetch(`/api/admin/payments?${params.toString()}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch payments');
      }

      const data: PaymentsResponse = await res.json();
      setPayments(data.data);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setTotalRevenue(data.totalRevenue);
    } catch {
      setError('Payment information temporarily unavailable');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
    setPage(1);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
    setPage(1);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-serif tracking-wide text-primary">Payments</h1>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-serif tracking-wide text-primary">Payments</h1>
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <p className="text-sm text-green-700 font-medium">Total Revenue (Paid)</p>
          <p className="text-xl font-bold text-green-800">{formatAmount(totalRevenue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-text-dark/70 mb-1">
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={handleStatusChange}
            className="px-3 py-2 border border-border-tan rounded-md bg-white text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-text-dark/70 mb-1">
            Start Date
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            className="px-3 py-2 border border-border-tan rounded-md bg-white text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-text-dark/70 mb-1">
            End Date
          </label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            className="px-3 py-2 border border-border-tan rounded-md bg-white text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-surface rounded-lg border border-border-tan">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-tan bg-secondary/50">
                  <th className="text-left px-4 py-3 font-medium text-text-dark/70">Transaction ID</th>
                  <th className="text-left px-4 py-3 font-medium text-text-dark/70">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-text-dark/70">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-text-dark/70">Order ID</th>
                  <th className="text-left px-4 py-3 font-medium text-text-dark/70">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-text-dark/70">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-text-dark/50">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment._id} className="border-b border-border-tan last:border-b-0 hover:bg-secondary/30">
                      <td className="px-4 py-3 font-mono text-xs">
                        {payment.razorpayPaymentId || payment._id.slice(-8)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatAmount(payment.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadgeClasses[payment.status] || 'bg-gray-100 text-gray-800'}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/orders/${payment.orderId}`}
                          className="text-primary hover:underline text-xs font-mono"
                        >
                          {String(payment.orderId).slice(-8)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-text-dark/70">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/payments/${payment._id}`}
                          className="text-primary hover:underline text-sm font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-dark/60">
                Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total} payments
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-border-tan rounded-md bg-white hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-sm text-text-dark/70">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm border border-border-tan rounded-md bg-white hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentList;
