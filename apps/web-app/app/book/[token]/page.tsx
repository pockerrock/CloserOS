'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { bookingsAPI } from '@/lib/api';

interface Booking {
  id: string;
  leadId: string;
  userId?: string;
  lead: {
    firstName: string;
    lastName: string;
    email: string;
  };
  user?: {
    firstName: string;
    lastName: string;
  };
  workspace: {
    name: string;
  };
  scheduledAt: string;
  duration: number;
  status: string;
  token: string;
}

export default function PublicBookingPage() {
  const params = useParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [canceled, setCanceled] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadBooking();
  }, [params.token]);

  const loadBooking = async () => {
    try {
      const response = await bookingsAPI.getByToken(params.token as string);
      setBooking(response.data);
    } catch (error) {
      console.error('Failed to load booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await bookingsAPI.confirm(booking!.id);
      setConfirmed(true);
    } catch (error) {
      console.error('Failed to confirm booking:', error);
      alert('Failed to confirm booking');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason) {
      alert('Please provide a reason for cancellation');
      return;
    }

    setCanceling(true);
    try {
      await bookingsAPI.cancel(booking!.id, cancelReason);
      setCanceled(true);
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      alert('Failed to cancel booking');
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-600">
            This booking link is invalid or has expired. Please contact your sales representative.
          </p>
        </div>
      </div>
    );
  }

  const scheduledDate = new Date(booking.scheduledAt);
  const isUpcoming = scheduledDate > new Date();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{booking.workspace.name}</h1>
          <p className="text-gray-600">Sales Call Booking</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          {confirmed && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              ✓ Your booking has been confirmed! You'll receive a calendar invite shortly.
            </div>
          )}

          {canceled && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              Your booking has been canceled. We'll be in touch to reschedule.
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Hi {booking.lead.firstName}!
            </h2>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                booking.status === 'CONFIRMED'
                  ? 'bg-green-100 text-green-800'
                  : booking.status === 'CANCELLED'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {booking.status}
            </span>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">📅</div>
              <div>
                <p className="text-sm font-medium text-gray-500">Date & Time</p>
                <p className="text-lg font-semibold text-gray-900">
                  {scheduledDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-lg text-gray-700">
                  {scheduledDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-2xl">⏱️</div>
              <div>
                <p className="text-sm font-medium text-gray-500">Duration</p>
                <p className="text-lg text-gray-900">{booking.duration} minutes</p>
              </div>
            </div>

            {booking.user && (
              <div className="flex items-start gap-3">
                <div className="text-2xl">👤</div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Your Sales Rep</p>
                  <p className="text-lg text-gray-900">
                    {booking.user.firstName} {booking.user.lastName}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="text-2xl">📧</div>
              <div>
                <p className="text-sm font-medium text-gray-500">Your Email</p>
                <p className="text-lg text-gray-900">{booking.lead.email}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {isUpcoming && booking.status === 'PENDING' && !confirmed && !canceled && (
            <div className="space-y-3">
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-semibold"
              >
                {confirming ? 'Confirming...' : '✓ Confirm Booking'}
              </button>

              <details className="border border-gray-200 rounded-lg">
                <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Need to cancel or reschedule?
                </summary>
                <div className="p-4 border-t border-gray-200">
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Please tell us why you need to cancel..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
                  />
                  <button
                    onClick={handleCancel}
                    disabled={canceling || !cancelReason}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {canceling ? 'Canceling...' : 'Cancel Booking'}
                  </button>
                </div>
              </details>
            </div>
          )}

          {booking.status === 'CONFIRMED' && !confirmed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">✓ This booking is confirmed</p>
              <p className="text-sm text-green-700 mt-1">
                You should have received a calendar invite at {booking.lead.email}
              </p>
            </div>
          )}

          {booking.status === 'CANCELLED' && !canceled && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">This booking has been canceled</p>
              <p className="text-sm text-red-700 mt-1">
                Please contact us if you'd like to reschedule.
              </p>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">What to Expect</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• You'll receive a calendar invite with a video call link</li>
            <li>• We'll send a reminder email 24 hours before</li>
            <li>• The call will be recorded for quality assurance</li>
            <li>• Have any questions ready about our products/services</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>
            Powered by <span className="font-semibold text-blue-600">CloserOS</span>
          </p>
          <p className="mt-2">
            Questions? Email us at{' '}
            <a
              href="mailto:support@closeros.com"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              support@closeros.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
