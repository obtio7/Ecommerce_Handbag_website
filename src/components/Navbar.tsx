import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingBag, User, Heart, Search, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, mapApiProduct } from '../types';
import { useWishlist } from '../context/WishlistContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Fetch more products to search through
        const res = await fetch(`/api/products?pageSize=100`);
        if (res.ok) {
          const data = await res.json();
          const mapped: Product[] = data.data.map(mapApiProduct);
          const query = searchQuery.toLowerCase();
          const filtered = mapped.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query)
          );
          setSearchResults(filtered.slice(0, 8));
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  // Handle search form submit (go to collection with search)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      navigate(`/collection?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleResultClick = (productId: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    navigate(`/product/${productId}`);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 bg-secondary/90 backdrop-blur-md border-b border-border-tan/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-serif tracking-tighter font-bold text-primary">
              ZAREVIELLE
            </Link>
            <div className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-[0.2em] font-semibold text-black">
              <Link to="/collection" className="hover:text-primary transition-colors">Collection</Link>
              <Link to="/about" className="hover:text-primary transition-colors">About</Link>
              <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
              {user && <Link to="/orders" className="hover:text-primary transition-colors">My Orders</Link>}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-black hover:text-primary transition-colors"
            >
              {searchOpen ? <X size={20} strokeWidth={1.5} /> : <Search size={20} strokeWidth={1.5} />}
            </button>
            <Link to="/wishlist" className="p-2 text-black hover:text-primary transition-colors relative hidden sm:block">
              <Heart size={20} strokeWidth={1.5} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-400 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link to="/cart" className="p-2 text-black hover:text-primary transition-colors relative hidden sm:block">
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-400 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
            
            <div className="hidden md:flex items-center">
              {user ? (
                <div className="flex items-center gap-4">
                  <Link 
                    to="/account" 
                    className="text-[10px] uppercase tracking-widest text-black hover:text-primary font-bold"
                  >
                    Account
                  </Link>
                  <Link to="/account" className="w-8 h-8 rounded-full overflow-hidden border border-border-tan shadow-sm hover:border-primary transition-colors">
                    <img src={user.photoURL || ''} alt={user.displayName || 'User'} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </Link>
                </div>
              ) : (
                <button 
                  onClick={() => navigate('/account')}
                  className="flex items-center gap-2 p-2 text-black hover:text-primary transition-colors"
                  id="login-button"
                >
                  <User size={20} strokeWidth={1.5} />
                  <span className="hidden sm:inline text-[10px] uppercase tracking-widest font-bold">Login</span>
                </button>
              )}
            </div>
            
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Search Dropdown */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 bg-white border-b border-border-tan shadow-lg z-50"
          >
            <div className="max-w-2xl mx-auto px-4 py-6">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-12 pr-4 py-3 border border-border-tan rounded-full text-sm focus:outline-none focus:border-primary bg-surface"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </form>

              {/* Results */}
              {searchQuery.trim() && (
                <div className="mt-4">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="space-y-1 max-h-[400px] overflow-y-auto">
                        {searchResults.map((product) => {
                          const firstVariant = product.variants?.[0];
                          const productImage = firstVariant?.images?.[0] || product.imageUrl;
                          const productPrice = firstVariant?.price || product.basePrice || product.price;
                          
                          return (
                            <button
                              key={product.id}
                              onClick={() => handleResultClick(product.id)}
                              className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-surface transition-colors text-left group"
                            >
                              <div className="w-14 h-14 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                                <img
                                  src={productImage}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-black truncate">{product.name}</p>
                                <p className="text-xs text-black/50">{product.category}</p>
                              </div>
                              <p className="text-sm font-medium text-primary">₹{productPrice}</p>
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => {
                          setSearchOpen(false);
                          navigate(`/collection?search=${encodeURIComponent(searchQuery.trim())}`);
                          setSearchQuery('');
                        }}
                        className="w-full mt-4 py-3 text-center text-[11px] uppercase tracking-[0.2em] font-bold text-primary hover:bg-primary/5 rounded-full transition-colors"
                      >
                        View all results →
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-black/60">No products found for "{searchQuery}"</p>
                      <p className="text-xs text-black/40 mt-1">Try a different search term</p>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Links when no search */}
              {!searchQuery.trim() && (
                <div className="mt-4 pt-4 border-t border-border-tan/30">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-black/40 mb-3">Popular Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {['Tote', 'Clutch', 'Sling', 'Handbag'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSearchOpen(false);
                          navigate(`/collection?category=${cat}`);
                        }}
                        className="px-4 py-2 text-xs font-medium bg-surface rounded-full hover:bg-primary hover:text-white transition-colors"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[100]"
              onClick={closeMobileMenu}
            />
            {/* Slide-in Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-secondary z-[101] flex flex-col shadow-2xl"
            >
              {/* Close Button */}
              <div className="flex items-center justify-between p-6 border-b border-border-tan/30">
                <span className="text-lg font-serif tracking-tighter font-bold text-primary">ZAREVIELLE</span>
                <button onClick={closeMobileMenu} className="p-2" aria-label="Close menu">
                  <X size={24} className="text-black" />
                </button>
              </div>

              {/* Nav Links */}
              <div className="flex-1 overflow-y-auto py-8 px-6 space-y-2">
                <Link to="/collection" onClick={closeMobileMenu} className="block py-4 text-[12px] uppercase tracking-[0.3em] font-bold text-black hover:text-primary transition-colors border-b border-border-tan/10">
                  Collection
                </Link>
                <Link to="/about" onClick={closeMobileMenu} className="block py-4 text-[12px] uppercase tracking-[0.3em] font-bold text-black hover:text-primary transition-colors border-b border-border-tan/10">
                  About
                </Link>
                <Link to="/contact" onClick={closeMobileMenu} className="block py-4 text-[12px] uppercase tracking-[0.3em] font-bold text-black hover:text-primary transition-colors border-b border-border-tan/10">
                  Contact
                </Link>
                {user && (
                  <Link to="/orders" onClick={closeMobileMenu} className="block py-4 text-[12px] uppercase tracking-[0.3em] font-bold text-black hover:text-primary transition-colors border-b border-border-tan/10">
                    My Orders
                  </Link>
                )}

                <div className="pt-6 space-y-2">
                  <Link to="/wishlist" onClick={closeMobileMenu} className="flex items-center justify-between py-4 text-[12px] uppercase tracking-[0.3em] font-bold text-black hover:text-primary transition-colors border-b border-border-tan/10">
                    <span>Wishlist</span>
                    {wishlistCount > 0 && (
                      <span className="bg-red-400 text-white text-[9px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/cart" onClick={closeMobileMenu} className="flex items-center justify-between py-4 text-[12px] uppercase tracking-[0.3em] font-bold text-black hover:text-primary transition-colors border-b border-border-tan/10">
                    <span>Cart</span>
                    {cartCount > 0 && (
                      <span className="bg-red-400 text-white text-[9px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </div>
              </div>

              {/* Auth Section */}
              <div className="p-6 border-t border-border-tan/30">
                {user ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-border-tan">
                        <img src={user.photoURL || ''} alt={user.displayName || 'User'} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] uppercase tracking-widest font-bold truncate max-w-[120px]">
                        {user.displayName || 'User'}
                      </span>
                    </div>
                    <button
                      onClick={() => { logout(); closeMobileMenu(); }}
                      className="text-[10px] uppercase tracking-widest font-bold text-red-600 hover:text-red-800"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { navigate('/account'); closeMobileMenu(); }}
                    className="w-full py-4 bg-primary text-white text-[11px] uppercase tracking-[0.3em] font-bold rounded-full hover:bg-black transition-all"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
