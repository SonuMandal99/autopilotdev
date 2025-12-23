import React, { useState } from 'react';
import { 
  FiCloud, 
  FiServer, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiPlay, 
  FiStopCircle,
  FiRefreshCw,
  FiSettings,
  FiExternalLink,
  FiActivity,
  FiGlobe
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import LogsViewer from '../components/LogsViewer';
import CodeViewer from '../components/CodeViewer';

const DeployApp = () => {
  const [deploymentType, setDeploymentType] = useState('docker');
  const [deployments, setDeployments] = useState([
    { id: 1, name: 'node-api', status: 'running', type: 'docker', url: 'http://localhost:3000', cpu: '45%', memory: '320MB', uptime: '2d 5h' },
    { id: 2, name: 'react-dashboard', status: 'stopped', type: 'kubernetes', url: 'http://dashboard.local', cpu: '0%', memory: '0MB', uptime: '-' },
    { id: 3, name: 'python-ml', status: 'deploying', type: 'docker', url: 'http://ml.local', cpu: '15%', memory: '210MB', uptime: '5h' },
    { id: 4, name: 'java-service', status: 'error', type: 'kubernetes', url: 'http://java.local', cpu: '85%', memory: '1.2GB', uptime: '1d' },
  ]);

  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const deploymentTypes = [
    { id: 'docker', label: 'Docker', icon: '🐳', color: 'bg-blue-600' },
    { id: 'kubernetes', label: 'Kubernetes', icon: '☸️', color: 'bg-purple-600' },
    { id: 'cloud', label: 'Cloud', icon: '☁️', color: 'bg-green-600' },
    { id: 'serverless', label: 'Serverless', icon: '⚡', color: 'bg-yellow-600' },
  ];

  const handleDeploy = () => {
    setIsDeploying(true);
    toast.info(`Starting ${deploymentType} deployment...`);

    setTimeout(() => {
      const newDeployment = {
        id: deployments.length + 1,
        name: `app-${Date.now().toString().slice(-4)}`,
        status: 'deploying',
        type: deploymentType,
        url: `http://${deploymentType}-app.local`,
        cpu: '0%',
        memory: '0MB',
        uptime: 'just now'
      };

      setDeployments([newDeployment, ...deployments]);
      setIsDeploying(false);
      toast.success('Deployment started successfully!');
    }, 2000);
  };

  const handleDeploymentAction = (id, action) => {
    setDeployments(deployments.map(deploy => {
      if (deploy.id === id) {
        const newStatus = action === 'start' ? 'running' : action === 'stop' ? 'stopped' : deploy.status;
        toast.info(`${action.charAt(0).toUpperCase() + action.slice(1)}ing deployment ${deploy.name}`);
        return { ...deploy, status: newStatus };
      }
      return deploy;
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'stopped': return 'bg-gray-500';
      case 'deploying': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return <FiCheckCircle className="text-green-400" />;
      case 'stopped': return <FiStopCircle className="text-gray-400" />;
      case 'deploying': return <FiRefreshCw className="text-blue-400 animate-spin" />;
      case 'error': return <FiAlertCircle className="text-red-400" />;
      default: return <FiAlertCircle className="text-gray-400" />;
    }
  };

  const DeploymentCard = ({ deployment }) => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center mb-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(deployment.status)} mr-3`}></div>
            <h3 className="font-bold text-white text-lg">{deployment.name}</h3>
            <span className="ml-3 px-2 py-1 text-xs bg-gray-700 rounded">{deployment.type}</span>
          </div>
          <div className="flex items-center text-gray-400 text-sm">
            <FiGlobe className="mr-2" />
            <a href={deployment.url} className="hover:text-blue-400" target="_blank" rel="noopener noreferrer">
              {deployment.url}
            </a>
            <FiExternalLink className="ml-2" size={12} />
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400 mb-1">Uptime</div>
          <div className="text-white font-medium">{deployment.uptime}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 p-3 rounded">
          <div className="text-sm text-gray-400 mb-1">CPU Usage</div>
          <div className="flex items-center">
            <div className="flex-1 bg-gray-700 rounded-full h-2 mr-3">
              <div 
                className={`h-full rounded-full ${
                  parseInt(deployment.cpu) > 80 ? 'bg-red-500' : 
                  parseInt(deployment.cpu) > 50 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: deployment.cpu }}
              ></div>
            </div>
            <div className="text-white font-medium">{deployment.cpu}</div>
          </div>
        </div>
        <div className="bg-gray-900 p-3 rounded">
          <div className="text-sm text-gray-400 mb-1">Memory</div>
          <div className="text-white font-medium">{deployment.memory}</div>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => handleDeploymentAction(deployment.id, deployment.status === 'running' ? 'stop' : 'start')}
          className={`flex-1 py-2 rounded font-medium ${
            deployment.status === 'running'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {deployment.status === 'running' ? 'Stop' : 'Start'}
        </button>
        <button
          onClick={() => setSelectedDeployment(deployment)}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
        >
          <FiSettings />
        </button>
        <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">
          <FiActivity />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Application Deployment</h1>
        <p className="text-gray-400">Deploy and manage your applications across different environments</p>
      </div>

      {/* Deployment Type Selection */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Select Deployment Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {deploymentTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setDeploymentType(type.id)}
              className={`
                flex flex-col items-center p-6 rounded-xl border-2 transition-all transform hover:scale-105
                ${deploymentType === type.id
                  ? `${type.color} border-white text-white`
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                }
              `}
            >
              <span className="text-3xl mb-3">{type.icon}</span>
              <span className="font-semibold">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Deploy */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Quick Deploy</h2>
            <p className="text-gray-400">Deploy your application with one click</p>
          </div>
          <div className="mt-4 md:mt-0">
            <span className="text-sm text-gray-400 mr-4">Environment: Production</span>
            <span className="text-sm text-blue-400">Advanced Settings</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Application Name</label>
            <input
              type="text"
              placeholder="my-app"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Container Image</label>
            <input
              type="text"
              placeholder="node:18-alpine"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Port</label>
            <input
              type="number"
              placeholder="3000"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
        </div>

        <button
          onClick={handleDeploy}
          disabled={isDeploying}
          className="w-full flex items-center justify-center py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-lg font-bold text-lg disabled:opacity-50"
        >
          {isDeploying ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
              Deploying...
            </>
          ) : (
            <>
              <FiPlay className="mr-3" />
              Deploy Application
            </>
          )}
        </button>
      </div>

      {/* Active Deployments */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Active Deployments</h2>
          <div className="text-sm text-gray-400">
            {deployments.filter(d => d.status === 'running').length} running
          </div>
        </div>

        {deployments.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-xl">
            <FiCloud className="text-gray-500 text-5xl mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Deployments</h3>
            <p className="text-gray-400">Start by deploying your first application</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {deployments.map((deployment) => (
              <DeploymentCard key={deployment.id} deployment={deployment} />
            ))}
          </div>
        )}
      </div>

      {/* Deployment Logs */}
      <div className="mb-8">
        <LogsViewer
          logs={[
            { id: 1, timestamp: new Date(Date.now() - 10000).toISOString(), level: 'info', message: 'Building Docker image', source: 'docker' },
            { id: 2, timestamp: new Date(Date.now() - 8000).toISOString(), level: 'success', message: 'Image built successfully', source: 'docker' },
            { id: 3, timestamp: new Date(Date.now() - 6000).toISOString(), level: 'info', message: 'Pushing to container registry', source: 'registry' },
            { id: 4, timestamp: new Date(Date.now() - 4000).toISOString(), level: 'info', message: 'Creating Kubernetes deployment', source: 'kubernetes' },
            { id: 5, timestamp: new Date(Date.now() - 2000).toISOString(), level: 'success', message: 'Deployment completed successfully', source: 'kubernetes' },
          ]}
          title="Deployment Logs"
          autoScroll={true}
        />
      </div>

      {/* Deployment Configuration Preview */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Deployment Configuration</h2>
        <CodeViewer
          code={`apiVersion: apps/v1
kind: Deployment
metadata:
  name: node-api-deployment
  labels:
    app: node-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: node-api
  template:
    metadata:
      labels:
        app: node-api
    spec:
      containers:
      - name: node-api
        image: node:18-alpine
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10`}
          language="yaml"
          filename="deployment.yaml"
          title="Kubernetes Deployment Config"
          showLineNumbers={true}
          readOnly={true}
        />
      </div>
    </div>
  );
};

export default DeployApp;