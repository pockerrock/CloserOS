'use client';

import { useEffect, useState } from 'react';
import { dealsAPI } from '@/lib/api';

interface Deal {
  id: string;
  stage: string;
  amount?: number;
  currency: string;
  lead: {
    firstName: string;
    lastName: string;
    email: string;
  };
  closer?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

const DEAL_STAGES = [
  { key: 'NEW', label: 'New', color: 'bg-gray-100' },
  { key: 'QUALIFIED', label: 'Qualified', color: 'bg-blue-100' },
  { key: 'SCHEDULED', label: 'Scheduled', color: 'bg-purple-100' },
  { key: 'SHOWED', label: 'Showed', color: 'bg-yellow-100' },
  { key: 'CLOSED', label: 'Closed', color: 'bg-green-100' },
  { key: 'PAID', label: 'Paid', color: 'bg-emerald-100' },
  { key: 'RECYCLE', label: 'Recycle', color: 'bg-orange-100' },
];

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupedDeals, setGroupedDeals] = useState<Record<string, Deal[]>>({});

  useEffect(() => {
    loadDeals();
  }, []);

  useEffect(() => {
    // Group deals by stage
    const grouped = DEAL_STAGES.reduce((acc, stage) => {
      acc[stage.key] = deals.filter((deal) => deal.stage === stage.key);
      return acc;
    }, {} as Record<string, Deal[]>);
    setGroupedDeals(grouped);
  }, [deals]);

  const loadDeals = async () => {
    try {
      const response = await dealsAPI.getAll();
      setDeals(response.data);
    } catch (error) {
      console.error('Failed to load deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (dealId: string) => {
    try {
      const response = await dealsAPI.createCheckout(dealId);
      if (response.data.sessionUrl) {
        window.open(response.data.sessionUrl, '_blank');
      }
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

  const totalValue = deals.reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Pipeline</h2>
        <div className="mt-2 flex gap-6 text-sm">
          <span className="text-gray-600">
            <span className="font-semibold text-gray-900">{deals.length}</span> Total Deals
          </span>
          <span className="text-gray-600">
            <span className="font-semibold text-gray-900">
              ${totalValue.toLocaleString()}
            </span>{' '}
            Total Value
          </span>
        </div>
      </div>

      {/* Kanban Board */}
      {deals.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">💼</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No deals yet</h3>
          <p className="text-gray-600 mb-6">
            Deals will appear here as you work with your leads
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-4 overflow-x-auto">
          {DEAL_STAGES.map((stage) => {
            const stageDeals = groupedDeals[stage.key] || [];
            const stageValue = stageDeals.reduce(
              (sum, deal) => sum + (Number(deal.amount) || 0),
              0
            );

            return (
              <div key={stage.key} className="min-w-[250px]">
                {/* Column Header */}
                <div className={`${stage.color} rounded-lg p-3 mb-3`}>
                  <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                  <div className="text-xs text-gray-600 mt-1">
                    {stageDeals.length} deals • ${stageValue.toLocaleString()}
                  </div>
                </div>

                {/* Deal Cards */}
                <div className="space-y-3">
                  {stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition cursor-pointer"
                    >
                      <div className="font-semibold text-gray-900 mb-1">
                        {deal.lead.firstName} {deal.lead.lastName}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{deal.lead.email}</div>
                      {deal.amount && (
                        <div className="text-lg font-bold text-green-600 mb-2">
                          ${Number(deal.amount).toLocaleString()}
                        </div>
                      )}
                      {deal.closer && (
                        <div className="text-xs text-gray-500 mb-3">
                          Closer: {deal.closer.firstName} {deal.closer.lastName}
                        </div>
                      )}

                      {/* Actions */}
                      {stage.key === 'CLOSED' && (
                        <button
                          onClick={() => handleCheckout(deal.id)}
                          className="w-full text-xs bg-green-600 text-white py-1.5 rounded hover:bg-green-700 transition"
                        >
                          💳 Send Payment Link
                        </button>
                      )}
                      {stage.key === 'PAID' && (
                        <div className="text-xs bg-emerald-50 text-emerald-700 py-1.5 px-2 rounded text-center font-semibold">
                          ✅ Paid
                        </div>
                      )}
                    </div>
                  ))}

                  {stageDeals.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-8">No deals</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
