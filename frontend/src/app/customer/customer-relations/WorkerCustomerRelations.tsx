'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { SearchableDropdown } from './SearchableDropdown';
import {
  WorkerCustomerRelation,
  Worker,
  Customer,
  relationApi,
} from './relation';

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
  const [loading, setLoading] = useState(false);

  // ✅ Add search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ended'>('all');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [workersRes, customersRes] = await Promise.all([
        relationApi.getAllWorkers(),
        relationApi.getAllCustomers(),
      ]);

      if (workersRes.success) setWorkers(workersRes.data);
      if (customersRes.success) setCustomers(customersRes.data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch data');
    }
  };

  const handleWorkerSelect = async (workerId: number | string | null) => {
    if (!workerId) {
      setSelectedWorker(null);
      setAvailableCustomers([]);
      return;
    }

    setSelectedWorker(Number(workerId));
    try {
      const response = await relationApi.getAvailableCustomersForWorker(Number(workerId));
      if (response.success) {
        setAvailableCustomers(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch available customers');
    }
  };

  const assignCustomer = async () => {
    if (!selectedWorker || !selectedCustomer) {
      toast.error('Please select both worker and customer');
      return;
    }

    setLoading(true);
    try {
      const response = await relationApi.assignCustomerToWorker(selectedWorker, selectedCustomer);
      if (response.success) {
        toast.success(response.message);
        onUpdate();
        setSelectedWorker(null);
        setSelectedCustomer(null);
        setAvailableCustomers([]);
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign customer to worker');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Updated to DELETE from database instead of just ending relation
  const removeCustomer = async (workerId: number, customerId: number) => {
    if (!confirm('Are you sure you want to permanently remove this customer from the worker? This action cannot be undone.')) return;

    try {
      const response = await relationApi.deleteWorkerCustomerRelation(workerId, customerId);
      if (response.success) {
        toast.success('Customer permanently removed from worker');
        onUpdate();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove customer from worker');
    }
  };

  // ✅ Add filtering logic
  const filteredRelations = relations.filter(relation => {
    const matchesSearch = searchTerm === '' || 
      relation.worker.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relation.worker.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relation.worker.phoneNumber.includes(searchTerm) ||
      relation.customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relation.customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relation.customer.phoneNumber.includes(searchTerm) ||
      relation.customer.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && !relation.thruDate) ||
      (statusFilter === 'ended' && relation.thruDate);

    return matchesSearch && matchesStatus;
  });

  // Prepare options for dropdowns
  const workerOptions = workers.map(worker => ({
    value: worker.workerId,
    label: `${worker.firstName} ${worker.lastName}`,
    subtitle: worker.phoneNumber,
  }));

  const customerOptions = availableCustomers.map(customer => ({
    value: customer.customerId,
    label: `${customer.firstName} ${customer.lastName}`,
    subtitle: `${customer.city} • ${customer.phoneNumber}`,
  }));

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Assignment Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Assign Customer to Worker</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Worker</label>
            <SearchableDropdown
              options={workerOptions}
              value={selectedWorker}
              onChange={handleWorkerSelect}
              placeholder="Choose a worker..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Customer</label>
            <SearchableDropdown
              options={customerOptions}
              value={selectedCustomer}
              onChange={(value) => setSelectedCustomer(value as number | null)}
              placeholder="Choose a customer..."
              disabled={!selectedWorker}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={assignCustomer}
              disabled={!selectedWorker || !selectedCustomer || loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Assigning...' : 'Assign Customer'}
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Add Search and Filter Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-xl font-semibold">Worker-Customer Assignments ({filteredRelations.length})</h2>
          
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search workers, customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'ended')}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Assignments</option>
              <option value="active">Active Only</option>
              <option value="ended">Ended Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Relations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredRelations.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <div className="text-lg font-medium">
              {searchTerm || statusFilter !== 'all' 
                ? 'No matching assignments found' 
                : 'No worker-customer assignments'
              }
            </div>
            <p className="text-sm">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first assignment using the form above'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Worker</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Through Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRelations.map((relation) => (
                  <tr key={relation.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {relation.worker.firstName} {relation.worker.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{relation.worker.phoneNumber}</div>
                        <div className={`text-xs mt-1 ${
                          relation.worker.isActive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {relation.worker.isActive ? '● Active' : '● Inactive'}
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
                        <div className="text-xs text-blue-600 mt-1">
                          {relation.customer.classification}
                        </div>
                      </div>
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
                      <button
                        onClick={() => removeCustomer(relation.workerId, relation.customerId)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
