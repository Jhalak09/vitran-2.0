'use client';
import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import HamburgerNavigation from '../../../components/HamburgerNavigation';
import { WorkerCustomerRelations } from './WorkerCustomerRelations';
import { CustomerProductRelations } from './CustomerProductRelations';
import {
  WorkerCustomerRelation,
  CustomerProductRelation,
  relationApi,
} from './relation';
import { useRouter } from 'next/navigation';

type TabType = 'worker-customer' | 'customer-product';

export default function CustomerRelationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('worker-customer');
  const [loading, setLoading] = useState(true);

  // Relations data
  const [workerCustomerRelations, setWorkerCustomerRelations] = useState<WorkerCustomerRelation[]>([]);
  const [customerProductRelations, setCustomerProductRelations] = useState<CustomerProductRelation[]>([]);
  const router = useRouter();
  useEffect(() => {
    fetchRelationsData();
  }, []);

  const fetchRelationsData = async () => {
    setLoading(true);
    try {
      const [workerCustomerRes, customerProductRes] = await Promise.all([
        relationApi.getWorkerCustomerRelations(),
        relationApi.getCustomerProductRelations(),
      ]);

      if (workerCustomerRes.success) setWorkerCustomerRelations(workerCustomerRes.data);
      if (customerProductRes.success) setCustomerProductRelations(customerProductRes.data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch relations data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <HamburgerNavigation />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading relationships...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* <HamburgerNavigation /> */}
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
            Customer Relations Management        </h1>

          </div>

        </div>
      </header>

        <div className="pt-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <p className="mt-2 text-gray-600">Manage customer-worker assignments and customer-product subscriptions</p>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('worker-customer')}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === 'worker-customer'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Worker-Customer Relations ({workerCustomerRelations.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('customer-product')}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === 'customer-product'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Customer-Product Relations ({customerProductRelations.length})
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-screen">
              {activeTab === 'worker-customer' && (
                <WorkerCustomerRelations
                  relations={workerCustomerRelations}
                  onUpdate={fetchRelationsData}
                />
              )}
              
              {activeTab === 'customer-product' && (
                <CustomerProductRelations
                  relations={customerProductRelations}
                  onUpdate={fetchRelationsData}
                />
              )}
            </div>
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
