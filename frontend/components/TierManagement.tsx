'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';

export default function TierManagement() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    entityId: '',
    newTier: 'pro' as 'free' | 'pro' | 'team' | 'enterprise',
    billingPeriod: 'monthly' as 'monthly' | 'yearly',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const data = await apiClient.changeTier(formData);
      setResult({ success: true, data });
    } catch (error: any) {
      setResult({ success: false, error: error.response?.data?.error || error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Change Customer Tier</h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          Upgrade or downgrade a customer&apos;s billing tier. The system will automatically calculate prorated charges, 
          adjust credit allocations, and update the subscription billing period.
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
            value={formData.entityId}
            onChange={(e) => setFormData({ ...formData, entityId: e.target.value })}
            placeholder="user-1234567890"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
          />
          <p className="text-xs text-gray-500 mt-1">
            Find this ID in the Customers list. Format: user-1234567890 or org-1234567890
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            New Billing Tier <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.newTier}
            onChange={(e) => setFormData({ ...formData, newTier: e.target.value as any })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
          >
            <option value="free">Free - $0/month</option>
            <option value="pro">Pro - $9/month</option>
            <option value="team">Team - $29/month</option>
            <option value="enterprise">Enterprise - Custom</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Prorated charges will be calculated automatically</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Billing Period <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.billingPeriod}
            onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value as any })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">When the customer will be billed</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white py-2.5 px-4 rounded text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Change Tier'}
        </button>
      </form>
      {result && (
        <div className={`mt-4 p-4 rounded border ${
          result.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          {result.success ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h4 className="text-sm font-semibold text-green-900">Tier Changed Successfully!</h4>
              </div>
              <p className="text-xs text-green-700 mb-3">
                The customer&apos;s tier has been updated. Credits have been adjusted and prorated charges calculated.
              </p>
              <details className="mt-2">
                <summary className="text-xs text-green-600 cursor-pointer hover:text-green-800">View Details</summary>
                <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-48 border border-green-200">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <h4 className="text-sm font-semibold text-red-900">Tier Change Failed</h4>
              </div>
              <p className="text-xs text-red-700 mb-2">Error details:</p>
              <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-48 border border-red-200">
                {JSON.stringify(result.error, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
