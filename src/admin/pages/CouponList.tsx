import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Percent, DollarSign, Calendar, Tag, Loader2, AlertCircle } from 'lucide-react';

interface Coupon {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

const CouponList: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    minOrderAmount: '0',
    maxDiscount: '',
    usageLimit: '100',
    expiresAt: '',
  });

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/admin/coupons');
      if (!response.ok) throw new Error('Failed to fetch coupons');
      const result = await response.json();
      setCoupons(result.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const payload = {
        code: formData.code.toUpperCase().trim(),
        type: formData.type,
        value: Number(formData.value),
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
        usageLimit: Number(formData.usageLimit) || 100,
        expiresAt: formData.expiresAt || undefined,
      };

      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create coupon');
      }

      // Reset form and refresh list
      setFormData({
        code: '',
        type: 'percentage',
        value: '',
        minOrderAmount: '0',
        maxDiscount: '',
        usageLimit: '100',
        expiresAt: '',
      });
      setShowForm(false);
      fetchCoupons();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    setDeleteLoading(id);
    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete coupon');
      fetchCoupons();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => { setError(null); setLoading(true); fetchCoupons(); }}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif text-primary">Promo Codes</h1>
          <p className="text-sm text-text-dark/60 mt-1">
            Manage discount codes and promotions
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          <span>Add Coupon</span>
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white border border-border-tan rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4">Create New Coupon</h2>
          
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-dark/70 mb-1">
                Coupon Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., SUMMER20"
                required
                className="w-full px-3 py-2 border border-border-tan rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-dark/70 mb-1">
                Discount Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percentage' | 'fixed' })}
                className="w-full px-3 py-2 border border-border-tan rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-dark/70 mb-1">
                {formData.type === 'percentage' ? 'Discount (%)' : 'Discount (₹)'} *
              </label>
              <input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder={formData.type === 'percentage' ? 'e.g., 20' : 'e.g., 500'}
                required
                min="1"
                max={formData.type === 'percentage' ? '100' : undefined}
                className="w-full px-3 py-2 border border-border-tan rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-dark/70 mb-1">
                Min Order Amount (₹)
              </label>
              <input
                type="number"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-border-tan rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {formData.type === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-text-dark/70 mb-1">
                  Max Discount (₹)
                </label>
                <input
                  type="number"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                  placeholder="Optional cap"
                  min="0"
                  className="w-full px-3 py-2 border border-border-tan rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-dark/70 mb-1">
                Usage Limit
              </label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                placeholder="100"
                min="1"
                className="w-full px-3 py-2 border border-border-tan rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-dark/70 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-border-tan rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3 flex gap-3 pt-2">
              <button
                type="submit"
                disabled={formLoading}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {formLoading && <Loader2 size={16} className="animate-spin" />}
                Create Coupon
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-border-tan rounded-lg hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons List */}
      {coupons.length === 0 ? (
        <div className="bg-white border border-border-tan rounded-xl p-12 text-center">
          <Tag className="w-12 h-12 text-primary/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-dark/70">No coupons yet</h3>
          <p className="text-sm text-text-dark/50 mt-1">
            Create your first promo code to offer discounts
          </p>
        </div>
      ) : (
        <div className="bg-white border border-border-tan rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-dark/70 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-dark/70 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-dark/70 uppercase tracking-wider">
                    Min Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-dark/70 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-dark/70 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-dark/70 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-dark/70 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-tan">
                {coupons.map((coupon) => {
                  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                  const isExhausted = coupon.usedCount >= coupon.usageLimit;
                  const isInactive = !coupon.isActive || isExpired || isExhausted;

                  return (
                    <tr key={coupon._id} className={isInactive ? 'bg-gray-50/50' : ''}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Tag size={16} className="text-primary" />
                          <span className="font-mono font-semibold text-primary">
                            {coupon.code}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          {coupon.type === 'percentage' ? (
                            <>
                              <Percent size={14} className="text-green-600" />
                              <span>{coupon.value}% off</span>
                              {coupon.maxDiscount && (
                                <span className="text-xs text-text-dark/50">
                                  (max ₹{coupon.maxDiscount})
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <DollarSign size={14} className="text-green-600" />
                              <span>₹{coupon.value} off</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {coupon.minOrderAmount > 0 ? `₹${coupon.minOrderAmount}` : '—'}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className={coupon.usedCount >= coupon.usageLimit ? 'text-red-600' : ''}>
                          {coupon.usedCount} / {coupon.usageLimit}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {coupon.expiresAt ? (
                          <div className="flex items-center gap-1">
                            <Calendar size={14} className={isExpired ? 'text-red-500' : 'text-text-dark/50'} />
                            <span className={isExpired ? 'text-red-600' : ''}>
                              {formatDate(coupon.expiresAt)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-text-dark/50">No expiry</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {isExpired ? (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                            Expired
                          </span>
                        ) : isExhausted ? (
                          <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                            Exhausted
                          </span>
                        ) : coupon.isActive ? (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => handleDelete(coupon._id)}
                          disabled={deleteLoading === coupon._id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete coupon"
                        >
                          {deleteLoading === coupon._id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponList;
