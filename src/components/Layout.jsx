import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import { CRTOverlay } from './CRTOverlay';

const Layout = () => {
  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-green">
      <CRTOverlay />
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="border-t border-terminal-green mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-terminal-muted">
            <div>
              <span className="text-terminal-green">$ </span>
              CYBER CHAUKIDAAR v1.0.0 | SYSTEM ACTIVE
            </div>
            <div className="flex gap-6">
              <span>STATUS: [PROTECTED]</span>
              <span>UPTIME: 99.9%</span>
              <span>THREATS BLOCKED: 1,337</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
