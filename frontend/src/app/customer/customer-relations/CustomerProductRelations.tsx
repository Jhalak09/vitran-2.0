'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CustomerProductRelation, Customer, Product, relationApi } from './relation';

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

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ended'>('all');

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

  // Filter relations for display
  const filteredRelations = relations.filter((relation) => {
    const matchesSearch =
      !searchTerm ||
      relation.customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relation.customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relation.product.productName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'active') return matchesSearch && !relation.thruDate;
    if (statusFilter === 'ended') return matchesSearch && !!relation.thruDate;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Assignment Form */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-6">Assign Product to Customer</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Customer
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCustomer ?? ''}
              onChange={e => setSelectedCustomer(Number(e.target.value))}
            >
              <option value="">Choose a customer...</option>
              {customers.map(c => (
                <option key={c.customerId} value={c.customerId}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Product
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedProduct ?? ''}
              onChange={e => setSelectedProduct(Number(e.target.value))}
              disabled={!selectedCustomer}
            >
              <option value="">Choose a product...</option>
              {availableProducts.map(p => (
                <option key={p.productId} value={p.productId}>
                  {p.productName}
                </option>
              ))}
            </select>
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
              Assign Product
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

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <h3 className="text-lg font-semibold">Customer Product Subscriptions ({filteredRelations.length})</h3>
          
          <div className="flex gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search customers, products..."
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'ended')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Subscriptions</option>
              <option value="active">Active</option>
              <option value="ended">Ended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Relations Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
              {filteredRelations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria' 
                      : 'Create your first subscription using the form above'
                    }
                  </td>
                </tr>
              ) : (
                filteredRelations.map((relation, index) => (
                  <tr 
                    key={`${relation.customerId}-${relation.productId}-${index}`} 
                    className={`hover:bg-gray-50 ${relation.thruDate ? 'opacity-60' : ''}`}
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
                          className="text-red-600 hover:text-red-900"
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
      </div>
    </div>
  );
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}
