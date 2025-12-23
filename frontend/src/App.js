import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/main.css';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';
import AnalyzeRepo from './pages/AnalyzeRepo';
import DeployApp from './pages/DeployApp';
import Settings from './pages/Settings';

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        {/* Toast Notifications */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />

        {/* Navigation */}
        <Navbar 
          toggleSidebar={toggleSidebar} 
          isSidebarOpen={isSidebarOpen}
        />

        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} />

        {/* Main Content */}
        <main className={`
          pt-16 transition-all duration-300
          ${isSidebarOpen ? 'md:pl-64' : 'md:pl-16'}
        `}>
          <div className="p-4 md:p-6">
            <Routes>
              {/* Dashboard */}
              <Route path="/" element={<Dashboard />} />
              
              {/* Repository Analysis */}
              <Route path="/analyze" element={<AnalyzeRepo />} />
              <Route path="/analyze/:repoId" element={<AnalyzeRepo />} />
              
              {/* Code Generation */}
              <Route path="/generate" element={<Navigate to="/analyze" />} />
              <Route path="/generate/:type" element={<AnalyzeRepo />} />
              
              {/* DevOps */}
              <Route path="/docker" element={<Navigate to="/analyze" />} />
              <Route path="/kubernetes" element={<Navigate to="/analyze" />} />
              <Route path="/cicd" element={<Navigate to="/analyze" />} />
              
              {/* Deployment */}
              <Route path="/deploy" element={<DeployApp />} />
              <Route path="/deploy/:appId" element={<DeployApp />} />
              
              {/* Database */}
              <Route path="/database" element={<Navigate to="/settings" />} />
              
              {/* Settings */}
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/:tab" element={<Settings />} />
              
              {/* Redirects */}
              <Route path="/dashboard" element={<Navigate to="/" />} />
              <Route path="/home" element={<Navigate to="/" />} />
              
              {/* 404 - Not Found */}
              <Route path="*" element={
                <div className="min-h-[80vh] flex flex-col items-center justify-center">
                  <h1 className="text-6xl font-bold text-white mb-4">404</h1>
                  <p className="text-xl text-gray-400 mb-8">Page not found</p>
                  <a href="/" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg">
                    Go to Dashboard
                  </a>
                </div>
              } />
            </Routes>
          </div>

          {/* Footer */}
          <footer className="mt-8 border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white font-bold text-xs">A</span>
                    </div>
                    <span className="font-bold text-white">AutoPilotDev</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    AI DevOps Platform for Computer Department Project
                  </p>
                </div>
                
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6 text-sm">
                  <a href="/" className="text-gray-400 hover:text-white">Dashboard</a>
                  <a href="/analyze" className="text-gray-400 hover:text-white">Analyze</a>
                  <a href="/deploy" className="text-gray-400 hover:text-white">Deploy</a>
                  <a href="/settings" className="text-gray-400 hover:text-white">Settings</a>
                </div>
                
                <div className="mt-4 md:mt-0">
                  <p className="text-xs text-gray-500">
                    © {new Date().getFullYear()} AutoPilotDev. Computer Department Project.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-800 text-center">
                <p className="text-xs text-gray-500">
                  This is a student project for educational purposes only.
                </p>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </Router>
  );
};

export default App;