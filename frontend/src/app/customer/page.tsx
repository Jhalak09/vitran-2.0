'use client';
import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { Customer, customerApi } from './customer';
import { CustomerForm, CustomersTable } from './CustomerComponents';
import { useRouter } from 'next/navigation';

type ViewMode = 'list' | 'create' | 'edit';

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
  const router = useRouter();

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
            Customer Management          </h1>

          </div>

          {/* ✅ ADDED: Add New Customer button in header */}
          {viewMode === 'list' && (
            <button
              onClick={handleCreateNew}
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                color: '#1e40af',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
              }}
            >
              + Add Customer
            </button>
          )}

          {/* ✅ ADDED: Back to List button in header for form views */}
          {(viewMode === 'create' || viewMode === 'edit') && (
            <button
              onClick={handleFormCancel}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                padding: '10px 20px',
                borderRadius: '12px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              ← Back to List
            </button>
          )}

        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
         
        </div>

        <div className="space-y-6">
          {viewMode === 'list' && (
            <CustomersTable customers={customers} onEdit={handleEdit} onRefresh={fetchCustomers} />
          )}
          {(viewMode === 'create' || viewMode === 'edit') && (
            <CustomerForm customer={selectedCustomer} onSuccess={handleFormSuccess} onCancel={handleFormCancel} isEdit={viewMode === 'edit'} />
          )}
        </div>

        
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
