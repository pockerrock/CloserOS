'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

export default function NotificationCenter({ workspaceId }: { workspaceId?: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && workspaceId) {
      fetchActivities();
    }
  }, [isOpen, workspaceId]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/analytics/activity?limit=20', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    if (type.includes('lead')) return '👤';
    if (type.includes('deal')) return '💼';
    if (type.includes('call')) return '📞';
    if (type.includes('booking')) return '📅';
    return '📢';
  };

  const getActivityColor = (type: string) => {
    if (type.includes('created')) return 'text-green-600 bg-green-50';
    if (type.includes('updated')) return 'text-blue-600 bg-blue-50';
    if (type.includes('deleted') || type.includes('cancelled')) return 'text-red-600 bg-red-50';
    if (type.includes('assigned')) return 'text-purple-600 bg-purple-50';
    return 'text-gray-600 bg-gray-50';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {activities.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Dropdown Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <button
                onClick={() => router.push('/activity')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View All
              </button>
            </div>

            {/* Activity List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : activities.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <svg
                    className="w-12 h-12 mx-auto text-gray-300 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="px-4 py-3 hover:bg-gray-50 transition cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}
                        >
                          <span className="text-sm">{getActivityIcon(activity.type)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.title}
                          </p>
                          {activity.description && (
                            <p className="text-xs text-gray-600 mt-1 truncate">
                              {activity.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {activity.user && (
                              <span className="text-xs text-gray-500">
                                by {activity.user.firstName} {activity.user.lastName}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {formatTimeAgo(activity.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {activities.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setActivities([]);
                    setIsOpen(false);
                  }}
                  className="w-full text-center text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
