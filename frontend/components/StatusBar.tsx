'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

export default function StatusBar() {
  const [status, setStatus] = useState({ billing: false, mock: false });
  const [stats, setStats] = useState({ customers: 0, subscriptions: 0 });

  useEffect(() => {
    const checkStatus = async () => {
      const health = await apiClient.checkHealth();
      setStatus(health);
      
      if (health.billing) {
        try {
          const customers = await apiClient.getCustomers();
          const activeSubs = customers.data.filter(c => c.status === 'active').length;
          setStats({ customers: customers.total, subscriptions: activeSubs });
        } catch (error) {
          // Silently fail
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Mock Server</span>
          <div className={`w-2 h-2 rounded-full ${status.mock ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        <p className="text-2xl font-semibold text-gray-900">
          {status.mock ? 'Online' : 'Offline'}
        </p>
      </div>

      <div className="bg-white rounded border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Billing Service</span>
          <div className={`w-2 h-2 rounded-full ${status.billing ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        <p className="text-2xl font-semibold text-gray-900">
          {status.billing ? 'Online' : 'Offline'}
        </p>
      </div>

      <div className="bg-white rounded border border-gray-200 p-5">
        <span className="text-sm font-medium text-gray-600 block mb-2">Total Customers</span>
        <p className="text-2xl font-semibold text-gray-900">{stats.customers}</p>
      </div>

      <div className="bg-white rounded border border-gray-200 p-5">
        <span className="text-sm font-medium text-gray-600 block mb-2">Active Subscriptions</span>
        <p className="text-2xl font-semibold text-gray-900">{stats.subscriptions}</p>
      </div>
    </div>
  );
}
