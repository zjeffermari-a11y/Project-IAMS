import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../App';
import { LayoutDashboard, FileText, CheckSquare, Settings, LogOut } from 'lucide-react';
import clsx from 'clsx';

export default function Layout() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Engagements', icon: FileText, path: '/engagements' },
    { label: 'MOV Inventory', icon: CheckSquare, path: '/movs' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="font-bold text-lg tracking-tight text-blue-900">IAMS</span>
        </div>
        
        <nav className="flex-1 py-6 flex flex-col gap-1 px-4">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon size={18} className={clsx(active ? "text-blue-700" : "text-gray-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="mb-4 px-3">
            <p className="text-sm font-medium text-gray-900 truncate">{profile?.name}</p>
            <p className="text-xs text-gray-500">{profile?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut size={18} className="text-gray-400" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="p-8 max-w-7xl mx-auto min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
