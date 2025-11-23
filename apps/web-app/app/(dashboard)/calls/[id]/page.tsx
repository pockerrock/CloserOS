'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { callsAPI } from '@/lib/api';

interface Call {
  id: string;
  dealId?: string;
  deal?: {
    id: string;
    lead: {
      firstName: string;
      lastName: string;
    };
  };
  userId?: string;
  user?: {
    firstName: string;
    lastName: string;
  };
  status: string;
  dailyRoomUrl?: string;
  dailyRoomName?: string;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  recordingUrl?: string;
  recordingReady: boolean;
  transcript?: string;
  summary?: string;
  createdAt: string;
}

export default function CallDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [call, setCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCall();
  }, [params.id]);

  const loadCall = async () => {
    try {
      const response = await callsAPI.getById(params.id as string);
      setCall(response.data);
    } catch (error) {
      console.error('Failed to load call:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCall = async () => {
    try {
      const response = await callsAPI.start(params.id as string);
      window.open(response.data.dailyRoomUrl, '_blank', 'width=1200,height=800');
      loadCall();
    } catch (error) {
      console.error('Failed to start call:', error);
      alert('Failed to start call');
    }
  };

  const handleEndCall = async () => {
    try {
      await callsAPI.end(params.id as string);
      loadCall();
    } catch (error) {
      console.error('Failed to end call:', error);
      alert('Failed to end call');
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Call not found</h2>
        <button
          onClick={() => router.push('/calls')}
          className="text-blue-600 hover:text-blue-700"
        >
          ← Back to Calls
        </button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'SCHEDULED':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/calls')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Call {call.deal ? `with ${call.deal.lead.firstName} ${call.deal.lead.lastName}` : 'Details'}
            </h2>
            <p className="text-gray-600 mt-1">
              {call.scheduledAt && `Scheduled: ${new Date(call.scheduledAt).toLocaleString()}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className={`px-4 py-2 rounded-lg font-medium ${getStatusColor(call.status)}`}>
            {call.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Call Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Call Information</h3>
            <dl className="space-y-3">
              {call.deal && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Lead</dt>
                  <dd className="text-sm text-gray-900">
                    <button
                      onClick={() => router.push(`/leads/${call.deal?.deal?.id}`)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {call.deal.lead.firstName} {call.deal.lead.lastName}
                    </button>
                  </dd>
                </div>
              )}
              {call.user && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Host</dt>
                  <dd className="text-sm text-gray-900">
                    {call.user.firstName} {call.user.lastName}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="text-sm">
                  <span className={`px-2 py-1 rounded ${getStatusColor(call.status)}`}>
                    {call.status.replace('_', ' ')}
                  </span>
                </dd>
              </div>
              {call.scheduledAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Scheduled</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(call.scheduledAt).toLocaleString()}
                  </dd>
                </div>
              )}
              {call.startedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Started</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(call.startedAt).toLocaleString()}
                  </dd>
                </div>
              )}
              {call.endedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ended</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(call.endedAt).toLocaleString()}
                  </dd>
                </div>
              )}
              {call.duration !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Duration</dt>
                  <dd className="text-sm text-gray-900">{formatDuration(call.duration)}</dd>
                </div>
              )}
              {call.dailyRoomName && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Room Name</dt>
                  <dd className="text-sm text-gray-900 font-mono">{call.dailyRoomName}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* AI Summary */}
          {call.summary && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Summary</h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{call.summary}</p>
              </div>
            </div>
          )}

          {/* Transcript */}
          {call.transcript ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transcript</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  {call.transcript}
                </pre>
              </div>
            </div>
          ) : call.status === 'COMPLETED' && !call.recordingReady ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transcript</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                  <p className="text-sm text-yellow-800">
                    Processing recording... Transcript will be available soon.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Recording */}
          {call.recordingUrl && call.recordingReady && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recording</h3>
              <div className="space-y-3">
                <video
                  controls
                  className="w-full rounded-lg"
                  src={call.recordingUrl}
                >
                  Your browser does not support the video tag.
                </video>
                <a
                  href={call.recordingUrl}
                  download
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  Download Recording
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-2">
              {call.status === 'SCHEDULED' && (
                <button
                  onClick={handleStartCall}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                >
                  Start Call
                </button>
              )}
              {call.status === 'IN_PROGRESS' && (
                <>
                  {call.dailyRoomUrl && (
                    <button
                      onClick={() => window.open(call.dailyRoomUrl, '_blank', 'width=1200,height=800')}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      Rejoin Call
                    </button>
                  )}
                  <button
                    onClick={handleEndCall}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
                  >
                    End Call
                  </button>
                </>
              )}
              {call.deal && (
                <button
                  onClick={() => router.push(`/deals/${call.dealId}`)}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition text-sm"
                >
                  View Deal
                </button>
              )}
            </div>
          </div>

          {/* Call Metrics */}
          {call.status === 'COMPLETED' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatDuration(call.duration)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Recording</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    call.recordingReady
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {call.recordingReady ? 'Ready' : 'Processing'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Transcript</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    call.transcript
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {call.transcript ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">AI Summary</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    call.summary
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {call.summary ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-3">
              {call.endedAt && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Call Ended</p>
                    <p className="text-xs text-gray-500">
                      {new Date(call.endedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              {call.startedAt && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Call Started</p>
                    <p className="text-xs text-gray-500">
                      {new Date(call.startedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              {call.scheduledAt && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Call Scheduled</p>
                    <p className="text-xs text-gray-500">
                      {new Date(call.scheduledAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-gray-400 mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Call Created</p>
                  <p className="text-xs text-gray-500">
                    {new Date(call.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
