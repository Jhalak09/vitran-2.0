'use client';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HindiSearchBar } from '@/components/ReusableSearchBar'; // ✅ Import reusable component
import CreateWorkerModal from './components/CreateWorkerModal';
import UpdateWorkerModal from './components/UpdateWorkerModal';

interface Worker {
  workerId: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: 'WORKER';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WorkerViewProps {
  currentUser: any;
}

// ✅ Keep your existing search logic - works perfectly with reusable component
const enhancedMultiWordSearch = (searchTerm: string, targetText: string): boolean => {
  if (!searchTerm || !targetText) return false;
  
  const normalizedTarget = targetText.toLowerCase().trim();
  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  // Direct match (exact phrase)
  if (normalizedTarget.includes(normalizedSearch)) return true;
  
  // Split search term into words for multi-word search
  const searchWords = normalizedSearch.split(/\s+/).filter(word => word.length > 0);
  
  if (searchWords.length === 1) {
    // Single word search
    return normalizedTarget.includes(normalizedSearch);
  }
  
  // Multi-word search - all words must be present (can be in any order)
  return searchWords.every(word => normalizedTarget.includes(word));
};

// ✅ Keep your existing advanced search logic
const createAdvancedSearch = (searchTerm: string, customer: any): boolean => {
  if (!searchTerm || !customer) return false;
  
  const fields = [
    customer.firstName || '',
    customer.lastName || '',
    customer.phoneNumber || '',
    `${customer.firstName || ''} ${customer.lastName || ''}`.trim() // Full name
  ];
  
  // Search in each field
  return fields.some(field => enhancedMultiWordSearch(searchTerm, field));
};

export default function WorkerView({ currentUser }: WorkerViewProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // ✅ Same state variable
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    filterWorkers();
  }, [workers, searchTerm, statusFilter]);

  const fetchWorkers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWorkers(data);
      } else {
        toast.error('Failed to fetch workers');
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
      toast.error('Error fetching workers');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Keep your existing filter logic - works perfectly
  const filterWorkers = () => {
    let filtered = [...workers];

    if (searchTerm && searchTerm.trim()) {
      filtered = filtered.filter(worker => {
        if (!worker) return false;
        
        // Use advanced search that handles multi-word Hindi
        return createAdvancedSearch(searchTerm, worker);
      });
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(worker => 
        statusFilter === 'ACTIVE' ? worker.isActive : !worker.isActive
      );
    }

    setFilteredWorkers(filtered);
    setCurrentPage(1);
  };

  const handleEditWorker = (worker: Worker) => {
    setEditingWorker(worker);
    setShowUpdateModal(true);
  };

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    setEditingWorker(null);
  };

  const deleteWorker = async (workerId: number, workerName: string) => {
    if (!confirm(`Are you sure you want to delete worker "${workerName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workers/${workerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Worker deleted successfully');
        fetchWorkers();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete worker');
      }
    } catch (error) {
      console.error('Error deleting worker:', error);
      toast.error('Error deleting worker');
    }
  };

  const toggleWorkerStatus = async (workerId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workers/${workerId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        fetchWorkers();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to toggle worker status');
      }
    } catch (error) {
      console.error('Error toggling worker status:', error);
      toast.error('Error toggling worker status');
    }
  };

  const totalPages = Math.ceil(filteredWorkers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWorkers = filteredWorkers.slice(startIndex, startIndex + itemsPerPage);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        borderTop: '1px solid #e5e7eb',
      }}>
        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredWorkers.length)} of {filteredWorkers.length} workers
          {searchTerm && (
            <span style={{
              marginLeft: '8px',
              padding: '2px 8px',
              backgroundColor: '#dbeafe',
              color: '#1e40af',
              borderRadius: '12px',
              fontSize: '0.75rem'
            }}>
              Search: "{searchTerm}"
            </span>
          )}
          {statusFilter !== 'ALL' && (
            <span style={{
              marginLeft: '8px',
              padding: '2px 8px',
              backgroundColor: '#dcfce7',
              color: '#16a34a',
              borderRadius: '12px',
              fontSize: '0.75rem'
            }}>
              Filter: {statusFilter}
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              background: currentPage === 1 ? '#f9fafb' : 'white',
              color: currentPage === 1 ? '#9ca3af' : '#374151',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
            }}
          >
            Previous
          </button>
          
          {pages.map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && setCurrentPage(page)}
              disabled={page === '...'}
              style={{
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                background: currentPage === page ? '#3b82f6' : page === '...' ? 'transparent' : 'white',
                color: currentPage === page ? 'white' : page === '...' ? '#9ca3af' : '#374151',
                cursor: page === '...' ? 'default' : 'pointer',
                fontSize: '0.875rem',
                minWidth: '40px',
                transition: 'all 0.2s ease',
              }}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              background: currentPage === totalPages ? '#f9fafb' : 'white',
              color: currentPage === totalPages ? '#9ca3af' : '#374151',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
            }}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#1e293b',
          margin: 0,
        }}>
          Worker Management
        </h2>
        
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.3s ease',
          }}
        >
          + Add Worker
        </button>
      </div>

      {/* ✅ UPDATED: Search and Filter with Reusable SearchBar */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
        marginBottom: '32px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          alignItems: 'start',
        }}>
          {/* ✅ REPLACED: Complex ReactTransliterate with simple reusable component */}
          <HindiSearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search: 'ram ji' or 'राम जी'..."
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '1rem',
              outline: 'none',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Worker Table */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
      }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
            <p>Loading workers...</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.95rem',
              }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb',
                    }}>
                      ID
                    </th>
                    <th style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb',
                    }}>
                      Name
                    </th>
                    <th style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb',
                    }}>
                      Phone
                    </th>
                    <th style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb',
                    }}>
                      Status
                    </th>
                    <th style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb',
                    }}>
                      Created
                    </th>
                    <th style={{
                      padding: '16px 20px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb',
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedWorkers.map((worker) => (
                    <tr
                      key={worker.workerId}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ padding: '16px 20px', color: '#374151' }}>
                        {worker.workerId}
                      </td>
                      <td style={{ padding: '16px 20px', color: '#111827', fontWeight: '500' }}>
                        {(worker.firstName || '')} {(worker.lastName || '')}
                      </td>
                      <td style={{ padding: '16px 20px', color: '#374151' }}>
                        {worker.phoneNumber || 'N/A'}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          backgroundColor: worker.isActive ? '#dcfce7' : '#fee2e2',
                          color: worker.isActive ? '#16a34a' : '#dc2626',
                        }}>
                          {worker.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', color: '#6b7280', fontSize: '0.875rem' }}>
                        {new Date(worker.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEditWorker(worker)}
                            style={{
                              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            Edit
                          </button>
                          
                          <button
                            onClick={() => toggleWorkerStatus(worker.workerId)}
                            style={{
                              background: worker.isActive 
                                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            {worker.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          
                          <button
                            onClick={() => deleteWorker(worker.workerId, `${worker.firstName || ''} ${worker.lastName || ''}`)}
                            style={{
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {renderPagination()}
          </>
        )}

        {/* Empty State */}
        {filteredWorkers.length === 0 && !isLoading && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6b7280',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👷</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>
              No workers found
            </h3>
            <p>
              {searchTerm || statusFilter !== 'ALL' 
                ? 'Try adjusting your search terms or filters.' 
                : 'Start by adding your first worker.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateWorkerModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onWorkerCreated={fetchWorkers}
      />

      <UpdateWorkerModal
        worker={editingWorker}
        isOpen={showUpdateModal}
        onClose={handleCloseUpdateModal}
        onWorkerUpdated={fetchWorkers}
      />
    </div>
  );
}
