'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user.firstName}! 👋
        </h2>
        <p className="text-gray-600">Here's what's happening with your sales today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Leads</h3>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-xs text-gray-500 mt-1">+0% from last month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Active Deals</h3>
            <span className="text-2xl">💼</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-xs text-gray-500 mt-1">0 closing soon</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Calls Today</h3>
            <span className="text-2xl">📞</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-xs text-gray-500 mt-1">0 scheduled</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Revenue</h3>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">$0</p>
          <p className="text-xs text-gray-500 mt-1">This month</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/leads?action=new"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer"
          >
            <span className="text-3xl mb-2">➕</span>
            <span className="text-sm font-medium text-gray-700">New Lead</span>
          </a>

          <a
            href="/calls?action=start"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition cursor-pointer"
          >
            <span className="text-3xl mb-2">📞</span>
            <span className="text-sm font-medium text-gray-700">Start Call</span>
          </a>

          <a
            href="/deals"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition cursor-pointer"
          >
            <span className="text-3xl mb-2">💼</span>
            <span className="text-sm font-medium text-gray-700">View Pipeline</span>
          </a>

          <a
            href="/documents"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-500 hover:bg-gray-50 transition cursor-pointer"
          >
            <span className="text-3xl mb-2">📄</span>
            <span className="text-sm font-medium text-gray-700">Documents</span>
          </a>
        </div>
      </div>

      {/* Getting Started Guide */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">🚀 CloserOS MVP is Live!</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <p className="font-semibold mb-2">✅ Completed Features:</p>
            <ul className="space-y-1 ml-4">
              <li>• Authentication & user management</li>
              <li>• Leads & deals CRM</li>
              <li>• Payment processing (Stripe)</li>
              <li>• WebRTC calling (Daily.co)</li>
              <li>• File storage (S3/MinIO)</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-2">🔜 Coming Next:</p>
            <ul className="space-y-1 ml-4">
              <li>• AI coaching & summaries</li>
              <li>• Calendar integration</li>
              <li>• SMS reminders</li>
              <li>• Analytics dashboard</li>
              <li>• Mobile app</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-blue-200">
          <a
            href="http://localhost:3001/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            📚 View API Documentation →
          </a>
        </div>
      </div>
    </div>
  );
}
