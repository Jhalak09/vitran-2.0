'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { SearchableDropdown } from './SearchableDropdown';
import {
  CustomerProductRelation,
  Customer,
  Product,
  relationApi,
} from './relation';

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
  
  // Form states
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [fromDate, setFromDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [thruDate, setThruDate] = useState<string>(''); // Optional through date
  const [loading, setLoading] = useState(false);

  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ended'>('all');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const isExpired = (thruDate: string | null): boolean => {
  if (!thruDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of today
  const expiry = new Date(thruDate);
  expiry.setHours(0, 0, 0, 0); // Set to start of expiry date
  return expiry < today; // Only expired if expiry date is before today
};



  const fetchInitialData = async () => {
    try {
      const [customersRes, productsRes] = await Promise.all([
        relationApi.getAllCustomers(),
        relationApi.getAllProducts(),
      ]);

      if (customersRes.success) setCustomers(customersRes.data);
      if (productsRes.success) setProducts(productsRes.data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch data');
    }
  };

  const handleCustomerSelect = async (customerId: number | string | null) => {
    if (!customerId) {
      setSelectedCustomer(null);
      setAvailableProducts([]);
      return;
    }

    setSelectedCustomer(Number(customerId));
    try {
      const response = await relationApi.getAvailableProductsForCustomer(Number(customerId));
      if (response.success) {
        setAvailableProducts(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch available products');
    }
  };

  const assignProduct = async () => {
    if (!selectedCustomer || !selectedProduct) {
      toast.error('Please select both customer and product');
      return;
    }

    if (quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    setLoading(true);
    try {
      const response = await relationApi.assignProductToCustomer(
        selectedCustomer,
        selectedProduct,
        quantity,
        fromDate,
        thruDate || undefined
      );
      if (response.success) {
        toast.success(response.message);
        onUpdate();
        resetForm();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign product to customer');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setSelectedProduct(null);
    setAvailableProducts([]);
    setQuantity(1);
    setFromDate(new Date().toISOString().split('T')[0]);
    setThruDate('');
  };

  const removeProduct = async (customerId: number, productId: number) => {
    if (!confirm('Are you sure you want to permanently remove this product from the customer? This action cannot be undone.')) return;

    try {
        const response = await relationApi.deleteCustomerProductRelation(customerId, productId);
        if (response.success) {
        toast.success('Product permanently removed from customer');
        onUpdate();
        } else {
        toast.error(response.message);
        }
    } catch (error: any) {
        toast.error(error.message || 'Failed to remove product from customer');
    }
    };
  const updateQuantity = async (customerId: number, productId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    try {
      const response = await relationApi.updateCustomerProductQuantity(customerId, productId, newQuantity);
      if (response.success) {
        toast.success('Quantity updated successfully');
        onUpdate();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update quantity');
    }
  };

  // Helper functions
  const safeToNumber = (value: string | number | undefined | null): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const formatCurrency = (value: string | number | undefined | null): string => {
    const numValue = safeToNumber(value);
    return `₹${numValue.toFixed(2)}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Filter relations based on search and status
  const filteredRelations = relations.filter(relation => {
  const matchesSearch = searchTerm === '' || 
    relation.customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    relation.customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    relation.customer.phoneNumber.includes(searchTerm) ||
    relation.customer.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    relation.product.productName.toLowerCase().includes(searchTerm.toLowerCase());

  // ✅ FIXED: Check if thruDate has actually passed
  const isActuallyEnded = relation.thruDate && new Date(relation.thruDate) < new Date();
  
  const matchesStatus = statusFilter === 'all' || 
    (statusFilter === 'active' && !isActuallyEnded) ||
    (statusFilter === 'ended' && isActuallyEnded);

  return matchesSearch && matchesStatus;
});

  // Prepare dropdown options
  const customerOptions = customers.map(customer => ({
    value: customer.customerId,
    label: `${customer.firstName} ${customer.lastName}`,
    subtitle: `${customer.city} • ${customer.phoneNumber} • ${customer.classification}`,
  }));

  const productOptions = availableProducts.map(product => ({
    value: product.productId,
    label: product.productName,
    subtitle: `₹${safeToNumber(product.currentProductPrice).toFixed(2)} • ${product.storeId}`,
  }));

  return (
    <div className="space-y-6">
      {/* Assignment Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Assign Product to Customer</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Customer</label>
            <SearchableDropdown
              options={customerOptions}
              value={selectedCustomer}
              onChange={handleCustomerSelect}
              placeholder="Choose a customer..."
            />
          </div>

          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Product</label>
            <SearchableDropdown
              options={productOptions}
              value={selectedProduct}
              onChange={(value) => setSelectedProduct(value as number | null)}
              placeholder="Choose a product..."
              disabled={!selectedCustomer}
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                onFocus={(e) => e.target.select()} // ✅ Auto-select on focus
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* From Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Through Date (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Through Date (Optional)</label>
            <input
              type="date"
              value={thruDate}
              onChange={(e) => setThruDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={fromDate}
            />
          </div>

          {/* Assign Button */}
          <div className="flex items-end">
            <button
              onClick={assignProduct}
              disabled={!selectedCustomer || !selectedProduct || loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Assigning...' : 'Assign Product'}
            </button>
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex justify-end">
          <button
            onClick={resetForm}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Reset Form
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-xl font-semibold">Customer Product Subscriptions ({filteredRelations.length})</h2>
          
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search customers, products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'ended')}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Subscriptions</option>
              <option value="active">Active Only</option>
              <option value="ended">Ended Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Relations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredRelations.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <div className="text-lg font-medium">
              {searchTerm || statusFilter !== 'all' 
                ? 'No matching subscriptions found' 
                : 'No customer-product subscriptions'
              }
            </div>
            <p className="text-sm">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first subscription using the form above'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Through Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRelations.map((relation) => (
                  <tr key={relation.id} className="hover:bg-gray-50 transition-colors">
                    {/* Customer Details */}
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
                        <div className="text-xs text-blue-600 mt-1">
                          {relation.customer.classification}
                        </div>
                      </div>
                    </td>

                    {/* Product Details */}
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

                    {/* Quantity (Editable) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                    <input
                        type="text" // Use text to avoid browser number input quirks
                        inputMode="numeric" // Show numeric keyboard on mobile
                        pattern="\d*" // Only allow digits
                        value={relation.quantityAssociated}
                        onChange={(e) => {
                        const value = e.target.value;
                        // Only allow digits
                        if (/^\d*$/.test(value) && value !== '0') {
                            const numValue = value === '' ? 1 : parseInt(value);
                            updateQuantity(relation.customerId, relation.productId, numValue);
                        }
                        }}
                        onFocus={(e) => {
                        // Select all on focus, making it easy to replace
                        setTimeout(() => e.target.select(), 0);
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                        disabled={!!relation.thruDate}
                    />
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(relation.product.currentProductPrice)}
                    </td>

                    {/* Total */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(safeToNumber(relation.product.currentProductPrice) * relation.quantityAssociated)}
                    </td>

                    {/* From Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(relation.fromDate)}
                    </td>

                    {/* Through Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {relation.thruDate ? formatDate(relation.thruDate) : '-'}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            relation.thruDate && new Date(relation.thruDate) < new Date()
                            ? 'bg-red-100 text-red-800'     // Red only if thruDate has passed
                            : 'bg-green-100 text-green-800' // Green if no thruDate or future thruDate  
                        }`}>
                            {relation.thruDate && new Date(relation.thruDate) < new Date() ? 'Ended' : 'Active'}
                        </span>
                        </td>

                    {/* Actions */}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
