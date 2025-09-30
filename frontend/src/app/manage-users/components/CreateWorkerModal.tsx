'use client';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

interface CreateWorkerForm {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  password: string;
  isActive: boolean;
}

interface CreateWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkerCreated: () => void;
}

export default function CreateWorkerModal({ isOpen, onClose, onWorkerCreated }: CreateWorkerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [createForm, setCreateForm] = useState<CreateWorkerForm>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    password: '',
    isActive: true,
  });

  const createWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Worker created successfully');
        setCreateForm({ firstName: '', lastName: '', phoneNumber: '', password: '', isActive: true });
        onClose();
        onWorkerCreated();
      } else {
        toast.error(data.message || 'Failed to create worker');
      }
    } catch (error) {
      console.error('Error creating worker:', error);
      toast.error('Error creating worker');
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
            Create New Worker
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

        <form onSubmit={createWorker} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          <input
            type="text"
            placeholder="First Name"
            value={createForm.firstName}
            required
            onChange={(e) => setCreateForm(prev => ({ ...prev, firstName: e.target.value }))}
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
            value={createForm.lastName}
            required
            onChange={(e) => setCreateForm(prev => ({ ...prev, lastName: e.target.value }))}
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
            value={createForm.phoneNumber}
            required
            onChange={(e) => setCreateForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
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
            placeholder="Password"
            value={createForm.password}
            required
            minLength={4}
            onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
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
              checked={createForm.isActive}
              onChange={(e) => setCreateForm(prev => ({ ...prev, isActive: e.target.checked }))}
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
              {isLoading ? 'Creating...' : 'Create Worker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
