import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../lib/utils';
import { Package, ChevronDown, ChevronUp, MapPin, Clock, Search, Truck, CheckCircle2, Box, CircleDot } from 'lucide-react';

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

interface OrderData {
  _id: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    zipCode: string;
  };
  statusHistory: StatusHistoryEntry[];
  trackingNumber?: string;
  trackingUrl?: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  placed: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  'out-for-delivery': 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

// Order status steps for progress tracking
const ORDER_STEPS = [
  { key: 'placed', label: 'Order Placed', icon: Box },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'out-for-delivery', label: 'Out for Delivery', icon: CircleDot },
  { key: 'delivered', label: 'Delivered', icon: Package },
];

const getStatusIndex = (status: string) => {
  const index = ORDER_STEPS.findIndex(s => s.key === status);
  return index >= 0 ? index : 0;
};

// Order Progress Component
const OrderProgress: React.FC<{ status: string }> = ({ status }) => {
  const currentIndex = getStatusIndex(status);
  const isCancelled = status === 'cancelled';

  if (isCancelled) {
    return (
      <div className="flex items-center justify-center p-4 bg-red-50 rounded-2xl">
        <span className="text-red-600 text-sm font-medium">Order Cancelled</span>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border-tan/30 mx-8" />
        <div 
          className="absolute top-5 left-0 h-0.5 bg-primary mx-8 transition-all duration-500"
          style={{ width: `calc(${(currentIndex / (ORDER_STEPS.length - 1)) * 100}% - 4rem)` }}
        />

        {ORDER_STEPS.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-primary text-white'
                    : 'bg-white border-2 border-border-tan/30 text-black/30'
                } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
              >
                <Icon size={18} />
              </div>
              <span
                className={`mt-2 text-[9px] uppercase tracking-widest font-bold text-center max-w-[80px] ${
                  isCompleted ? 'text-primary' : 'text-black/40'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Orders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  
  // Guest order tracking
  const [trackingEmail, setTrackingEmail] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [guestOrders, setGuestOrders] = useState<OrderData[] | null>(null);

  useEffect(() => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/orders/my?email=${encodeURIComponent(user.email!)}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingEmail.trim()) return;

    setTrackingLoading(true);
    setTrackingError(null);

    try {
      const res = await fetch(`/api/orders/my?email=${encodeURIComponent(trackingEmail.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length === 0) {
          setTrackingError('No orders found for this email address.');
          setGuestOrders(null);
        } else {
          setGuestOrders(data);
        }
      } else {
        setTrackingError('Failed to fetch orders. Please try again.');
      }
    } catch (err) {
      setTrackingError('Something went wrong. Please try again.');
    } finally {
      setTrackingLoading(false);
    }
  };

  // Render order card (reusable for both logged-in and guest users)
  const renderOrderCard = (order: OrderData) => {
    const isExpanded = expandedOrder === order._id;
    return (
      <div key={order._id} className="bg-surface border border-border-tan/30 rounded-3xl overflow-hidden card-shadow">
        {/* Order Header */}
        <button
          onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
          className="w-full p-6 flex items-center justify-between gap-4 hover:bg-secondary/50 transition-colors text-left"
        >
          <div className="flex items-center gap-6 flex-1 min-w-0">
            <div className="hidden sm:flex w-12 h-12 bg-secondary rounded-full items-center justify-center flex-shrink-0">
              <Package size={20} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-primary">
                #{order._id.slice(-8).toUpperCase()}
              </p>
              <p className="text-[10px] text-black/60 mt-1">
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                {' · '}
                {order.items.length} item{order.items.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className={`text-[9px] uppercase tracking-widest font-bold px-3 py-1 rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
              {order.status.replace('-', ' ')}
            </span>
            <span className="text-sm font-serif font-medium text-primary hidden sm:block">
              {formatCurrency(order.totalAmount)}
            </span>
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="px-6 pb-6 border-t border-border-tan/20 pt-6 space-y-6">
            {/* Order Progress */}
            <div className="hidden md:block">
              <OrderProgress status={order.status} />
            </div>

            {/* Items */}
            <div className="space-y-4">
              <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary/70">Items</h4>
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-secondary rounded-xl overflow-hidden flex-shrink-0 border border-border-tan/20">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.15em] font-bold truncate">{item.name}</p>
                    <p className="text-[10px] text-black/60">Qty: {item.quantity} · {formatCurrency(item.price)}</p>
                  </div>
                  <p className="text-sm font-serif text-primary">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            {/* Shipping Address */}
            <div className="flex items-start gap-3 p-4 bg-secondary/50 rounded-2xl">
              <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-1">Shipping Address</p>
                <p className="text-[11px] text-black/70 leading-relaxed">
                  {order.shippingAddress.fullName}<br />
                  {order.shippingAddress.address}<br />
                  {order.shippingAddress.city} — {order.shippingAddress.zipCode}
                </p>
              </div>
            </div>

            {/* Tracking Info */}
            {order.trackingNumber && (
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <Truck size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-1 text-blue-700">Tracking Information</p>
                  <p className="text-[11px] text-blue-900 font-mono">{order.trackingNumber}</p>
                  {order.trackingUrl && (
                    <a 
                      href={order.trackingUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-[10px] uppercase tracking-widest font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Track Package →
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Status Timeline */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={14} className="text-primary" />
                  <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary/70">Timeline</h4>
                </div>
                <div className="space-y-3 pl-4 border-l-2 border-border-tan/30">
                  {order.statusHistory.map((entry, idx) => (
                    <div key={idx} className="relative pl-4">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 bg-primary rounded-full border-2 border-white"></div>
                      <p className="text-[10px] uppercase tracking-widest font-bold">{entry.status.replace('-', ' ')}</p>
                      <p className="text-[9px] text-black/50">
                        {new Date(entry.changedAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-baseline pt-4 border-t border-border-tan/20">
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-black/60">Total</span>
              <span className="text-2xl font-serif italic text-primary">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Guest user - show tracking form
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-32">
        <h1 className="text-6xl font-serif tracking-tighter mb-8 px-4">Track <span className="italic font-light opacity-60">Order</span></h1>
        <p className="text-sm text-black/60 mb-12 px-4">Enter your email address to view your order status.</p>

        {/* Tracking Form */}
        <form onSubmit={handleTrackOrder} className="mb-12 px-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/50" size={18} />
              <input
                type="email"
                value={trackingEmail}
                onChange={(e) => setTrackingEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="w-full bg-surface border border-border-tan/30 p-4 pl-14 rounded-full text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit"
              disabled={trackingLoading}
              className="px-8 py-4 bg-primary text-white text-[11px] uppercase tracking-[0.2em] font-bold rounded-full hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {trackingLoading ? 'Searching...' : 'Track Orders'}
            </button>
          </div>
          {trackingError && (
            <p className="mt-4 text-sm text-red-600">{trackingError}</p>
          )}
        </form>

        {/* Guest Orders Results */}
        {guestOrders && guestOrders.length > 0 && (
          <div className="space-y-6">
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary px-4">
              Found {guestOrders.length} order{guestOrders.length > 1 ? 's' : ''}
            </p>
            {guestOrders.map(renderOrderCard)}
          </div>
        )}

        {/* Sign in prompt */}
        {!guestOrders && (
          <div className="text-center py-12 px-4">
            <Package size={60} strokeWidth={0.5} className="mx-auto text-text-dark/10 mb-6" />
            <p className="text-sm text-black/60 mb-4">
              Sign in with your Google account for a better experience
            </p>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-40 text-center">
        <p className="text-sm text-black/60 uppercase tracking-widest">Loading your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-40 text-center space-y-8">
        <Package size={80} strokeWidth={0.5} className="mx-auto text-text-dark/10" />
        <h1 className="text-4xl font-serif tracking-tighter text-black italic">No orders yet</h1>
        <p className="text-sm text-black/60">Your order history will appear here once you make a purchase.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-32">
      <h1 className="text-6xl font-serif tracking-tighter mb-16 px-4">My <span className="italic font-light opacity-60">Orders</span></h1>

      <div className="space-y-6">
        {orders.map(renderOrderCard)}
      </div>
    </div>
  );
};

export default Orders;
