import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

interface PaymentDetail {
  _id: string;
  orderId: string;
  razorpayPaymentId?: string;
  razorpayOrderId: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  method?: string;
  customerEmail: string;
  createdAt: string;
  updatedAt: string;
}

const statusBadgeClasses: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  refunded: 'bg-purple-100 text-purple-800',
};

const PaymentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPayment = async () => {
      setIsLoading(true);
      setError('');

      try {
        const res = await fetch(`/api/admin/payments/${id}`, {
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('Failed to fetch payment');
        }

        const data: PaymentDetail = await res.json();
        setPayment(data);
      } catch {
        setError('Payment information temporarily unavailable');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchPayment();
    }
  }, [id]);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link to="/admin/payments" className="text-primary hover:underline text-sm">
          ← Back to Payments
        </Link>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
          {error}
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="space-y-6">
        <Link to="/admin/payments" className="text-primary hover:underline text-sm">
          ← Back to Payments
        </Link>
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-center">
          Payment not found
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link to="/admin/payments" className="inline-flex items-center text-primary hover:underline text-sm">
        ← Back to Payments
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-serif tracking-wide text-primary">Payment Detail</h1>
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${statusBadgeClasses[payment.status] || 'bg-gray-100 text-gray-800'}`}>
          {payment.status}
        </span>
      </div>

      {/* Payment Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Details */}
        <div className="bg-surface rounded-lg border border-border-tan p-6 space-y-4">
          <h2 className="text-lg font-medium text-text-dark">Transaction Details</h2>

          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-sm text-text-dark/60">Payment ID</span>
              <span className="text-sm font-mono text-text-dark text-right break-all">
                {payment._id}
              </span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-sm text-text-dark/60">Amount</span>
              <span className="text-sm font-bold text-text-dark">
                {formatAmount(payment.amount, payment.currency)}
              </span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-sm text-text-dark/60">Currency</span>
              <span className="text-sm text-text-dark">{payment.currency}</span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-sm text-text-dark/60">Payment Method</span>
              <span className="text-sm text-text-dark capitalize">
                {payment.method || 'N/A'}
              </span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-sm text-text-dark/60">Customer Email</span>
              <span className="text-sm text-text-dark">{payment.customerEmail}</span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-sm text-text-dark/60">Created At</span>
              <span className="text-sm text-text-dark">{formatDate(payment.createdAt)}</span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-sm text-text-dark/60">Last Updated</span>
              <span className="text-sm text-text-dark">{formatDate(payment.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Razorpay Details */}
        <div className="bg-surface rounded-lg border border-border-tan p-6 space-y-4">
          <h2 className="text-lg font-medium text-text-dark">Razorpay Details</h2>

          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-sm text-text-dark/60">Razorpay Payment ID</span>
              <span className="text-sm font-mono text-text-dark text-right break-all">
                {payment.razorpayPaymentId || 'N/A'}
              </span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-sm text-text-dark/60">Razorpay Order ID</span>
              <span className="text-sm font-mono text-text-dark text-right break-all">
                {payment.razorpayOrderId}
              </span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-sm text-text-dark/60">Signature</span>
              <span className="text-sm font-mono text-text-dark text-right break-all max-w-[200px] truncate" title={payment.razorpaySignature || 'N/A'}>
                {payment.razorpaySignature || 'N/A'}
              </span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-sm text-text-dark/60">Settlement Status</span>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadgeClasses[payment.status] || 'bg-gray-100 text-gray-800'}`}>
                {payment.status}
              </span>
            </div>
          </div>
        </div>

        {/* Linked Order */}
        <div className="bg-surface rounded-lg border border-border-tan p-6 space-y-4 lg:col-span-2">
          <h2 className="text-lg font-medium text-text-dark">Linked Order</h2>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-text-dark/60">Order ID: </span>
              <span className="text-sm font-mono text-text-dark">{String(payment.orderId)}</span>
            </div>
            <Link
              to={`/admin/orders/${payment.orderId}`}
              className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary/5 transition-colors"
            >
              View Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailPage;
