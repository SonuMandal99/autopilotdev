import React, { useState } from 'react';
import { 
  FiFile, 
  FiSave, 
  FiCopy, 
  FiDownload, 
  FiCode, 
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiZap,
  FiSettings
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const GenerateFile = ({ 
  initialCode = '',
  initialLanguage = 'javascript',
  initialFilename = 'generated.js',
  onGenerate,
  onSave,
  isLoading = false,
  fileTypes = [
    { value: 'dockerfile', label: 'Dockerfile', icon: '🐳' },
    { value: 'yaml', label: 'Kubernetes YAML', icon: '☸️' },
    { value: 'javascript', label: 'JavaScript', icon: '🟨' },
    { value: 'typescript', label: 'TypeScript', icon: '🔷' },
    { value: 'python', label: 'Python', icon: '🐍' },
    { value: 'java', label: 'Java', icon: '☕' },
    { value: 'json', label: 'JSON Config', icon: '📊' },
    { value: 'markdown', label: 'Documentation', icon: '📝' },
  ]
}) => {
  const [filename, setFilename] = useState(initialFilename);
  const [language, setLanguage] = useState(initialLanguage);
  const [code, setCode] = useState(initialCode);
  const [showOptions, setShowOptions] = useState(false);
  const [customOptions, setCustomOptions] = useState({
    includeComments: true,
    optimize: true,
    minify: false,
    addHeader: true,
    format: 'standard',
  });

  const handleGenerate = () => {
    if (!filename.trim()) {
      toast.error('Please enter a filename');
      return;
    }

    const generationData = {
      filename,
      language,
      options: customOptions,
      timestamp: new Date().toISOString(),
    };

    if (onGenerate) {
      onGenerate(generationData);
    } else {
      // Default generation for demo
      const demoCode = {
        dockerfile: `# Auto-generated Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]`,
        yaml: `# Auto-generated Kubernetes Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${filename.split('.')[0]}-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ${filename.split('.')[0]}
  template:
    metadata:
      labels:
        app: ${filename.split('.')[0]}
    spec:
      containers:
      - name: ${filename.split('.')[0]}
        image: ${filename.split('.')[0]}:latest
        ports:
        - containerPort: 3000`,
        javascript: `// Auto-generated JavaScript file
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello from AutoPilotDev!' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,
      };

      setCode(demoCode[language] || `// Generated ${language} file\nconsole.log("Hello, World!");`);
      toast.success(`Generated ${filename} successfully!`);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave({ filename, language, code });
    } else {
      toast.success(`Saved ${filename} to workspace`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.info(`Downloaded: ${filename}`);
  };

  const handleReset = () => {
    setCode('');
    setFilename(initialFilename);
    setLanguage(initialLanguage);
    toast.info('Reset to initial state');
  };

  const getFileExtension = () => {
    const extensions = {
      dockerfile: '',
      javascript: '.js',
      typescript: '.ts',
      python: '.py',
      java: '.java',
      yaml: '.yaml',
      json: '.json',
      markdown: '.md',
    };
    return extensions[language] || '.txt';
  };

  const updateFilenameExtension = (newLanguage) => {
    const baseName = filename.split('.')[0];
    const extension = getFileExtension(newLanguage);
    setFilename(`${baseName}${extension}`);
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-900 rounded-lg">
            <FiZap className="text-purple-400" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI File Generator</h2>
            <p className="text-gray-400 text-sm">Generate configuration files and code with AI</p>
          </div>
        </div>
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
        >
          <FiSettings className="mr-2" />
          {showOptions ? <FiChevronUp /> : <FiChevronDown />}
        </button>
      </div>

      {/* Main Form */}
      <div className="space-y-6">
        {/* File Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Filename
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiFile className="text-gray-500" />
              </div>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter filename"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              File Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {fileTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setLanguage(type.value);
                    updateFilenameExtension(type.value);
                  }}
                  className={`
                    flex flex-col items-center p-3 rounded-lg border transition-all
                    ${language === type.value
                      ? 'bg-purple-900 border-purple-500 text-white'
                      : 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800'
                    }
                  `}
                  title={type.label}
                >
                  <span className="text-xl mb-1">{type.icon}</span>
                  <span className="text-xs truncate w-full text-center">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Options */}
        {showOptions && (
          <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Generation Options</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(customOptions).map(([key, value]) => (
                <div key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    id={key}
                    checked={value}
                    onChange={(e) => setCustomOptions({
                      ...customOptions,
                      [key]: e.target.checked
                    })}
                    className="mr-2 rounded bg-gray-800 border-gray-700"
                  />
                  <label htmlFor={key} className="text-sm text-gray-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </label>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-sm text-gray-400 mb-2">Code Style</label>
              <select
                value={customOptions.format}
                onChange={(e) => setCustomOptions({
                  ...customOptions,
                  format: e.target.value
                })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              >
                <option value="standard">Standard</option>
                <option value="airbnb">Airbnb</option>
                <option value="google">Google</option>
                <option value="prettier">Prettier</option>
              </select>
            </div>
          </div>
        )}

        {/* Code Preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">
              Code Preview
            </label>
            <div className="text-sm text-gray-500">
              {code.length} characters, {code.split('\n').length} lines
            </div>
          </div>
          <div className="relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-64 font-mono text-sm bg-gray-900 text-gray-100 border border-gray-700 rounded-lg p-4 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={`// Generated ${language} code will appear here...`}
              spellCheck="false"
            />
            {!code && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none">
                <div className="text-center">
                  <FiCode size={48} className="mx-auto mb-4" />
                  <p>Generated code will appear here</p>
                  <p className="text-sm mt-2">Click "Generate" to create your file</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-700">
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-medium transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Generating...
              </>
            ) : (
              <>
                <FiRefreshCw className="mr-3" />
                Generate Code
              </>
            )}
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium flex items-center"
              disabled={!code}
            >
              <FiSave className="mr-2" />
              Save
            </button>

            <button
              onClick={handleCopy}
              className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium flex items-center"
              disabled={!code}
            >
              <FiCopy className="mr-2" />
              Copy
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium flex items-center"
              disabled={!code}
            >
              <FiDownload className="mr-2" />
              Download
            </button>

            <button
              onClick={handleReset}
              className="px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium flex items-center"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Quick Templates */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h4 className="text-sm font-semibold text-gray-400 mb-3">Quick Templates</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Express Server', 'React Component', 'Docker Compose', 'K8s Service'].map((template) => (
            <button
              key={template}
              onClick={() => {
                setLanguage(template.includes('Docker') ? 'dockerfile' : 
                           template.includes('K8s') ? 'yaml' : 'javascript');
                toast.info(`Selected ${template} template`);
              }}
              className="px-3 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm text-gray-300 transition-colors"
            >
              {template}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GenerateFile;