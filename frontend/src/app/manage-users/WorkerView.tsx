'use client';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
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

export default function WorkerView({ currentUser }: WorkerViewProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filterWorkers = () => {
    let filtered = [...workers];

    if (searchTerm) {
      filtered = filtered.filter(worker =>
        worker.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.phoneNumber.includes(searchTerm)
      );
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

      {/* Search and Filter */}
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
        }}>
          <input
            type="text"
            placeholder="Search workers by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
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
                        {worker.firstName} {worker.lastName}
                      </td>
                      <td style={{ padding: '16px 20px', color: '#374151' }}>
                        {worker.phoneNumber}
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
                            onClick={() => deleteWorker(worker.workerId, `${worker.firstName} ${worker.lastName}`)}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px',
                gap: '8px',
                borderTop: '1px solid #e5e7eb',
              }}>
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
                  }}
                >
                  Previous
                </button>
                
                <span style={{ margin: '0 16px', color: '#374151' }}>
                  Page {currentPage} of {totalPages}
                </span>
                
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
                  }}
                >
                  Next
                </button>
              </div>
            )}
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
            <p>Try adjusting your search terms or filters.</p>
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
