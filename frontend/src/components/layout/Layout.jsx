import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Logo from '../Logo';
import { Menu } from 'lucide-react';

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-faint">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-stone h-14 flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 text-muted hover:text-ink rounded-lg"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="font-bold text-ink">StudySynergy</span>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && <Sidebar mobile onClose={() => setMobileOpen(false)} />}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-60 lg:flex lg:flex-col">
        <Sidebar />
      </div>

      {/* Content area */}
      <div className="pt-14 lg:pt-0 lg:pl-60">
        {/* Desktop header */}
        <div className="hidden lg:block">
          <Header />
        </div>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
