'use client';
import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import HamburgerNavigation from '../../components/HamburgerNavigation';
import { InventoryTable } from './InventoryTable';
import { InventoryItem, inventoryApi } from './inventory';

  const getTodayString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getYesterdayString = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function InventoryPage() {
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); // ✅ Add selectedDate state
  const [initializing, setInitializing] = useState(false); 


useEffect(() => {
    initializeAndFetchData(); // ✅ Call initialize first, then fetch
  }, []);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  // ✅ Add useEffect to fetch data when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      fetchInventoryData();
    }
  }, [selectedDate]);

  // ✅ UPDATE: fetchInventoryData to use selectedDate
  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const response = await inventoryApi.getInventorySummary(selectedDate); // ✅ Pass selectedDate
      if (response.success) {
        setInventoryData(response.data);
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  };

   const initializeAndFetchData = async () => {
    setLoading(true);
    setInitializing(true);
    
    try {
      // Step 1: Initialize today's inventory (only runs for today's date)
      console.log('🚀 Auto-initializing today\'s inventory...');
      const initResponse = await inventoryApi.initializeTodayInventory('system');
      
      if (initResponse.success) {
        if (initResponse.data?.updatedCount > 0) {
          console.log(`✅ Initialized ${initResponse.data.updatedCount} inventory records for today`);
          toast.success(`Initialized ${initResponse.data.updatedCount} products for today`);
        } else {
          console.log('ℹ️ Today\'s inventory already exists');
        }
      } else {
        console.warn('⚠️ Initialize response:', initResponse.message);
      }
    } catch (error: any) {
      console.error('❌ Failed to initialize today\'s inventory:', error);
      // Don't show error toast - this is background operation
    } finally {
      setInitializing(false);
    }

    // Step 2: Fetch inventory data for selected date
    await fetchInventoryData();
  };
  const updateAllInventories = async () => {
    setUpdating(true);
    try {
      const response = await inventoryApi.updateAllInventories('admin');
      if (response.success) {
        toast.success(response.message);
        fetchInventoryData(); // Refresh data
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update inventories');
    } finally {
      setUpdating(false);
    }
  };

  // Calculate summary stats
  const summaryStats = {
    totalProducts: inventoryData.length,
    totalOrderedQuantity: inventoryData.reduce((sum, item) => sum + item.totalOrderedQuantity, 0),
    totalReceivedQuantity: inventoryData.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0),
    totalRemainingQuantity: inventoryData.reduce((sum, item) => sum + (item.remainingQuantity || 0), 0), // ✅ Updated from distributed
    totalValue: inventoryData.reduce((sum, item) => sum + (item.totalOrderedQuantity * Number(item.product.currentProductPrice)), 0),
    pendingReceipt: inventoryData.filter(item => !item.receivedQuantity).length,
    readyForDistribution: inventoryData.filter(item => item.receivedQuantity && !item.remainingQuantity && item.remainingQuantity !== 0).length,
  };

  if (loading) {
    return (
      <>
        <HamburgerNavigation />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading inventory data...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <HamburgerNavigation />
      <div className="min-h-screen bg-gray-50">
        <div className="pt-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
                  <p className="mt-2 text-gray-600">
                    Monitor and manage product inventory for {new Date(selectedDate).toLocaleDateString('en-IN', { 
                      year: 'numeric', month: 'long', day: 'numeric' 
                    })}
                  </p>
                </div>
                
                <div className="mt-4 md:mt-0">
                  <button
                    onClick={updateAllInventories}
                    disabled={updating}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {updating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </>
                    ) : (
                      'Recalculate All'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Total Products</p>
                    <p className="text-2xl font-semibold text-gray-900">{summaryStats.totalProducts}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📦</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Ordered Quantity</p>
                    <p className="text-2xl font-semibold text-gray-900">{summaryStats.totalOrderedQuantity}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📋</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Received Quantity</p>
                    <p className="text-2xl font-semibold text-gray-900">{summaryStats.totalReceivedQuantity}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Total Value</p>
                    <p className="text-2xl font-semibold text-gray-900">₹{summaryStats.totalValue.toFixed(2)}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-500">{summaryStats.pendingReceipt}</p>
                  <p className="text-sm text-gray-600">Pending Receipt</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-500">{summaryStats.readyForDistribution}</p>
                  <p className="text-sm text-gray-600">Ready for Distribution</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-500">{summaryStats.totalRemainingQuantity}</p>
                  <p className="text-sm text-gray-600">Remaining Stock</p>
                </div>
              </div>
            </div>

            {/* ✅ Pass selectedDate and setSelectedDate to InventoryTable */}
            <InventoryTable
              inventoryData={inventoryData}
              onUpdate={fetchInventoryData}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              getTodayString={getTodayString} // ✅ Pass helper function
              getYesterdayString={getYesterdayString} 
            />
          </div>
        </div>

        {/* Global Toaster */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#1e40af', color: '#fff', fontWeight: '500' },
            success: { style: { background: '#16a34a' } },
            error: { style: { background: '#dc2626' } },
          }}
        />
      </div>
    </>
  );
}
