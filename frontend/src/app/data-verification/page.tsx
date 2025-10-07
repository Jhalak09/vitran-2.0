'use client'

import React, { useState, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { useRouter } from 'next/navigation';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface DeliveryData {
  workerId: number;
  workerName: string;
  customerId: number;
  customerName: string;
  inventoryId: number;
  productName: string;
  deliveredQuantity: number;
  bill: number;
  isCollected: boolean;
}

interface CashData {
  workerId: number;
  workerName: string;
  cashCollected: number;
}

interface FilterOption {
  id: number;
  name: string;
}

export default function DataVerificationPage() {
  const [deliveries, setDeliveries] = useState<DeliveryData[]>([])
  const [cashData, setCashData] = useState<CashData[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Filter states
  const [selectedWorker, setSelectedWorker] = useState<string>('')
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')

  // Unique values for filters
  const [uniqueWorkers, setUniqueWorkers] = useState<FilterOption[]>([])
  const [uniqueCustomers, setUniqueCustomers] = useState<FilterOption[]>([])
  const router = useRouter();

  const fetchData = async () => {
    try {
      setLoading(true)
      const [deliveriesRes, cashRes] = await Promise.all([
        fetch(`${API_BASE_URL}/data-verification/overview`),
        fetch(`${API_BASE_URL}/data-verification/cash-summary`)
      ])
      
      const deliveriesData = await deliveriesRes.json()
      const cashDataRes = await cashRes.json()
      
      if (deliveriesData.success && Array.isArray(deliveriesData.data)) {
        setDeliveries(deliveriesData.data)
        
        // Extract unique workers with proper null checks
        const workersMap = new Map<number, string>()
        deliveriesData.data.forEach((d: DeliveryData) => {
          if (d && typeof d.workerId === 'number' && d.workerName) {
            workersMap.set(d.workerId, d.workerName)
          }
        })
        
        const workers: FilterOption[] = Array.from(workersMap.entries())
          .map(([id, name]) => ({ id, name }))
          .filter(worker => worker.id != null && worker.name != null)
        
        // Extract unique customers with proper null checks
        const customersMap = new Map<number, string>()
        deliveriesData.data.forEach((d: DeliveryData) => {
          if (d && typeof d.customerId === 'number' && d.customerName) {
            customersMap.set(d.customerId, d.customerName)
          }
        })
        
        const customers: FilterOption[] = Array.from(customersMap.entries())
          .map(([id, name]) => ({ id, name }))
          .filter(customer => customer.id != null && customer.name != null)
        
        setUniqueWorkers(workers)
        setUniqueCustomers(customers)
      }
      
      if (cashDataRes.success && Array.isArray(cashDataRes.data)) {
        setCashData(cashDataRes.data)
      }
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filter deliveries based on selected filters
  const filteredDeliveries = deliveries.filter(delivery => {
    if (!delivery) return false
    const workerMatch = selectedWorker === '' || delivery.workerId?.toString() === selectedWorker
    const customerMatch = selectedCustomer === '' || delivery.customerId?.toString() === selectedCustomer
    return workerMatch && customerMatch
  })

  // Filter cash data based on worker filter
  const filteredCashData = cashData.filter(cash => {
    if (!cash) return false
    return selectedWorker === '' || cash.workerId?.toString() === selectedWorker
  })

  // ✅ ADDED: Check if data is empty to prevent submission
  const isDataEmpty = deliveries.length === 0 && cashData.length === 0
  const isSubmitDisabled = submitting || isDataEmpty

  const updateDelivery = (index: number, field: keyof DeliveryData, value: any) => {
    setDeliveries(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const updateCash = (index: number, amount: number) => {
    setCashData(prev => prev.map((item, i) => 
      i === index ? { ...item, cashCollected: amount } : item
    ))
  }

  const clearFilters = () => {
    setSelectedWorker('')
    setSelectedCustomer('')
  }

  const submitVerification = async () => {
    // ✅ ADDED: Prevent submission if data is empty
    if (isDataEmpty) {
      toast.error('No data available to verify. Please ensure there are deliveries or cash records to submit.')
      return
    }

    try {
      setSubmitting(true)
      
      const response = await fetch(`${API_BASE_URL}/verification/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveries: deliveries.map(d => ({
            workerId: d.workerId,
            customerId: d.customerId,
            inventoryId: d.inventoryId,
            productName: d.productName,
            deliveredQuantity: d.deliveredQuantity,
            bill: d.bill,
            isCollected: d.isCollected
          })),
          cashData: cashData.map(c => ({
            workerId: c.workerId,
            actualAmount: c.cashCollected
          })),
          verifiedBy: 'admin'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Verification submitted successfully')
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Failed to submit verification')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
<header
  style={{
    background:
      'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
    padding: '20px 40px',
    boxShadow: '0 8px 32px rgba(30, 64, 175, 0.3)',
    position: 'relative',
    zIndex: 1,
  }}
>
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between', // left & right alignment
      alignItems: 'center',
      maxWidth: '1400px',
      margin: '0 auto',
    }}
  >
    {/* LEFT SIDE: Button + Title */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <button
        onClick={() => router.replace('/dashboard')}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '8px',
          color: 'white',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: '500',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
        }}
      >
        ← Dashboard
      </button>

      <h1
        style={{
          fontSize: '1.8rem',
          fontWeight: '800',
          color: 'white',
          margin: 0,
          letterSpacing: '-0.02em',
          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        Data Verification
      </h1>
    </div>

    {/* RIGHT SIDE: Delivery & Cash Info */}
    <div
      style={{
        fontSize: '0.9rem',
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '500',
      }}
    >
      Showing {filteredDeliveries.length} deliveries, {filteredCashData.length}{' '}
      cash records
    </div>
  </div>
</header>

    <div className="p-6 space-y-6">
        
      

      {/* ✅ ADDED: Alert when no data is available */}
      {isDataEmpty && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-yellow-400 mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">No Data Available</h3>
              <p className="text-sm text-yellow-700">There are no deliveries or cash records to verify at this time.</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <h3 className="text-lg font-medium">Filters:</h3>
          
          {/* Worker Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Worker:</label>
            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Workers</option>
              {uniqueWorkers.map(worker => (
                worker?.id != null && worker?.name ? (
                  <option key={worker.id} value={worker.id.toString()}>
                    {worker.name}
                  </option>
                ) : null
              ))}
            </select>
          </div>

          {/* Customer Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Customer:</label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Customers</option>
              {uniqueCustomers.map(customer => (
                customer?.id != null && customer?.name ? (
                  <option key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </option>
                ) : null
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {(selectedWorker || selectedCustomer) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Daily Deliveries</h2>
          <span className="text-sm text-gray-600">({filteredDeliveries.length} records)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No deliveries found matching the selected filters
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((delivery) => {
                  if (!delivery) return null
                  
                  // Find the original index in the unfiltered array
                  const originalIndex = deliveries.findIndex(d => 
                    d && d.workerId === delivery.workerId && 
                    d.customerId === delivery.customerId && 
                    d.inventoryId === delivery.inventoryId
                  )
                  
                  return (
                    <tr key={`${delivery.workerId}-${delivery.customerId}-${delivery.inventoryId}`}>
                      <td className="px-6 py-4 text-sm text-gray-900">{delivery.workerName || 'Unknown'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{delivery.customerName || 'Unknown'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{delivery.productName || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={delivery.deliveredQuantity || 0}
                          onChange={e => updateDelivery(originalIndex, 'deliveredQuantity', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.01"
                          value={delivery.bill || 0}
                          onChange={e => updateDelivery(originalIndex, 'bill', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={delivery.isCollected || false}
                          onChange={e => updateDelivery(originalIndex, 'isCollected', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cash Collection Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cash Collection</h2>
          <span className="text-sm text-gray-600">({filteredCashData.length} records)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cash Collected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCashData.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                    No cash records found matching the selected filters
                  </td>
                </tr>
              ) : (
                filteredCashData.map((cash) => {
                  if (!cash) return null
                  
                  // Find the original index in the unfiltered array
                  const originalIndex = cashData.findIndex(c => c && c.workerId === cash.workerId)
                  
                  return (
                    <tr key={cash.workerId}>
                      <td className="px-6 py-4 text-sm text-gray-900">{cash.workerName || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={cash.cashCollected || 0}
                          onChange={e => updateCash(originalIndex, parseInt(e.target.value) || 0)}
                          className="w-32 px-2 py-1 border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={submitVerification}
          disabled={isSubmitDisabled} // ✅ UPDATED: Now disabled when data is empty
          className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
            isSubmitDisabled 
              ? 'bg-gray-400 cursor-not-allowed text-gray-200' // ✅ UPDATED: Better disabled styling
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Submitting...
            </>
          ) : isDataEmpty ? (
            // ✅ ADDED: Different text when data is empty
            'No Data to Verify'
          ) : (
            'Complete Verification'
          )}
        </button>
      </div>

      <Toaster />
    </div>
    </div>
  )
}
