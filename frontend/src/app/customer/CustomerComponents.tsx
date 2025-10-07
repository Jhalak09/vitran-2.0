'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { HindiSearchBar } from '@/components/ReusableSearchBar'; // ✅ Import reusable component
import { Customer, CreateCustomerDto, CustomerClassification, customerApi } from './customer';

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
const createAdvancedCustomerSearch = (searchTerm: string, customer: Customer): boolean => {
  if (!searchTerm || !customer) return false;
  
  const fields = [
    customer.firstName || '',
    customer.lastName || '',
    customer.phoneNumber || '',
    customer.city || '',
    `${customer.firstName || ''} ${customer.lastName || ''}`.trim(), // Full name
    `${customer.firstName || ''} ${customer.lastName || ''} ${customer.city || ''}`.trim() // Name + city
  ];
  
  // Search in each field
  return fields.some(field => enhancedMultiWordSearch(searchTerm, field));
};

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

  // ✅ Handle transliteration for name fields using reusable component onChange
  const handleTransliterateChange = (fieldName: keyof CreateCustomerDto, text: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: text }));
    if (errors[fieldName]) { setErrors(prev => ({ ...prev, [fieldName]: '' })); }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">{isEdit ? 'Edit Customer' : 'Add New Customer'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            {/* ✅ REPLACED: ReactTransliterate with reusable HindiSearchBar adapted for form input */}
            <div className="w-full">
              <HindiSearchBar
                value={formData.firstName}
                onChange={(text) => handleTransliterateChange('firstName', text)}
                placeholder="Enter first name (English/हिंदी)"
                className={`${errors.firstName ? '[&>div>input]:border-red-500' : ''}`}
              />
            </div>
            {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            {/* ✅ REPLACED: ReactTransliterate with reusable HindiSearchBar adapted for form input */}
            <div className="w-full">
              <HindiSearchBar
                value={formData.lastName}
                onChange={(text) => handleTransliterateChange('lastName', text)}
                placeholder="Enter last name (English/हिंदी)"
                className={`${errors.lastName ? '[&>div>input]:border-red-500' : ''}`}
              />
            </div>
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
            {/* ✅ REPLACED: ReactTransliterate with reusable HindiSearchBar for city names */}
            <div className="w-full">
              <HindiSearchBar
                value={formData.city}
                onChange={(text) => handleTransliterateChange('city', text)}
                placeholder="Enter city (English/हिंदी)"
                className={`${errors.city ? '[&>div>input]:border-red-500' : ''}`}
              />
            </div>
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
  const [searchQuery, setSearchQuery] = useState<string>(''); // ✅ Same state variable
  const [classificationFilter, setClassificationFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;

  // ✅ Keep your existing filter logic - works perfectly
  const filteredCustomers = customers.filter(customer => {
    if (!customer) return false;

    // Use advanced search that handles multi-word Hindi
    const searchMatch = !searchQuery.trim() || createAdvancedCustomerSearch(searchQuery, customer);
    const classificationMatch = !classificationFilter || customer.classification === classificationFilter;

    return searchMatch && classificationMatch;
  });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, classificationFilter]);

  const getClassificationBadge = (classification: string) => {
    const colors = { 
      B2B: 'bg-purple-100 text-purple-800', 
      B2C: 'bg-blue-100 text-blue-800' 
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[classification as keyof typeof colors] || colors.B2C}`}>
        {classification}
      </span>
    );
  };

  const getFullAddress = (customer: Customer): string => {
    let address = customer.address1;
    if (customer.address2) {
      address += `, ${customer.address2}`;
    }
    return address;
  };

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
      <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-700">
          <span>Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} customers</span>
          {searchQuery && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              Search: "{searchQuery}"
            </span>
          )}
          {classificationFilter && (
            <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
              Filter: {classificationFilter}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          {pages.map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && setCurrentPage(page)}
              disabled={page === '...'}
              className={`px-3 py-1 border rounded-md text-sm transition-colors ${
                currentPage === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : page === '...'
                  ? 'border-transparent cursor-default'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">
            Customers ({filteredCustomers.length})
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-3">
            {/* ✅ REPLACED: Complex ReactTransliterate with simple reusable component */}
            <HindiSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search: 'ram ji' or 'राम जी'..."
              width="250px"
            />
            
            <select 
              value={classificationFilter} 
              onChange={(e) => setClassificationFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ minWidth: '120px' }}
            >
              <option value="">All Types</option>
              <option value="B2C">B2C</option>
              <option value="B2B">B2B</option>
            </select>
            
            {/* Clear filters */}
            {(searchQuery || classificationFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setClassificationFilter('');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors whitespace-nowrap"
              >
                Clear All
              </button>
            )}
            
            <button 
              onClick={onRefresh}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors whitespace-nowrap"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
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
            {paginatedCustomers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <div className="text-4xl mb-2">👥</div>
                    <div className="text-lg font-medium">No customers found</div>
                    <div className="text-sm">
                      {searchQuery || classificationFilter 
                        ? 'Try adjusting your search terms or filters.' 
                        : 'Start by adding your first customer.'
                      }
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedCustomers.map((customer) => (
                <tr key={customer.customerId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {customer.firstName} {customer.lastName}
                      </div>
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
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={getFullAddress(customer)}>
                      {getFullAddress(customer)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getClassificationBadge(customer.classification)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => onEdit(customer)} 
                      className="text-blue-600 hover:text-blue-900 focus:outline-none transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {renderPagination()}
    </div>
  );
};
