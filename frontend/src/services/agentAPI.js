import { apiHelper } from './api';

// AI Agent API endpoints
export const agentAPI = {
  // Repository Analysis
  async analyzeRepository(repoData) {
    return apiHelper.post('/analyze/repository', repoData);
  },

  async getRepositoryAnalysis(analysisId) {
    return apiHelper.get(`/analyze/${analysisId}`);
  },

  async listRepositoryAnalyses(limit = 10, offset = 0) {
    return apiHelper.get('/analyze/list', { limit, offset });
  },

  // Code Generation
  async generateCode(prompt, language = 'javascript', context = {}) {
    return apiHelper.post('/generate/code', {
      prompt,
      language,
      context,
      timestamp: new Date().toISOString(),
    });
  },

  async generateDockerfile(repoAnalysisId, options = {}) {
    return apiHelper.post('/generate/dockerfile', {
      analysisId: repoAnalysisId,
      options,
    });
  },

  async generateKubernetesConfig(repoAnalysisId, options = {}) {
    return apiHelper.post('/generate/kubernetes', {
      analysisId: repoAnalysisId,
      options,
    });
  },

  async generateCICDConfig(repoAnalysisId, provider = 'github', options = {}) {
    return apiHelper.post('/generate/cicd', {
      analysisId: repoAnalysisId,
      provider,
      options,
    });
  },

  // AI Chat/Completion
  async chatCompletion(messages, options = {}) {
    return apiHelper.post('/ai/chat', {
      messages,
      options: {
        model: options.model || 'gpt-4',
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
        ...options,
      },
    });
  },

  async codeCompletion(prompt, language, context = {}) {
    return apiHelper.post('/ai/completion/code', {
      prompt,
      language,
      context,
    });
  },

  async explainCode(code, language) {
    return apiHelper.post('/ai/explain', {
      code,
      language,
    });
  },

  async refactorCode(code, language, improvements = []) {
    return apiHelper.post('/ai/refactor', {
      code,
      language,
      improvements,
    });
  },

  async debugCode(code, language, error) {
    return apiHelper.post('/ai/debug', {
      code,
      language,
      error,
    });
  },

  // DevOps Operations
  async deployApplication(deploymentConfig) {
    return apiHelper.post('/deploy', deploymentConfig);
  },

  async getDeploymentStatus(deploymentId) {
    return apiHelper.get(`/deploy/${deploymentId}/status`);
  },

  async listDeployments(limit = 20, offset = 0) {
    return apiHelper.get('/deploy/list', { limit, offset });
  },

  async stopDeployment(deploymentId) {
    return apiHelper.post(`/deploy/${deploymentId}/stop`);
  },

  async getDeploymentLogs(deploymentId, lines = 100) {
    return apiHelper.get(`/deploy/${deploymentId}/logs`, { lines });
  },

  // File Operations
  async saveGeneratedFile(filename, content, type = 'code') {
    return apiHelper.post('/files/save', {
      filename,
      content,
      type,
    });
  },

  async getGeneratedFiles(limit = 20, offset = 0) {
    return apiHelper.get('/files/list', { limit, offset });
  },

  async deleteGeneratedFile(fileId) {
    return apiHelper.delete(`/files/${fileId}`);
  },

  // Configuration Management
  async saveConfiguration(configName, configData) {
    return apiHelper.post('/config/save', {
      name: configName,
      data: configData,
    });
  },

  async getConfiguration(configName) {
    return apiHelper.get(`/config/${configName}`);
  },

  async listConfigurations() {
    return apiHelper.get('/config/list');
  },

  // Templates
  async getTemplates(category = null) {
    return apiHelper.get('/templates', { category });
  },

  async applyTemplate(templateId, variables = {}) {
    return apiHelper.post(`/templates/${templateId}/apply`, { variables });
  },

  // Monitoring and Analytics
  async getSystemMetrics(timeRange = '1h') {
    return apiHelper.get('/monitoring/metrics', { timeRange });
  },

  async getAIOperationsStats() {
    return apiHelper.get('/analytics/ai-ops');
  },

  async getUserActivity() {
    return apiHelper.get('/analytics/user-activity');
  },

  // Real-time Operations (WebSocket/SSE)
  async subscribeToDeploymentUpdates(deploymentId, callback) {
    // This would typically use WebSocket or Server-Sent Events
    // For now, implement polling
    const poll = async () => {
      try {
        const status = await this.getDeploymentStatus(deploymentId);
        callback(status);
      } catch (error) {
        console.error('Error polling deployment status:', error);
      }
    };

    // Poll every 5 seconds
    const intervalId = setInterval(poll, 5000);
    
    // Return cleanup function
    return () => clearInterval(intervalId);
  },

  async streamAIChat(messages, onChunk, onComplete, onError) {
    // Simulate streaming for now
    try {
      const response = await this.chatCompletion(messages);
      // Simulate chunked response
      const words = response.message.split(' ');
      for (let i = 0; i < words.length; i++) {
        setTimeout(() => {
          onChunk(words[i] + ' ');
          if (i === words.length - 1) {
            onComplete();
          }
        }, i * 50);
      }
    } catch (error) {
      onError(error);
    }
  },

  // Batch Operations
  async batchGenerate(files, options = {}) {
    return apiHelper.post('/batch/generate', {
      files,
      options,
    });
  },

  async batchDeploy(deployments, options = {}) {
    return apiHelper.post('/batch/deploy', {
      deployments,
      options,
    });
  },

  // Utility Functions
  async validateRepositoryUrl(url) {
    return apiHelper.post('/validate/repo-url', { url });
  },

  async testAPIConnection(service) {
    return apiHelper.post('/test/connection', { service });
  },

  async getServiceStatus() {
    return apiHelper.get('/status');
  },

  // Export/Import
  async exportProject(projectId, format = 'json') {
    return apiHelper.post(`/export/${projectId}`, { format });
  },

  async importProject(projectData) {
    return apiHelper.post('/import', projectData);
  },

  // Error handling helpers
  handleAIError(error) {
    const defaultMessage = 'AI service is temporarily unavailable. Please try again later.';
    
    if (error.code === 'RATE_LIMIT') {
      return {
        message: 'Rate limit exceeded. Please wait before making more requests.',
        retryAfter: error.retryAfter || 60,
      };
    } else if (error.code === 'MODEL_OVERLOAD') {
      return {
        message: 'AI model is currently overloaded. Please try again in a few moments.',
      };
    } else if (error.code === 'INVALID_REQUEST') {
      return {
        message: 'Invalid request. Please check your input and try again.',
      };
    } else {
      return {
        message: error.message || defaultMessage,
      };
    }
  },

  // Format AI response
  formatAIResponse(response, type = 'code') {
    switch (type) {
      case 'code':
        return {
          code: response.code || response.content || '',
          language: response.language || 'text',
          explanation: response.explanation || '',
          suggestions: response.suggestions || [],
        };
      case 'analysis':
        return {
          summary: response.summary || {},
          recommendations: response.recommendations || [],
          files: response.files || [],
          metrics: response.metrics || {},
        };
      case 'chat':
        return {
          message: response.message || '',
          role: response.role || 'assistant',
          timestamp: response.timestamp || new Date().toISOString(),
        };
      default:
        return response;
    }
  },
};

export default agentAPI;