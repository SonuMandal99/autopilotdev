import React, { useState } from 'react';
import { FiCode, FiFileText, FiPackage, FiDatabase, FiCpu, FiTrendingUp } from 'react-icons/fi';
import { toast } from 'react-toastify';
import RepoInputBox from '../components/RepoInputBox';
import CodeViewer from '../components/CodeViewer';
import LogsViewer from '../components/LogsViewer';

const AnalyzeRepo = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [repoData, setRepoData] = useState(null);

  const handleAnalyze = async (repoInfo) => {
    setIsAnalyzing(true);
    setRepoData(repoInfo);
    
    // Simulate API call
    setTimeout(() => {
      const mockResult = {
        id: 'analysis_' + Date.now(),
        repoInfo: repoInfo,
        summary: {
          totalFiles: 42,
          totalLines: 1850,
          languages: ['JavaScript', 'Python', 'Dockerfile', 'YAML'],
          dependencies: 15,
          vulnerabilities: 2,
          complexity: 'Medium'
        },
        structure: {
          directories: 8,
          filesByType: {
            '.js': 12,
            '.py': 8,
            '.json': 5,
            '.md': 2,
            '.yaml': 3,
            'Dockerfile': 1,
            'docker-compose.yml': 1
          }
        },
        recommendations: [
          'Add .dockerignore file',
          'Update dependencies to latest versions',
          'Implement proper error handling',
          'Add unit tests',
          'Optimize Docker image size'
        ],
        generatedFiles: {
          dockerfile: `# Generated Dockerfile for ${repoInfo.url.split('/').pop()}
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]`,
          dockerCompose: `# Docker Compose configuration
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./data:/app/data`,
          cicd: `# GitHub Actions workflow
name: CI/CD Pipeline
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm test`}
      };
      
      setAnalysisResult(mockResult);
      setIsAnalyzing(false);
      toast.success('Repository analysis completed!');
    }, 2000);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FiTrendingUp /> },
    { id: 'structure', label: 'Structure', icon: <FiDatabase /> },
    { id: 'code', label: 'Code Analysis', icon: <FiCode /> },
    { id: 'dependencies', label: 'Dependencies', icon: <FiPackage /> },
    { id: 'recommendations', label: 'Recommendations', icon: <FiCpu /> },
    { id: 'generated', label: 'Generated Files', icon: <FiFileText /> },
  ];

  const renderTabContent = () => {
    if (!analysisResult) return null;

    switch (selectedTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-2xl font-bold text-white">{analysisResult.summary.totalFiles}</div>
                <div className="text-gray-400 text-sm">Total Files</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-2xl font-bold text-white">{analysisResult.summary.totalLines}</div>
                <div className="text-gray-400 text-sm">Lines of Code</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-2xl font-bold text-white">{analysisResult.summary.dependencies}</div>
                <div className="text-gray-400 text-sm">Dependencies</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-2xl font-bold text-white">{analysisResult.summary.vulnerabilities}</div>
                <div className="text-gray-400 text-sm">Vulnerabilities</div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-4">Repository Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Complexity:</span>
                  <span className={`px-3 py-1 rounded-full ${analysisResult.summary.complexity === 'High' ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
                    {analysisResult.summary.complexity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Primary Languages:</span>
                  <div className="flex gap-2">
                    {analysisResult.summary.languages.map((lang, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-700 rounded text-sm">{lang}</span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Analysis Time:</span>
                  <span className="text-white">2.3 seconds</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'structure':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-4">File Structure</h3>
              <div className="space-y-2">
                {Object.entries(analysisResult.structure.filesByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-3 bg-gray-900 rounded">
                    <div className="flex items-center">
                      <FiFileText className="text-gray-400 mr-3" />
                      <span className="text-white">{type} files</span>
                    </div>
                    <span className="px-3 py-1 bg-blue-900 text-blue-300 rounded-full">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'recommendations':
        return (
          <div className="space-y-4">
            {analysisResult.recommendations.map((rec, idx) => (
              <div key={idx} className="bg-gray-800 p-4 rounded-lg flex items-start">
                <div className="mr-4 mt-1">
                  <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center">
                    <FiCpu className="text-blue-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white mb-2">Recommendation {idx + 1}</h4>
                  <p className="text-gray-300">{rec}</p>
                  <div className="mt-3">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm">
                      Implement This
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'generated':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CodeViewer
                code={analysisResult.generatedFiles.dockerfile}
                language="dockerfile"
                filename="Dockerfile"
                title="Generated Dockerfile"
              />
              <CodeViewer
                code={analysisResult.generatedFiles.dockerCompose}
                language="yaml"
                filename="docker-compose.yml"
                title="Docker Compose Config"
              />
            </div>
            <div>
              <CodeViewer
                code={analysisResult.generatedFiles.cicd}
                language="yaml"
                filename=".github/workflows/ci-cd.yml"
                title="CI/CD Pipeline"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <div className="text-gray-500">Select a tab to view analysis details</div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Repository Analysis</h1>
        <p className="text-gray-400">Analyze GitHub repositories and generate AI-powered insights</p>
      </div>

      {/* Repository Input */}
      <div className="mb-8">
        <RepoInputBox
          onAnalyze={handleAnalyze}
          isLoading={isAnalyzing}
          title="Analyze Git Repository"
        />
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-8">
          {/* Tabs */}
          <div className="border-b border-gray-700">
            <div className="flex space-x-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                    ${selectedTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                    }
                  `}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {renderTabContent()}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium">
              Generate All Configs
            </button>
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">
              Deploy Now
            </button>
            <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium">
              Save Analysis
            </button>
            <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium">
              Export Report
            </button>
          </div>

          {/* Analysis Logs */}
          <div>
            <LogsViewer
              logs={[
                { id: 1, timestamp: new Date(Date.now() - 5000).toISOString(), level: 'info', message: 'Repository cloned successfully', source: 'git' },
                { id: 2, timestamp: new Date(Date.now() - 4000).toISOString(), level: 'info', message: 'Analyzing file structure', source: 'analyzer' },
                { id: 3, timestamp: new Date(Date.now() - 3000).toISOString(), level: 'success', message: 'Dependencies identified: 15 packages', source: 'analyzer' },
                { id: 4, timestamp: new Date(Date.now() - 2000).toISOString(), level: 'info', message: 'AI analysis in progress', source: 'ai' },
                { id: 5, timestamp: new Date(Date.now() - 1000).toISOString(), level: 'success', message: 'Analysis completed successfully', source: 'ai' },
              ]}
              title="Analysis Process Logs"
              autoScroll={true}
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!analysisResult && !isAnalyzing && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCode className="text-gray-500 text-4xl" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">No Repository Analyzed</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-8">
            Enter a repository URL above to start analysis. Get AI-powered insights, code reviews, and automated configuration generation.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-gray-800 p-6 rounded-lg">
              <FiCode className="text-blue-400 text-2xl mb-4" />
              <h4 className="font-bold text-white mb-2">Code Analysis</h4>
              <p className="text-gray-400 text-sm">Deep analysis of code quality and structure</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <FiPackage className="text-green-400 text-2xl mb-4" />
              <h4 className="font-bold text-white mb-2">Dependency Check</h4>
              <p className="text-gray-400 text-sm">Identify outdated or vulnerable dependencies</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <FiCpu className="text-purple-400 text-2xl mb-4" />
              <h4 className="font-bold text-white mb-2">AI Recommendations</h4>
              <p className="text-gray-400 text-sm">Get intelligent suggestions for improvements</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyzeRepo;