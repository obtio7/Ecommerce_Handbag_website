import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Mail, ShoppingBag, Search, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface CustomerOrder {
  _id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface Customer {
  email: string;
  name: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  orders: CustomerOrder[];
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  'out-for-delivery': 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'orders' | 'spent' | 'recent'>('recent');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/admin/customers');
        if (!response.ok) throw new Error('Failed to fetch customers');
        const data = await response.json();
        setCustomers(data.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Filter and sort customers
  const filteredCustomers = customers
    .filter(c => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        c.email.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query) ||
        c.phone?.includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'orders':
          return b.totalOrders - a.totalOrders;
        case 'spent':
          return b.totalSpent - a.totalSpent;
        case 'recent':
        default:
          return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif text-primary flex items-center gap-2">
            <Users size={24} />
            Customers
          </h1>
          <p className="text-sm text-text-dark/60 mt-1">
            {customers.length} customer{customers.length !== 1 ? 's' : ''} total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dark/40" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email, name, or phone..."
            className="w-full pl-10 pr-4 py-2 border border-border-tan rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'orders' | 'spent' | 'recent')}
          className="px-4 py-2 border border-border-tan rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="recent">Most Recent</option>
          <option value="orders">Most Orders</option>
          <option value="spent">Highest Spent</option>
        </select>
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-lg border border-border-tan">
          <Users size={48} className="mx-auto mb-4 text-text-dark/20" />
          <p className="text-text-dark/60">
            {searchQuery ? 'No customers match your search' : 'No customers yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCustomers.map((customer) => {
            const isExpanded = expandedCustomer === customer.email;
            
            return (
              <div
                key={customer.email}
                className="bg-surface rounded-lg border border-border-tan overflow-hidden"
              >
                {/* Customer Header */}
                <button
                  onClick={() => setExpandedCustomer(isExpanded ? null : customer.email)}
                  className="w-full p-4 flex items-center justify-between gap-4 hover:bg-secondary/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-medium text-sm">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-text-dark truncate">{customer.name}</p>
                      <p className="text-sm text-text-dark/60 truncate flex items-center gap-1">
                        <Mail size={12} />
                        {customer.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="hidden sm:block text-right">
                      <p className="text-text-dark/60">Orders</p>
                      <p className="font-medium text-text-dark">{customer.totalOrders}</p>
                    </div>
                    <div className="hidden md:block text-right">
                      <p className="text-text-dark/60">Total Spent</p>
                      <p className="font-medium text-primary">{formatCurrency(customer.totalSpent)}</p>
                    </div>
                    <div className="hidden lg:block text-right">
                      <p className="text-text-dark/60">Last Order</p>
                      <p className="text-text-dark">{formatDate(customer.lastOrderDate)}</p>
                    </div>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {/* Expanded Order History */}
                {isExpanded && (
                  <div className="border-t border-border-tan p-4 bg-secondary/20">
                    <h4 className="text-sm font-medium text-text-dark/70 mb-3 flex items-center gap-2">
                      <ShoppingBag size={14} />
                      Order History
                    </h4>
                    
                    {customer.orders.length === 0 ? (
                      <p className="text-sm text-text-dark/50">No orders found</p>
                    ) : (
                      <div className="space-y-2">
                        {customer.orders.map((order) => (
                          <Link
                            key={order._id}
                            to={`/admin/orders/${order._id}`}
                            className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-secondary/50 transition-colors"
                          >
                            <div>
                              <p className="font-mono text-sm text-primary">
                                {order.orderNumber || `#${order._id.slice(-8).toUpperCase()}`}
                              </p>
                              <p className="text-xs text-text-dark/50">
                                {formatDate(order.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                                STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'
                              }`}>
                                {order.status.replace(/-/g, ' ')}
                              </span>
                              <span className="font-medium text-text-dark">
                                {formatCurrency(order.totalAmount)}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Customer Stats */}
                    <div className="mt-4 pt-4 border-t border-border-tan/50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-xs text-text-dark/50">Total Orders</p>
                        <p className="font-medium text-text-dark">{customer.totalOrders}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-dark/50">Total Spent</p>
                        <p className="font-medium text-primary">{formatCurrency(customer.totalSpent)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-dark/50">Avg. Order</p>
                        <p className="font-medium text-text-dark">
                          {formatCurrency(customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-dark/50">Phone</p>
                        <p className="font-medium text-text-dark">{customer.phone || '—'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomerList;
