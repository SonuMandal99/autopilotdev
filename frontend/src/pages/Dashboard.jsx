import React, { useState, useEffect } from 'react';
import { 
  FiActivity, 
  FiCode, 
  FiCloud, 
  FiPackage, 
  FiTrendingUp, 
  FiUsers,
  FiDatabase,
  FiClock,
  FiArrowUp,
  FiArrowDown,
  FiRefreshCw
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import LogsViewer from '../components/LogsViewer';
import CodeViewer from '../components/CodeViewer';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProjects: 12,
    activeDeployments: 8,
    aiRequests: 156,
    successRate: 92,
    totalUsers: 5,
    storageUsed: '2.3 GB'
  });

  const [recentActivities, setRecentActivities] = useState([
    { id: 1, project: 'Node API Server', action: 'Deployed', time: '2 minutes ago', status: 'success' },
    { id: 2, project: 'React Dashboard', action: 'Code Generated', time: '15 minutes ago', status: 'success' },
    { id: 3, project: 'Python ML Model', action: 'Dockerfile Created', time: '1 hour ago', status: 'success' },
    { id: 4, project: 'Java Microservice', action: 'K8s Config Generated', time: '3 hours ago', status: 'success' },
    { id: 5, project: 'Go API', action: 'CI/CD Pipeline Failed', time: '5 hours ago', status: 'error' },
  ]);

  const [quickActions, setQuickActions] = useState([
    { id: 1, title: 'New Project', icon: <FiCode />, color: 'bg-blue-600', action: 'createProject' },
    { id: 2, title: 'Analyze Repo', icon: <FiPackage />, color: 'bg-green-600', action: 'analyzeRepo' },
    { id: 3, title: 'Deploy App', icon: <FiCloud />, color: 'bg-purple-600', action: 'deployApp' },
    { id: 4, title: 'Generate Config', icon: <FiDatabase />, color: 'bg-orange-600', action: 'generateConfig' },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Simulate fetching dashboard data
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Dashboard data loaded');
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleQuickAction = (action) => {
    toast.info(`Starting ${action}...`);
    // Navigate or open modal based on action
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setStats(prev => ({
        ...prev,
        aiRequests: prev.aiRequests + 1,
        activeDeployments: Math.floor(Math.random() * 10) + 1
      }));
      setIsLoading(false);
      toast.success('Dashboard refreshed');
    }, 1000);
  };

  const StatCard = ({ title, value, icon, change, color }) => (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${color} rounded-lg`}>
          {icon}
        </div>
        <div className={`flex items-center text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {change >= 0 ? <FiArrowUp className="mr-1" /> : <FiArrowDown className="mr-1" />}
          {Math.abs(change)}%
        </div>
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">{value}</h3>
      <p className="text-gray-400 text-sm">{title}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Welcome to AutoPilotDev - AI-powered DevOps platform</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg disabled:opacity-50"
          >
            <FiRefreshCw className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="text-sm text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.action)}
              className={`${action.color} hover:opacity-90 rounded-xl p-6 text-white transition-all transform hover:scale-105`}
            >
              <div className="flex flex-col items-center">
                <div className="text-2xl mb-3">{action.icon}</div>
                <span className="font-semibold">{action.title}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Projects"
          value={stats.totalProjects}
          icon={<FiCode className="text-white text-xl" />}
          change={12}
          color="bg-blue-600"
        />
        <StatCard
          title="Active Deployments"
          value={stats.activeDeployments}
          icon={<FiCloud className="text-white text-xl" />}
          change={8}
          color="bg-green-600"
        />
        <StatCard
          title="AI Requests"
          value={stats.aiRequests}
          icon={<FiActivity className="text-white text-xl" />}
          change={23}
          color="bg-purple-600"
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          icon={<FiTrendingUp className="text-white text-xl" />}
          change={2}
          color="bg-orange-600"
        />
        <StatCard
          title="Team Members"
          value={stats.totalUsers}
          icon={<FiUsers className="text-white text-xl" />}
          change={0}
          color="bg-pink-600"
        />
        <StatCard
          title="Storage Used"
          value={stats.storageUsed}
          icon={<FiDatabase className="text-white text-xl" />}
          change={-5}
          color="bg-indigo-600"
        />
      </div>

      {/* Recent Activity and Code Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
            <FiClock className="text-gray-400" />
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 bg-gray-900 rounded-lg hover:bg-gray-850 transition-colors"
              >
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${activity.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="font-medium text-white">{activity.project}</p>
                    <p className="text-sm text-gray-400">{activity.action}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-300">{activity.time}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${activity.status === 'success' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 text-center text-gray-400 hover:text-white border border-gray-700 rounded-lg hover:border-gray-600 transition-colors">
            View All Activity
          </button>
        </div>

        {/* Quick Code Preview */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Quick Code Preview</h2>
          <CodeViewer
            code={`// Sample Dockerfile generated by AutoPilotDev
FROM node:18-alpine

# Install dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \\
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "server.js"]`}
            language="dockerfile"
            filename="Dockerfile"
            title="Generated Dockerfile"
            showLineNumbers={true}
            readOnly={true}
          />
        </div>
      </div>

      {/* System Logs */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">System Logs</h2>
          <div className="text-sm text-gray-400">
            Real-time monitoring
          </div>
        </div>
        <LogsViewer
          title="System Activity"
          autoScroll={true}
          realTime={true}
        />
      </div>

      {/* Performance Metrics */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-6">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-900 rounded-lg">
            <div className="text-3xl font-bold text-green-400 mb-2">98%</div>
            <p className="text-gray-400">Uptime</p>
          </div>
          <div className="text-center p-4 bg-gray-900 rounded-lg">
            <div className="text-3xl font-bold text-blue-400 mb-2">450ms</div>
            <p className="text-gray-400">Avg Response Time</p>
          </div>
          <div className="text-center p-4 bg-gray-900 rounded-lg">
            <div className="text-3xl font-bold text-purple-400 mb-2">99.9%</div>
            <p className="text-gray-400">API Reliability</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;