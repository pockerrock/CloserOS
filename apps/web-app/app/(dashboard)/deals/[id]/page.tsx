'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { dealsAPI } from '@/lib/api';

interface Deal {
  id: string;
  leadId: string;
  lead: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  stage: string;
  amount?: number;
  currency: string;
  closerId?: string;
  closer?: {
    firstName: string;
    lastName: string;
  };
  stripePaymentId?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

const DEAL_STAGES = [
  { key: 'NEW', label: 'New', color: 'bg-gray-100 text-gray-800' },
  { key: 'QUALIFIED', label: 'Qualified', color: 'bg-blue-100 text-blue-800' },
  { key: 'SCHEDULED', label: 'Scheduled', color: 'bg-purple-100 text-purple-800' },
  { key: 'SHOWED', label: 'Showed', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'CLOSED', label: 'Closed', color: 'bg-green-100 text-green-800' },
  { key: 'PAID', label: 'Paid', color: 'bg-emerald-100 text-emerald-800' },
  { key: 'RECYCLE', label: 'Recycle', color: 'bg-red-100 text-red-800' },
];

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeal();
  }, [params.id]);

  const loadDeal = async () => {
    try {
      const response = await dealsAPI.getById(params.id as string);
      setDeal(response.data);
    } catch (error) {
      console.error('Failed to load deal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (newStage: string) => {
    try {
      await dealsAPI.updateStage(params.id as string, newStage);
      loadDeal();
    } catch (error) {
      console.error('Failed to update stage:', error);
      alert('Failed to update stage');
    }
  };

  const handleCheckout = async () => {
    try {
      const response = await dealsAPI.createCheckout(params.id as string);
      window.open(response.data.sessionUrl, '_blank');
    } catch (error) {
      console.error('Failed to create checkout:', error);
      alert('Failed to create checkout session');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Deal not found</h2>
        <button
          onClick={() => router.push('/deals')}
          className="text-blue-600 hover:text-blue-700"
        >
          ← Back to Deals
        </button>
      </div>
    );
  }

  const currentStage = DEAL_STAGES.find(s => s.key === deal.stage) || DEAL_STAGES[0];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/deals')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {deal.lead.firstName} {deal.lead.lastName}
            </h2>
            <p className="text-gray-600 mt-1">
              {deal.lead.email}
              {deal.amount && ` • $${deal.amount.toLocaleString()} ${deal.currency}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className={`px-4 py-2 rounded-lg font-medium ${currentStage.color}`}>
            {currentStage.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deal Information</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Lead</dt>
                <dd className="text-sm text-gray-900">
                  <button
                    onClick={() => router.push(`/leads/${deal.leadId}`)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {deal.lead.firstName} {deal.lead.lastName}
                  </button>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-sm text-gray-900">{deal.lead.email}</dd>
              </div>
              {deal.lead.phone && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="text-sm text-gray-900">{deal.lead.phone}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Stage</dt>
                <dd className="text-sm text-gray-900">
                  <span className={`px-2 py-1 rounded ${currentStage.color}`}>
                    {currentStage.label}
                  </span>
                </dd>
              </div>
              {deal.amount && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Amount</dt>
                  <dd className="text-sm text-gray-900">
                    ${deal.amount.toLocaleString()} {deal.currency}
                  </dd>
                </div>
              )}
              {deal.closer && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Closer</dt>
                  <dd className="text-sm text-gray-900">
                    {deal.closer.firstName} {deal.closer.lastName}
                  </dd>
                </div>
              )}
              {deal.stripePaymentId && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Payment ID</dt>
                  <dd className="text-sm text-gray-900 font-mono">{deal.stripePaymentId}</dd>
                </div>
              )}
              {deal.paidAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Paid At</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(deal.paidAt).toLocaleString()}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(deal.createdAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Stage Update */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Stage</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DEAL_STAGES.map((stage) => (
                <button
                  key={stage.key}
                  onClick={() => handleStageChange(stage.key)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    deal.stage === stage.key
                      ? stage.color + ' ring-2 ring-offset-2 ring-blue-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  disabled={deal.stage === stage.key}
                >
                  {stage.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-4">
              {deal.paidAt && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Payment Received</p>
                    <p className="text-xs text-gray-500">
                      {new Date(deal.paidAt).toLocaleString()}
                    </p>
                    {deal.stripePaymentId && (
                      <p className="text-xs text-gray-500 font-mono mt-1">
                        {deal.stripePaymentId}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {deal.updatedAt !== deal.createdAt && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Deal Updated</p>
                    <p className="text-xs text-gray-500">
                      {new Date(deal.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-gray-400 mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Deal Created</p>
                  <p className="text-xs text-gray-500">
                    {new Date(deal.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {deal.stage === 'CLOSED' && !deal.paidAt && (
                <button
                  onClick={handleCheckout}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                >
                  Send Payment Link
                </button>
              )}
              <button
                onClick={() => window.location.href = `mailto:${deal.lead.email}`}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Email Lead
              </button>
              {deal.lead.phone && (
                <button
                  onClick={() => window.location.href = `tel:${deal.lead.phone}`}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm"
                >
                  Call Lead
                </button>
              )}
              <button
                onClick={() => router.push(`/leads/${deal.leadId}`)}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition text-sm"
              >
                View Lead
              </button>
            </div>
          </div>

          {/* Deal Progress */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress</h3>
            <div className="space-y-2">
              {DEAL_STAGES.map((stage, index) => {
                const currentIndex = DEAL_STAGES.findIndex(s => s.key === deal.stage);
                const isPast = index < currentIndex;
                const isCurrent = index === currentIndex;

                return (
                  <div
                    key={stage.key}
                    className={`flex items-center gap-3 p-2 rounded ${
                      isCurrent ? 'bg-blue-50' : isPast ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isCurrent ? 'bg-blue-600 text-white' :
                      isPast ? 'bg-green-600 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {isPast ? '✓' : index + 1}
                    </div>
                    <span className={`text-sm ${
                      isCurrent ? 'font-semibold text-gray-900' :
                      isPast ? 'text-gray-700' :
                      'text-gray-500'
                    }`}>
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Status */}
          {deal.amount && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Amount</span>
                  <span className="text-lg font-bold text-gray-900">
                    ${deal.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    deal.paidAt
                      ? 'bg-green-100 text-green-800'
                      : deal.stage === 'CLOSED'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {deal.paidAt ? 'Paid' : deal.stage === 'CLOSED' ? 'Pending' : 'Unpaid'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
