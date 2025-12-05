'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const adminNavigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Customers', href: '/customers' },
  { name: 'Subscriptions', href: '/subscriptions' },
  { name: 'Reports', href: '/reports' },
];

const customerNavigation = [
  { name: 'My Subscription', href: '/customer' },
];

export default function Navigation() {
  const pathname = usePathname();

  // Always show admin navigation - no auth needed
  const navigation = adminNavigation;

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between">
          <div className="flex space-x-8">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">
              Admin Dashboard
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}

