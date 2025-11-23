'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Leads', href: '/leads', icon: '👥' },
  { name: 'Deals', href: '/deals', icon: '💼' },
  { name: 'Calls', href: '/calls', icon: '📞' },
  { name: 'Documents', href: '/documents', icon: '📄' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-blue-600">CloserOS</h1>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="ml-2 text-gray-400 hover:text-gray-600 text-sm"
              title="Logout"
            >
              🚪
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        {/* Top bar */}
        <div className="h-16 bg-white shadow-sm flex items-center justify-between px-8 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {navigation.find((item) => pathname === item.href)?.name || 'CloserOS'}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.workspace?.name || 'Workspace'}</span>
          </div>
        </div>

        {/* Page content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
