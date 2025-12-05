'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient, OnboardRequest } from '@/lib/api';

interface OnboardFormProps {
  onSuccess?: () => void;
}

export default function OnboardForm({ onSuccess }: OnboardFormProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    type: 'user' as 'user' | 'organization',
    tier: 'free' as 'free' | 'pro' | 'team' | 'enterprise',
    billingPeriod: 'monthly' as 'monthly' | 'yearly',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const entityId = `user-${Date.now()}`;
      const request: OnboardRequest = {
        entity: {
          id: entityId,
          type: formData.type,
          name: formData.name,
          email: formData.email,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        tier: formData.tier,
        billingPeriod: formData.billingPeriod,
      };

      const data = await apiClient.onboardCustomer(request);
      setResult({ success: true, data });
      
      // Reset all form fields
      setFormData({
        email: '',
        name: '',
        type: 'user',
        tier: 'free',
        billingPeriod: 'monthly',
      });

      // If on /customers/new page, redirect after 2 seconds
      if (pathname === '/customers/new') {
        setTimeout(() => {
          router.push('/customers');
        }, 2000);
      }

      // Call optional success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      setResult({ success: false, error: error.response?.data?.error || error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Onboard New Customer</h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          Create a new customer account in both Metronome (billing engine) and Stripe (payment processor). 
          This will automatically set up their initial subscription, allocate credits based on tier, and create their first invoice if needed.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Customer Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
            placeholder="customer@example.com"
          />
          <p className="text-xs text-gray-500 mt-1">Used for account identification and communication</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Customer Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
            placeholder="John Doe or Company Name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Account Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
          >
            <option value="user">User (Individual)</option>
            <option value="organization">Organization (Team/Company)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Determines billing entity type in Metronome</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Billing Tier <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.tier}
            onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
          >
            <option value="free">Free - $0/month, Basic credits</option>
            <option value="pro">Pro - $9/month, Standard credits</option>
            <option value="team">Team - $29/month, Enhanced credits</option>
            <option value="enterprise">Enterprise - Custom pricing, Premium credits</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Determines subscription price and credit allocation</p>
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
            <option value="monthly">Monthly (Billed every month)</option>
            <option value="yearly">Yearly (Billed annually, usually discounted)</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white py-2.5 px-4 rounded text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Onboard Customer'}
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
                <h4 className="text-sm font-semibold text-green-900">Customer Onboarded Successfully!</h4>
              </div>
              <p className="text-xs text-green-700 mb-3">
                The customer has been created in both Metronome and Stripe. Initial subscription and credits have been set up.
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
                <h4 className="text-sm font-semibold text-red-900">Onboarding Failed</h4>
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
