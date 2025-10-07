'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HindiSearchBar } from '@/components/ReusableSearchBar'; // ✅ Import reusable SearchBar
import { HindiDropdown, createDropdownOptions, DropdownOption } from '@/components/ReusableDropdown'; // ✅ Import reusable Dropdowns
import { WorkerCustomerRelation, Worker, Customer, relationApi } from './relation';

// ✅ Enhanced search function for multi-word Hindi search
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

// ✅ Advanced search for relation data
const createAdvancedRelationSearch = (searchTerm: string, relation: WorkerCustomerRelation): boolean => {
  if (!searchTerm || !relation) return false;
  
  const fields = [
    // Worker fields
    relation.worker.firstName || '',
    relation.worker.lastName || '',
    relation.worker.phoneNumber || '',
    `${relation.worker.firstName || ''} ${relation.worker.lastName || ''}`.trim(),
    
    // Customer fields
    relation.customer.firstName || '',
    relation.customer.lastName || '',
    relation.customer.phoneNumber || '',
    relation.customer.city || '',
    relation.customer.classification || '',
    `${relation.customer.firstName || ''} ${relation.customer.lastName || ''}`.trim(),
    
    // Combined fields
    `${relation.worker.firstName || ''} ${relation.worker.lastName || ''} ${relation.customer.firstName || ''} ${relation.customer.lastName || ''}`.trim()
  ];
  
  // Search in each field
  return fields.some(field => enhancedMultiWordSearch(searchTerm, field));
};

interface WorkerCustomerRelationsProps {
  relations: WorkerCustomerRelation[];
  onUpdate: () => void;
}

