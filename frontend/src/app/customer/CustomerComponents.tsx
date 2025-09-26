'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Customer, CreateCustomerDto, CustomerClassification, customerApi } from './customer';

interface CustomerFormProps {
  customer?: Customer;
  onSuccess: () => void;
  onCancel: () => void;
  isEdit?: boolean;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSuccess, onCancel, isEdit = false }) => {
  const [formData, setFormData] = useState<CreateCustomerDto>({
    firstName: '', lastName: '', address1: '', address2: '', phoneNumber: '', city: '', pincode: '',
    classification: CustomerClassification.B2C,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer && isEdit) {
      setFormData({
        firstName: customer.firstName, lastName: customer.lastName, address1: customer.address1,
        address2: customer.address2 || '', phoneNumber: customer.phoneNumber, city: customer.city,
        pincode: customer.pincode, classification: customer.classification,
      });
    }
  }, [customer, isEdit]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.address1.trim()) newErrors.address1 = 'Address is required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
    
    const phoneRegex = /^[+]?[1-9]?[0-9]{7,15}$/;
    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    const pincodeRegex = /^[0-9]{6}$/;
    if (formData.pincode && !pincodeRegex.test(formData.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) { toast.error('Please fix the form errors'); return; }
    setLoading(true);
    try {
      let response;
      if (isEdit && customer) {
        response = await customerApi.updateCustomer(customer.customerId, formData);
      } else {
        response = await customerApi.createCustomer(formData);
      }
      if (response.success) { toast.success(response.message); onSuccess(); } 
      else { toast.error(response.message); }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} customer`);
    } finally { setLoading(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) { setErrors(prev => ({ ...prev, [name]: '' })); }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">{isEdit ? 'Edit Customer' : 'Add New Customer'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter first name" />
            {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter last name" />
            {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
          <input type="text" name="address1" value={formData.address1} onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.address1 ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter address line 1" />
          {errors.address1 && <p className="text-red-500 text-sm mt-1">{errors.address1}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
          <input type="text" name="address2" value={formData.address2} onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter address line 2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter phone number" />
            {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
            <input type="text" name="city" value={formData.city} onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter city" />
            {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
            <input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.pincode ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter pincode" />
            {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
          </div>
        </div>
        <div className="max-w-sm">
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type *</label>
          <select name="classification" value={formData.classification} onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value={CustomerClassification.B2C}>B2C (Business to Consumer)</option>
            <option value={CustomerClassification.B2B}>B2B (Business to Business)</option>
          </select>
        </div>
        <div className="flex justify-end space-x-4 pt-6">
          <button type="button" onClick={onCancel} disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500">Cancel</button>
          <button type="submit" disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Saving...' : isEdit ? 'Update Customer' : 'Create Customer'}
          </button>
        </div>
      </form>
    </div>
  );
};

interface CustomersTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onRefresh: () => void;
}

export const CustomersTable: React.FC<CustomersTableProps> = ({ customers, onEdit, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const filteredCustomers = customers.filter(customer =>
    customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phoneNumber.includes(searchQuery) || customer.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getClassificationBadge = (classification: string) => {
    const colors = { B2B: 'bg-purple-100 text-purple-800', B2C: 'bg-blue-100 text-blue-800' };
    return (<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[classification as keyof typeof colors] || colors.B2C}`}>{classification}</span>);
  };

  const getFullAddress = (customer: Customer) => {
    let address = customer.address1;
    if (customer.address2) {
      address += `, ${customer.address2}`;
    }
    return address;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">Customers ({filteredCustomers.length})</h2>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <input type="text" placeholder="Search customers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            <button onClick={onRefresh}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500">Refresh</button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCustomers.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">{searchQuery ? 'No customers found matching your search.' : 'No customers found.'}</td></tr>
            ) : (
              filteredCustomers.map((customer) => (
                <tr key={customer.customerId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.firstName} {customer.lastName}</div>
                      <div className="text-sm text-gray-500">ID: {customer.customerId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.phoneNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.city}</div>
                    <div className="text-sm text-gray-500">{customer.pincode}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{getFullAddress(customer)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getClassificationBadge(customer.classification)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => onEdit(customer)} className="text-blue-600 hover:text-blue-900 focus:outline-none">Edit</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {filteredCustomers.length > 0 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex justify-between"><div className="text-sm text-gray-700">Showing {filteredCustomers.length} customers</div></div>
        </div>
      )}
    </div>
  );
};
