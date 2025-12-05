'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import OnboardForm from '@/components/OnboardForm';
import Link from 'next/link';

export default function NewCustomerPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <NewCustomerPageContent />
    </ProtectedRoute>
  );
}

function NewCustomerPageContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="mb-6">
          <Link
            href="/customers"
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
          >
            ← Back to Customers
          </Link>
          <h2 className="text-xl font-semibold text-gray-900 mt-2">Onboard New Customer</h2>
          <p className="text-sm text-gray-500 mt-1">Create a new customer account in Metronome and Stripe</p>
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
            <p className="text-xs text-gray-700 font-medium mb-2">What happens when you onboard a customer:</p>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>Customer account created in Metronome (billing engine)</li>
              <li>Customer account created in Stripe (payment processor)</li>
              <li>Initial subscription/contract established</li>
              <li>Credits allocated based on selected tier</li>
              <li>First invoice generated (if tier requires payment)</li>
            </ul>
          </div>
        </div>

        <OnboardForm />
      </div>
    </div>
  );
}

