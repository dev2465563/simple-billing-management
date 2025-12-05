'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useState } from 'react';
import TierManagement from '@/components/TierManagement';
import SubscriptionStatus from '@/components/SubscriptionStatus';

export default function SubscriptionsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <SubscriptionsPageContent />
    </ProtectedRoute>
  );
}

function SubscriptionsPageContent() {
  const [activeView, setActiveView] = useState<'change' | 'status'>('change');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Subscription Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage subscription tiers and billing</p>
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
            <p className="text-xs text-gray-700 font-medium mb-2">Available Actions:</p>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li><strong>Change Tier:</strong> Upgrade or downgrade customer billing tier (prorated charges calculated automatically)</li>
              <li><strong>Check Status:</strong> View customer&apos;s current subscription details, credits, and billing period</li>
            </ul>
          </div>
        </div>

        {/* View Toggle */}
        <div className="mb-6 flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveView('change')}
            className={`${
              activeView === 'change'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            } pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Change Tier
          </button>
          <button
            onClick={() => setActiveView('status')}
            className={`${
              activeView === 'status'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            } pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Check Status
          </button>
        </div>

        {/* Content */}
        <div className="max-w-2xl">
          {activeView === 'change' && <TierManagement />}
          {activeView === 'status' && <SubscriptionStatus />}
        </div>
      </div>
    </div>
  );
}

