import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit, AlertTriangle, CheckSquare, Square, Package } from 'lucide-react';

interface ProductVariant {
  _id: string;
  color: { name: string; hexCode: string };
  price: number;
  compareAtPrice?: number;
  discount?: { percentage: number; label?: string };
  images: string[];
  stock: number;
  sku: string;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  variants: ProductVariant[];
  tags?: string[];
  material?: string;
  featured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse {
  data: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const ProductList: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Filter state
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  const fetchProducts = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/products?page=${pageNum}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch products');
      }
      const data: PaginatedResponse = await res.json();
      setProducts(data.data);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setPage(data.page);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(page);
    // Clear selection when page changes
    setSelectedIds(new Set());
  }, [fetchProducts, page]);

  // Filter products by stock
  const filteredProducts = products.filter(product => {
    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
    if (stockFilter === 'low') return totalStock > 0 && totalStock < 5;
    if (stockFilter === 'out') return totalStock === 0;
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p._id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      // Delete products one by one
      for (const id of selectedIds) {
        await fetch(`/api/admin/products/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
      }
      setBulkDeleteConfirm(false);
      setSelectedIds(new Set());
      fetchProducts(page);
    } catch (err: any) {
      setError(err.message || 'Failed to delete products');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to delete product');
      }
      setDeleteTarget(null);
      fetchProducts(page);
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif text-primary">Products</h1>
          <p className="text-sm text-text-dark/60 mt-1">
            {total} product{total !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as 'all' | 'low' | 'out')}
            className="px-3 py-2 text-sm border border-border-tan rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">All Stock</option>
            <option value="low">Low Stock (&lt;5)</option>
            <option value="out">Out of Stock</option>
          </select>
          
          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <button
              onClick={() => setBulkDeleteConfirm(true)}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors font-medium text-sm flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete ({selectedIds.size})
            </button>
          )}
          
          <button
            onClick={() => navigate('/admin/products/new')}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            + Add Product
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <svg
            className="animate-spin h-6 w-6 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-text-dark/60">
          <Package size={48} className="mx-auto mb-4 text-text-dark/20" />
          <p>No products found.</p>
          <button
            onClick={() => navigate('/admin/products/new')}
            className="mt-3 text-primary hover:underline text-sm"
          >
            Add your first product
          </button>
        </div>
      ) : (
        <>
          <div className="bg-surface rounded-lg card-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-tan bg-secondary/50">
                    <th className="text-left px-4 py-3 w-10">
                      <button
                        onClick={toggleSelectAll}
                        className="text-text-dark/70 hover:text-primary transition-colors"
                      >
                        {selectedIds.size === filteredProducts.length && filteredProducts.length > 0 ? (
                          <CheckSquare size={18} />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-text-dark/70">Image</th>
                    <th className="text-left px-4 py-3 font-medium text-text-dark/70">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-text-dark/70">Price</th>
                    <th className="text-left px-4 py-3 font-medium text-text-dark/70">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-text-dark/70">Stock</th>
                    <th className="text-right px-4 py-3 font-medium text-text-dark/70">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
                    const isLowStock = totalStock > 0 && totalStock < 5;
                    const isOutOfStock = totalStock === 0;
                    
                    return (
                    <tr
                      key={product._id}
                      className={`border-b border-border-tan/50 hover:bg-secondary/30 transition-colors ${
                        selectedIds.has(product._id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSelect(product._id)}
                          className="text-text-dark/70 hover:text-primary transition-colors"
                        >
                          {selectedIds.has(product._id) ? (
                            <CheckSquare size={18} className="text-primary" />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {product.variants.length > 0 && product.variants[0].images.length > 0 ? (
                          <img
                            src={product.variants[0].images[0]}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-border-tan/30 rounded flex items-center justify-center">
                            <svg className="w-5 h-5 text-text-dark/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-text-dark">{product.name}</div>
                        {product.featured && (
                          <span className="inline-block mt-0.5 text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded">
                            Featured
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-dark">
                        {formatPrice(product.basePrice)}
                      </td>
                      <td className="px-4 py-3 text-text-dark/70">{product.category}</td>
                      <td className="px-4 py-3">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                            <AlertTriangle size={14} />
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 text-yellow-600 font-medium">
                            <AlertTriangle size={14} />
                            {totalStock} left
                          </span>
                        ) : (
                          <span className="text-text-dark">{totalStock}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/admin/products/${product._id}/edit`)}
                            className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors flex items-center gap-1"
                          >
                            <Edit size={12} />
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(product)}
                            className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors flex items-center gap-1"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-text-dark/60">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm border border-border-tan rounded-md hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm border border-border-tan rounded-md hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface rounded-lg p-6 max-w-sm w-full mx-4 card-shadow">
            <h3 className="text-lg font-serif text-text-dark mb-2">Delete Product</h3>
            <p className="text-sm text-text-dark/70 mb-4">
              Are you sure you want to delete{' '}
              <span className="font-medium text-text-dark">"{deleteTarget.name}"</span>?
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm border border-border-tan rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface rounded-lg p-6 max-w-sm w-full mx-4 card-shadow">
            <h3 className="text-lg font-serif text-text-dark mb-2">Delete {selectedIds.size} Products</h3>
            <p className="text-sm text-text-dark/70 mb-4">
              Are you sure you want to delete{' '}
              <span className="font-medium text-text-dark">{selectedIds.size} products</span>?
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setBulkDeleteConfirm(false)}
                disabled={isBulkDeleting}
                className="px-4 py-2 text-sm border border-border-tan rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isBulkDeleting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  `Delete ${selectedIds.size} Products`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
