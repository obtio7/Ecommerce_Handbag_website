import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product, ProductVariant, Review, CartItem, mapApiProduct } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ArrowLeft, Plus, Minus, MessageSquare, Loader2, ZoomIn, X, Share2, Facebook, Twitter, Link as LinkIcon, Clock } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import SwipeableGallery from '../components/SwipeableGallery';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { recentlyViewed, addToRecentlyViewed } = useRecentlyViewed();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [showShareMenu, setShowShareMenu] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  const selectedVariant: ProductVariant | undefined = product?.variants?.[selectedVariantIndex];
  
  // Filter recently viewed to exclude current product
  const filteredRecentlyViewed = recentlyViewed.filter(p => (p.id || p._id) !== id).slice(0, 4);
  
  // Get all images for the selected variant
  const variantImages = selectedVariant?.images || [];
  const allImages = variantImages.length > 0 ? variantImages : (product?.imageUrl ? [product.imageUrl] : []);
  
  // Reset selected image when variant changes
  React.useEffect(() => {
    setSelectedImageIndex(0);
  }, [selectedVariantIndex]);

  // Handle mouse move for zoom
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  // Share functionality
  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out ${product?.name} at Zarevielle!`;
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
        break;
    }
    setShowShareMenu(false);
  };

  useEffect(() => {
    if (!id) return;

    // Scroll to top when product page loads
    window.scrollTo({ top: 0, behavior: 'instant' });

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/products/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found');
          }
          throw new Error('Failed to fetch product');
        }
        const data = await response.json();
        const mappedProduct = mapApiProduct(data);
        setProduct(mappedProduct);
        // Add to recently viewed
        addToRecentlyViewed(mappedProduct);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Fetch recommendations (other products)
  useEffect(() => {
    if (!id) return;
    
    const fetchRecommendations = async () => {
      try {
        // Fetch more products to ensure we have enough after filtering
        const response = await fetch('/api/products?pageSize=20');
        if (response.ok) {
          const data = await response.json();
          const allProducts: Product[] = (data.data || []).map(mapApiProduct);
          // Filter out current product and take up to 4
          const filtered = allProducts.filter(p => p.id !== id).slice(0, 4);
          setRecommendations(filtered);
        }
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
      }
    };
    
    fetchRecommendations();
  }, [id]);

  // Fetch reviews from MongoDB API
  useEffect(() => {
    if (!id) return;
    
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/reviews/${id}`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data);
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      }
    };
    
    fetchReviews();
  }, [id]);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    setSubmittingReview(true);
    setReviewError(null);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: id,
          userId: user.uid,
          userName: user.displayName || 'Anonymous',
          rating: newReview.rating,
          comment: newReview.comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      // Add the new review to the list
      setReviews(prev => [data, ...prev]);
      setNewReview({ rating: 5, comment: '' });
    } catch (error: any) {
      setReviewError(error.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    const cartItem: CartItem = {
      productId: product.id,
      variantId: selectedVariant._id,
      name: product.name,
      color: selectedVariant.color.name,
      price: selectedVariant.price,
      originalPrice: selectedVariant.compareAtPrice || selectedVariant.price,
      quantity,
      imageUrl: selectedVariant.images[0] || product.imageUrl,
      sku: selectedVariant.sku,
      stock: selectedVariant.stock,
    };

    // Add to cart (quantity times)
    for (let i = 0; i < quantity; i++) {
      addToCart(cartItem);
    }
  };

  const handleBuyNow = () => {
    if (!product || !selectedVariant) return;

    const cartItem: CartItem = {
      productId: product.id,
      variantId: selectedVariant._id,
      name: product.name,
      color: selectedVariant.color.name,
      price: selectedVariant.price,
      originalPrice: selectedVariant.compareAtPrice || selectedVariant.price,
      quantity,
      imageUrl: selectedVariant.images[0] || product.imageUrl,
      sku: selectedVariant.sku,
      stock: selectedVariant.stock,
    };

    // Add to cart and navigate to checkout
    for (let i = 0; i < quantity; i++) {
      addToCart(cartItem);
    }
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <p className="font-serif italic text-2xl text-red-500/80">{error || 'Product not found'}</p>
        <Link
          to="/collection"
          className="mt-4 px-6 py-2 text-[10px] uppercase tracking-[0.2em] font-bold border border-primary rounded-full hover:bg-primary hover:text-white transition-all"
        >
          Back to Collection
        </Link>
      </div>
    );
  }

  const displayPrice = selectedVariant?.price || product.price;
  const compareAtPrice = selectedVariant?.compareAtPrice;
  const discount = selectedVariant?.discount;
  const displayImage = allImages[selectedImageIndex] || product.imageUrl;
  const variantStock = selectedVariant?.stock ?? 0;
  const isOutOfStock = variantStock === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-32">
      <Link to="/collection" className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-bold mb-16 hover:text-primary transition-all">
        <ArrowLeft size={14} strokeWidth={1.5} /> Back to Archive
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-20 lg:gap-32 items-start px-4">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Mobile: Swipeable Gallery */}
          <div className="md:hidden">
            <SwipeableGallery 
              images={allImages} 
              productName={product.name}
            />
            {discount && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold z-10">
                {discount.label || `${discount.percentage}% Off`}
              </div>
            )}
          </div>

          {/* Desktop: Zoomable Image */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            ref={imageRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            className="hidden md:block aspect-[4/5] bg-surface rounded-[48px] overflow-hidden border border-border-tan/30 card-shadow p-4 relative cursor-zoom-in group"
          >
            <div className="w-full h-full rounded-[32px] overflow-hidden relative">
              <img 
                src={displayImage} 
                alt={product.name} 
                className={cn(
                  "w-full h-full object-cover transition-transform duration-200",
                  isZoomed && "scale-150"
                )}
                style={isZoomed ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` } : undefined}
                referrerPolicy="no-referrer" 
              />
              {/* Zoom indicator */}
              <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                <ZoomIn size={12} />
                Hover to zoom
              </div>
            </div>
            {discount && (
              <div className="absolute top-8 left-8 bg-red-500 text-white px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold">
                {discount.label || `${discount.percentage}% Off`}
              </div>
            )}
            {/* Share button */}
            <div className="absolute top-8 right-8">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all"
              >
                <Share2 size={18} className="text-black" />
              </button>
              {/* Share menu */}
              <AnimatePresence>
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="absolute top-14 right-0 bg-white rounded-2xl shadow-xl border border-border-tan/30 p-2 min-w-[160px] z-10"
                  >
                    <button
                      onClick={() => handleShare('facebook')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface rounded-xl transition-colors"
                    >
                      <Facebook size={16} className="text-blue-600" />
                      Facebook
                    </button>
                    <button
                      onClick={() => handleShare('twitter')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface rounded-xl transition-colors"
                    >
                      <Twitter size={16} className="text-sky-500" />
                      Twitter
                    </button>
                    <button
                      onClick={() => handleShare('whatsapp')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface rounded-xl transition-colors"
                    >
                      <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </button>
                    <button
                      onClick={() => handleShare('copy')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface rounded-xl transition-colors"
                    >
                      <LinkIcon size={16} className="text-black/60" />
                      Copy Link
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
          
          {/* Image Thumbnails - Desktop only */}
          {allImages.length > 1 && (
            <div className="hidden md:flex gap-3 overflow-x-auto pb-2 px-1">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={cn(
                    "flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all",
                    idx === selectedImageIndex
                      ? "border-primary ring-2 ring-primary/30 scale-105"
                      : "border-border-tan/30 hover:border-primary/50 opacity-70 hover:opacity-100"
                  )}
                >
                  <img 
                    src={img} 
                    alt={`${product.name} view ${idx + 1}`} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-16"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-8 h-px bg-primary opacity-20"></span>
              <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary">{product.category}</p>
            </div>
            <h1 className="text-6xl md:text-8xl font-serif tracking-tighter leading-none">{product.name}</h1>
            <div className="flex items-center gap-4">
              <p className="text-3xl font-light text-black italic">{formatCurrency(displayPrice)}</p>
              {compareAtPrice && compareAtPrice > displayPrice && (
                <p className="text-xl font-light text-black/40 line-through italic">{formatCurrency(compareAtPrice)}</p>
              )}
              {discount && (
                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold">
                  {discount.percentage}% Off
                </span>
              )}
            </div>
          </div>

          <div className="space-y-10">
            <p className="text-black text-lg leading-relaxed max-w-md italic font-serif">
              "{product.description}"
            </p>

            {/* Color/Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">
                  Color — {selectedVariant?.color.name}
                </p>
                <div className="flex gap-3">
                  {product.variants.map((variant, idx) => (
                    <button
                      key={variant._id}
                      onClick={() => {
                        setSelectedVariantIndex(idx);
                        setQuantity(1);
                      }}
                      className={cn(
                        'w-10 h-10 rounded-full border-2 shadow-sm transition-all',
                        idx === selectedVariantIndex
                          ? 'border-primary scale-110 ring-2 ring-primary/30'
                          : 'border-border-tan/30 hover:border-primary/50'
                      )}
                      style={{ backgroundColor: variant.color.hexCode }}
                      title={variant.color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Stock indicator */}
            <div className="text-[10px] uppercase tracking-[0.2em] font-bold">
              {isOutOfStock ? (
                <span className="text-red-500">Out of Stock</span>
              ) : variantStock <= 5 ? (
                <span className="text-orange-500">Only {variantStock} left in stock</span>
              ) : (
                <span className="text-green-600">In Stock</span>
              )}
            </div>

            {/* Material & Dimensions */}
            {product.material && (
              <p className="text-[10px] uppercase tracking-[0.2em] text-black/60 font-medium">
                Material: {product.material}
              </p>
            )}
            
            <div className="flex flex-col gap-6 pt-4">
               <div className="flex items-center gap-6 bg-surface border border-border-tan/30 w-fit p-2 rounded-full shadow-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
                    disabled={isOutOfStock}
                  >
                    <Minus size={14}/>
                  </button>
                  <span className="w-6 text-center text-xs font-bold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(variantStock, quantity + 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
                    disabled={isOutOfStock || quantity >= variantStock}
                  >
                    <Plus size={14}/>
                  </button>
               </div>
               <div className="flex flex-col sm:flex-row gap-4">
                 <button 
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={cn(
                      "w-full sm:w-fit px-12 py-6 text-[11px] uppercase tracking-[0.3em] font-bold rounded-full transition-all shadow-xl",
                      isOutOfStock
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-primary text-white hover:bg-black"
                    )}
                 >
                    {isOutOfStock ? 'Out of Stock' : 'Add to Bag'}
                 </button>
                 <button 
                    onClick={() => {
                      handleAddToCart();
                      navigate('/checkout');
                    }}
                    disabled={isOutOfStock}
                    className={cn(
                      "w-full sm:w-fit px-12 py-6 text-[11px] uppercase tracking-[0.3em] font-bold rounded-full transition-all shadow-xl",
                      isOutOfStock
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-black text-white hover:bg-gray-800"
                    )}
                 >
                    Buy Now
                 </button>
               </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recommendations Section - Always show */}
      <section className="mt-32 pt-20 border-t border-border-tan/30">
        <div className="px-4">
          <h2 className="text-4xl md:text-5xl font-serif tracking-tighter mb-12">
            You May <span className="italic font-light opacity-60">Also Like</span>
          </h2>
          {recommendations.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {recommendations.map((rec) => {
                const firstVariant = rec.variants?.[0];
                const recImage = firstVariant?.images?.[0] || rec.imageUrl;
                const recPrice = firstVariant?.price || rec.basePrice || rec.price;
                
                return (
                  <Link
                    key={rec.id}
                    to={`/product/${rec.id}`}
                    className="group"
                  >
                    <div className="aspect-[4/5] bg-surface rounded-[24px] overflow-hidden mb-4 border border-border-tan/30">
                      <img
                        src={recImage}
                        alt={rec.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <h3 className="font-serif text-lg text-text-dark group-hover:text-primary transition-colors">
                      {rec.name}
                    </h3>
                    <p className="text-sm text-text-dark/60 mt-1">
                      {formatCurrency(recPrice)}
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-text-dark/40 font-serif italic">
              <p>Explore our collection for more beautiful pieces</p>
              <Link 
                to="/collection" 
                className="inline-block mt-4 px-8 py-3 text-[10px] uppercase tracking-[0.2em] font-bold border border-primary rounded-full hover:bg-primary hover:text-white transition-all"
              >
                View Collection
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Reviews Section */}
      <section className="mt-20 pt-16 border-t border-border-tan/30">
        <div className="px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
            <h2 className="text-4xl md:text-5xl font-serif tracking-tighter">Client <span className="italic font-light opacity-60">Correspondence</span></h2>
            <div className="flex items-center gap-3">
              <div className="flex text-primary">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} fill={i <= 4 ? "currentColor" : "none"} strokeWidth={1.5} />)}
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold">{reviews.length > 0 ? `${(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)} Rating` : 'No reviews yet'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Review Form */}
            <div className="lg:col-span-1">
              {user ? (
                <form onSubmit={handleAddReview} className="space-y-5 bg-surface p-6 md:p-8 rounded-[24px] border border-border-tan/30 card-shadow sticky top-32">
                  <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Share your Perspective</h4>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <button 
                        key={i} 
                        type="button"
                        onClick={() => setNewReview(prev => ({ ...prev, rating: i }))}
                        className={cn("transition-colors hover:scale-110", newReview.rating >= i ? "text-primary" : "text-text-dark/20 hover:text-primary/50")}
                      >
                        <Star size={24} fill={newReview.rating >= i ? "currentColor" : "none"} strokeWidth={1.5} />
                      </button>
                    ))}
                  </div>
                  <textarea 
                    value={newReview.comment}
                    onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Share your thoughts on the craft..." 
                    className="w-full bg-white border border-border-tan/30 p-4 rounded-[16px] text-sm focus:outline-none focus:border-primary min-h-[120px] resize-none"
                    required
                    disabled={submittingReview}
                  />
                  {reviewError && (
                    <p className="text-sm text-red-500">{reviewError}</p>
                  )}
                  <button 
                    type="submit"
                    disabled={submittingReview}
                    className="w-full py-4 bg-primary text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-full hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submittingReview ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Publish Review'
                    )}
                  </button>
                </form>
              ) : (
                <div className="bg-surface p-6 md:p-8 rounded-[24px] border border-border-tan/30 text-center">
                  <MessageSquare size={32} className="mx-auto mb-4 text-primary/30" strokeWidth={1} />
                  <p className="font-serif italic text-black mb-4">Please sign in to join the conversation.</p>
                  <button 
                    onClick={() => navigate('/login')}
                    className="px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold border border-primary rounded-full hover:bg-primary hover:text-white transition-all"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>

            {/* Reviews List */}
            <div className="lg:col-span-2">
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-white p-5 md:p-6 rounded-[20px] border border-border-tan/20 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{review.userName.charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="text-sm font-semibold">{review.userName}</span>
                        </div>
                        <div className="flex text-primary">
                          {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill={i <= review.rating ? "currentColor" : "none"} strokeWidth={1.5} />)}
                        </div>
                      </div>
                      <p className="text-base font-serif italic text-text-dark/80 leading-relaxed">"{review.comment}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-text-dark/20 bg-surface/50 rounded-[24px] border border-border-tan/20">
                  <MessageSquare size={48} strokeWidth={1} className="mb-4" />
                  <p className="font-serif italic text-xl text-text-dark/40">No reviews yet.</p>
                  <p className="text-sm text-text-dark/30 mt-2">Be the first to share your experience!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Recently Viewed Section */}
      {filteredRecentlyViewed.length > 0 && (
        <section className="mt-20 pt-16 border-t border-border-tan/30">
          <div className="px-4">
            <div className="flex items-center gap-3 mb-10">
              <Clock size={20} className="text-primary/60" />
              <h2 className="text-3xl md:text-4xl font-serif tracking-tighter">
                Recently <span className="italic font-light opacity-60">Viewed</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {filteredRecentlyViewed.map((item) => {
                const itemId = item.id || item._id;
                const firstVariant = item.variants?.[0];
                const itemImage = firstVariant?.images?.[0] || item.imageUrl;
                const itemPrice = firstVariant?.price || item.basePrice || item.price;
                
                return (
                  <Link
                    key={itemId}
                    to={`/product/${itemId}`}
                    className="group"
                  >
                    <div className="aspect-[4/5] bg-surface rounded-[24px] overflow-hidden mb-4 border border-border-tan/30">
                      <img
                        src={itemImage}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <h3 className="font-serif text-lg text-text-dark group-hover:text-primary transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-sm text-text-dark/60 mt-1">
                      {formatCurrency(itemPrice)}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
