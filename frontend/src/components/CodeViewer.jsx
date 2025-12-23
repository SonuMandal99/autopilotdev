import React, { useState } from 'react';
import { FiCopy, FiDownload, FiMaximize2, FiMinimize2, FiCode, FiFileText } from 'react-icons/fi';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'react-toastify';

const CodeViewer = ({ 
  code, 
  language = 'javascript', 
  filename = 'code.js',
  title = 'Code Preview',
  showLineNumbers = true,
  readOnly = false,
  onSave = null
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedCode, setEditedCode] = useState(code);

  const fileExtensions = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    html: 'html',
    css: 'css',
    json: 'json',
    yaml: 'yaml',
    dockerfile: 'Dockerfile',
    bash: 'sh',
    markdown: 'md',
  };

  const getFileIcon = (lang) => {
    const icons = {
      javascript: '🟨',
      typescript: '🔷',
      python: '🐍',
      java: '☕',
      html: '🌐',
      css: '🎨',
      json: '📊',
      yaml: '⚙️',
      dockerfile: '🐳',
      bash: '💻',
      markdown: '📝',
    };
    return icons[lang] || '📄';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
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

  const handleSave = () => {
    if (onSave) {
      onSave(editedCode);
      toast.success('Code saved successfully!');
      setEditMode(false);
    }
  };

  const handleMaximize = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`
      bg-gray-900 rounded-xl shadow-lg border border-gray-700 overflow-hidden
      ${isFullscreen ? 'fixed inset-0 z-50 m-4' : 'relative'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <span className="text-xl mr-2">{getFileIcon(language)}</span>
            <div>
              <div className="flex items-center">
                <FiFileText className="text-blue-400 mr-2" />
                <span className="font-mono text-sm text-white">{filename}</span>
                <span className="ml-2 px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">
                  {fileExtensions[language] || language}
                </span>
              </div>
              <p className="text-xs text-gray-400">{title}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {!readOnly && (
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-3 py-1 rounded text-sm ${editMode ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              {editMode ? 'Preview' : 'Edit'}
            </button>
          )}
          
          <button
            onClick={handleCopy}
            className="flex items-center px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            title="Copy to clipboard"
          >
            <FiCopy className="mr-1" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          
          <button
            onClick={handleDownload}
            className="flex items-center px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            title="Download file"
          >
            <FiDownload className="mr-1" />
            Download
          </button>
          
          {onSave && editMode && (
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
            >
              Save
            </button>
          )}
          
          <button
            onClick={handleMaximize}
            className="flex items-center px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div className="relative">
        {editMode ? (
          <textarea
            value={editedCode}
            onChange={(e) => setEditedCode(e.target.value)}
            className="w-full h-[500px] bg-gray-900 text-gray-100 font-mono p-4 outline-none resize-none"
            spellCheck="false"
          />
        ) : (
          <div className="overflow-auto max-h-[500px]">
            <SyntaxHighlighter
              language={language}
              style={vscDarkPlus}
              showLineNumbers={showLineNumbers}
              lineNumberStyle={{ color: '#6b7280', minWidth: '3em' }}
              customStyle={{
                margin: 0,
                padding: '1rem',
                background: 'transparent',
                fontSize: '14px',
              }}
              lineProps={{
                style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' }
              }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        )}
      </div>

      {/* Footer - Stats */}
      <div className="bg-gray-800 px-4 py-2 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <FiCode className="mr-2" />
              <span>{language.toUpperCase()}</span>
            </div>
            <div>
              <span>Lines: {code.split('\n').length}</span>
            </div>
            <div>
              <span>Chars: {code.length}</span>
            </div>
          </div>
          <div className="text-xs">
            {isFullscreen ? 'Press ESC or click minimize to exit fullscreen' : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeViewer;