'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, SubscriptionStatus } from '@/lib/api';

export default function CustomerPage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <CustomerDashboard />
    </ProtectedRoute>
  );
}

function CustomerDashboard() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.entityId) {
      loadSubscriptionStatus();
    }
  }, [user]);

  const loadSubscriptionStatus = async () => {
    if (!user?.entityId) return;
    
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.getSubscriptionStatus(user.entityId);
      setStatus(data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load subscription status');
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

  const getTierDisplay = (tier: string) => {
    const tierInfo: Record<string, { name: string; price: string }> = {
      free: { name: 'Free', price: '$0/month' },
      pro: { name: 'Pro', price: '$9/month' },
      team: { name: 'Team', price: '$29/month' },
      enterprise: { name: 'Enterprise', price: 'Custom' },
    };
    return tierInfo[tier] || { name: tier, price: 'N/A' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="bg-white rounded border border-gray-200 p-8 text-center">
            <div className="text-gray-500">Loading your subscription...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="bg-red-50 border border-red-200 rounded p-6">
            <h3 className="text-base font-semibold text-red-900 mb-2">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={loadSubscriptionStatus}
              className="mt-4 text-sm text-red-700 hover:text-red-900 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="bg-white rounded border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No subscription found</p>
          </div>
        </div>
      </div>
    );
  }

  const tierInfo = getTierDisplay(status.tier);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">My Subscription</h2>
          <p className="text-sm text-gray-500 mt-1">View and manage your billing subscription</p>
        </div>

        <div className="bg-white rounded border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="text-xs text-gray-500">Current Tier</span>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{tierInfo.name}</p>
              <p className="text-sm text-gray-600 mt-1">{tierInfo.price}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Status</span>
              <p className={`text-sm font-medium mt-1 px-3 py-1 rounded border inline-block ${getStatusColor(status.status)}`}>
                {status.status}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Credits Balance</span>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {(status.creditsBalance || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Available credits for usage</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Billing Period</span>
              <p className="text-lg font-medium text-gray-900 mt-1">
                {status.currentPeriodStart && status.currentPeriodEnd
                  ? `${new Date(status.currentPeriodStart).toLocaleDateString()} - ${new Date(status.currentPeriodEnd).toLocaleDateString()}`
                  : 'N/A'}
              </p>
              {status.nextInvoiceDate && (
                <p className="text-xs text-gray-500 mt-1">
                  Next invoice: {new Date(status.nextInvoiceDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Email</span>
              <span className="text-sm font-medium text-gray-900">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Account ID</span>
              <span className="text-sm font-medium text-gray-900">{user?.entityId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Account Type</span>
              <span className="text-sm font-medium text-gray-900 capitalize">{status.tier}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs text-blue-900">
            <strong>Need to change your plan?</strong> Contact support to upgrade or downgrade your subscription tier.
          </p>
        </div>
      </div>
    </div>
  );
}


