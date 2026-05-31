import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../lib/utils';
import { Package, ChevronDown, ChevronUp, LogIn } from 'lucide-react';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface StatusHistory {
  status: string;
  changedAt: string;
}

interface Order {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    zipCode: string;
  };
  paymentId?: string;
  statusHistory: StatusHistory[];
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

const MyOrders: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/orders/my-orders?userId=${user.uid}`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders);
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-32 text-center">
        <p className="text-sm text-black">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-40 text-center space-y-8">
        <div className="flex justify-center text-primary/20">
          <LogIn size={80} strokeWidth={0.5} />
        </div>
        <h1 className="text-4xl font-serif tracking-tighter text-black">Please Log In</h1>
        <p className="text-sm text-black max-w-md mx-auto">
          You need to be logged in to view your orders. Please sign in with your Google account to continue.
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-40 text-center space-y-8">
        <div className="flex justify-center text-primary/20">
          <Package size={80} strokeWidth={0.5} />
        </div>
        <h1 className="text-4xl font-serif tracking-tighter text-black">No Orders Yet</h1>
        <p className="text-sm text-black">
          You have not placed any orders yet. Start exploring our collection.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-32">
      <h1 className="text-6xl font-serif tracking-tighter mb-20">
        My <span className="italic font-light">Orders</span>
      </h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order._id}
            className="bg-surface border border-border-tan/30 rounded-3xl overflow-hidden card-shadow"
          >
            {/* Order Header */}
            <button
              onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
              className="w-full p-6 flex items-center justify-between text-left hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-6 flex-wrap">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-black mb-1">Order ID</p>
                  <p className="text-xs font-mono text-black">{order._id.slice(-8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-black mb-1">Date</p>
                  <p className="text-xs text-black">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-black mb-1">Total</p>
                  <p className="text-xs font-semibold text-black">{formatCurrency(order.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-black mb-1">Items</p>
                  <p className="text-xs text-black">{order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                  {order.status.replace('-', ' ')}
                </span>
              </div>
              {expandedOrder === order._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {/* Expanded Details */}
            {expandedOrder === order._id && (
              <div className="border-t border-border-tan/20 p-6 space-y-6">
                {/* Items */}
                <div>
                  <h4 className="text-[9px] uppercase tracking-[0.3em] font-bold text-primary mb-4">Items</h4>
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-12 h-14 bg-white rounded-xl border border-border-tan/20 overflow-hidden flex-shrink-0 p-1">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                        </div>
                        <div className="flex-grow">
                          <p className="text-xs font-semibold text-black">{item.name}</p>
                          <p className="text-[10px] text-black">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                        </div>
                        <p className="text-xs font-semibold text-black">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h4 className="text-[9px] uppercase tracking-[0.3em] font-bold text-primary mb-2">Shipping Address</h4>
                  <p className="text-xs text-black leading-relaxed">
                    {order.shippingAddress.fullName}<br />
                    {order.shippingAddress.address}<br />
                    {order.shippingAddress.city} - {order.shippingAddress.zipCode}
                  </p>
                </div>

                {/* Payment ID */}
                {order.paymentId && (
                  <div>
                    <h4 className="text-[9px] uppercase tracking-[0.3em] font-bold text-primary mb-2">Payment ID</h4>
                    <p className="text-xs font-mono text-black">{order.paymentId}</p>
                  </div>
                )}

                {/* Status History */}
                {order.statusHistory && order.statusHistory.length > 0 && (
                  <div>
                    <h4 className="text-[9px] uppercase tracking-[0.3em] font-bold text-primary mb-3">Status History</h4>
                    <div className="space-y-2">
                      {order.statusHistory.map((entry, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          <p className="text-[10px] text-black">
                            <span className="font-semibold capitalize">{entry.status.replace('-', ' ')}</span>
                            {' — '}
                            {new Date(entry.changedAt).toLocaleString('en-IN', {
                              year: 'numeric', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;
