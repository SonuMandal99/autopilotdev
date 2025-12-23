import React, { useState } from 'react';
import {
  FiUser,
  FiLock,
  FiGlobe,
  FiDatabase,
  FiCloud,
  FiBell,
  FiSave,
  FiKey,
  FiRefreshCw,
  FiTrash2,
  FiCopy,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showApiKey, setShowApiKey] = useState(false);
  const [settings, setSettings] = useState({
    profile: {
      name: 'Student Developer',
      email: 'student@college.edu',
      role: 'Admin',
      department: 'Computer Engineering'
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
      passwordLastChanged: '2024-01-15'
    },
    api: {
      openaiKey: 'sk-*************1234',
      githubToken: 'ghp_*************',
      dockerhubToken: 'dckr_*************'
    },
    preferences: {
      theme: 'dark',
      language: 'en',
      notifications: true,
      autoSave: true
    },
    integrations: {
      github: true,
      docker: true,
      kubernetes: true,
      aws: false,
      azure: false,
      gcp: false
    }
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <FiUser /> },
    { id: 'security', label: 'Security', icon: <FiLock /> },
    { id: 'api', label: 'API Keys', icon: <FiKey /> },
    { id: 'integrations', label: 'Integrations', icon: <FiGlobe /> },
    { id: 'preferences', label: 'Preferences', icon: <FiBell /> },
    { id: 'database', label: 'Database', icon: <FiDatabase /> },
    { id: 'cloud', label: 'Cloud', icon: <FiCloud /> }
  ];

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  const handleReset = () => {
    toast.info('Settings reset to defaults');
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const regenerateApiKey = (keyType) => {
    toast.warn(`Regenerating ${keyType} key...`);
    // API call to regenerate key
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={settings.profile.name}
                    onChange={(e) => setSettings({
                      ...settings,
                      profile: { ...settings.profile, name: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={settings.profile.email}
                    onChange={(e) => setSettings({
                      ...settings,
                      profile: { ...settings.profile, email: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Role</label>
                  <input
                    type="text"
                    value={settings.profile.role}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Department</label>
                  <input
                    type="text"
                    value={settings.profile.department}
                    onChange={(e) => setSettings({
                      ...settings,
                      profile: { ...settings.profile, department: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-4">Avatar</h3>
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl">
                  SD
                </div>
                <div className="space-y-3">
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
                    Upload New Photo
                  </button>
                  <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
                    Remove Photo
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-4">Security Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-400">Add an extra layer of security</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.security.twoFactor}
                      onChange={(e) => setSettings({
                        ...settings,
                        security: { ...settings.security, twoFactor: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Session Timeout (minutes)</label>
                  <select
                    value={settings.security.sessionTimeout}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: { ...settings.security, sessionTimeout: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                    <option value="0">Never</option>
                  </select>
                </div>

                <div>
                  <h4 className="font-medium text-white mb-2">Password</h4>
                  <p className="text-sm text-gray-400 mb-4">
                    Last changed: {settings.security.passwordLastChanged}
                  </p>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
                    Change Password
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <h4 className="font-medium text-white mb-2">Active Sessions</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-900 rounded">
                      <div>
                        <p className="text-white">Chrome on Windows</p>
                        <p className="text-sm text-gray-400">Current session</p>
                      </div>
                      <button className="text-red-400 hover:text-red-300">
                        Revoke
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-900 rounded">
                      <div>
                        <p className="text-white">Firefox on Linux</p>
                        <p className="text-sm text-gray-400">2 days ago</p>
                      </div>
                      <button className="text-red-400 hover:text-red-300">
                        Revoke
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'api':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-4">API Keys & Tokens</h3>
              <p className="text-gray-400 mb-6">
                Manage your API keys for various services. Keep them secure and don't share them.
              </p>

              <div className="space-y-4">
                {/* OpenAI API Key */}
                <div className="bg-gray-900 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-900 rounded-lg flex items-center justify-center mr-3">
                        <FiKey className="text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">OpenAI API Key</h4>
                        <p className="text-sm text-gray-400">For AI code generation</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(settings.api.openaiKey, 'OpenAI Key')}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                        title="Copy to clipboard"
                      >
                        <FiCopy />
                      </button>
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                        title={showApiKey ? 'Hide key' : 'Show key'}
                      >
                        {showApiKey ? <FiEyeOff /> : <FiEye />}
                      </button>
                      <button
                        onClick={() => regenerateApiKey('OpenAI')}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                        title="Regenerate key"
                      >
                        <FiRefreshCw />
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.api.openaiKey}
                      readOnly
                      className="w-full px-4 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>

                {/* GitHub Token */}
                <div className="bg-gray-900 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mr-3">
                        <FiKey className="text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">GitHub Token</h4>
                        <p className="text-sm text-gray-400">For repository access</p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(settings.api.githubToken, 'GitHub Token')}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* DockerHub Token */}
                <div className="bg-gray-900 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                        <FiKey className="text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">DockerHub Token</h4>
                        <p className="text-sm text-gray-400">For container registry</p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(settings.api.dockerhubToken, 'DockerHub Token')}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-700">
                <h4 className="font-medium text-white mb-3">Generate New API Key</h4>
                <div className="flex space-x-3">
                  <select className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white">
                    <option>Select service</option>
                    <option>OpenAI</option>
                    <option>GitHub</option>
                    <option>DockerHub</option>
                    <option>AWS</option>
                    <option>Azure</option>
                  </select>
                  <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
                    Generate
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-4">Service Integrations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(settings.integrations).map(([service, enabled]) => (
                  <div key={service} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                        enabled ? 'bg-green-900' : 'bg-gray-800'
                      }`}>
                        <FiGlobe className={enabled ? 'text-green-400' : 'text-gray-400'} />
                      </div>
                      <div>
                        <h4 className="font-medium text-white capitalize">{service}</h4>
                        <p className="text-sm text-gray-400">
                          {enabled ? 'Connected' : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setSettings({
                          ...settings,
                          integrations: { ...settings.integrations, [service]: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-bold text-white mb-4">
              {tabs.find(t => t.id === activeTab)?.label} Settings
            </h3>
            <p className="text-gray-400">Settings for this section will be available soon.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account and platform preferences</p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center"
          >
            <FiSave className="mr-2" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:w-64">
          <div className="bg-gray-800 rounded-xl p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors
                    ${activeTab === tab.id
                      ? 'bg-blue-900 text-blue-300'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }
                  `}
                >
                  <span className="mr-3">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="mt-8 pt-6 border-t border-gray-700">
              <h4 className="text-sm font-semibold text-gray-400 mb-3">Danger Zone</h4>
              <button className="w-full flex items-center justify-center px-4 py-3 bg-red-900 hover:bg-red-800 text-red-300 rounded-lg">
                <FiTrash2 className="mr-2" />
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {renderTabContent()}

          {/* System Info */}
          <div className="mt-8 bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-bold text-white mb-4">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900 p-4 rounded">
                <div className="text-sm text-gray-400">Platform Version</div>
                <div className="text-white font-medium">1.0.0</div>
              </div>
              <div className="bg-gray-900 p-4 rounded">
                <div className="text-sm text-gray-400">Last Updated</div>
                <div className="text-white font-medium">2024-01-20</div>
              </div>
              <div className="bg-gray-900 p-4 rounded">
                <div className="text-sm text-gray-400">Storage Used</div>
                <div className="text-white font-medium">2.3 GB / 10 GB</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;