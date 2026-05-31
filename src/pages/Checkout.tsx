import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { loadRazorpay } from '../lib/razorpay';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';
import { CreditCard, Truck, ShieldCheck, Mail, MapPin, User, Phone, Loader2, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';

const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_COST = 79;

interface SavedAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  email: string;
}

const Checkout: React.FC = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedAddress, setSavedAddress] = useState<SavedAddress | null>(null);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    fullName: user?.displayName || '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
  });

  // Fetch last order address when user is logged in
  useEffect(() => {
    const fetchLastAddress = async () => {
      if (!user?.email) return;
      
      setLoadingAddress(true);
      try {
        const response = await fetch(`/api/orders/my?email=${encodeURIComponent(user.email)}`);
        if (response.ok) {
          const orders = await response.json();
          if (orders.length > 0) {
            const lastOrder = orders[0]; // Most recent order
            const addr = lastOrder.shippingAddress;
            if (addr) {
              const saved: SavedAddress = {
                fullName: addr.fullName || lastOrder.customerName || '',
                phone: addr.phone || lastOrder.customerPhone || '',
                address: addr.address || '',
                city: addr.city || '',
                zipCode: addr.zipCode || '',
                email: lastOrder.customerEmail || user.email || '',
              };
              setSavedAddress(saved);
              
              // Auto-fill the form with saved address
              setFormData(prev => ({
                email: saved.email || prev.email,
                fullName: saved.fullName || prev.fullName,
                phone: saved.phone || prev.phone,
                address: saved.address || prev.address,
                city: saved.city || prev.city,
                zipCode: saved.zipCode || prev.zipCode,
              }));
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch last address:', error);
      } finally {
        setLoadingAddress(false);
      }
    };

    fetchLastAddress();
  }, [user?.email]);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponValid, setCouponValid] = useState(false);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);

  const isFreeShipping = cartTotal >= FREE_SHIPPING_THRESHOLD;
  const shippingCost = isFreeShipping ? 0 : SHIPPING_COST;

  // Calculate subtotal and discount from cart items
  const subtotal = cart.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0);
  const discountAmount = cart.reduce(
    (sum, item) => sum + (item.originalPrice - item.price) * item.quantity,
    0
  );
  const orderTotal = cartTotal - couponDiscount + shippingCost;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponMessage(null);
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), cartTotal }),
      });
      const result = await response.json();
      if (result.valid) {
        setCouponDiscount(result.discount);
        setCouponValid(true);
        setCouponMessage(result.message);
        setAppliedCouponCode(couponCode.trim().toUpperCase());
      } else {
        setCouponDiscount(0);
        setCouponValid(false);
        setCouponMessage(result.message);
        setAppliedCouponCode(null);
      }
    } catch {
      setCouponMessage('Failed to validate coupon. Please try again.');
      setCouponValid(false);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    setCouponValid(false);
    setCouponMessage(null);
    setAppliedCouponCode(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Load Razorpay SDK
      const res = await loadRazorpay();
      if (!res) {
        setErrorMessage('Payment service unavailable. Please check your internet connection and try again.');
        setLoading(false);
        return;
      }

      // 2. Create order on backend
      const orderResponse = await fetch('/api/payments/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            color: item.color,
            originalPrice: item.originalPrice,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl || '/placeholder-product.png', // Fallback for missing images
            sku: item.sku,
          })),
          subtotal,
          discountAmount: discountAmount + couponDiscount,
          shippingCost,
          totalAmount: orderTotal,
          couponCode: appliedCouponCode || undefined,
          customerEmail: formData.email,
          customerName: formData.fullName,
          customerPhone: formData.phone || undefined,
          shippingAddress: {
            fullName: formData.fullName,
            address: formData.address,
            city: formData.city,
            zipCode: formData.zipCode,
            phone: formData.phone,
          },
          userId: user?.uid || 'guest',
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        setErrorMessage(errorData.error || 'Order could not be initiated. Please try again.');
        setLoading(false);
        return;
      }

      const order = await orderResponse.json();

      // 3. Open Razorpay checkout modal
      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Zarevielle',
        description: 'Refined Leather Goods Selection',
        order_id: order.razorpayOrderId,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          // 4. Verify payment on backend
          try {
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (verifyResponse.ok) {
              // 5. On verification success: clear cart, navigate to success
              clearCart();
              navigate('/success');
            } else {
              const verifyError = await verifyResponse.json().catch(() => ({}));
              setErrorMessage(verifyError.error || 'Payment verification failed. Please contact support.');
              setLoading(false);
            }
          } catch {
            setErrorMessage('Payment verification failed. Please contact support.');
            setLoading(false);
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: '#5A5A40' },
        modal: {
          ondismiss: async () => {
            // Cancel the order when user closes payment modal
            try {
              await fetch('/api/payments/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ razorpay_order_id: order.razorpayOrderId }),
              });
            } catch (err) {
              console.error('Failed to cancel order:', err);
            }
            setErrorMessage('Payment was cancelled. You can retry by submitting again.');
            setLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Checkout error:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-24 md:py-32">
      <h1 className="text-4xl md:text-6xl font-serif tracking-tighter mb-8 md:mb-20 italic font-light opacity-60">Logistics & Secure Payment</h1>

      {errorMessage && (
        <div className="mb-6 md:mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Mobile Order Summary Toggle */}
      <div className="lg:hidden mb-6">
        <button
          type="button"
          onClick={() => setShowOrderSummary(!showOrderSummary)}
          className="w-full flex items-center justify-between p-4 bg-primary text-white rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} />
            <span className="text-sm font-bold uppercase tracking-wider">
              {showOrderSummary ? 'Hide' : 'Show'} Order Summary ({cart.length} items)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold">{formatCurrency(orderTotal)}</span>
            {showOrderSummary ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>
        
        {/* Collapsible Order Summary for Mobile */}
        {showOrderSummary && (
          <div className="mt-4 bg-surface border border-border-tan/30 rounded-3xl p-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
            {/* Cart Items */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {cart.map(item => (
                <div key={`${item.productId}-${item.variantId}`} className="flex gap-4 items-center">
                  <div className="w-16 h-20 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-border-tan/20">
                    <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="text-sm font-bold truncate">{item.name}</h4>
                    <p className="text-xs text-black/60">{item.color}</p>
                    <p className="text-xs text-black/40">{item.quantity} × {formatCurrency(item.price)}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Totals */}
            <div className="pt-4 border-t border-border-tan/30 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-black/60">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon</span>
                  <span>-{formatCurrency(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-black/60">Shipping</span>
                <span>{isFreeShipping ? 'Free' : formatCurrency(shippingCost)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border-tan/30 font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(orderTotal)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-20">
        <div className="lg:col-span-7 space-y-10 lg:space-y-16">
          {/* Contact Information */}
          <section className="space-y-6 lg:space-y-10">
            <div className="flex items-center gap-3 lg:gap-4 text-[10px] uppercase tracking-[0.3em] lg:tracking-[0.4em] font-bold pb-4 lg:pb-6 border-b border-border-tan/20 text-primary">
              <User size={16} strokeWidth={1.5} /> 
              <span>01. Contact Selection</span>
            </div>
            <div className="space-y-5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8">
              <div className="space-y-2 lg:space-y-3">
                <label className="text-[10px] lg:text-[9px] uppercase tracking-[0.2em] lg:tracking-[0.3em] text-black font-bold ml-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-5 lg:left-6 top-1/2 -translate-y-1/2 text-primary" size={16} />
                  <input 
                    type="email" 
                    name="email" 
                    required 
                    value={formData.email} 
                    onChange={handleInputChange}
                    autoComplete="email"
                    inputMode="email"
                    className="w-full bg-surface border border-border-tan/30 p-4 lg:p-5 pl-12 lg:pl-14 rounded-2xl lg:rounded-full text-sm lg:text-[11px] lg:uppercase lg:tracking-widest focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div className="space-y-2 lg:space-y-3">
                <label className="text-[10px] lg:text-[9px] uppercase tracking-[0.2em] lg:tracking-[0.3em] text-black font-bold ml-2">Full Name</label>
                <input 
                  type="text" 
                  name="fullName" 
                  required 
                  value={formData.fullName} 
                  onChange={handleInputChange}
                  autoComplete="name"
                  className="w-full bg-surface border border-border-tan/30 p-4 lg:p-5 px-5 lg:px-8 rounded-2xl lg:rounded-full text-sm lg:text-[11px] lg:uppercase lg:tracking-widest focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2 lg:space-y-3 lg:col-span-2">
                <label className="text-[10px] lg:text-[9px] uppercase tracking-[0.2em] lg:tracking-[0.3em] text-black font-bold ml-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-5 lg:left-6 top-1/2 -translate-y-1/2 text-primary" size={16} />
                  <input 
                    type="tel" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleInputChange}
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full bg-surface border border-border-tan/30 p-4 lg:p-5 pl-12 lg:pl-14 rounded-2xl lg:rounded-full text-sm lg:text-[11px] lg:uppercase lg:tracking-widest focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Shipping Details */}
          <section className="space-y-6 lg:space-y-10">
            <div className="flex items-center gap-3 lg:gap-4 text-[10px] uppercase tracking-[0.3em] lg:tracking-[0.4em] font-bold pb-4 lg:pb-6 border-b border-border-tan/20 text-primary">
              <Truck size={16} strokeWidth={1.5} /> 
              <span>02. Delivery Address</span>
              {loadingAddress && (
                <Loader2 size={14} className="animate-spin ml-2 text-primary/60" />
              )}
            </div>
            
            {/* Saved Address Indicator */}
            {savedAddress && !loadingAddress && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-green-700">
                    Address auto-filled from your last order
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSavedAddress(null);
                    setFormData(prev => ({
                      ...prev,
                      phone: '',
                      address: '',
                      city: '',
                      zipCode: '',
                    }));
                  }}
                  className="text-[10px] uppercase tracking-widest font-bold text-primary hover:text-primary/70 py-2 px-4 border border-primary/30 rounded-full lg:border-0 lg:p-0"
                >
                  Use Different Address
                </button>
              </div>
            )}
            
            <div className="space-y-5 lg:space-y-8">
              <div className="space-y-2 lg:space-y-3">
                <label className="text-[10px] lg:text-[9px] uppercase tracking-[0.2em] lg:tracking-[0.3em] text-black font-bold ml-2">Street Address</label>
                <div className="relative">
                  <MapPin className="absolute left-5 lg:left-6 top-1/2 -translate-y-1/2 text-primary" size={16} />
                  <input 
                    type="text" 
                    name="address" 
                    required 
                    value={formData.address} 
                    onChange={handleInputChange}
                    autoComplete="street-address"
                    className="w-full bg-surface border border-border-tan/30 p-4 lg:p-5 pl-12 lg:pl-14 rounded-2xl lg:rounded-full text-sm lg:text-[11px] lg:uppercase lg:tracking-widest focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
                    placeholder="123 Main Street, Apt 4B"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 lg:gap-8">
                <div className="space-y-2 lg:space-y-3">
                  <label className="text-[10px] lg:text-[9px] uppercase tracking-[0.2em] lg:tracking-[0.3em] text-black font-bold ml-2">City</label>
                  <input 
                    type="text" 
                    name="city" 
                    required 
                    value={formData.city} 
                    onChange={handleInputChange}
                    autoComplete="address-level2"
                    className="w-full bg-surface border border-border-tan/30 p-4 lg:p-5 px-5 lg:px-8 rounded-2xl lg:rounded-full text-sm lg:text-[11px] lg:uppercase lg:tracking-widest focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
                    placeholder="Mumbai"
                  />
                </div>
                <div className="space-y-2 lg:space-y-3">
                  <label className="text-[10px] lg:text-[9px] uppercase tracking-[0.2em] lg:tracking-[0.3em] text-black font-bold ml-2">PIN Code</label>
                  <input 
                    type="text" 
                    name="zipCode" 
                    required 
                    value={formData.zipCode} 
                    onChange={handleInputChange}
                    autoComplete="postal-code"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-full bg-surface border border-border-tan/30 p-4 lg:p-5 px-5 lg:px-8 rounded-2xl lg:rounded-full text-sm lg:text-[11px] lg:uppercase lg:tracking-widest focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
                    placeholder="400001"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Payment Info */}
          <section className="space-y-6 lg:space-y-10">
            <div className="flex items-center gap-3 lg:gap-4 text-[10px] uppercase tracking-[0.3em] lg:tracking-[0.4em] font-bold pb-4 lg:pb-6 border-b border-border-tan/20 text-primary">
              <ShieldCheck size={16} strokeWidth={1.5} /> 
              <span>03. Secure Payment</span>
            </div>
            <div className="p-8 lg:p-12 bg-white border border-border-tan/10 rounded-3xl lg:rounded-[48px] flex flex-col items-center justify-center gap-4 lg:gap-6 text-center card-shadow">
               <div className="w-14 h-14 lg:w-16 lg:h-16 bg-secondary rounded-full flex items-center justify-center">
                  <CreditCard size={24} className="text-primary lg:w-7 lg:h-7" />
               </div>
               <p className="text-xs lg:text-[11px] uppercase tracking-[0.15em] lg:tracking-[0.2em] font-medium text-black max-w-sm leading-relaxed">
                 You'll be redirected to Razorpay's secure payment gateway to complete your purchase.
               </p>
            </div>
          </section>

          {/* Mobile Coupon Section */}
          <section className="lg:hidden space-y-4">
            <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">Have a Coupon?</h3>
            {appliedCouponCode ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
                <span className="text-sm font-bold text-green-700">{appliedCouponCode}</span>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-[10px] uppercase tracking-widest font-bold text-red-500 hover:text-red-700 py-2 px-3"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1 bg-surface border border-border-tan/30 p-4 px-5 rounded-2xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-6 py-4 bg-primary text-white text-[10px] uppercase tracking-[0.15em] font-bold rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-50 min-w-[80px]"
                >
                  {couponLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Apply'}
                </button>
              </div>
            )}
            {couponMessage && (
              <p className={`text-sm ${couponValid ? 'text-green-600' : 'text-red-500'}`}>
                {couponMessage}
              </p>
            )}
          </section>

          {/* Mobile Submit Button */}
          <div className="lg:hidden pt-4">
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-primary text-white text-sm uppercase tracking-[0.2em] font-bold rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-50 shadow-xl flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Pay {formatCurrency(orderTotal)}
                </>
              )}
            </button>
            <p className="text-center text-[10px] uppercase tracking-widest text-black/40 mt-4">
              Secure checkout powered by Razorpay
            </p>
          </div>
        </div>

        {/* Order Sticky Sidebar - Desktop Only */}
        <div className="hidden lg:block lg:col-span-5 px-4">
          <div className="sticky top-32 space-y-8">
             {/* Coupon Code Input */}
             <div className="bg-surface border border-border-tan/30 p-8 rounded-[32px] space-y-4">
               <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary">Have a Coupon?</h3>
               {appliedCouponCode ? (
                 <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-full px-5 py-3">
                   <span className="text-[11px] uppercase tracking-widest font-bold text-green-700">{appliedCouponCode}</span>
                   <button
                     type="button"
                     onClick={handleRemoveCoupon}
                     className="text-[9px] uppercase tracking-widest font-bold text-red-500 hover:text-red-700"
                   >
                     Remove
                   </button>
                 </div>
               ) : (
                 <div className="flex gap-3">
                   <input
                     type="text"
                     value={couponCode}
                     onChange={(e) => setCouponCode(e.target.value)}
                     placeholder="Enter code"
                     className="flex-1 bg-white border border-border-tan/30 p-4 px-6 rounded-full text-[11px] uppercase tracking-widest focus:outline-none focus:border-primary"
                   />
                   <button
                     type="button"
                     onClick={handleApplyCoupon}
                     disabled={couponLoading || !couponCode.trim()}
                     className="px-6 py-4 bg-primary text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-full hover:bg-primary/90 transition-all disabled:opacity-50"
                   >
                     {couponLoading ? '...' : 'Apply'}
                   </button>
                 </div>
               )}
               {couponMessage && (
                 <p className={`text-[11px] ${couponValid ? 'text-green-600' : 'text-red-500'}`}>
                   {couponMessage}
                 </p>
               )}
             </div>

             <div className="bg-primary text-white p-12 rounded-[60px] space-y-12 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold border-b border-white/10 pb-6 opacity-60">The Selection Archive</h3>
                <div className="space-y-8 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                   {cart.map(item => (
                     <div key={`${item.productId}-${item.variantId}`} className="flex gap-6 items-center">
                        <div className="w-16 h-20 bg-white/5 rounded-[12px] p-1 border border-white/10 overflow-hidden flex-shrink-0">
                           <img src={item.imageUrl} className="w-full h-full object-cover rounded-[8px]" alt={item.name} />
                        </div>
                        <div className="flex-grow">
                           <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] mb-1">{item.name}</h4>
                           <p className="text-[9px] text-white/60 font-medium">{item.color}</p>
                           <p className="text-[9px] text-white/40 font-serif italic">{item.quantity} Unit · {formatCurrency(item.price)}</p>
                        </div>
                     </div>
                   ))}
                </div>
                
                <div className="pt-10 border-t border-white/10 space-y-4">
                   <div className="flex justify-between items-baseline text-sm">
                      <span className="opacity-40">Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                   </div>
                   {discountAmount > 0 && (
                     <div className="flex justify-between items-baseline text-sm">
                        <span className="opacity-40">Discount</span>
                        <span className="text-green-300">-{formatCurrency(discountAmount)}</span>
                     </div>
                   )}
                   {couponDiscount > 0 && (
                     <div className="flex justify-between items-baseline text-sm">
                        <span className="opacity-40">Coupon ({appliedCouponCode})</span>
                        <span className="text-green-300">-{formatCurrency(couponDiscount)}</span>
                     </div>
                   )}
                   <div className="flex justify-between items-baseline text-sm">
                      <span className="opacity-40">Shipping</span>
                      <span>{isFreeShipping ? 'Free' : formatCurrency(shippingCost)}</span>
                   </div>
                   <div className="flex justify-between items-baseline font-serif pt-4 border-t border-white/10">
                      <span className="text-sm opacity-40 italic">Valuation</span>
                      <span className="text-4xl text-white tracking-widest">{formatCurrency(orderTotal)}</span>
                   </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-6 bg-white text-primary text-[11px] uppercase tracking-[0.4em] font-bold rounded-full hover:bg-white/90 transition-all disabled:opacity-50 shadow-xl"
                >
                  {loading ? 'Processing...' : 'Validate Selection'}
                </button>
             </div>
             
             <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary text-center space-y-4 px-12">
                <div className="flex items-center justify-center gap-3">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                   <span>Priority Global In-Transit</span>
                </div>
                <p className="text-[9px] opacity-60 leading-loose">
                  Complimentary High-Value Insurance Included <br />
                  Carbon-Neutral Fulfillment Cycle
                </p>
             </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
