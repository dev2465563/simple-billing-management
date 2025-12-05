'use client';

import { useEffect, useState } from 'react';
import { apiClient, Customer } from '@/lib/api';

export default function CustomersList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCustomers = async () => {
    try {
      const response = await apiClient.getCustomers();
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    const interval = setInterval(loadCustomers, 10000);
    return () => clearInterval(interval);
  }, []);

  const getTierBadge = (tier: string) => {
    const styles: Record<string, string> = {
      free: 'bg-gray-100 text-gray-700 border-gray-200',
      pro: 'bg-blue-100 text-blue-700 border-blue-200',
      team: 'bg-purple-100 text-purple-700 border-purple-200',
      enterprise: 'bg-green-100 text-green-700 border-green-200',
    };
    return styles[tier] || styles.free;
  };

  if (loading) {
    return (
      <div className="bg-white rounded border border-gray-200 p-8">
        <div className="text-center text-gray-500">Loading customers...</div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="bg-white rounded border border-gray-200 p-12 text-center">
        <p className="text-gray-500 mb-2">No customers found</p>
        <p className="text-sm text-gray-400">Onboard your first customer to get started</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-base font-semibold text-gray-900">Customers ({customers.length})</h2>
        <button
          onClick={loadCustomers}
          className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Refresh
        </button>
      </div>
      <div className="divide-y divide-gray-200">
        {customers.map((customer) => (
          <div key={customer.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{customer.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded border ${getTierBadge(customer.tier)}`}>
                    {customer.tier}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-1">{customer.email}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>ID: {customer.id}</span>
                  <span>•</span>
                  <span>{customer.type}</span>
                  <span>•</span>
                  <span>Credits: {(customer.creditsBalance || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="ml-4">
                <span className={`text-xs px-2 py-1 rounded ${
                  customer.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {customer.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
