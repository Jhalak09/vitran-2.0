'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HindiSearchBar, EnglishSearchBar } from '@/components/ReusableSearchBar'; // ✅ Import reusable SearchBars
import { HindiDropdown, EnglishDropdown, createDropdownOptions, DropdownOption } from '@/components/ReusableDropdown'; // ✅ Import reusable Dropdowns
import { CustomerProductRelation, Customer, Product, relationApi } from './relation';

// ✅ Keep your existing search logic - works perfectly with reusable components
const enhancedMultiWordSearch = (searchTerm: string, targetText: string): boolean => {
  if (!searchTerm || !targetText) return false;
  
  const normalizedTarget = targetText.toLowerCase().trim();
  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  // Direct match (exact phrase)
  if (normalizedTarget.includes(normalizedSearch)) return true;
  
  // Split search term into words for multi-word search
  const searchWords = normalizedSearch.split(/\s+/).filter(word => word.length > 0);
  
  if (searchWords.length === 1) {
    // Single word search
    return normalizedTarget.includes(normalizedSearch);
  }
  
  // Multi-word search - all words must be present (can be in any order)
  return searchWords.every(word => normalizedTarget.includes(word));
};

// ✅ Customer search function (with Hindi support)
const searchCustomer = (searchTerm: string, customer: Customer): boolean => {
  if (!searchTerm || !customer) return false;
  
  const fields = [
    customer.firstName || '',
    customer.lastName || '',
    customer.phoneNumber || '',
    customer.city || '',
    customer.classification || '',
    `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
  ];
  
  return fields.some(field => enhancedMultiWordSearch(searchTerm, field));
};

// ✅ Product search function (English only)
const searchProduct = (searchTerm: string, product: Product): boolean => {
  if (!searchTerm || !product) return false;
  
  const normalizedSearch = searchTerm.toLowerCase().trim();
  const fields = [
    product.productName || '',
    product.description || '',
    product.storeId?.toString() || ''
  ];
  
  return fields.some(field => 
    field.toLowerCase().includes(normalizedSearch)
  );
};

// ✅ Advanced search for relation data with separate customer/product filters
const createAdvancedRelationSearch = (
  customerSearchTerm: string, 
  productSearchTerm: string, 
  relation: CustomerProductRelation
): boolean => {
  if (!relation) return false;
  
  // Customer search match (empty search term means match all)
  const customerMatch = !customerSearchTerm.trim() || searchCustomer(customerSearchTerm, relation.customer);
  
  // Product search match (empty search term means match all)
  const productMatch = !productSearchTerm.trim() || searchProduct(productSearchTerm, relation.product);
  
  // Both must match
  return customerMatch && productMatch;
};

interface CustomerProductRelationsProps {
  relations: CustomerProductRelation[];
  onUpdate: () => void;
}

export const CustomerProductRelations: React.FC<CustomerProductRelationsProps> = ({
  relations,
  onUpdate,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  // ✅ Separate search terms for customers and products
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ended'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, productsRes] = await Promise.all([
          relationApi.getAllCustomers(),
          relationApi.getAllProducts(),
        ]);
        setCustomers(customersRes.data);
        setProducts(productsRes.data);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load data');
      }
    };
    fetchData();
  }, []);

  // Filter products: exclude those with ACTIVE assignments to the selected customer
  useEffect(() => {
    if (!selectedCustomer) {
      setAvailableProducts([]);
      return;
    }

    // Get product IDs that have active assignments (no thruDate) to the selected customer
    const activelyAssignedProductIds = relations
      .filter(rel => !rel.thruDate && rel.customerId === selectedCustomer)
      .map(rel => rel.productId);

    // Show only products that are NOT actively assigned to this customer
    const filtered = products.filter(
      p => !activelyAssignedProductIds.includes(p.productId)
    );

    setAvailableProducts(filtered);
  }, [selectedCustomer, products, relations]);

  // ✅ Keep your existing filter logic - works perfectly
  const filteredRelations = relations.filter((relation) => {
    if (!relation) return false;

    // Use advanced search with separate customer and product search terms
    const searchMatch = createAdvancedRelationSearch(customerSearchTerm, productSearchTerm, relation);
    
    // Status filter
    let statusMatch = true;
    if (statusFilter === 'active') statusMatch = !relation.thruDate;
    if (statusFilter === 'ended') statusMatch = !!relation.thruDate;
    
    return searchMatch && statusMatch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRelations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRelations = filteredRelations.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [customerSearchTerm, productSearchTerm, statusFilter]);

  const assignProduct = async () => {
    if (!selectedCustomer || !selectedProduct || !quantity) {
      toast.error('Please select customer, product, and quantity');
      return;
    }
    setLoading(true);
    try {
      await relationApi.assignProductToCustomer(
        selectedCustomer,
        selectedProduct,
        quantity
      );
      toast.success('Product assigned successfully');
      onUpdate();
      setSelectedCustomer(null);
      setSelectedProduct(null);
      setQuantity(1);
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign product');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (customerId: number, productId: number, newQuantity: number) => {
    try {
      await relationApi.updateCustomerProductQuantity(customerId, productId, newQuantity);
      toast.success('Quantity updated successfully');
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update quantity');
    }
  };

  const removeProduct = async (customerId: number, productId: number) => {
    if (!confirm('Are you sure you want to remove this product from the customer?')) return;

    try {
      const response = await relationApi.deleteCustomerProductRelation(customerId, productId);
      if (response.success) {
        toast.success('Product removed from customer');
        onUpdate();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove product from customer');
    }
  };

  const clearForm = () => {
    setSelectedCustomer(null);
    setSelectedProduct(null);
    setQuantity(1);
  };

  // ✅ Create dropdown options with proper formatting
  const customerOptions = createDropdownOptions(
    customers,
    (customer) => `${customer.firstName} ${customer.lastName}`, // Label
    (customer) => customer.customerId, // ID
    (customer) => customer.phoneNumber, // Subtitle
    (customer) => [customer.city, customer.classification] // Details
  );

  const productOptions = createDropdownOptions(
    availableProducts,
    (product) => product.productName, // Label
    (product) => product.productId, // ID
    (product) => `₹${product.currentProductPrice}`, // Subtitle
    (product) => [product.storeId, product.description || 'No description'] // Details
  );

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
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredRelations.length)} of {filteredRelations.length} subscriptions
          </span>
          {customerSearchTerm && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              Customer: "{customerSearchTerm}"
            </span>
          )}
          {productSearchTerm && (
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
              Product: "{productSearchTerm}"
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
              Status: {statusFilter}
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
    <div className="space-y-6">
      {/* ✅ UPDATED: Assignment Form with Proper Hindi/English Dropdowns */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-6">Assign Product to Customer</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            {/* ✅ FIXED: Hindi Dropdown for Customer Selection */}
            <HindiDropdown
              label="Select Customer"
              options={customerOptions}
              selectedValue={selectedCustomer}
              onSelect={(option: DropdownOption<Customer> | null) => 
                setSelectedCustomer(option ? option.value.customerId : null)
              }
              placeholder="Choose a customer..."
              emptyMessage="No customers found"
              allowClear={true}
            />
          </div>

          <div>
            {/* ✅ FIXED: English Dropdown for Product Selection */}
            <EnglishDropdown
              label="Select Product"
              options={productOptions}
              selectedValue={selectedProduct}
              onSelect={(option: DropdownOption<Product> | null) => 
                setSelectedProduct(option ? option.value.productId : null)
              }
              placeholder="Choose a product..."
              disabled={!selectedCustomer}
              emptyMessage="No products available"
              allowClear={true}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              min={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={assignProduct}
              disabled={loading || !selectedCustomer || !selectedProduct || !quantity}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Assigning...' : 'Assign Product'}
            </button>
            <button
              onClick={clearForm}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* ✅ UPDATED: Search Bars using Reusable Components */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex flex-col space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Customer Product Subscriptions ({filteredRelations.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* ✅ Hindi SearchBar for Customer Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Customers
              </label>
              <HindiSearchBar
                value={customerSearchTerm}
                onChange={setCustomerSearchTerm}
                placeholder="Customer name, phone..."
                width="100%"
              />
            </div>

            {/* ✅ English SearchBar for Product Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Products
              </label>
              <EnglishSearchBar
                value={productSearchTerm}
                onChange={setProductSearchTerm}
                placeholder="Product name, description..."
                width="100%"
              />
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'ended')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">All Subscriptions</option>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
              </select>
            </div>

            {/* Clear all filters button */}
            <div className="flex items-end">
              {(customerSearchTerm || productSearchTerm || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setCustomerSearchTerm('');
                    setProductSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Relations Table with Pagination */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CUSTOMER
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PRODUCT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  QUANTITY
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  FROM DATE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  THROUGH DATE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedRelations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="text-4xl mb-2">📦</div>
                      <div className="text-lg font-medium">No subscriptions found</div>
                      <div className="text-sm">
                        {customerSearchTerm || productSearchTerm || statusFilter !== 'all' 
                          ? 'Try adjusting your search terms or filters.' 
                          : 'Create your first subscription using the form above.'
                        }
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRelations.map((relation, index) => (
                  <tr 
                    key={`${relation.customerId}-${relation.productId}-${index}`} 
                    className={`hover:bg-gray-50 transition-colors ${relation.thruDate ? 'opacity-60' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {relation.customer.firstName} {relation.customer.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {relation.customer.phoneNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {relation.customer.city}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">
                          {relation.customer.classification}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {relation.product.imageUrl && (
                          <img
                            className="h-12 w-12 rounded-lg object-cover mr-3 border border-gray-200"
                            src={relationApi.getImageUrl(relation.product.imageUrl)}
                            alt={relation.product.productName}
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {relation.product.productName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Store: {relation.product.storeId}
                          </div>
                          {relation.product.description && (
                            <div className="text-xs text-gray-400 truncate max-w-xs">
                              {relation.product.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={relation.quantityAssociated}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*$/.test(value) && value !== '0') {
                            const numValue = value === '' ? 1 : parseInt(value);
                            updateQuantity(relation.customerId, relation.productId, numValue);
                          }
                        }}
                        onFocus={(e) => {
                          setTimeout(() => e.target.select(), 0);
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                        disabled={!!relation.thruDate}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(relation.fromDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {relation.thruDate ? formatDate(relation.thruDate) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        relation.thruDate && new Date(relation.thruDate) < new Date()
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {relation.thruDate && new Date(relation.thruDate) < new Date() ? 'Ended' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!relation.thruDate && (
                        <button 
                          onClick={() => removeProduct(relation.customerId, relation.productId)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          Remove
                        </button>
                      )}
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
    </div>
  );
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}
