'use client';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { inventoryApi } from './inventory';
import { useRef } from "react";


interface CombinedInventoryItem {
  productId: number;
  demandId: number;
  totalDemand: number;
  product: {
    productId: number;
    productName: string;
    currentProductPrice: string;
    storeId: string;
    imageUrl?: string;
  };
  inventoryId?: number;
  receivedQuantity?: number;
  remainingQuantity?: number;
  entryByUserLoginId?: string;
  lastUpdated?: string;
  date?: string;
}

interface InventoryTableProps {
  inventory: CombinedInventoryItem[];
  onInventoryUpdate: () => void;
  currentUserId: string;
}

export default function InventoryTable({ 
  inventory, 
  onInventoryUpdate, 
  currentUserId 
}: InventoryTableProps) {
  const [editingReceived, setEditingReceived] = useState<{[key: number]: string}>({});
  const [editingRemaining, setEditingRemaining] = useState<{[key: number]: string}>({});
  const [loading, setLoading] = useState<{[key: number]: boolean}>({});
  const [submitLoading, setSubmitLoading] = useState(false); // ✅ NEW: Loading state for submit button
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'received' | 'completed'>('all');
  const tableRef = useRef<HTMLDivElement>(null);

  // Local state for optimistic updates
  const [localUpdates, setLocalUpdates] = useState<{[key: number]: Partial<CombinedInventoryItem>}>({});

  // Apply local updates to inventory data
  const getUpdatedInventory = () => {
    return inventory.map(item => ({
      ...item,
      ...(localUpdates[item.productId] || {})
    }));
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
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

  const getStatus = (item: CombinedInventoryItem): string => {
    if (!item.receivedQuantity) return 'pending';
    if (item.remainingQuantity === undefined || item.remainingQuantity === null) return 'received';
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

  // Use updated inventory for filtering
  const updatedInventory = getUpdatedInventory();
  const filteredData = updatedInventory.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.storeId.toLowerCase().includes(searchTerm.toLowerCase());

    const status = getStatus(item);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ✅ UPDATED: Submit one quantity at a time function
// ✅ ENHANCED: Submit with perfect scroll preservation
const submitNextQuantity = async () => {
  const updates: Array<{
    type: 'received' | 'remaining';
    productId: number;
    value: number;
  }> = [];
  
  // Collect all received quantity updates
  Object.entries(editingReceived).forEach(([productId, value]) => {
    const numValue = parseInt(value) || 0;
    if (numValue > 0) {
      updates.push({
        type: 'received',
        productId: parseInt(productId),
        value: numValue
      });
    }
  });

  // Collect all remaining quantity updates  
  Object.entries(editingRemaining).forEach(([productId, value]) => {
    const numValue = parseInt(value) || 0;
    updates.push({
      type: 'remaining',
      productId: parseInt(productId),
      value: numValue
    });
  });

  if (updates.length === 0) {
    toast.error('No quantities to submit');
    return;
  }

  setSubmitLoading(true);

  // ✅ ENHANCED: Store multiple scroll positions for better preservation
  const preserveScrollPosition = () => {
    return {
      tableScroll: tableRef.current?.scrollTop || 0,
      windowScroll: window.scrollY || 0,
      tableElement: tableRef.current
    };
  };

  // ✅ ENHANCED: Restore scroll positions smoothly
  const restoreScrollPosition = (positions: any) => {
    // Use requestAnimationFrame for smoother restoration
    requestAnimationFrame(() => {
      if (positions.tableElement && positions.tableScroll !== undefined) {
        positions.tableElement.scrollTop = positions.tableScroll;
      }
      if (positions.windowScroll !== undefined) {
        window.scrollTo(0, positions.windowScroll);
      }
    });
  };

  try {
    const update = updates[0];
    
    // ✅ Preserve scroll positions before any operations
    const scrollPositions = preserveScrollPosition();
    
    if (update.type === 'received') {
      await inventoryApi.updateReceivedQuantity(update.productId, update.value, currentUserId);
      setEditingReceived(prev => {
        const newState = { ...prev };
        delete newState[update.productId];
        return newState;
      });
    } else {
      await inventoryApi.updateRemainingQuantity(update.productId, update.value, currentUserId);
      setEditingRemaining(prev => {
        const newState = { ...prev };
        delete newState[update.productId];
        return newState;
      });
    }

    toast.success(`Successfully updated 1 quantity. ${updates.length - 1} remaining.`);
    
    // ✅ ENHANCED: Smooth refresh with scroll preservation
    await onInventoryUpdate();
    
    // ✅ Restore scroll position after a small delay to ensure DOM is updated
    setTimeout(() => {
      restoreScrollPosition(scrollPositions);
    }, 50);
    
  } catch (error: any) {
    toast.error(error.message || 'Failed to update quantity');
  } finally {
    setSubmitLoading(false);
  }
};

  

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-xl font-semibold">Today's Inventory & Demand ({filteredData.length})</h2>
          
          <div className="flex flex-col md:flex-row gap-4">
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

      {/* ✅ UPDATED: Submit Button Section */}
<div className="bg-white rounded-lg shadow p-4">
  <div className="flex items-center justify-between">
    <div className="text-sm text-gray-600">
      {Object.keys(editingReceived).length + Object.keys(editingRemaining).length > 0 ? (
        <span>
          {Object.keys(editingReceived).length + Object.keys(editingRemaining).length} quantities ready to submit (one at a time)
        </span>
      ) : (
        <span>Make changes in the table below, then click submit</span>
      )}
    </div>
    <button
      onClick={submitNextQuantity} // ✅ CHANGED: Updated function name
      disabled={submitLoading || (Object.keys(editingReceived).length + Object.keys(editingRemaining).length === 0)}
      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {submitLoading ? 'Submitting...' : 'Submit Next Quantity'} {/* ✅ CHANGED: Updated button text */}
    </button>
  </div>
</div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <div className="text-lg font-medium">
              {searchTerm || statusFilter !== 'all' 
                ? 'No matching items found' 
                : 'No demand data available'
              }
            </div>
            <p className="text-sm">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Demand will appear when customers subscribe to products'
              }
            </p>
          </div>
        ) : (
          <div ref={tableRef} className="overflow-x-auto max-h-[600px] scroll-smooth">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
suggested inventory                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Morning Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining After Delivery
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
                  const totalValue = item.totalDemand * Number(item.product.currentProductPrice);
                  
                  return (
                    <tr key={item.productId} className="hover:bg-gray-50 transition-colors">
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

                      {/* Total Demand */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.totalDemand}
                        </div>
                        <div className="text-xs text-gray-500">
                          Customer demand
                        </div>
                      </td>

                      {/* ✅ UPDATED: Received Quantity (Only input, no onBlur) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editingReceived[item.productId] ?? (item.receivedQuantity?.toString() || '')}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                              setEditingReceived(prev => ({
                                ...prev,
                                [item.productId]: value
                              }));
                            }
                          }}
                          onFocus={(e) => setTimeout(() => e.target.select(), 10)}
                          placeholder="Enter qty"
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                          disabled={loading[item.productId]}
                        />
                      </td>

                      {/* ✅ UPDATED: Remaining Quantity (Only input, no onBlur) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editingRemaining[item.productId] ?? (
                            item.remainingQuantity !== undefined && item.remainingQuantity !== null 
                              ? item.remainingQuantity.toString() 
                              : ''
                          )}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                              setEditingRemaining(prev => ({
                                ...prev,
                                [item.productId]: value
                              }));
                            }
                          }}
                          onFocus={(e) => setTimeout(() => e.target.select(), 10)}
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
  );
}
