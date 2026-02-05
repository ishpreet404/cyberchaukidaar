import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Home, 
  AlertTriangle, 
  Database, 
  MessageSquare, 
  Key,
  Blocks,
  Menu,
  X
} from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'DASHBOARD', icon: Home },
    { path: '/scam-analyzer', label: 'SCAM ANALYZER', icon: AlertTriangle },
    { path: '/breach-checker', label: 'BREACH CHECK', icon: Database },
    { path: '/ai-coach', label: 'AI COACH', icon: MessageSquare },
    { path: '/vault', label: 'VAULT', icon: Key },
    { path: '/advanced', label: 'ADVANCED', icon: Blocks },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block border-b border-terminal-green bg-terminal-bg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 hover:animate-glitch">
              <Shield className="w-6 h-6" />
                          <span className="text-xl font-bold text-shadow-terminal">
                              Cyber Chaukidaar
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="flex gap-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`
                    flex items-center gap-2 px-4 py-2 border-l border-terminal-green
                    hover:bg-terminal-green hover:text-terminal-bg
                    transition-all duration-100
                    ${location.pathname === path ? 'bg-terminal-green text-terminal-bg' : 'text-terminal-green'}
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-bold">{label}</span>
                </Link>
              ))}
            </div>

            {/* System Status */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-terminal-muted">SYS:</span>
              <span className="text-terminal-green">[ONLINE]</span>
              <span className="cursor"></span>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-b border-terminal-green bg-terminal-bg">
        <div className="flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            <span className="text-lg font-bold">CYBERGUARD</span>
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-terminal-green"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-terminal-green">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-2 px-4 py-3 border-b border-terminal-green
                  hover:bg-terminal-green hover:text-terminal-bg
                  ${location.pathname === path ? 'bg-terminal-green text-terminal-bg' : ''}
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-bold">{label}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>
    </>
  );
};

export default Navigation;
