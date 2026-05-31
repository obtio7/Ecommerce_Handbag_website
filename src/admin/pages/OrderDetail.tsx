import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, CreditCard, Clock, Truck } from 'lucide-react';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface StatusHistoryEntry {
  status: string;
  changedAt: string;
}

interface OrderDetailData {
  _id: string;
  customerEmail: string;
  customerPhone?: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    zipCode: string;
    phone?: string;
  };
  paymentId?: string;
  razorpayOrderId?: string;
  statusHistory: StatusHistoryEntry[];
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['out-for-delivery', 'cancelled'],
  'out-for-delivery': ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const STATUS_BADGE_COLORS: Record<string, string> = {
  placed: 'bg-gray-100 text-gray-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-yellow-100 text-yellow-700',
  'out-for-delivery': 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_DOT_COLORS: Record<string, string> = {
  placed: 'bg-gray-400',
  confirmed: 'bg-blue-400',
  shipped: 'bg-yellow-400',
  'out-for-delivery': 'bg-orange-400',
  delivered: 'bg-green-400',
  cancelled: 'bg-red-400',
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

const formatDateTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/admin/orders/${id}`, {
          credentials: 'include',
        });

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Order not found');
          }
          throw new Error('Failed to fetch order');
        }

        const data: OrderDetailData = await res.json();
        setOrder(data);
        // Pre-fill tracking info if exists
        if (data.trackingNumber) setTrackingNumber(data.trackingNumber);
        if (data.trackingUrl) setTrackingUrl(data.trackingUrl);
      } catch (err: any) {
        setError(err.message || 'Failed to load order details.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!selectedStatus || !order) return;

    // Require tracking number when shipping
    if (selectedStatus === 'shipped' && !trackingNumber.trim()) {
      setUpdateError('Please enter a tracking number before marking as shipped.');
      return;
    }

    setIsUpdating(true);
    setUpdateError('');
    setUpdateSuccess('');

    try {
      const res = await fetch(`/api/admin/orders/${order._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          status: selectedStatus,
          trackingNumber: trackingNumber.trim() || undefined,
          trackingUrl: trackingUrl.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || 'Failed to update status'
        );
      }

      // Update local state with the returned order
      setOrder(data.order);
      setSelectedStatus('');
      setUpdateSuccess('Order status updated successfully.');

      // Clear success message after 3 seconds
      setTimeout(() => setUpdateSuccess(''), 3000);
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to update order status.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 mb-4"
        >
          <ArrowLeft size={16} />
          Back to Orders
        </Link>
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!order) return null;

  const validNextStatuses = VALID_TRANSITIONS[order.status] || [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 mb-3"
        >
          <ArrowLeft size={16} />
          Back to Orders
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-serif text-text-dark">Order Details</h1>
            <p className="text-xs text-text-dark/50 mt-1 font-mono">
              ID: {order._id}
            </p>
          </div>
          <span
            className={`inline-block self-start px-3 py-1 rounded-full text-xs font-medium capitalize ${
              STATUS_BADGE_COLORS[order.status] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {order.status.replace(/-/g, ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Items + Shipping + Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <section className="bg-surface rounded-lg border border-border-tan p-5">
            <h2 className="flex items-center gap-2 text-sm font-medium text-text-dark mb-4">
              <Package size={16} className="text-primary" />
              Order Items
            </h2>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-md bg-secondary/50"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-12 h-12 rounded object-cover border border-border-tan"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-dark truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-text-dark/50">
                      Qty: {item.quantity} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-text-dark">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border-tan flex justify-between items-center">
              <span className="text-sm font-medium text-text-dark/70">Total</span>
              <span className="text-lg font-medium text-text-dark">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </section>

          {/* Shipping Address */}
          <section className="bg-surface rounded-lg border border-border-tan p-5">
            <h2 className="flex items-center gap-2 text-sm font-medium text-text-dark mb-4">
              <MapPin size={16} className="text-primary" />
              Shipping Address
            </h2>
            <div className="text-sm text-text-dark/80 space-y-1">
              <p className="font-medium text-text-dark">
                {order.shippingAddress.fullName}
              </p>
              <p>{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.zipCode}
              </p>
            </div>
          </section>

          {/* Payment Info */}
          <section className="bg-surface rounded-lg border border-border-tan p-5">
            <h2 className="flex items-center gap-2 text-sm font-medium text-text-dark mb-4">
              <CreditCard size={16} className="text-primary" />
              Payment Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-text-dark/50">Payment ID</span>
                <p className="font-mono text-text-dark text-xs mt-0.5">
                  {order.paymentId || '—'}
                </p>
              </div>
              <div>
                <span className="text-text-dark/50">Razorpay Order ID</span>
                <p className="font-mono text-text-dark text-xs mt-0.5">
                  {order.razorpayOrderId || '—'}
                </p>
              </div>
              <div>
                <span className="text-text-dark/50">Customer Email</span>
                <p className="text-text-dark mt-0.5">{order.customerEmail}</p>
              </div>
              <div>
                <span className="text-text-dark/50">Order Date</span>
                <p className="text-text-dark mt-0.5">
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Right column: Status Update + Status History */}
        <div className="space-y-6">
          {/* Status Update */}
          {validNextStatuses.length > 0 && (
            <section className="bg-surface rounded-lg border border-border-tan p-5">
              <h2 className="text-sm font-medium text-text-dark mb-3">
                Update Status
              </h2>

              {updateError && (
                <div className="p-2.5 mb-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs">
                  {updateError}
                </div>
              )}

              {updateSuccess && (
                <div className="p-2.5 mb-3 rounded-md bg-green-50 border border-green-200 text-green-700 text-xs">
                  {updateSuccess}
                </div>
              )}

              <div className="space-y-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setUpdateError('');
                  }}
                  className="w-full px-3 py-2 border border-border-tan rounded-md bg-white text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                >
                  <option value="">Select next status...</option>
                  {validNextStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>

                {/* Tracking Number Input - Show when shipping */}
                {(selectedStatus === 'shipped' || order.status === 'shipped' || order.status === 'out-for-delivery') && (
                  <div className="space-y-2 p-3 bg-secondary/50 rounded-md">
                    <label className="block text-xs font-medium text-text-dark/70">
                      Tracking Number {selectedStatus === 'shipped' && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g., AWB123456789"
                      className="w-full px-3 py-2 border border-border-tan rounded-md bg-white text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                    <label className="block text-xs font-medium text-text-dark/70 mt-2">
                      Tracking URL (optional)
                    </label>
                    <input
                      type="url"
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      placeholder="https://tracking.example.com/..."
                      className="w-full px-3 py-2 border border-border-tan rounded-md bg-white text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                )}

                <button
                  onClick={handleStatusUpdate}
                  disabled={!selectedStatus || isUpdating}
                  className="w-full py-2 px-4 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </section>
          )}

          {/* Tracking Info Display */}
          {order.trackingNumber && (
            <section className="bg-surface rounded-lg border border-border-tan p-5">
              <h2 className="flex items-center gap-2 text-sm font-medium text-text-dark mb-3">
                <Truck size={16} className="text-primary" />
                Shipping Info
              </h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-text-dark/50">Tracking Number</span>
                  <p className="font-mono text-text-dark mt-0.5">{order.trackingNumber}</p>
                </div>
                {order.trackingUrl && (
                  <div>
                    <span className="text-text-dark/50">Tracking Link</span>
                    <p className="mt-0.5">
                      <a 
                        href={order.trackingUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Track Package →
                      </a>
                    </p>
                  </div>
                )}
                {order.shippedAt && (
                  <div>
                    <span className="text-text-dark/50">Shipped On</span>
                    <p className="text-text-dark mt-0.5">{formatDateTime(order.shippedAt)}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Status History Timeline */}
          <section className="bg-surface rounded-lg border border-border-tan p-5">
            <h2 className="flex items-center gap-2 text-sm font-medium text-text-dark mb-4">
              <Clock size={16} className="text-primary" />
              Status History
            </h2>

            {order.statusHistory.length === 0 ? (
              <p className="text-xs text-text-dark/50">No status changes recorded.</p>
            ) : (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border-tan" />

                <div className="space-y-4">
                  {[...order.statusHistory].reverse().map((entry, idx) => (
                    <div key={idx} className="relative flex items-start gap-3 pl-6">
                      {/* Dot */}
                      <div
                        className={`absolute left-0 top-1.5 w-[14px] h-[14px] rounded-full border-2 border-white ${
                          STATUS_DOT_COLORS[entry.status] || 'bg-gray-400'
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-text-dark capitalize">
                          {entry.status.replace(/-/g, ' ')}
                        </p>
                        <p className="text-xs text-text-dark/50 mt-0.5">
                          {formatDateTime(entry.changedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
