'use client';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Admin {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

interface UpdateAdminForm {
  email: string;
  password: string;
  name: string;
}

interface UpdateAdminModalProps {
  admin: Admin | null;
  isOpen: boolean;
  onClose: () => void;
  onAdminUpdated: () => void;
}

export default function UpdateAdminModal({ admin, isOpen, onClose, onAdminUpdated }: UpdateAdminModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [updateForm, setUpdateForm] = useState<UpdateAdminForm>({
    email: '',
    password: '',
    name: '',
  });

  useEffect(() => {
    if (admin && isOpen) {
      setUpdateForm({
        email: admin.email,
        password: '',
        name: admin.name || '',
      });
    }
  }, [admin, isOpen]);

  const updateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin) return;

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const updateData: any = {
        email: updateForm.email,
        name: updateForm.name,
      };
      
      if (updateForm.password.trim()) {
        updateData.password = updateForm.password;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${admin.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Admin updated successfully');
        onClose();
        onAdminUpdated();
      } else {
        toast.error(data.message || 'Failed to update admin');
      }
    } catch (error) {
      console.error('Error updating admin:', error);
      toast.error('Error updating admin');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px' 
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1e293b',
            margin: 0,
          }}>
            Update Admin: {admin?.name}
          </h2>
          
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={updateAdmin} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          <input
            type="text"
            placeholder="Full Name"
            value={updateForm.name}
            required
            onChange={(e) => setUpdateForm(prev => ({ ...prev, name: e.target.value }))}
            style={{
              padding: '12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => e.target.style.borderColor = '#10b981'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
          
          <input
            type="email"
            placeholder="Email Address"
            value={updateForm.email}
            required
            onChange={(e) => setUpdateForm(prev => ({ ...prev, email: e.target.value }))}
            style={{
              padding: '12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => e.target.style.borderColor = '#10b981'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
          
          <input
            type="password"
            placeholder="New Password (leave empty to keep current)"
            value={updateForm.password}
            onChange={(e) => setUpdateForm(prev => ({ ...prev, password: e.target.value }))}
            style={{
              padding: '12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => e.target.style.borderColor = '#10b981'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: '#e5e7eb',
                color: '#374151',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isLoading}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                transition: 'all 0.3s ease',
              }}
            >
              {isLoading ? 'Updating...' : 'Update Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
