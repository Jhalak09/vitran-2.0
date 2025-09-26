'use client';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { InventoryItem, inventoryApi } from './inventory';

interface InventoryTableProps {
  inventoryData: InventoryItem[];
  onUpdate: () => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  getTodayString: () => string; // ✅ Add helper function prop
  getYesterdayString: () => string; // ✅ Add helper function prop
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  inventoryData,
  onUpdate,
  selectedDate, // ✅ Use prop instead of local state
  onDateChange,
getTodayString, // ✅ Use prop
  getYesterdayString, // ✅ Use prop instead of local state setter
}) => {
  const [editingReceived, setEditingReceived] = useState<{[key: number]: string}>({});
  const [editingRemaining, setEditingRemaining] = useState<{[key: number]: string}>({});
  const [loading, setLoading] = useState<{[key: number]: boolean}>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'received' | 'completed'>('all');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  
  // Helper functions
  React.useEffect(() => {
    fetchAvailableDates();
  }, []);

  const fetchAvailableDates = async () => {
    try {
      const response = await inventoryApi.getAvailableDates();
      if (response.success) {
        const dates = response.data.map(date => new Date(date).toISOString().split('T')[0]);
        setAvailableDates(dates);
      }
    } catch (error) {
      console.error('Failed to fetch available dates:', error);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number): string => {
    return `₹${value.toFixed(2)}`;
  };

  // ✅ UPDATED: Simplified status logic (no distributed)
  const getStatus = (item: InventoryItem): string => {
    if (!item.receivedQuantity) return 'pending';
    if (!item.remainingQuantity && item.remainingQuantity !== 0) return 'received';
    return 'completed';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'received': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter inventory data
  const filteredData = inventoryData.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.storeId.toLowerCase().includes(searchTerm.toLowerCase());

    const status = getStatus(item);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ✅ UPDATED: Update received quantity with selectedDate
  const updateReceivedQuantity = async (productId: number, receivedQty: number) => {
    if (receivedQty < 1) {
      toast.error('Received quantity must be at least 1');
      return;
    }

    setLoading(prev => ({ ...prev, [productId]: true }));
    try {
      const response = await inventoryApi.updateReceivedQuantity(productId, receivedQty, 'admin', selectedDate);
      if (response.success) {
        toast.success('Received quantity updated successfully');
        onUpdate();
        setEditingReceived(prev => {
          const newState = { ...prev };
          delete newState[productId];
          return newState;
        });
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update received quantity');
    } finally {
      setLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  // ✅ UPDATED: Update remaining quantity with selectedDate
  const updateRemainingQuantity = async (productId: number, remainingQty: number) => {
    if (remainingQty < 0) {
      toast.error('Remaining quantity cannot be negative');
      return;
    }

    setLoading(prev => ({ ...prev, [productId]: true }));
    try {
      const response = await inventoryApi.updateRemainingQuantity(productId, remainingQty, 'admin', selectedDate);
      if (response.success) {
        toast.success('Remaining quantity updated successfully');
        onUpdate();
        setEditingRemaining(prev => {
          const newState = { ...prev };
          delete newState[productId];
          return newState;
        });
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update remaining quantity');
    } finally {
      setLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-xl font-semibold">Inventory Management ({filteredData.length})</h2>
          
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
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

            {/* ✅ UPDATED: Status Filter Options */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Receipt</option>
              <option value="received">Received</option>
              <option value="completed">Day Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* ✅ UPDATED: Date Navigation Tabs using props */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onDateChange(getTodayString())}
            className={`px-4 py-2 rounded-md ${
              selectedDate === getTodayString()
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Today ({new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })})
          </button>
          
          <button
            onClick={() => onDateChange(getYesterdayString())}
            className={`px-4 py-2 rounded-md ${
              selectedDate === getYesterdayString()
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Yesterday ({new Date(Date.now() - 86400000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })})
          </button>

          {availableDates.slice(2).map(date => (
            <button
              key={date}
              onClick={() => onDateChange(date)}
              className={`px-4 py-2 rounded-md ${
                selectedDate === date
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
            </button>
          ))}
        </div>
      </div>

      {/* Rest of the table remains the same... */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Table content stays the same */}
        {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <div className="text-lg font-medium">
              {searchTerm || statusFilter !== 'all' 
                ? 'No matching inventory items found' 
                : 'No inventory data available'
              }
            </div>
            <p className="text-sm">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Inventory will appear when customers subscribe to products'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ordered Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Received Qty
                  </th>
                  {/* ✅ REMOVED: Distributed Qty Column */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item) => {
                  const status = getStatus(item);
                  const totalValue = item.totalOrderedQuantity * Number(item.product.currentProductPrice);
                  
                  return (
                    <tr key={item.inventoryId} className="hover:bg-gray-50 transition-colors">
                      {/* Product Details */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {item.product.imageUrl && (
                            <img
                              className="h-12 w-12 rounded-lg object-cover mr-3 border border-gray-200"
                              src={inventoryApi.getImageUrl(item.product.imageUrl)}
                              alt={item.product.productName}
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.product.productName}
                            </div>
                            <div className="text-sm text-gray-500">
                              Store: {item.product.storeId}
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatCurrency(Number(item.product.currentProductPrice))}/unit
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Ordered Quantity */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.totalOrderedQuantity}
                        </div>
                        <div className="text-xs text-gray-500">
                          Customer demand
                        </div>
                      </td>

                      {/* Received Quantity (Editable) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editingReceived[item.productId] ?? (item.receivedQuantity || '')}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                              setEditingReceived(prev => ({
                                ...prev,
                                [item.productId]: value
                              }));
                            }
                          }}
                          onBlur={(e) => {
                            const value = e.target.value;
                            const numValue = parseInt(value) || 0;
                            if (numValue !== item.receivedQuantity && numValue > 0) {
                              updateReceivedQuantity(item.productId, numValue);
                            }
                          }}
                          onFocus={(e) => setTimeout(() => e.target.select(), 10)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          placeholder="Enter qty"
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                          disabled={loading[item.productId]}
                        />
                      </td>

                      {/* ✅ UPDATED: Remaining Quantity (Editable - End of Day Input) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editingRemaining[item.productId] ?? (item.remainingQuantity || '')}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                              setEditingRemaining(prev => ({
                                ...prev,
                                [item.productId]: value
                              }));
                            }
                          }}
                          onBlur={(e) => {
                            const value = e.target.value;
                            const numValue = parseInt(value) || 0;
                            if (numValue !== item.remainingQuantity) {
                              updateRemainingQuantity(item.productId, numValue);
                            }
                          }}
                          onFocus={(e) => setTimeout(() => e.target.select(), 10)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          placeholder="End of day"
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                          disabled={loading[item.productId] || !item.receivedQuantity}
                        />
                      </td>

                      {/* Total Value */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(totalValue)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Total value
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>

                      {/* Last Updated */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.lastUpdated)}
                        {item.entryByUserLoginId && (
                          <div className="text-xs text-gray-400">
                            by {item.entryByUserLoginId}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
