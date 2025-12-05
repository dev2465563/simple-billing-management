'use client';

import StatusBar from '@/components/StatusBar';
import WorkflowSteps from '@/components/WorkflowSteps';

export default function DashboardPage() {
  return <AdminDashboard />;
}

function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Admin Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">System overview and health monitoring</p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-900 font-medium mb-2">📋 How to Use This Dashboard:</p>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li><strong>Onboard Customers:</strong> Go to &quot;Customers&quot; → &quot;New Customer&quot; to create accounts in Metronome and Stripe</li>
              <li><strong>Manage Subscriptions:</strong> Use &quot;Subscriptions&quot; tab to change tiers or check status</li>
              <li><strong>View All Customers:</strong> See all onboarded customers in the &quot;Customers&quot; tab</li>
              <li><strong>Monitor System:</strong> Check service health status below</li>
            </ol>
          </div>
        </div>

        {/* Status Bar */}
        <StatusBar />

        {/* Workflow Overview */}
        <WorkflowSteps />
      </div>
    </div>
  );
}

