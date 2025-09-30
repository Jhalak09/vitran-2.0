'use client'

import React, { useState, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import HamburgerNavigation from '../../components/HamburgerNavigation'
import InventoryTable from './InventoryTable'
import { inventoryApi, InventoryItem } from './inventory'

interface DemandItem {
  demandId: number;
  productId: number;
  totalDemand: number;
  date: string;
  product: {
    productId: number;
    productName: string;
    currentProductPrice: string;
    storeId: string;
    imageUrl?: string;
  };
}

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
  // Inventory fields (optional)
  inventoryId?: number;
  receivedQuantity?: number;
  remainingQuantity?: number;
  entryByUserLoginId?: string;
  lastUpdated?: string;
  date?: string;
}

export default function InventoryPage() {
  const [combinedData, setCombinedData] = useState<CombinedInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const currentUserId = 'admin'

  const fetchCombinedData = async () => {
    try {
      setLoading(true)
      
      // Fetch demand data (always available)
      const demandResponse = await inventoryApi.getDemandAll()
      if (!demandResponse.success) {
        throw new Error(demandResponse.message || 'Failed to fetch demand data')
      }
      
      const demands: DemandItem[] = demandResponse.data
      console.log('Demand data:', demands)
      
      // Fetch inventory data (may be empty if no products received)
      const inventoryResponse = await inventoryApi.getInventorySummary()
      const inventories: InventoryItem[] = inventoryResponse.success ? inventoryResponse.data : []
      console.log('Inventory data:', inventories)
      
      // Combine demand and inventory data - demand is the primary source
      const combined: CombinedInventoryItem[] = demands.map(demand => {
        // Find matching inventory record
        const inventory = inventories.find(inv => inv.productId === demand.productId)
        
        return {
          productId: demand.productId,
          demandId: demand.demandId,
          totalDemand: demand.totalDemand,
          product: demand.product,
          // Inventory data (optional)
          inventoryId: inventory?.inventoryId,
          receivedQuantity: inventory?.receivedQuantity,
          remainingQuantity: inventory?.remainingQuantity,
          entryByUserLoginId: inventory?.entryByUserLoginId,
          lastUpdated: inventory?.lastUpdated,
          date: inventory?.date
        }
      })
      
      console.log('Combined data:', combined)
      setCombinedData(combined)
      
    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast.error(error.message || 'Failed to fetch inventory data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCombinedData()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchCombinedData()
      toast.success('Data refreshed successfully')
    } catch (error: any) {
      console.error('Error refreshing data:', error)
      toast.error(error.message || 'Failed to refresh data')
    } finally {
      setRefreshing(false)
    }
  }

  const handleInventoryUpdate = async () => {
    await fetchCombinedData()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HamburgerNavigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading inventory data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HamburgerNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-2 text-gray-600">
            Monitor and manage product inventory for {new Date().toLocaleDateString('en-IN', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {refreshing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Data
              </>
            )}
          </button>
        </div>

        <InventoryTable 
          inventory={combinedData} 
          onInventoryUpdate={handleInventoryUpdate}
          currentUserId={currentUserId}
        />
      </div>

      <Toaster position="top-right" />
    </div>
  )
}
