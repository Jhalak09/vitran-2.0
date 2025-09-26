'use client';
import React, { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Product, Store, productApi } from './product';

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onRefresh: () => void;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({ products, onEdit, onDelete, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [storeFilter, setStoreFilter] = useState<'ALL' | Store>('ALL');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 20; // Handle large datasets with pagination

  // Memoized filtered products for performance with large datasets
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.productId.toString().includes(searchQuery);
      const matchesStore = storeFilter === 'ALL' || product.storeId === storeFilter;
      return matchesSearch && matchesStore;
    });
  }, [products, searchQuery, storeFilter]);

  // Paginated products for large datasets
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(startIndex, startIndex + productsPerPage);
  }, [filteredProducts, currentPage, productsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const getStoreBadge = (store: Store) => {
    const colors = {
      SANCHI: 'bg-green-100 text-green-800 border-green-200',
      SABORO: 'bg-blue-100 text-blue-800 border-blue-200',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[store]}`}>
        {store}
      </span>
    );
  };

  const getPriceChangeIndicator = (currentPrice: number, lastPrice?: number) => {
    if (!lastPrice) return null;
    
    const change = currentPrice - lastPrice;
    const isIncrease = change > 0;
    const isDecrease = change < 0;

    if (isIncrease) {
      return <span className="text-green-600 text-xs font-medium">↗ +{formatPrice(change)}</span>;
    } else if (isDecrease) {
      return <span className="text-red-600 text-xs font-medium">↘ {formatPrice(change)}</span>;
    }
    return <span className="text-gray-500 text-xs">→ No change</span>;
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.productName}"?`)) {
      return;
    }

    setDeletingId(product.productId);
    try {
      const response = await productApi.deleteProduct(product.productId);
      if (response.success) {
        toast.success('Product deleted successfully');
        onDelete(product);
        // Reset to first page if current page becomes empty
        if (paginatedProducts.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleStoreFilter = (value: 'ALL' | Store) => {
    setStoreFilter(value);
    setCurrentPage(1); // Reset to first page on new filter
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header with Search and Filters */}
      <div className="p-4 sm:p-6 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">
            Products ({filteredProducts.length}{products.length !== filteredProducts.length ? ` of ${products.length}` : ''})
          </h2>
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-3">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by name, description, or ID..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={storeFilter}
            onChange={(e) => handleStoreFilter(e.target.value as 'ALL' | Store)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
          >
            <option value="ALL">All Stores</option>
            <option value={Store.SANCHI}>SANCHI</option>
            <option value={Store.SABORO}>SABORO</option>
          </select>
          
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
              <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  {searchQuery || storeFilter !== 'ALL' ? (
                    <div>
                      <p className="text-lg font-medium">No products found</p>
                      <p className="text-sm">Try adjusting your search or filter criteria</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-medium">No products available</p>
                      <p className="text-sm">Create your first product to get started</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              paginatedProducts.map((product) => (
                <tr key={product.productId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 sm:px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {product.imageUrl && (
                        <div className="flex-shrink-0">
                          <img
                            className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover border border-gray-200 shadow-sm"
                            src={productApi.getImageUrl(product.imageUrl)}
                            alt={product.productName}
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {product.productName}
                        </div>
                        <div className="text-sm text-gray-500">ID: {product.productId}</div>
                        {/* Show description on mobile/tablet */}
                        {product.description && (
                          <div className="lg:hidden text-xs text-gray-400 truncate max-w-xs mt-1">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatPrice(product.currentProductPrice)}
                    </div>
                    {product.lastProductPrice && (
                      <div className="text-xs text-gray-500">
                        Last: {formatPrice(product.lastProductPrice)}
                      </div>
                    )}
                    <div className="mt-1">
                      {getPriceChangeIndicator(product.currentProductPrice, product.lastProductPrice)}
                    </div>
                  </td>
                  
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    {getStoreBadge(product.storeId)}
                  </td>
                  
                  {/* Description column - hidden on mobile/tablet */}
                  <td className="hidden lg:table-cell px-3 sm:px-6 py-4 max-w-xs">
                    <div className="text-sm text-gray-900">
                      {product.description ? (
                        <span className="line-clamp-2" title={product.description}>
                          {product.description}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">No description</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-1 sm:space-y-0">
                      <button
                        onClick={() => onEdit(product)}
                        className="text-blue-600 hover:text-blue-900 focus:outline-none transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        disabled={deletingId === product.productId}
                        className="text-red-600 hover:text-red-900 focus:outline-none disabled:opacity-50 transition-colors"
                      >
                        {deletingId === product.productId ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination for Large Datasets */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{((currentPage - 1) * productsPerPage) + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * productsPerPage, filteredProducts.length)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{filteredProducts.length}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ←
                  </button>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    →
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
