import React from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Truck } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';

const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_COST = 79;

const Cart: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();

  const shippingCost = cartTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const orderTotal = cartTotal + shippingCost;
  const amountForFreeShipping = FREE_SHIPPING_THRESHOLD - cartTotal;
  const freeShippingProgress = Math.min((cartTotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

  if (cartCount === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-40 text-center space-y-12">
        <div className="flex justify-center text-text-dark/10">
          <ShoppingBag size={100} strokeWidth={0.5} />
        </div>
        <h1 className="text-5xl font-serif tracking-tighter text-black italic">Your Selection is Currently Empty</h1>
        <Link 
          to="/collection" 
          className="inline-flex items-center gap-6 px-12 py-5 bg-primary text-white text-[11px] uppercase tracking-[0.4em] font-bold rounded-full hover:bg-black transition-all shadow-xl"
        >
          Explore the Archive
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-32">
      <h1 className="text-6xl font-serif tracking-tighter mb-16 px-4">Shopping <span className="italic font-light opacity-60">Selection</span></h1>
      
      {/* Free Shipping Banner */}
      {cartTotal < FREE_SHIPPING_THRESHOLD && (
        <div className="mx-4 mb-12 p-5 bg-surface border border-border-tan/30 rounded-3xl">
          <div className="flex items-center gap-3 mb-3">
            <Truck size={16} className="text-primary" />
            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-primary">
              Add {formatCurrency(amountForFreeShipping)} more for free shipping
            </p>
          </div>
          <div className="w-full h-2 bg-border-tan/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
          <p className="text-[9px] text-black/50 mt-2 uppercase tracking-widest">Free shipping on orders ₹999+</p>
        </div>
      )}

      {cartTotal >= FREE_SHIPPING_THRESHOLD && (
        <div className="mx-4 mb-12 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
          <Truck size={16} className="text-green-600" />
          <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-green-700">
            You've unlocked free shipping!
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
        <div className="lg:col-span-7 space-y-12 px-4">
          {cart.map((item) => (
            <motion.div 
              key={`${item.productId}-${item.variantId}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="group flex gap-8 pb-12 border-b border-border-tan/20 items-center"
            >
              <div className="w-28 h-36 bg-surface rounded-[24px] border border-border-tan/30 overflow-hidden flex-shrink-0 card-shadow p-2">
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-[18px]" />
              </div>
              
              <div className="flex-grow space-y-2">
                <h3 className="text-[11px] uppercase tracking-[0.3em] font-bold text-primary">{item.name}</h3>
                <p className="text-[10px] text-black uppercase tracking-[0.2em] font-semibold">{item.color}</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-serif italic text-text-dark/80">{formatCurrency(item.price)}</p>
                  {item.originalPrice > item.price && (
                    <p className="text-sm font-serif italic text-text-dark/40 line-through">{formatCurrency(item.originalPrice)}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-6 pt-4">
                  <div className="flex items-center gap-4 bg-secondary border border-border-tan/30 p-1 rounded-full px-2">
                    <button onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white transition-colors"><Minus size={12}/></button>
                    <span className="w-6 text-center text-[10px] font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white transition-colors"><Plus size={12}/></button>
                  </div>
                  
                  <button 
                    onClick={() => removeFromCart(item.productId, item.variantId)}
                    className="text-[10px] uppercase tracking-widest font-extrabold text-red-600/70 hover:text-red-800 transition-colors cursor-pointer"
                  >
                    Remove Piece
                  </button>
                </div>
              </div>

              <div className="hidden sm:block text-lg font-serif font-light text-right w-24">
                {formatCurrency(item.price * item.quantity)}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="lg:col-span-5 px-4">
          <div className="bg-surface border border-border-tan/30 rounded-[48px] p-12 space-y-12 sticky top-32 card-shadow">
            <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary/70 border-b border-border-tan/10 pb-6">Accounting & Logistics</h3>
            
            <div className="space-y-6 text-[10px] uppercase tracking-[0.3em] font-bold">
              <div className="flex justify-between">
                <span className="text-text-dark/70">Archive Subtotal</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-primary">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-dark/70">Value Added Tax</span>
                <span>Inclusive</span>
              </div>
              <div className="pt-8 border-t border-border-tan/10 flex justify-between font-serif text-3xl italic tracking-tighter lowercase">
                <span className="text-text-dark/70">total</span>
                <span className="text-primary">{formatCurrency(orderTotal)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <Link 
                to="/checkout" 
                className="block w-full py-6 bg-primary text-white text-center text-[11px] uppercase tracking-[0.3em] font-bold rounded-full hover:bg-black transition-all shadow-xl"
              >
                Proceed to Secure Checkout
              </Link>
              
              <div className="flex items-center justify-center gap-3 pt-4 opacity-60">
                 <ShieldCheck size={14} />
                 <p className="text-[9px] uppercase tracking-[0.2em] font-bold">
                    Encrypted Transaction Protocol
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
