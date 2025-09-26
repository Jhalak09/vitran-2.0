'use client';
import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { Customer, customerApi } from './customer';
import { CustomerForm, CustomersTable } from './CustomerComponents';

type ViewMode = 'list' | 'create' | 'edit';

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await customerApi.getAllCustomers();
      if (response.success && Array.isArray(response.data)) {
        setCustomers(response.data);
      } else {
        toast.error('Failed to fetch customers');
        setCustomers([]);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleCreateNew = () => { setSelectedCustomer(undefined); setViewMode('create'); };
  const handleEdit = (customer: Customer) => { setSelectedCustomer(customer); setViewMode('edit'); };
  const handleFormSuccess = () => { setViewMode('list'); setSelectedCustomer(undefined); fetchCustomers(); };
  const handleFormCancel = () => { setViewMode('list'); setSelectedCustomer(undefined); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
              <p className="mt-2 text-gray-600">Manage your customer database</p>
            </div>
            {viewMode === 'list' && (
              <button onClick={handleCreateNew}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md transition-colors duration-200">
                Add New Customer
              </button>
            )}
            {(viewMode === 'create' || viewMode === 'edit') && (
              <button onClick={handleFormCancel}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 shadow-md transition-colors duration-200">
                Back to List
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {viewMode === 'list' && (
            <CustomersTable customers={customers} onEdit={handleEdit} onRefresh={fetchCustomers} />
          )}
          {(viewMode === 'create' || viewMode === 'edit') && (
            <CustomerForm customer={selectedCustomer} onSuccess={handleFormSuccess} onCancel={handleFormCancel} isEdit={viewMode === 'edit'} />
          )}
        </div>

        {viewMode === 'list' && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{customers.length}</div>
                <div className="text-gray-500 mt-1">Total Customers</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{customers.filter(c => c.classification === 'B2B').length}</div>
                <div className="text-gray-500 mt-1">B2B Customers</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{customers.filter(c => c.classification === 'B2C').length}</div>
                <div className="text-gray-500 mt-1">B2C Customers</div>
              </div>
            </div>
          </div>
        )}
      </div>

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
  );
}
