import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag, ArrowRight, Check } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../lib/utils';
import { Product, CartItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';

const Wishlist: React.FC = () => {
  const { wishlist, removeFromWishlist, wishlistCount, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  const handleAddToCart = (item: Product) => {
    const firstVariant = item.variants?.[0];
    if (!firstVariant) return;
    
    const cartItem: CartItem = {
      productId: item.id || item._id || '',
      variantId: firstVariant._id,
      name: item.name,
      color: firstVariant.color.name,
      price: firstVariant.price,
      originalPrice: firstVariant.compareAtPrice || firstVariant.price,
      quantity: 1,
      imageUrl: firstVariant.images?.[0] || item.imageUrl,
      sku: firstVariant.sku,
      stock: firstVariant.stock,
    };
    addToCart(cartItem);
    
    // Show added confirmation
    const itemId = item.id || item._id || '';
    setAddedItems(prev => new Set(prev).add(itemId));
    setTimeout(() => {
      setAddedItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }, 2000);
  };

  const handleMoveAllToCart = () => {
    wishlist.forEach(item => handleAddToCart(item));
  };

  if (wishlistCount === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center space-y-12">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex justify-center text-black/10"
        >
          <Heart size={100} strokeWidth={0.5} />
        </motion.div>
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-serif tracking-tighter text-black italic"
        >
          Your Wishlist is Empty
        </motion.h1>
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-black/60 max-w-md mx-auto"
        >
          Browse the collection and click the heart icon to save items you love. Your wishlist will be waiting for you.
        </motion.p>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Link 
            to="/collection" 
            className="inline-flex items-center gap-4 px-10 py-4 bg-primary text-white text-[11px] uppercase tracking-[0.3em] font-bold rounded-full hover:bg-black transition-all shadow-xl"
          >
            Explore Collection
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-32">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
        <div>
          <h1 className="text-5xl md:text-6xl font-serif tracking-tighter mb-2">My <span className="italic font-light opacity-60">Wishlist</span></h1>
          <p className="text-sm text-black/60">{wishlistCount} item{wishlistCount !== 1 ? 's' : ''} saved</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleMoveAllToCart}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-full hover:bg-black transition-all"
          >
            <ShoppingBag size={14} />
            Add All to Bag
          </button>
          <button
            onClick={clearWishlist}
            className="flex items-center gap-2 px-6 py-3 border border-red-200 text-red-600 text-[10px] uppercase tracking-[0.2em] font-bold rounded-full hover:bg-red-50 transition-all"
          >
            <Trash2 size={14} />
            Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {wishlist.map((item, index) => {
            const itemId = item.id || item._id || '';
            const isAdded = addedItems.has(itemId);
            const firstVariant = item.variants?.[0];
            const displayImage = firstVariant?.images?.[0] || item.imageUrl;
            const displayPrice = firstVariant?.price || item.basePrice || item.price;
            
            return (
              <motion.div 
                key={itemId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border border-border-tan/30 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group"
              >
                <Link to={`/product/${itemId}`} className="block relative">
                  <div className="aspect-[4/5] overflow-hidden bg-surface">
                    <img 
                      src={displayImage} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  {/* Remove button overlay */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeFromWishlist(itemId);
                    }}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    title="Remove from wishlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </Link>
                
                <div className="p-5 space-y-3">
                  <Link to={`/product/${itemId}`}>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-black hover:text-primary transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-black/50 uppercase tracking-wider">{item.category}</p>
                    {item.variants && item.variants.length > 1 && (
                      <div className="flex gap-1">
                        {item.variants.slice(0, 4).map((v, i) => (
                          <div 
                            key={i}
                            className="w-4 h-4 rounded-full border border-border-tan/50"
                            style={{ backgroundColor: v.color.hexCode }}
                            title={v.color.name}
                          />
                        ))}
                        {item.variants.length > 4 && (
                          <span className="text-[10px] text-black/40">+{item.variants.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-lg font-serif italic text-black">{formatCurrency(displayPrice)}</p>
                  
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={!firstVariant || firstVariant.stock === 0}
                    className={`w-full flex items-center justify-center gap-2 py-3 text-[10px] uppercase tracking-widest font-bold rounded-full transition-all ${
                      isAdded
                        ? 'bg-green-500 text-white'
                        : !firstVariant || firstVariant.stock === 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-black'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check size={14} />
                        Added to Bag
                      </>
                    ) : !firstVariant || firstVariant.stock === 0 ? (
                      'Out of Stock'
                    ) : (
                      <>
                        <ShoppingBag size={14} />
                        Add to Bag
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Continue Shopping */}
      <div className="mt-16 text-center">
        <Link 
          to="/collection"
          className="inline-flex items-center gap-2 text-sm text-black/60 hover:text-primary transition-colors"
        >
          Continue Shopping
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
};

export default Wishlist;
