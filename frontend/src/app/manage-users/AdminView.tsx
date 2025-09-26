'use client';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import CreateAdminModal from './components/CreateAdminModal';
import UpdateAdminModal from './components/UpdateAdminModal';

interface Admin {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

interface AdminViewProps {
  currentUser: any;
}

export default function AdminView({ currentUser }: AdminViewProps) {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    filterAdmins();
  }, [admins, searchTerm]);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
      } else {
        toast.error('Failed to fetch admins');
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Error fetching admins');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAdmins = () => {
    let filtered = [...admins];

    if (searchTerm) {
      filtered = filtered.filter(admin =>
        admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAdmins(filtered);
    setCurrentPage(1);
  };

  const handleEditAdmin = (admin: Admin) => {
    setEditingAdmin(admin);
    setShowUpdateModal(true);
  };

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    setEditingAdmin(null);
  };

  const deleteAdmin = async (adminId: number, adminName: string) => {
    if (!confirm(`Are you sure you want to delete admin "${adminName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${adminId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Admin deleted successfully');
        fetchAdmins();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete admin');
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error('Error deleting admin');
    }
  };

  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAdmins = filteredAdmins.slice(startIndex, startIndex + itemsPerPage);

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
          Admin Management
        </h2>
        
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.3s ease',
          }}
        >
          + Add Admin
        </button>
      </div>

      {/* Search */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
        marginBottom: '32px',
      }}>
        <input
          type="text"
          placeholder="Search admins by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '1rem',
            outline: 'none',
            transition: 'border-color 0.2s ease',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => e.target.style.borderColor = '#10b981'}
          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
        />
      </div>

      {/* Admin Table */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
      }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
            <p>Loading admins...</p>
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
                      Email
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
                  {paginatedAdmins.map((admin) => (
                    <tr
                      key={admin.id}
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
                        {admin.id}
                      </td>
                      <td style={{ padding: '16px 20px', color: '#111827', fontWeight: '500' }}>
                        {admin.name || 'N/A'}
                      </td>
                      <td style={{ padding: '16px 20px', color: '#374151' }}>
                        {admin.email}
                      </td>
                      <td style={{ padding: '16px 20px', color: '#6b7280', fontSize: '0.875rem' }}>
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEditAdmin(admin)}
                            style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            Edit
                          </button>
                          
                          <button
                            onClick={() => deleteAdmin(admin.id, admin.name || admin.email)}
                            disabled={admin.id === currentUser.id}
                            style={{
                              background: admin.id === currentUser.id 
                                ? '#e5e7eb' 
                                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              color: admin.id === currentUser.id ? '#9ca3af' : 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: admin.id === currentUser.id ? 'not-allowed' : 'pointer',
                              transition: 'all 0.3s ease',
                            }}
                            title={admin.id === currentUser.id ? 'Cannot delete yourself' : 'Delete admin'}
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
        {filteredAdmins.length === 0 && !isLoading && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6b7280',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👥</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>
              No admins found
            </h3>
            <p>Try adjusting your search terms.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateAdminModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onAdminCreated={fetchAdmins}
      />

      <UpdateAdminModal
        admin={editingAdmin}
        isOpen={showUpdateModal}
        onClose={handleCloseUpdateModal}
        onAdminUpdated={fetchAdmins}
      />
    </div>
  );
}
