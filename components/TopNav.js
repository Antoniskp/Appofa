'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';

export default function TopNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isActive = (path) => pathname === path ? 'text-blue-600' : '';

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="app-container">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center text-xl font-bold text-gray-900">
              News App
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-950 ${isActive('/')}`}
              >
                Home
              </Link>
              <Link
                href="/articles"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-950 ${isActive('/articles')}`}
              >
                Articles
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-950">
                  Welcome, {user.username} ({user.role})
                </span>
                <Link
                  href="/profile"
                  className={`text-sm font-medium text-gray-950 ${isActive('/profile')}`}
                >
                  Profile
                </Link>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className={`text-sm font-medium text-gray-950 ${isActive('/admin')}`}
                  >
                    Admin
                  </Link>
                )}
                {(user.role === 'admin' || user.role === 'editor') && (
                  <Link
                    href="/editor"
                    className={`text-sm font-medium text-gray-950 ${isActive('/editor')}`}
                  >
                    Editor
                  </Link>
                )}
                <Link
                  href="/editor"
                  className="text-sm font-medium bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                >
                  Add Article
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-red-600 hover:text-red-800"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-950 hover:text-blue-700"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
