'use client';

import { useEffect, useState } from 'react';
import { callsAPI } from '@/lib/api';
import { useSearchParams } from 'next/navigation';

interface Call {
  id: string;
  status: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  dailyRoomUrl?: string;
  host: {
    firstName: string;
    lastName: string;
  };
  booking?: {
    lead: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStartModal, setShowStartModal] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    loadCalls();

    // Check if action=start in URL
    if (searchParams?.get('action') === 'start') {
      setShowStartModal(true);
    }
  }, [searchParams]);

  const loadCalls = async () => {
    try {
      const response = await callsAPI.getAll();
      setCalls(response.data);
    } catch (error) {
      console.error('Failed to load calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCall = async (callId: string) => {
    try {
      const response = await callsAPI.start(callId);
      if (response.data.dailyRoomUrl) {
        // Open Daily.co room in new window
        window.open(response.data.dailyRoomUrl, '_blank', 'width=1200,height=800');
        loadCalls(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to start call:', error);
      alert('Failed to start call');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeCalls = calls.filter((call) => call.status === 'IN_PROGRESS');
  const upcomingCalls = calls.filter((call) => call.status === 'SCHEDULED');
  const completedCalls = calls.filter((call) => call.status === 'COMPLETED');

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calls</h2>
          <p className="text-gray-600 mt-1">Manage your sales calls and meetings</p>
        </div>
        <button
          onClick={() => setShowStartModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
        >
          <span>📞</span>
          <span>Start Call</span>
        </button>
      </div>

      {/* Active Calls */}
      {activeCalls.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">🔴 Active Calls</h3>
          <div className="grid gap-4">
            {activeCalls.map((call) => (
              <div
                key={call.id}
                className="bg-green-50 border-2 border-green-500 rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-gray-900">
                    Call with{' '}
                    {call.booking
                      ? `${call.booking.lead.firstName} ${call.booking.lead.lastName}`
                      : 'Unknown'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Started:{' '}
                    {call.startedAt
                      ? new Date(call.startedAt).toLocaleTimeString()
                      : 'Unknown'}
                  </div>
                </div>
                <div className="flex gap-3">
                  {call.dailyRoomUrl && (
                    <button
                      onClick={() => window.open(call.dailyRoomUrl, '_blank')}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      Rejoin Call
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      await callsAPI.end(call.id);
                      loadCalls();
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                  >
                    End Call
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Calls */}
      {upcomingCalls.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">📅 Upcoming Calls</h3>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Participant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Host
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingCalls.map((call) => (
                  <tr key={call.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {call.booking
                          ? `${call.booking.lead.firstName} ${call.booking.lead.lastName}`
                          : 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {call.host.firstName} {call.host.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                        Scheduled
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleStartCall(call.id)}
                        className="text-green-600 hover:text-green-900 font-medium"
                      >
                        Start Call
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Call History */}
      {completedCalls.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">📜 Call History</h3>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Participant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ended
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Recording
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {completedCalls.map((call) => (
                  <tr key={call.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {call.booking
                          ? `${call.booking.lead.firstName} ${call.booking.lead.lastName}`
                          : 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {call.duration ? `${Math.floor(call.duration / 60)}m` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {call.endedAt ? new Date(call.endedAt).toLocaleString() : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                        Processing...
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button className="text-blue-600 hover:text-blue-900 font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {calls.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📞</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No calls yet</h3>
          <p className="text-gray-600 mb-6">Start your first sales call</p>
          <button
            onClick={() => setShowStartModal(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            Start First Call
          </button>
        </div>
      )}

      {/* Start Call Modal */}
      {showStartModal && (
        <StartCallModal
          onClose={() => setShowStartModal(false)}
          onSuccess={() => {
            setShowStartModal(false);
            loadCalls();
          }}
        />
      )}
    </div>
  );
}

function StartCallModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleQuickCall = async () => {
    setLoading(true);
    try {
      // Create a call without a booking
      const createResponse = await callsAPI.create({});
      const callId = createResponse.data.id;

      // Start the call
      const startResponse = await callsAPI.start(callId);

      if (startResponse.data.dailyRoomUrl) {
        window.open(startResponse.data.dailyRoomUrl, '_blank', 'width=1200,height=800');
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to start call:', error);
      alert('Failed to start call');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Start a Call</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ×
          </button>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleQuickCall}
            disabled={loading}
            className="w-full p-6 border-2 border-green-500 bg-green-50 rounded-lg hover:bg-green-100 transition disabled:opacity-50"
          >
            <div className="text-4xl mb-2">📞</div>
            <div className="font-semibold text-gray-900">Quick Call</div>
            <div className="text-sm text-gray-600 mt-1">
              Start an instant call without a scheduled booking
            </div>
          </button>

          <div className="text-center text-gray-500 text-sm">
            <p>Scheduled calls can be started from the upcoming calls list above</p>
          </div>
        </div>
      </div>
    </div>
  );
}
