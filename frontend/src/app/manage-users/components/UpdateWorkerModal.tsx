'use client';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

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

interface UpdateWorkerForm {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  password: string;
  isActive: boolean;
}

interface UpdateWorkerModalProps {
  worker: Worker | null;
  isOpen: boolean;
  onClose: () => void;
  onWorkerUpdated: () => void;
}

export default function UpdateWorkerModal({ worker, isOpen, onClose, onWorkerUpdated }: UpdateWorkerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [updateForm, setUpdateForm] = useState<UpdateWorkerForm>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    password: '',
    isActive: true,
  });

  useEffect(() => {
    if (worker && isOpen) {
      setUpdateForm({
        firstName: worker.firstName,
        lastName: worker.lastName,
        phoneNumber: worker.phoneNumber,
        password: '', // Always empty for security
        isActive: worker.isActive,
      });
    }
  }, [worker, isOpen]);

  const updateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) return;

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Prepare update data - only include fields that are not empty
      const updateData: any = {
        firstName: updateForm.firstName,
        lastName: updateForm.lastName,
        phoneNumber: updateForm.phoneNumber,
        isActive: updateForm.isActive,
      };

      // Only include password if it's provided
      if (updateForm.password.trim()) {
        updateData.password = updateForm.password;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workers/${worker.workerId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Worker updated successfully');
        onClose();
        onWorkerUpdated();
      } else {
        toast.error(data.message || 'Failed to update worker');
      }
    } catch (error) {
      console.error('Error updating worker:', error);
      toast.error('Error updating worker');
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
            Update Worker: {worker?.firstName} {worker?.lastName}
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

        <form onSubmit={updateWorker} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          <input
            type="text"
            placeholder="First Name"
            value={updateForm.firstName}
            required
            onChange={(e) => setUpdateForm(prev => ({ ...prev, firstName: e.target.value }))}
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
          
          <input
            type="text"
            placeholder="Last Name"
            value={updateForm.lastName}
            required
            onChange={(e) => setUpdateForm(prev => ({ ...prev, lastName: e.target.value }))}
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
          
          <input
            type="tel"
            placeholder="Phone Number"
            value={updateForm.phoneNumber}
            required
            onChange={(e) => setUpdateForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
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

          <input
            type="password"
            placeholder="New Password (leave empty to keep current)"
            value={updateForm.password}
            minLength={6}
            onChange={(e) => setUpdateForm(prev => ({ ...prev, password: e.target.value }))}
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
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="checkbox"
              id="isActive"
              checked={updateForm.isActive}
              onChange={(e) => setUpdateForm(prev => ({ ...prev, isActive: e.target.checked }))}
            />
            <label htmlFor="isActive" style={{ color: '#374151', fontWeight: '500' }}>
              Active Worker
            </label>
          </div>
          
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
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
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
              {isLoading ? 'Updating...' : 'Update Worker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
