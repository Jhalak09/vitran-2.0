'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { EnglishSearchBar } from '@/components/ReusableSearchBar'; // ✅ Import English SearchBar
import { Product, Store, productApi } from './product';

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onRefresh: () => void;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({ products, onEdit, onDelete, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState(''); // ✅ Same state variable
  const [storeFilter, setStoreFilter] = useState<'ALL' | Store>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(20);

  // ✅ Keep your existing filter logic - works perfectly
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.productId.toString().includes(searchQuery);
    
    const matchesStore = storeFilter === 'ALL' || product.storeId === storeFilter;
    
    return matchesSearch && matchesStore;
  });

  // Enhanced pagination logic
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, storeFilter]);

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.productName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await productApi.deleteProduct(product.productId);
      if (response.success) {
        toast.success('Product deleted successfully');
        onDelete(product);
      } else {
        toast.error(response.message || 'Failed to delete product');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const getPriceChangeIndicator = (currentPrice: number, lastPrice?: number) => {
    if (!lastPrice) return null;
    
    const isIncrease = currentPrice > lastPrice;
    const isDecrease = currentPrice < lastPrice;
    
    if (isIncrease) {
      return <span className="text-green-600 text-xs ml-1">↗</span>;
    } else if (isDecrease) {
      return <span className="text-red-600 text-xs ml-1">↘</span>;
    }
    return <span className="text-gray-600 text-xs ml-1">→</span>;
  };

  const getStoreBadge = (store: Store) => {
    const colors = {
      [Store.SANCHI]: 'bg-blue-100 text-blue-800',
      [Store.SABORO]: 'bg-purple-100 text-purple-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[store]}`}>
        {store}
      </span>
    );
  };

  // Enhanced pagination component
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add first page if not visible
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }

    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add last page if not visible
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return (
      <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-700">
          <span>
            Showing {startIndex + 1} to {Math.min(startIndex + productsPerPage, filteredProducts.length)} of {filteredProducts.length} products
          </span>
          {searchQuery && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              Search: "{searchQuery}"
            </span>
          )}
          {storeFilter !== 'ALL' && (
            <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
              Store: {storeFilter}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          
          {pages.map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && setCurrentPage(page)}
              disabled={page === '...'}
              className={`px-3 py-1 border rounded-md text-sm transition-colors ${
                currentPage === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : page === '...'
                  ? 'border-transparent cursor-default'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header with search and filters */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">
            Products ({filteredProducts.length})
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-3">
            {/* ✅ REPLACED: Complex search input with simple reusable English SearchBar */}
            <EnglishSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search products..."
              width="250px"
            />
            
            {/* Store filter */}
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value as 'ALL' | Store)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ minWidth: '120px' }}
            >
              <option value="ALL">All Stores</option>
              <option value={Store.SANCHI}>SANCHI</option>
              <option value={Store.SABORO}>SABORO</option>
            </select>
            
            {/* Clear filters */}
            {(searchQuery || storeFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStoreFilter('ALL');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors whitespace-nowrap"
              >
                Clear All
              </button>
            )}
            
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors whitespace-nowrap"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <div className="text-4xl mb-2">📦</div>
                    <div className="text-lg font-medium">No products found</div>
                    <div className="text-sm">
                      {searchQuery || storeFilter !== 'ALL' 
                        ? 'Try adjusting your search terms or filters.' 
                        : 'Create your first product to get started.'
                      }
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedProducts.map((product) => (
                <tr key={product.productId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.imageUrl && (
                        <img
                          className="h-12 w-12 rounded-lg object-cover mr-3 border border-gray-200"
                          src={productApi.getImageUrl(product.imageUrl)}
                          alt={product.productName}
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                        <div className="text-sm text-gray-500">ID: {product.productId}</div>
                        {/* Show description on mobile/tablet */}
                        <div className="lg:hidden">
                          {product.description && (
                            <div className="text-xs text-gray-400 mt-1 truncate max-w-xs">{product.description}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatPrice(product.currentProductPrice)}</div>
                    {product.lastProductPrice && (
                      <div className="text-xs text-gray-500">
                        Last: {formatPrice(product.lastProductPrice)}
                        {getPriceChangeIndicator(product.currentProductPrice, product.lastProductPrice)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStoreBadge(product.storeId)}</td>
                  {/* Description column - hidden on mobile/tablet */}
                  <td className="px-6 py-4 hidden lg:table-cell">
                    {product.description ? (
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={product.description}>
                        {product.description}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No description</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(product)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Enhanced pagination */}
      {renderPagination()}
    </div>
  );
};
