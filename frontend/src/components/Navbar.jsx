import React, { useState } from 'react';
import { FiMenu, FiX, FiCode, FiCloud, FiSettings, FiLogOut, FiUser } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ toggleSidebar, isSidebarOpen }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <FiCode /> },
    { path: '/analyze', label: 'Analyze Repo', icon: <FiCloud /> },
    { path: '/deploy', label: 'Deploy App', icon: <FiCloud /> },
    { path: '/settings', label: 'Settings', icon: <FiSettings /> },
  ];

  return (
    <nav className="bg-gray-900 text-white shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section */}
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none"
            >
              {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
            
            <div className="flex items-center ml-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FiCode className="text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  AutoPilotDev
                </span>
                <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded-full">
                  Beta
                </span>
              </div>
            </div>
          </div>

          {/* Center section - Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right section - User menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <FiUser size={18} />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">Student Developer</p>
                <p className="text-xs text-gray-400">Computer Dept</p>
              </div>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-700">
                  <p className="text-sm font-medium">Logged in as</p>
                  <p className="text-sm text-gray-400 truncate">student@college.edu</p>
                </div>
                <Link
                  to="/settings"
                  className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <FiSettings className="mr-3" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    // Handle logout
                    setIsUserMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                >
                  <FiLogOut className="mr-3" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden mt-2 pb-2">
          <div className="flex space-x-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap ${
                  location.pathname === item.path
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;