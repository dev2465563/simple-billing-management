'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

export default function ReportsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <ReportsPageContent />
    </ProtectedRoute>
  );
}

function ReportsPageContent() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    tierDistribution: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const customers = await apiClient.getCustomers();
        const activeSubs = customers.data.filter(c => c.status === 'active').length;
        
        const tierDist: Record<string, number> = {};
        customers.data.forEach(c => {
          tierDist[c.tier] = (tierDist[c.tier] || 0) + 1;
        });

        setStats({
          totalCustomers: customers.data.length || customers.total || 0,
          activeSubscriptions: activeSubs,
          totalRevenue: 0, // Would calculate from invoices in real app
          tierDistribution: tierDist,
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="text-center text-gray-500">Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Reports & Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">Billing metrics and insights</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded border border-gray-200 p-6">
            <span className="text-sm font-medium text-gray-600">Total Customers</span>
            <p className="text-3xl font-semibold text-gray-900 mt-2">{stats.totalCustomers}</p>
          </div>
          <div className="bg-white rounded border border-gray-200 p-6">
            <span className="text-sm font-medium text-gray-600">Active Subscriptions</span>
            <p className="text-3xl font-semibold text-gray-900 mt-2">{stats.activeSubscriptions}</p>
          </div>
          <div className="bg-white rounded border border-gray-200 p-6">
            <span className="text-sm font-medium text-gray-600">Total Revenue</span>
            <p className="text-3xl font-semibold text-gray-900 mt-2">${stats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Tier Distribution */}
        <div className="bg-white rounded border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Tier Distribution</h3>
          <div className="space-y-4">
            {Object.entries(stats.tierDistribution).map(([tier, count]) => {
              const percentage = stats.totalCustomers > 0 
                ? ((count / stats.totalCustomers) * 100).toFixed(1) 
                : 0;
              return (
                <div key={tier}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 capitalize">{tier}</span>
                    <span className="text-gray-600">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gray-900 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(stats.tierDistribution).length === 0 && (
              <p className="text-sm text-gray-500">No data available</p>
            )}
          </div>
        </div>

        {/* Additional Reports Section */}
        <div className="mt-6 bg-white rounded border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Additional Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Revenue Report</h4>
              <p className="text-xs text-gray-600">Monthly and yearly revenue breakdown</p>
              <button className="mt-3 text-xs text-gray-600 hover:text-gray-900">Coming Soon</button>
            </div>
            <div className="p-4 border border-gray-200 rounded">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Churn Analysis</h4>
              <p className="text-xs text-gray-600">Customer retention and churn metrics</p>
              <button className="mt-3 text-xs text-gray-600 hover:text-gray-900">Coming Soon</button>
            </div>
            <div className="p-4 border border-gray-200 rounded">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Credit Usage</h4>
              <p className="text-xs text-gray-600">Credit consumption patterns</p>
              <button className="mt-3 text-xs text-gray-600 hover:text-gray-900">Coming Soon</button>
            </div>
            <div className="p-4 border border-gray-200 rounded">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Payment Failures</h4>
              <p className="text-xs text-gray-600">Failed payment analysis</p>
              <button className="mt-3 text-xs text-gray-600 hover:text-gray-900">Coming Soon</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

