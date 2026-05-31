import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product, mapApiProduct } from '../types';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import { motion } from 'motion/react';
import { Filter, ChevronDown, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-az';

const SORT_LABELS: Record<SortOption, string> = {
  'newest': 'Newest',
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low',
  'name-az': 'Name A-Z',
};

const PRODUCTS_PER_PAGE = 12;

const Collection: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const searchQuery = searchParams.get('search') || '';
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, searchQuery, sortBy]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('pageSize', '100');
        if (categoryFilter && categoryFilter !== 'All') {
          params.set('category', categoryFilter);
        }
        const response = await fetch(`/api/products?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const result = await response.json();
        const mapped = result.data.map(mapApiProduct);
        setProducts(mapped);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryFilter]);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['All', ...cats];
  }, [products]);

  // Filter by search query and sort
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => (a.basePrice || a.price) - (b.basePrice || b.price));
        break;
      case 'price-desc':
        filtered.sort((a, b) => (b.basePrice || b.price) - (a.basePrice || a.price));
        break;
      case 'name-az':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        // Already sorted by createdAt desc from API
        break;
    }
    return filtered;
  }, [products, sortBy, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredAndSortedProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [filteredAndSortedProducts, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const clearSearch = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('search');
    setSearchParams(newParams);
  };

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <p className="font-serif italic text-2xl text-red-500/80">Unable to load products</p>
        <p className="text-sm text-black">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 text-[10px] uppercase tracking-[0.2em] font-bold border border-primary rounded-full hover:bg-primary hover:text-white transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-baseline mb-20 gap-8 px-4">
        <div>
          <h1 className="text-6xl font-serif tracking-tighter mb-4">The <span className="italic font-light opacity-60">Archive</span></h1>
          <p className="text-black text-[10px] uppercase tracking-[0.4em] font-bold">
            {loading ? '...' : `${filteredAndSortedProducts.length} Pieces ${searchQuery ? 'Found' : 'Currently Curated'}`}
            {totalPages > 1 && !loading && (
              <span className="ml-2 text-primary/60">· Page {currentPage} of {totalPages}</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-2 px-6 py-2 bg-white border border-border-tan/30 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold hover:border-primary transition-all"
            >
              {SORT_LABELS[sortBy]}
              <ChevronDown size={12} className={`transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
            </button>
            {isSortOpen && (
              <div className="absolute top-full mt-2 right-0 bg-white border border-border-tan/30 rounded-2xl shadow-lg z-20 overflow-hidden min-w-[200px]">
                {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSortBy(key);
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3 text-[10px] uppercase tracking-[0.15em] font-bold transition-all ${
                      sortBy === key
                        ? 'bg-primary text-white'
                        : 'hover:bg-secondary text-black'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden md:flex gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSearchParams(cat === 'All' ? {} : { category: cat })}
                className={`px-6 py-2 text-[10px] uppercase tracking-[0.2em] font-bold transition-all rounded-full border ${
                  (categoryFilter === cat || (!categoryFilter && cat === 'All'))
                    ? 'bg-primary text-white border-primary shadow-lg'
                    : 'bg-white text-black border-border-tan/30 hover:border-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="md:hidden flex items-center gap-3 px-6 py-2 bg-white border border-border-tan/30 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold"
          >
            <Filter size={14} strokeWidth={1.5} /> Sort & Filter
          </button>
        </div>
      </div>

      {/* Search Results Banner */}
      {searchQuery && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 px-4"
        >
          <div className="flex items-center gap-3 p-4 bg-surface rounded-2xl border border-border-tan/30">
            <Search size={18} className="text-primary" />
            <span className="text-sm">
              Search results for: <strong>"{searchQuery}"</strong>
            </span>
            <button
              onClick={clearSearch}
              className="ml-auto flex items-center gap-1 text-xs text-black/60 hover:text-primary transition-colors"
            >
              <X size={14} /> Clear
            </button>
          </div>
        </motion.div>
      )}

      {/* Mobile Filter Drawer */}
      {isFilterOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden mb-12 p-6 bg-surface border border-border-tan/30 rounded-[32px] flex flex-wrap gap-3 card-shadow"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSearchParams(cat === 'All' ? {} : { category: cat });
                setIsFilterOpen(false);
              }}
              className={`px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-bold rounded-full border ${
                (categoryFilter === cat || (!categoryFilter && cat === 'All'))
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-black border-border-tan/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {paginatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          {filteredAndSortedProducts.length === 0 && (
            <div className="text-center py-40">
              <p className="font-serif italic text-2xl text-primary">
                {searchQuery ? `No products found for "${searchQuery}"` : 'No pieces found in this category.'}
              </p>
              <button 
                onClick={() => setSearchParams({})}
                className="mt-6 text-xs uppercase tracking-widest font-bold border-b border-primary pb-1"
              >
                Show All Products
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center items-center gap-2 mt-16"
            >
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-bold border border-border-tan/30 rounded-full hover:border-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-3 py-2 text-black/40">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page as number)}
                      className={`w-10 h-10 flex items-center justify-center text-[11px] font-bold rounded-full transition-all ${
                        currentPage === page
                          ? 'bg-primary text-white shadow-lg'
                          : 'border border-border-tan/30 hover:border-primary text-black'
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-bold border border-border-tan/30 rounded-full hover:border-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={14} />
              </button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default Collection;
