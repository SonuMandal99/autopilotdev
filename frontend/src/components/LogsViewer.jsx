import React, { useState, useEffect, useRef } from 'react';
import { FiPlay, FiPause, FiTrash2, FiDownload, FiFilter, FiSearch, FiClock } from 'react-icons/fi';
import { toast } from 'react-toastify';

const LogsViewer = ({ 
  logs = [], 
  title = "Application Logs",
  autoScroll = true,
  realTime = false
}) => {
  const [filter, setFilter] = useState('');
  const [logLevel, setLogLevel] = useState('all');
  const [isPlaying, setIsPlaying] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const logsEndRef = useRef(null);

  const logLevels = {
    info: { color: 'bg-blue-500', text: 'text-blue-300' },
    success: { color: 'bg-green-500', text: 'text-green-300' },
    warning: { color: 'bg-yellow-500', text: 'text-yellow-300' },
    error: { color: 'bg-red-500', text: 'text-red-300' },
    debug: { color: 'bg-purple-500', text: 'text-purple-300' },
  };

  // Default logs if none provided
  const defaultLogs = [
    { id: 1, timestamp: new Date(Date.now() - 30000).toISOString(), level: 'info', message: 'Application started successfully', source: 'backend' },
    { id: 2, timestamp: new Date(Date.now() - 25000).toISOString(), level: 'success', message: 'Connected to database', source: 'database' },
    { id: 3, timestamp: new Date(Date.now() - 20000).toISOString(), level: 'warning', message: 'High memory usage detected', source: 'system' },
    { id: 4, timestamp: new Date(Date.now() - 15000).toISOString(), level: 'debug', message: 'Processing request /api/analyze', source: 'api' },
    { id: 5, timestamp: new Date(Date.now() - 10000).toISOString(), level: 'error', message: 'Failed to fetch repository data', source: 'github' },
    { id: 6, timestamp: new Date(Date.now() - 5000).toISOString(), level: 'info', message: 'AI analysis completed', source: 'ai' },
  ];

  const displayLogs = logs.length > 0 ? logs : defaultLogs;

  // Filter logs based on level and search term
  const filteredLogs = displayLogs.filter(log => {
    const matchesLevel = logLevel === 'all' || log.level === logLevel;
    const matchesSearch = searchTerm === '' || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && isPlaying && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, autoScroll, isPlaying]);

  const handleClearLogs = () => {
    toast.info('Logs cleared');
  };

  const handleDownloadLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${new Date(log.timestamp).toLocaleTimeString()}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}`
    ).join('\n');
    
    const element = document.createElement('a');
    const file = new Blob([logText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `logs_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast.success('Logs downloaded successfully!');
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const getLogColor = (level) => {
    return logLevels[level] || logLevels.info;
  };

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-800 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center mb-3 sm:mb-0">
          <div className="p-2 bg-gray-700 rounded-lg mr-3">
            <FiClock className="text-blue-400" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="text-sm text-gray-400">Real-time application logs and monitoring</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-500" size={16} />
            </div>
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm w-40"
            />
          </div>

          <select
            value={logLevel}
            onChange={(e) => setLogLevel(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
          >
            <option value="all">All Levels</option>
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-lg ${isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            title={isPlaying ? 'Pause auto-scroll' : 'Play auto-scroll'}
          >
            {isPlaying ? <FiPause /> : <FiPlay />}
          </button>

          <button
            onClick={handleDownloadLogs}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
            title="Download logs"
          >
            <FiDownload />
          </button>

          <button
            onClick={handleClearLogs}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
            title="Clear logs"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      {/* Log Level Filters */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {Object.entries(logLevels).map(([level, { color }]) => (
            <button
              key={level}
              onClick={() => setLogLevel(logLevel === level ? 'all' : level)}
              className={`flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                logLevel === level
                  ? `${color} text-white`
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${color} mr-2`}></div>
              {level.toUpperCase()} ({displayLogs.filter(l => l.level === level).length})
            </button>
          ))}
        </div>
        <div className="text-sm text-gray-400">
          Showing {filteredLogs.length} of {displayLogs.length} logs
        </div>
      </div>

      {/* Logs Container */}
      <div className="h-[400px] overflow-y-auto bg-gray-950">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FiFilter size={48} className="mb-4" />
            <p className="text-lg">No logs match your filters</p>
            <p className="text-sm">Try changing your filter criteria</p>
          </div>
        ) : (
          <div className="p-4 font-mono text-sm">
            {filteredLogs.map((log) => {
              const { color, text } = getLogColor(log.level);
              return (
                <div
                  key={log.id}
                  className="py-2 px-3 border-l-4 hover:bg-gray-800 transition-colors"
                  style={{ borderLeftColor: color }}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-gray-500">{formatTimestamp(log.timestamp)}</span>
                    <span className={`px-2 py-0.5 rounded ${color} text-white text-xs`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                      {log.source}
                    </span>
                  </div>
                  <p className={`${text} break-words`}>{log.message}</p>
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span>Real-time: {realTime ? 'ON' : 'OFF'}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span>Auto-scroll: {isPlaying ? 'ON' : 'OFF'}</span>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default LogsViewer;