import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { User, Package, MapPin, Heart, Clock, LogOut, ChevronRight, Edit2, Save, X } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useWishlist } from '../context/WishlistContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }>;
}

interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

const Account: React.FC = () => {
  const { user, logout } = useAuth();
  const { wishlistCount } = useWishlist();
  const { recentlyViewed } = useRecentlyViewed();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'addresses' | 'wishlist'>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [editingAddress, setEditingAddress] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch orders
  useEffect(() => {
    if (user && activeTab === 'orders') {
      fetchOrders();
    }
  }, [user, activeTab]);

  // Load saved addresses from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedAddresses');
    if (saved) {
      setSavedAddresses(JSON.parse(saved));
    }
  }, []);

  const fetchOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/orders?userId=${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const saveAddress = (address: SavedAddress) => {
    const updated = savedAddresses.map(a => 
      a.id === address.id ? address : a
    );
    setSavedAddresses(updated);
    localStorage.setItem('savedAddresses', JSON.stringify(updated));
    setEditingAddress(null);
  };

  const deleteAddress = (id: string) => {
    const updated = savedAddresses.filter(a => a.id !== id);
    setSavedAddresses(updated);
    localStorage.setItem('savedAddresses', JSON.stringify(updated));
  };

  const setDefaultAddress = (id: string) => {
    const updated = savedAddresses.map(a => ({
      ...a,
      isDefault: a.id === id
    }));
    setSavedAddresses(updated);
    localStorage.setItem('savedAddresses', JSON.stringify(updated));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      case 'processing': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <User size={32} className="text-primary" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif tracking-tight">{user.displayName || 'Welcome'}</h1>
            <p className="text-sm text-black/60">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-6 py-3 border border-red-200 text-red-600 text-[10px] uppercase tracking-[0.2em] font-bold rounded-full hover:bg-red-50 transition-all"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: User },
          { id: 'orders', label: 'Orders', icon: Package },
          { id: 'addresses', label: 'Addresses', icon: MapPin },
          { id: 'wishlist', label: 'Wishlist', icon: Heart },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 rounded-full text-[11px] uppercase tracking-[0.15em] font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'bg-surface text-black hover:bg-primary/10'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <div className="bg-surface p-6 rounded-3xl border border-border-tan/30">
              <div className="flex items-center gap-3 mb-4">
                <Package size={20} className="text-primary" />
                <h3 className="font-medium">Orders</h3>
              </div>
              <p className="text-3xl font-serif">{orders.length}</p>
              <Link to="/orders" className="text-xs text-primary mt-2 inline-flex items-center gap-1 hover:underline">
                View all orders <ChevronRight size={12} />
              </Link>
            </div>

            <div className="bg-surface p-6 rounded-3xl border border-border-tan/30">
              <div className="flex items-center gap-3 mb-4">
                <Heart size={20} className="text-primary" />
                <h3 className="font-medium">Wishlist</h3>
              </div>
              <p className="text-3xl font-serif">{wishlistCount}</p>
              <Link to="/wishlist" className="text-xs text-primary mt-2 inline-flex items-center gap-1 hover:underline">
                View wishlist <ChevronRight size={12} />
              </Link>
            </div>

            <div className="bg-surface p-6 rounded-3xl border border-border-tan/30">
              <div className="flex items-center gap-3 mb-4">
                <Clock size={20} className="text-primary" />
                <h3 className="font-medium">Recently Viewed</h3>
              </div>
              <p className="text-3xl font-serif">{recentlyViewed.length}</p>
              <p className="text-xs text-black/50 mt-2">Products browsed</p>
            </div>

            {/* Recent Orders */}
            <div className="md:col-span-2 lg:col-span-3 bg-white p-6 rounded-3xl border border-border-tan/30">
              <h3 className="font-medium mb-4">Recent Orders</h3>
              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.slice(0, 3).map((order) => (
                    <Link
                      key={order._id}
                      to={`/orders`}
                      className="flex items-center justify-between p-4 bg-surface rounded-2xl hover:bg-primary/5 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-sm">Order #{order.orderNumber}</p>
                        <p className="text-xs text-black/50">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                        <span className={`text-[10px] px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-black/50 text-center py-8">No orders yet</p>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            {loadingOrders ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order._id} className="bg-white p-6 rounded-3xl border border-border-tan/30">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                      <div>
                        <p className="font-medium">Order #{order.orderNumber}</p>
                        <p className="text-sm text-black/50">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-surface">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-black/20">
                              <Package size={24} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-surface rounded-3xl">
                <Package size={48} className="mx-auto mb-4 text-black/20" />
                <p className="font-serif italic text-xl text-black/40">No orders yet</p>
                <Link
                  to="/collection"
                  className="inline-block mt-4 px-6 py-3 bg-primary text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-full hover:bg-black transition-all"
                >
                  Start Shopping
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div>
            {savedAddresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedAddresses.map((address) => (
                  <div key={address.id} className={`bg-white p-6 rounded-3xl border ${address.isDefault ? 'border-primary' : 'border-border-tan/30'}`}>
                    {address.isDefault && (
                      <span className="text-[10px] px-2 py-1 bg-primary/10 text-primary rounded-full font-bold uppercase tracking-wider mb-3 inline-block">
                        Default
                      </span>
                    )}
                    <p className="font-medium">{address.name}</p>
                    <p className="text-sm text-black/60 mt-1">{address.phone}</p>
                    <p className="text-sm text-black/60 mt-2">{address.address}</p>
                    <p className="text-sm text-black/60">{address.city}, {address.state} - {address.pincode}</p>
                    <div className="flex gap-2 mt-4">
                      {!address.isDefault && (
                        <button
                          onClick={() => setDefaultAddress(address.id)}
                          className="text-xs text-primary hover:underline"
                        >
                          Set as default
                        </button>
                      )}
                      <button
                        onClick={() => deleteAddress(address.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-surface rounded-3xl">
                <MapPin size={48} className="mx-auto mb-4 text-black/20" />
                <p className="font-serif italic text-xl text-black/40">No saved addresses</p>
                <p className="text-sm text-black/40 mt-2">Addresses will be saved when you place an order</p>
              </div>
            )}
          </div>
        )}

        {/* Wishlist Tab */}
        {activeTab === 'wishlist' && (
          <div>
            {wishlistCount > 0 ? (
              <div className="text-center py-8">
                <p className="text-black/60 mb-4">You have {wishlistCount} items in your wishlist</p>
                <Link
                  to="/wishlist"
                  className="inline-block px-6 py-3 bg-primary text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-full hover:bg-black transition-all"
                >
                  View Wishlist
                </Link>
              </div>
            ) : (
              <div className="text-center py-16 bg-surface rounded-3xl">
                <Heart size={48} className="mx-auto mb-4 text-black/20" />
                <p className="font-serif italic text-xl text-black/40">Your wishlist is empty</p>
                <Link
                  to="/collection"
                  className="inline-block mt-4 px-6 py-3 bg-primary text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-full hover:bg-black transition-all"
                >
                  Browse Collection
                </Link>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Account;
