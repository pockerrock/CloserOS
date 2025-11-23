'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { workspacesAPI } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string;
}

export default function TeamPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'CLOSER',
  });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (user?.workspaceId) {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      const response = await workspacesAPI.getById(user!.workspaceId);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);

    try {
      await workspacesAPI.inviteUser(user!.workspaceId, inviteData.email, inviteData.role);
      setShowInviteModal(false);
      setInviteData({ email: '', role: 'CLOSER' });
      alert('Invitation sent successfully!');
      loadUsers();
    } catch (error) {
      console.error('Failed to invite user:', error);
      alert('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-100 text-purple-800';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800';
      case 'CLOSER':
        return 'bg-green-100 text-green-800';
      case 'SETTER':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canManageTeam = user?.role === 'OWNER' || user?.role === 'ADMIN';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
          <p className="text-gray-600 mt-1">
            Manage your workspace team and permissions
          </p>
        </div>
        {canManageTeam && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Invite Member
          </button>
        )}
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Members</h3>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Closers</h3>
            <span className="text-2xl">💼</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {users.filter((u) => u.role === 'CLOSER').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Setters</h3>
            <span className="text-2xl">📞</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {users.filter((u) => u.role === 'SETTER').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Admins</h3>
            <span className="text-2xl">⚙️</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {users.filter((u) => u.role === 'OWNER' || u.role === 'ADMIN').length}
          </p>
        </div>
      </div>

      {/* Team List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              {canManageTeam && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                      {member.firstName[0]}
                      {member.lastName[0]}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{member.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${getRoleBadgeColor(
                      member.role
                    )}`}
                  >
                    {member.role}
                  </span>
                </td>
                {canManageTeam && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {member.id !== user?.id && (
                      <>
                        <button className="text-blue-600 hover:text-blue-900 mr-4">
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-900">Remove</button>
                      </>
                    )}
                    {member.id === user?.id && (
                      <span className="text-gray-400 text-xs">You</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Team Member</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="colleague@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CLOSER">Closer</option>
                  <option value="SETTER">Setter</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {inviteData.role === 'CLOSER' &&
                    'Can manage deals, make calls, and close sales'}
                  {inviteData.role === 'SETTER' &&
                    'Can create leads and schedule calls'}
                  {inviteData.role === 'ADMIN' &&
                    'Full access to workspace settings and team management'}
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {inviting ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!canManageTeam && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Only workspace owners and administrators can invite new team members. Contact your
            workspace admin to add new members.
          </p>
        </div>
      )}
    </div>
  );
}
