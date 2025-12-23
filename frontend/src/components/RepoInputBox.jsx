import React, { useState } from 'react';
import { FiGithub, FiGitlab, FiLink, FiDownload, FiSearch, FiCode } from 'react-icons/fi';
import { toast } from 'react-toastify';

const RepoInputBox = ({ onAnalyze, isLoading, title = "Repository Analysis" }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [repoType, setRepoType] = useState('github');
  const [branch, setBranch] = useState('main');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!repoUrl.trim()) {
      toast.error('Please enter a repository URL');
      return;
    }

    const repoData = {
      url: repoUrl,
      type: repoType,
      branch: branch,
      timestamp: new Date().toISOString(),
    };

    onAnalyze(repoData);
  };

  const handleExampleClick = () => {
    setRepoUrl('https://github.com/example/nodejs-app');
    toast.info('Example repository URL loaded. Click Analyze to proceed.');
  };

  const handleClear = () => {
    setRepoUrl('');
    setBranch('main');
    toast.info('Form cleared');
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-900 rounded-lg">
            <FiCode className="text-blue-400" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="text-gray-400 text-sm">Analyze any Git repository for AI-powered insights</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleExampleClick}
          className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center"
        >
          <FiSearch className="mr-2" />
          Load Example
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Repository URL Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Repository URL
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiLink className="text-gray-500" />
            </div>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              required
            />
          </div>
          <p className="mt-2 text-sm text-gray-400">
            Supports GitHub, GitLab, Bitbucket, and other Git repositories
          </p>
        </div>

        {/* Repository Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Repository Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'github', label: 'GitHub', icon: <FiGithub />, color: 'bg-gray-900' },
                { value: 'gitlab', label: 'GitLab', icon: <FiGitlab />, color: 'bg-orange-900' },
                { value: 'other', label: 'Other', icon: <FiLink />, color: 'bg-gray-900' },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setRepoType(type.value)}
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-lg border transition-all
                    ${repoType === type.value
                      ? `${type.color} border-blue-500 text-white`
                      : 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800'
                    }
                  `}
                >
                  <span className="text-lg mb-1">{type.icon}</span>
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Branch Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="main"
              />
            </div>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-sm text-gray-400 hover:text-white mb-3"
          >
            <span className="mr-2">{showAdvanced ? '▼' : '▶'}</span>
            Advanced Options
          </button>
          
          {showAdvanced && (
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Depth Limit
                  </label>
                  <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
                    <option value="1">Shallow (Fastest)</option>
                    <option value="3">Medium</option>
                    <option value="full">Full History</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    File Filter
                  </label>
                  <input
                    type="text"
                    placeholder="*.js,*.py,*.java"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="include-deps"
                  className="mr-2"
                />
                <label htmlFor="include-deps" className="text-sm text-gray-400">
                  Include dependency analysis
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            type="submit"
            disabled={isLoading}
            className={`
              flex-1 flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all
              ${isLoading
                ? 'bg-blue-800 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
              }
            `}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Analyzing...
              </>
            ) : (
              <>
                <FiDownload className="mr-3" />
                Analyze Repository
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={handleClear}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            Clear
          </button>
        </div>
      </form>

      {/* Tips Section */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h4 className="text-sm font-semibold text-gray-400 mb-2">💡 Tips for Best Results</h4>
        <ul className="text-sm text-gray-500 space-y-1">
          <li className="flex items-center">
            <span className="mr-2">•</span>
            Use public repositories for immediate analysis
          </li>
          <li className="flex items-center">
            <span className="mr-2">•</span>
            Include package.json/pom.xml for dependency insights
          </li>
          <li className="flex items-center">
            <span className="mr-2">•</span>
            For private repos, configure API tokens in Settings
          </li>
        </ul>
      </div>
    </div>
  );
};

export default RepoInputBox;