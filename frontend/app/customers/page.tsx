'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import CustomersList from '@/components/CustomersList';
import Link from 'next/link';

export default function CustomersPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <CustomersPageContent />
    </ProtectedRoute>
  );
}

function CustomersPageContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Customer Management</h2>
            <p className="text-sm text-gray-500 mt-1">View and manage all customer accounts</p>
            <p className="text-xs text-gray-400 mt-2">
              Each customer has accounts in both Metronome (billing) and Stripe (payments). 
              Click &quot;New Customer&quot; to onboard a new customer.
            </p>
          </div>
          <Link
            href="/customers/new"
            className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            + New Customer
          </Link>
        </div>

        <CustomersList />
      </div>
    </div>
  );
}

