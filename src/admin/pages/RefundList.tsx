import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Search, Check, X, AlertCircle, DollarSign } from 'lucide-react';

interface RefundRequest {
  _id: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  paymentId?: string;
  refundId?: string;
  processedAt?: string;
  processedBy?: string;
  adminNote?: string;
  createdAt: string;
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
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  processed: 'bg-green-100 text-green-700',
};

const RefundList: React.FC = () => {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [processing, setProcessing] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchRefunds = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      
      const res = await fetch(`/api/admin/refunds?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch refunds');
      }
      
      const data = await res.json();
      setRefunds(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load refunds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRefunds();
  };

  const handleAction = async (action: 'approve' | 'reject' | 'process') => {
    if (!selectedRefund) return;
    
    setProcessing(true);
    setActionResult(null);
    
    try {
      const res = await fetch(`/api/admin/refunds/${selectedRefund._id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminNote }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action} refund`);
      }
      
      setActionResult({ success: true, message: data.message || `Refund ${action}d successfully` });
      setSelectedRefund(null);
      setAdminNote('');
      fetchRefunds();
    } catch (err: any) {
      setActionResult({ success: false, message: err.message });
    } finally {
      setProcessing(false);
    }
  };

  // Stats
  const stats = {
    pending: refunds.filter(r => r.status === 'pending').length,
    approved: refunds.filter(r => r.status === 'approved').length,
    processed: refunds.filter(r => r.status === 'processed').length,
    totalAmount: refunds.filter(r => r.status === 'processed').reduce((sum, r) => sum + r.amount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-text-dark flex items-center gap-2">
            <DollarSign size={24} className="text-primary" />
            Refund Management
          </h1>
          <p className="text-sm text-text-dark/60 mt-1">Process customer refund requests</p>
        </div>
        <button
          onClick={fetchRefunds}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-border-tan text-text-dark text-sm font-medium rounded-md hover:bg-secondary/50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-xs text-yellow-700 uppercase tracking-wide">Pending</p>
          <p className="text-2xl font-serif text-yellow-800 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-700 uppercase tracking-wide">Approved</p>
          <p className="text-2xl font-serif text-blue-800 mt-1">{stats.approved}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-green-700 uppercase tracking-wide">Processed</p>
          <p className="text-2xl font-serif text-green-800 mt-1">{stats.processed}</p>
        </div>
        <div className="bg-surface border border-border-tan rounded-lg p-4">
          <p className="text-xs text-text-dark/60 uppercase tracking-wide">Total Refunded</p>
          <p className="text-2xl font-serif text-primary mt-1">{formatCurrency(stats.totalAmount)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-lg border border-border-tan p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dark/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order ID or email..."
                className="w-full pl-10 pr-4 py-2.5 border border-border-tan rounded-md bg-white text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-border-tan rounded-md bg-white text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="processed">Processed</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {actionResult && (
        <div className={`p-4 rounded-md ${actionResult.success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'} text-sm`}>
          {actionResult.message}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="animate-spin text-primary" />
        </div>
      ) : refunds.length === 0 ? (
        <div className="text-center py-20 text-text-dark/50">
          <DollarSign size={48} className="mx-auto mb-4 opacity-30" />
          <p>No refund requests found</p>
        </div>
      ) : (
        <div className="bg-surface rounded-lg border border-border-tan overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="text-left px-5 py-3 font-medium text-text-dark/70">Order</th>
                  <th className="text-left px-5 py-3 font-medium text-text-dark/70">Customer</th>
                  <th className="text-left px-5 py-3 font-medium text-text-dark/70">Amount</th>
                  <th className="text-left px-5 py-3 font-medium text-text-dark/70">Reason</th>
                  <th className="text-left px-5 py-3 font-medium text-text-dark/70">Status</th>
                  <th className="text-left px-5 py-3 font-medium text-text-dark/70">Date</th>
                  <th className="text-right px-5 py-3 font-medium text-text-dark/70">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-tan">
                {refunds.map(refund => (
                  <tr key={refund._id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3">
                      <Link to={`/admin/orders/${refund.orderId}`} className="text-primary hover:underline font-mono text-xs">
                        {refund.orderNumber || `#${refund.orderId.slice(-8).toUpperCase()}`}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-text-dark">{refund.customerName}</p>
                      <p className="text-text-dark/50 text-xs">{refund.customerEmail}</p>
                    </td>
                    <td className="px-5 py-3 font-medium text-text-dark">
                      {formatCurrency(refund.amount)}
                    </td>
                    <td className="px-5 py-3 text-text-dark/70 max-w-[200px] truncate" title={refund.reason}>
                      {refund.reason}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[refund.status]}`}>
                        {refund.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-text-dark/70 text-xs">
                      {formatDate(refund.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {refund.status === 'pending' && (
                        <button
                          onClick={() => setSelectedRefund(refund)}
                          className="text-primary hover:underline text-xs font-medium"
                        >
                          Review
                        </button>
                      )}
                      {refund.status === 'approved' && (
                        <button
                          onClick={() => setSelectedRefund(refund)}
                          className="text-green-600 hover:underline text-xs font-medium"
                        >
                          Process
                        </button>
                      )}
                      {(refund.status === 'processed' || refund.status === 'rejected') && (
                        <span className="text-text-dark/40 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {selectedRefund && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border-tan">
              <h2 className="text-lg font-serif text-text-dark">
                {selectedRefund.status === 'pending' ? 'Review Refund Request' : 'Process Refund'}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-text-dark/50">Order</p>
                  <p className="font-medium text-text-dark">{selectedRefund.orderNumber}</p>
                </div>
                <div>
                  <p className="text-text-dark/50">Amount</p>
                  <p className="font-medium text-primary text-lg">{formatCurrency(selectedRefund.amount)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-text-dark/50">Customer</p>
                  <p className="font-medium text-text-dark">{selectedRefund.customerName}</p>
                  <p className="text-text-dark/60 text-xs">{selectedRefund.customerEmail}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-text-dark/50">Reason</p>
                  <p className="text-text-dark">{selectedRefund.reason}</p>
                </div>
              </div>

              {selectedRefund.paymentId && (
                <div className="p-3 bg-secondary/50 rounded-lg text-xs">
                  <p className="text-text-dark/50">Payment ID</p>
                  <p className="font-mono text-text-dark">{selectedRefund.paymentId}</p>
                </div>
              )}

              <div>
                <label className="block text-sm text-text-dark/70 mb-1.5">Admin Note (optional)</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-border-tan rounded-md bg-white text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  placeholder="Add a note about this refund..."
                />
              </div>

              {selectedRefund.status === 'approved' && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                  <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Ready to Process</p>
                    <p className="mt-1">This will initiate the refund through Razorpay. The amount will be credited to the customer's original payment method.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border-tan flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedRefund(null);
                  setAdminNote('');
                }}
                className="px-4 py-2 text-text-dark text-sm font-medium hover:bg-secondary/50 rounded-md transition-colors"
              >
                Cancel
              </button>
              
              {selectedRefund.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={processing}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    <X size={16} />
                    Reject
                  </button>
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={processing}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Check size={16} />
                    Approve
                  </button>
                </>
              )}
              
              {selectedRefund.status === 'approved' && (
                <button
                  onClick={() => handleAction('process')}
                  disabled={processing}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {processing ? <RefreshCw size={16} className="animate-spin" /> : <DollarSign size={16} />}
                  Process Refund
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundList;
