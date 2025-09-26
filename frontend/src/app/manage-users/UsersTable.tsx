'use client';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'WORKER';
  createdAt: string;
  updatedAt: string;
}

interface UsersTableProps {
  users: User[];
  currentUser: any;
  onEditUser: (user: User) => void;
  onUserDeleted: () => void;
}

export default function UsersTable({ users, currentUser, onEditUser, onUserDeleted }: UsersTableProps) {
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [sortField, setSortField] = useState<keyof User>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchTerm, roleFilter, sortField, sortDirection]);

  const filterAndSortUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'ALL') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const deleteUser = async (userId: number, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('User deleted successfully');
        onUserDeleted();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error deleting user');
    }
  };

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <>
      {/* Search and Filter Section */}
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
          alignItems: 'center',
        }}>
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
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
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '1rem',
              outline: 'none',
              backgroundColor: 'white',
            }}
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="WORKER">Worker</option>
          </select>

          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            alignItems: 'center',
            justifyContent: 'flex-end'
          }}>
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
              Showing {paginatedUsers.length} of {filteredUsers.length} users
            </span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.95rem',
          }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th
                  onClick={() => handleSort('id')}
                  style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderBottom: '2px solid #e5e7eb',
                  }}
                >
                  ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('name')}
                  style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderBottom: '2px solid #e5e7eb',
                  }}
                >
                  Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('email')}
                  style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderBottom: '2px solid #e5e7eb',
                  }}
                >
                  Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('role')}
                  style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderBottom: '2px solid #e5e7eb',
                  }}
                >
                  Role {sortField === 'role' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('createdAt')}
                  style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderBottom: '2px solid #e5e7eb',
                  }}
                >
                  Created {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
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
              {paginatedUsers.map((user, index) => (
                <tr
                  key={user.id}
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
                    {user.id}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#111827', fontWeight: '500' }}>
                    {user.name}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#374151' }}>
                    {user.email}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      backgroundColor: user.role === 'ADMIN' 
                        ? '#fef3c7' 
                        : '#dbeafe',
                      color: user.role === 'ADMIN' 
                        ? '#92400e' 
                        : '#1e40af',
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', color: '#6b7280', fontSize: '0.875rem' }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => onEditUser(user)}
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
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
                        onClick={() => deleteUser(user.id, user.name)}
                        disabled={user.id === currentUser.id}
                        style={{
                          background: user.id === currentUser.id 
                            ? '#e5e7eb' 
                            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: user.id === currentUser.id ? '#9ca3af' : 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: user.id === currentUser.id ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease',
                        }}
                        title={user.id === currentUser.id ? 'Cannot delete yourself' : 'Delete user'}
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
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#6b7280',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👥</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>
            No users found
          </h3>
          <p>Try adjusting your search terms or filters.</p>
        </div>
      )}
    </>
  );
}