export const WorkerCustomerRelations: React.FC<WorkerCustomerRelationsProps> = ({
  relations,
  onUpdate,
}) => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [sequenceNumber, setSequenceNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ Enhanced search and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ended'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workersRes, customersRes] = await Promise.all([
          relationApi.getAllWorkers(),
          relationApi.getAllCustomers(),
        ]);
        setWorkers(workersRes.data);
        setCustomers(customersRes.data);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load data');
      }
    };
    fetchData();
  }, []);

  // Filter customers: exclude those with ACTIVE assignments to ANY worker (including selected worker)
  useEffect(() => {
    if (!selectedWorker) {
      setAvailableCustomers([]);
      return;
    }

    // Get customer IDs that have active assignments (no thruDate) to ANY worker
    const activelyAssignedCustomerIds = relations
      .filter(rel => !rel.thruDate) // No thruDate means active assignment
      .map(rel => rel.customerId);

    // Show only customers that are NOT actively assigned to anyone
    const filtered = customers.filter(
      c => !activelyAssignedCustomerIds.includes(c.customerId)
    );

    setAvailableCustomers(filtered);
  }, [selectedWorker, customers, relations]);

  // ✅ Enhanced multi-word search with pagination
  const filteredRelations = relations.filter((relation) => {
    if (!relation) return false;

    // Use advanced search that handles multi-word Hindi
    const searchMatch = !searchTerm.trim() || createAdvancedRelationSearch(searchTerm, relation);
    
    // Status filter
    let statusMatch = true;
    if (statusFilter === 'active') statusMatch = !relation.thruDate;
    if (statusFilter === 'ended') statusMatch = !!relation.thruDate;
    
    return searchMatch && statusMatch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRelations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRelations = filteredRelations.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const assignCustomer = async () => {
    if (!selectedWorker || !selectedCustomer || !sequenceNumber) {
      toast.error('Please select worker, customer, and sequence number');
      return;
    }
    setLoading(true);
    try {
      await relationApi.assignCustomerToWorker({
        workerId: selectedWorker,
        customerId: selectedCustomer,
        sequenceNumber,
      });
      toast.success('Customer assigned successfully');
      onUpdate();
      setSelectedCustomer(null);
      setSequenceNumber(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign customer');
    } finally {
      setLoading(false);
    }
  };

  const removeCustomer = async (workerId: number, customerId: number) => {
    if (!confirm('Are you sure you want to remove this customer from the worker? This will set the through date to now.')) return;

    try {
      const response = await relationApi.deleteWorkerCustomerRelation(workerId, customerId);
      if (response.success) {
        toast.success('Customer removed from worker');
        onUpdate();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove customer from worker');
    }
  };

  const clearForm = () => {
    setSelectedWorker(null);
    setSelectedCustomer(null);
    setSequenceNumber(null);
  };

  // ✅ Create dropdown options for workers and customers
  const workerOptions = createDropdownOptions(
    workers,
    (worker) => `${worker.firstName} ${worker.lastName}`, // Label
    (worker) => worker.workerId, // ID
    (worker) => worker.phoneNumber, // Subtitle
    (worker) => [worker.isActive ? 'Active' : 'Inactive'] // Details
  );

  const customerOptions = createDropdownOptions(
    availableCustomers,
    (customer) => `${customer.firstName} ${customer.lastName}`, // Label
    (customer) => customer.customerId, // ID
    (customer) => customer.phoneNumber, // Subtitle
    (customer) => [customer.city, customer.classification] // Details
  );

  // Enhanced pagination component
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add first page if not visible
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }

    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add last page if not visible
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return (
      <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-700">
          <span>
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredRelations.length)} of {filteredRelations.length} relations
          </span>
          {searchTerm && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              Search: "{searchTerm}"
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
              Filter: {statusFilter}
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
    <div className="space-y-6">
      {/* ✅ UPDATED: Assignment Form with Hindi Dropdowns */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-6">Assign Customer to Worker</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            {/* ✅ REPLACED: Complex select with Hindi Dropdown for Worker */}
            <HindiDropdown
              label="Select Worker"
              options={workerOptions}
              selectedValue={selectedWorker}
              onSelect={(option: DropdownOption<Worker> | null) => 
                setSelectedWorker(option ? option.value.workerId : null)
              }
              placeholder="Choose a worker..."
              emptyMessage="No workers found"
              allowClear={true}
            />
          </div>

          <div>
            {/* ✅ REPLACED: Complex select with Hindi Dropdown for Customer */}
            <HindiDropdown
              label="Select Customer"
              options={customerOptions}
              selectedValue={selectedCustomer}
              onSelect={(option: DropdownOption<Customer> | null) => 
                setSelectedCustomer(option ? option.value.customerId : null)
              }
              placeholder="Choose a customer..."
              disabled={!selectedWorker}
              emptyMessage="No customers available"
              allowClear={true}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sequence Number
            </label>
            <input
              type="number"
              min={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={sequenceNumber ?? ''}
              onChange={e => setSequenceNumber(Number(e.target.value))}
              placeholder="1"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={assignCustomer}
              disabled={loading || !selectedWorker || !selectedCustomer || !sequenceNumber}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Assigning...' : 'Assign Customer'}
            </button>
            <button
              onClick={clearForm}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* ✅ UPDATED: Search Bar using Reusable Component */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-0">
            Worker Customer Relations ({filteredRelations.length})
          </h3>
          
          <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-3">
            {/* ✅ REPLACED: Complex ReactTransliterate with Hindi SearchBar */}
            <HindiSearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search workers, customers..."
              width="250px"
            />
            
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'ended')}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ minWidth: '140px' }}
            >
              <option value="all">All Relations</option>
              <option value="active">Active</option>
              <option value="ended">Ended</option>
            </select>

            {/* Clear filters */}
            {(searchTerm || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors whitespace-nowrap"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Relations Table with Pagination */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  WORKER
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CUSTOMER
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SEQUENCE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  FROM DATE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  THROUGH DATE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedRelations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="text-4xl mb-2">🔄</div>
                      <div className="text-lg font-medium">No relations found</div>
                      <div className="text-sm">
                        {searchTerm || statusFilter !== 'all' 
                          ? 'Try adjusting your search terms or filters.' 
                          : 'Create your first assignment using the form above.'
                        }
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRelations.map(relation => (
                  <tr 
                    key={relation.id} 
                    className={`hover:bg-gray-50 transition-colors ${relation.thruDate ? 'opacity-60' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {relation.worker.firstName} {relation.worker.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {relation.worker.phoneNumber}
                          </div>
                          <div className="flex items-center mt-1">
                            <div className={`h-2 w-2 rounded-full ${relation.worker.isActive ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                            <span className={`ml-1 text-xs ${relation.worker.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                              {relation.worker.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {relation.customer.firstName} {relation.customer.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {relation.customer.city} • {relation.customer.phoneNumber}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">
                          {relation.customer.classification}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {relation.sequenceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(relation.fromDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {relation.thruDate ? formatDate(relation.thruDate) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        relation.thruDate 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {relation.thruDate ? 'Ended' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!relation.thruDate && (
                        <button 
                          onClick={() => removeCustomer(relation.workerId, relation.customerId)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Enhanced pagination */}
        {renderPagination()}
      </div>
    </div>
  );
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}
