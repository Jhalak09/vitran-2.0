'use client'

import React, { useState, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { startOfMonth, endOfMonth, format, startOfYear, eachMonthOfInterval } from 'date-fns'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface Customer {
  customerId: number;
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  phoneNumber: string;
}

interface Bill {
  billId: number;
  billNumber: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  isPaid: boolean;
  createdAt: string;
}

interface BillPreview {
  customer: Customer;
  productSummary: Array<{
    productName: string;
    totalQuantity: number;
    unitPrice: number;
    totalAmount: number;
  }>;
  totalAmount: number;
  deliveryCharges: number;
  grandTotal: number;
}

export default function BillManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' })
  const [includeDeliveryCharges, setIncludeDeliveryCharges] = useState(false)
  const [bills, setBills] = useState<Bill[]>([])
  const [billPreview, setBillPreview] = useState<BillPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [useCustomRange, setUseCustomRange] = useState(false)

  // Generate months for current year using date-fns
  const generateMonthOptions = () => {
    const currentDate = new Date()
    const startOfCurrentYear = startOfYear(currentDate)
    
    // Get all months from January to current month
    const months = eachMonthOfInterval({
      start: startOfCurrentYear,
      end: currentDate
    })
    
    const options = months.map(date => ({
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy')
    }))
    
    // Reverse to show most recent months first
    return options.reverse()
  }

  // Get date range from month using date-fns
  const getDateRangeFromMonth = (monthValue: string) => {
  const [year, month] = monthValue.split('-').map(Number)
  const monthDate = new Date(year, month - 1, 1)
  
  const startDate = format(startOfMonth(monthDate), 'yyyy-MM-dd')
  const endDate = format(endOfMonth(monthDate), 'yyyy-MM-dd')
  
  console.log(`${format(monthDate, 'MMMM yyyy')} (${monthValue}): ${startDate} to ${endDate}`)
  
  return { 
    start: startDate, 
    end: endDate 
  }
}

  const monthOptions = generateMonthOptions()

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers`)
      const data = await response.json()
      if (data.success) {
        setCustomers(data.data)
      }
    } catch (error) {
      toast.error('Failed to fetch customers')
    }
  }

  const fetchCustomerBills = async (customerId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bills/customer/${customerId}`)
      const data = await response.json()
      if (data.success) {
        setBills(data.data)
      }
    } catch (error) {
      toast.error('Failed to fetch bills')
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerBills(selectedCustomer)
    }
  }, [selectedCustomer])

  const previewBill = async () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer')
      return
    }

    const dateRange = useCustomRange 
      ? customDateRange 
      : selectedMonth 
        ? getDateRangeFromMonth(selectedMonth)
        : null

    if (!dateRange || !dateRange.start || !dateRange.end) {
      toast.error('Please select a date range')
      return
    }

    console.log('Sending API request with:', {
      customerId: selectedCustomer,
      dateRange,
      includeDeliveryCharges
    })

    setLoading(true)
    try {
      const params = new URLSearchParams({
        customerId: selectedCustomer.toString(),
        startDate: dateRange.start,
        endDate: dateRange.end,
        includeDeliveryCharges: includeDeliveryCharges.toString()
      })

      const apiUrl = `${API_BASE_URL}/bills/preview?${params}`
      console.log('API URL:', apiUrl)

      const response = await fetch(apiUrl)
      const data = await response.json()
      
      console.log('API Response:', data)
      
      if (data.success) {
        setBillPreview(data.data)
        if (data.data.deliveries && data.data.deliveries.length === 0) {
          toast('No unbilled deliveries found for the selected period')
        }
      } else {
        toast.error(data.message)
        setBillPreview(null)
      }
    } catch (error) {
      console.error('Preview error:', error)
      toast.error('Failed to preview bill')
    } finally {
      setLoading(false)
    }
  }

  const generateBill = async () => {
    if (!selectedCustomer || !billPreview) {
      toast.error('Please preview the bill first')
      return
    }

    const dateRange = useCustomRange 
      ? customDateRange 
      : getDateRangeFromMonth(selectedMonth)

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/bills/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer,
          startDate: dateRange.start,
          endDate: dateRange.end,
          includeDeliveryCharges,
          createdBy: 'admin'
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Bill generated successfully')
        setBillPreview(null)
        fetchCustomerBills(selectedCustomer)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Failed to generate bill')
    } finally {
      setLoading(false)
    }
  }

  const downloadBill = async (billId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bills/download/${billId}`)
      
      if (!response.ok) {
        throw new Error('Failed to download bill')
      }
      
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bill-${billId}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
      
      toast.success('Bill downloaded successfully')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download bill')
    }
  }

  const markBillPaid = async (billId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bills/${billId}/mark-paid`, {
        method: 'PATCH'
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Bill marked as paid')
        if (selectedCustomer) {
          fetchCustomerBills(selectedCustomer)
        }
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Failed to mark bill as paid')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Bill Management</h1>

      {/* Bill Generation Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Generate New Bill</h2>
        
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
            onClick={previewBill}
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
              onClick={generateBill}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              Generate Bill
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
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
            <p className="text-lg font-semibold">Total: ₹{billPreview.grandTotal.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Existing Bills */}
      {selectedCustomer && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Customer Bills</h2>
          
          {bills.length === 0 ? (
            <p className="text-gray-500">No bills found for this customer.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bills.map(bill => (
                    <tr key={bill.billId}>
                      <td className="px-6 py-4 text-sm text-gray-900">{bill.billNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {format(new Date(bill.startDate), 'MMM dd, yyyy')} - {format(new Date(bill.endDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">₹{Number(bill.totalAmount).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          bill.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {bill.isPaid ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => downloadBill(bill.billId)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                        >
                          Download
                        </button>
                        {!bill.isPaid && (
                          <button
                            onClick={() => markBillPaid(bill.billId)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                          >
                            Mark Paid
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
      )}

      <Toaster />
    </div>
  )
}
