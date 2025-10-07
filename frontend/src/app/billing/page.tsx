'use client'

import React from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { useBillManagement } from './useBillManagement'
import { BillsTable } from './BillsTable'
import { useRouter } from 'next/navigation'

export default function BillManagementPage() {
  const {
    customers,
    selectedCustomer,
    selectedMonth,
    customDateRange,
    includeDeliveryCharges,
    bills,
    billPreview,
    loading,
    useCustomRange,
    sendingWhatsApp,
    monthOptions,
    setSelectedCustomer,
    setSelectedMonth,
    setCustomDateRange,
    setIncludeDeliveryCharges,
    setUseCustomRange,
    handlePreviewBill,
    handleGenerateBill,
    handleSendWhatsApp,
    handleMarkPaid,
    handleDeleteFile,
    downloadBill,
    previewBillPDF,
  } = useBillManagement();
      const router = useRouter();


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
        padding: '20px 40px',
        boxShadow: '0 8px 32px rgba(30, 64, 175, 0.3)',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto',
        }}>
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

            <h1 style={{
              fontSize: '1.8rem',
              fontWeight: '800',
              color: 'white',
              margin: 0,
              letterSpacing: '-0.02em',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
              Bill Management
            </h1>
          </div>
          
        </div>
      </header>

    <div className="p-6 space-y-6">
        
      <h1 className="text-3xl font-bold text-gray-900"></h1>

      {/* Bill Generation Section */}
      <div className="bg-white rounded-lg shadow p-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
            <select
              value={selectedCustomer || ''}
              onChange={(e) => setSelectedCustomer(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Customer</option>
              {customers.map(customer => (
                <option key={customer.customerId} value={customer.customerId}>
                  {customer.firstName} {customer.lastName} - {customer.phoneNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!useCustomRange}
                  onChange={() => setUseCustomRange(false)}
                  className="mr-2"
                />
                Month
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={useCustomRange}
                  onChange={() => setUseCustomRange(true)}
                  className="mr-2"
                />
                Custom Range
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {!useCustomRange ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Month</option>
                {monthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Delivery Charges */}
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeDeliveryCharges}
                onChange={(e) => setIncludeDeliveryCharges(e.target.checked)}
                className="mr-2"
              />
              Include Delivery Charges
            </label>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handlePreviewBill}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Loading...
              </>
            ) : (
              'Preview Bill'
            )}
          </button>
          
          {billPreview && (
            <button
              onClick={handleGenerateBill}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              Generate & Save Bill
            </button>
          )}
        </div>
      </div>

      {/* Bill Preview */}
      {billPreview && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Bill Preview</h2>
          
          <div className="mb-4">
            <h3 className="font-medium">Customer: {billPreview.customer.firstName} {billPreview.customer.lastName}</h3>
            <p className="text-sm text-gray-600">{billPreview.customer.address1}, {billPreview.customer.city}</p>
          </div>

          {billPreview.productSummary && billPreview.productSummary.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 mb-4">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Packets</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {billPreview.productSummary.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.productName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.totalQuantity}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">₹{item.totalAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No unbilled deliveries found for the selected period
            </div>
          )}

          <div className="text-right">
            <p className="text-sm">Subtotal: ₹{billPreview.totalAmount.toFixed(2)}</p>
            {billPreview.deliveryCharges > 0 && (
              <p className="text-sm">Delivery Charges: ₹{billPreview.deliveryCharges.toFixed(2)}</p>
            )}
            <p className="text-lg font-semibold">Grand Total: ₹{billPreview.grandTotal.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Existing Bills */}
      {selectedCustomer && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Customer Bills
            {bills.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({bills.length} total)
              </span>
            )}
          </h2>
          
          <BillsTable
            bills={bills}
            sendingWhatsApp={sendingWhatsApp}
            onDownload={downloadBill}
            onPreview={previewBillPDF}
            onSendWhatsApp={handleSendWhatsApp}
            onMarkPaid={handleMarkPaid}
            onDeleteFile={handleDeleteFile}
          />
        </div>
      )}

      <Toaster />
    </div>
    </div>
  )
}
