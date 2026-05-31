import React, { useState } from 'react';
import { Product, CartItem } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, Plus } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const productId = product.id || product._id || '';
  const inWishlist = isInWishlist(productId);

  // Track selected variant index for color switching
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  // Get selected variant (or first variant as fallback)
  const selectedVariant = product.variants?.[selectedVariantIndex] || product.variants?.[0];

  // Check if any variant has a discount
  const discountVariant = product.variants?.find(v => v.discount);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedVariant) return;

    const cartItem: CartItem = {
      productId,
      variantId: selectedVariant._id,
      name: product.name,
      color: selectedVariant.color.name,
      price: selectedVariant.price,
      originalPrice: selectedVariant.compareAtPrice || selectedVariant.price,
      quantity: 1,
      imageUrl: selectedVariant.images?.[0] || product.imageUrl,
      sku: selectedVariant.sku,
      stock: selectedVariant.stock,
    };

    addToCart(cartItem);
  };

  // Get the display image based on selected variant
  const displayImage = selectedVariant?.images?.[0] || product.imageUrl;
  const displayPrice = selectedVariant?.price || product.basePrice || product.price;
  const compareAtPrice = selectedVariant?.compareAtPrice;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-surface p-4 rounded-[32px] border border-border-tan/30 card-shadow"
      id={`product-${product.id}`}
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-[4/5] overflow-hidden bg-secondary rounded-[24px] mb-6 relative">
          <img 
            src={displayImage} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          
          {/* Discount badge */}
          {discountVariant?.discount && (
            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-[9px] uppercase tracking-widest font-bold">
              {discountVariant.discount.label || `${discountVariant.discount.percentage}% Off`}
            </div>
          )}

          <button 
            onClick={handleWishlistToggle}
            className={`absolute top-4 right-4 p-3 rounded-full transition-all duration-300 card-shadow ${
              inWishlist 
                ? 'bg-red-500 text-white opacity-100 translate-y-0' 
                : 'bg-white/80 backdrop-blur-sm opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-primary hover:text-white'
            }`}
          >
            <Heart size={18} strokeWidth={1.5} fill={inWishlist ? 'currentColor' : 'none'} />
          </button>

          <button 
            onClick={handleAddToCart}
            className="absolute bottom-4 left-4 right-4 py-4 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-full opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 hover:bg-black/80 flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Add to Bag
          </button>
        </div>
      </Link>
      
      <div className="space-y-2 px-2">
        <Link to={`/product/${product.id}`} className="block">
          <h3 className="serif text-xl text-text-dark group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Color swatches - now clickable */}
        {product.variants && product.variants.length > 1 && (
          <div className="flex gap-1.5 py-1">
            {product.variants.map((variant, idx) => (
              <button
                key={variant._id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedVariantIndex(idx);
                }}
                className={cn(
                  "w-5 h-5 rounded-full border-2 transition-all cursor-pointer",
                  idx === selectedVariantIndex
                    ? "border-primary scale-110 ring-2 ring-primary/30"
                    : "border-border-tan/40 hover:border-primary/50"
                )}
                style={{ backgroundColor: variant.color.hexCode }}
                title={variant.color.name}
              />
            ))}
          </div>
        )}

        <div className="flex justify-between items-center">
          <p className="text-[10px] text-black font-bold uppercase tracking-widest">{product.category}</p>
          <div className="flex items-center gap-2">
            {compareAtPrice && compareAtPrice > displayPrice && (
              <p className="text-sm font-light text-text-dark/40 line-through">{formatCurrency(compareAtPrice)}</p>
            )}
            <p className="text-lg font-light text-text-dark opacity-80">{formatCurrency(displayPrice)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
