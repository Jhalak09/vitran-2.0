'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { WorkerCustomerRelation, Worker, Customer, relationApi } from './relation';

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

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ended'>('all');

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

  // Filter relations for display
  const filteredRelations = relations.filter((relation) => {
    const matchesSearch =
      !searchTerm ||
      relation.worker.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relation.worker.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relation.customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relation.customer.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'active') return matchesSearch && !relation.thruDate;
    if (statusFilter === 'ended') return matchesSearch && !!relation.thruDate;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Assignment Form */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-6">Assign Customer to Worker</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Worker
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedWorker ?? ''}
              onChange={e => setSelectedWorker(Number(e.target.value))}
            >
              <option value="">Choose a worker...</option>
              {workers.map(w => (
                <option key={w.workerId} value={w.workerId}>
                  {w.firstName} {w.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Customer
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCustomer ?? ''}
              onChange={e => setSelectedCustomer(Number(e.target.value))}
              disabled={!selectedWorker}
            >
              <option value="">Choose a customer...</option>
              {availableCustomers.map(c => (
                <option key={c.customerId} value={c.customerId}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
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
              Assign Customer
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

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <h3 className="text-lg font-semibold">Worker Customer Relations ({filteredRelations.length})</h3>
          
          <div className="flex gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search customers, workers..."
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'ended')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Relations</option>
              <option value="active">Active</option>
              <option value="ended">Ended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Relations Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
              {filteredRelations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria' 
                      : 'Create your first assignment using the form above'
                    }
                  </td>
                </tr>
              ) : (
                filteredRelations.map(relation => (
                  <tr 
                    key={relation.id} 
                    className={`hover:bg-gray-50 ${relation.thruDate ? 'opacity-60' : ''}`}
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
                          className="text-red-600 hover:text-red-900"
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
      </div>
    </div>
  );
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}
