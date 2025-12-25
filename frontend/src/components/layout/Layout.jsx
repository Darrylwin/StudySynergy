// src/components/layout/Layout.jsx
import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import { 
  LayoutDashboard, 
  FolderPlus, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

const Layout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Nouvelle Session', href: '/session/new', icon: FolderPlus },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
              <span className="font-semibold text-gray-800">StudySynergy</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/session/new')}
              className="btn-primary py-2 px-4 text-sm"
            >
              <FolderPlus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Menu Mobile (render Sidebar as overlay) */}
        {mobileMenuOpen && (
          <div>
            <Sidebar mobile onClose={() => setMobileMenuOpen(false)} />
          </div>
        )}
      </div>

      {/* Sidebar Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <Sidebar />
      </div>

      {/* Header Desktop */}
      <div className="hidden lg:fixed lg:z-40 lg:ml-64 lg:inset-y-0 lg:right-0 lg:w-[calc(100%-16rem)]">
        <Header />
      </div>

      {/* Main Content */}
      <main className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;