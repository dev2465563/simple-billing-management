'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';

export default function SubscriptionStatus() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [entityId, setEntityId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const data = await apiClient.getSubscriptionStatus(entityId);
      setStatus({ success: true, data });
    } catch (error: any) {
      setStatus({ success: false, error: error.response?.data?.error || error.message });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'expired': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Check Subscription Status</h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          View a customer&apos;s current subscription details including tier, status, credit balance, and billing period information.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Customer Entity ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            placeholder="user-1234567890"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
          />
          <p className="text-xs text-gray-500 mt-1">
            Find this ID in the Customers list. Format: user-1234567890 or org-1234567890
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white py-2.5 px-4 rounded text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Get Status'}
        </button>
      </form>
      {status && (
        <div className={`mt-4 p-4 rounded border ${status.success ? 'bg-white' : 'bg-red-50 border-red-200'}`}>
          {status.success ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500">Tier</span>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{status.data.tier}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Status</span>
                  <p className={`text-xs font-medium mt-0.5 px-2 py-1 rounded border inline-block ${getStatusColor(status.data.status)}`}>
                    {status.data.status}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Credits Balance</span>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{(status.data.creditsBalance || 0).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Period End</span>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {status.data.currentPeriodEnd ? new Date(status.data.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <details className="mt-2">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">View Details</summary>
                <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-48">
                  {JSON.stringify(status.data, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <p className="text-sm text-red-800">{JSON.stringify(status.error)}</p>
          )}
        </div>
      )}
    </div>
  );
}
