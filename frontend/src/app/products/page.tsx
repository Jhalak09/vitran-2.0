'use client';
import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { Product, Store, productApi } from './product';
import { ProductForm } from './ProductForm';
import { ProductsTable } from './ProductsTable';
import { useRouter } from 'next/navigation';

type ViewMode = 'list' | 'create' | 'edit';

export default function ProductManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const router = useRouter();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productApi.getAllProducts();
      if (response.success && Array.isArray(response.data)) {
        setProducts(response.data);
      } else {
        toast.error('Failed to fetch products');
        setProducts([]);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleCreateNew = () => { setSelectedProduct(undefined); setViewMode('create'); };
  const handleEdit = (product: Product) => { setSelectedProduct(product); setViewMode('edit'); };
  const handleDelete = (product: Product) => { setProducts(prev => prev.filter(p => p.productId !== product.productId)); };
  const handleFormSuccess = () => { setViewMode('list'); setSelectedProduct(undefined); fetchProducts(); };
  const handleFormCancel = () => { setViewMode('list'); setSelectedProduct(undefined); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
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
Product Management            </h1>
          </div>
          <div className="w-full max-w-2xl">
          <div className="flex justify-between items-center">
            <div>
            </div>
            {viewMode === 'list' && (
              <button onClick={handleCreateNew}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md transition-colors duration-200">
                Add New Product
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
        </div>
        
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        

        <div className="space-y-6">
          {viewMode === 'list' && (
            <ProductsTable products={products} onEdit={handleEdit} onDelete={handleDelete} onRefresh={fetchProducts} />
          )}
          {(viewMode === 'create' || viewMode === 'edit') && (
            <ProductForm product={selectedProduct} onSuccess={handleFormSuccess} onCancel={handleFormCancel} isEdit={viewMode === 'edit'} />
          )}
        </div>

        {viewMode === 'list' && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-10">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{products.length}</div>
                <div className="text-gray-500 mt-1">Total Products</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{products.filter(p => p.storeId === Store.SANCHI).length}</div>
                <div className="text-gray-500 mt-1">SANCHI Store</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{products.filter(p => p.storeId === Store.SABORO).length}</div>
                <div className="text-gray-500 mt-1">SABORO Store</div>
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
