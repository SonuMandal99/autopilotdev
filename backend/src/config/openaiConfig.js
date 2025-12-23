require('dotenv').config();

const openaiConfig = {
  // API Configuration
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION,
  
  // Model Configuration
  model: process.env.OPENAI_MODEL || 'gpt-4',
  maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 2048,
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
  topP: parseFloat(process.env.OPENAI_TOP_P) || 1,
  frequencyPenalty: parseFloat(process.env.OPENAI_FREQUENCY_PENALTY) || 0,
  presencePenalty: parseFloat(process.env.OPENAI_PRESENCE_PENALTY) || 0,
  
  // Request Configuration
  timeout: parseInt(process.env.OPENAI_TIMEOUT) || 30000, // 30 seconds
  maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES) || 3,
  
  // Rate Limiting
  requestsPerMinute: parseInt(process.env.OPENAI_RPM) || 60,
  tokensPerMinute: parseInt(process.env.OPENAI_TPM) || 60000,
  
  // Cost Management
  maxCostPerDay: parseFloat(process.env.OPENAI_MAX_COST_PER_DAY) || 10.0,
  costPerToken: {
    'gpt-4': 0.03 / 1000, // $0.03 per 1K tokens
    'gpt-4-32k': 0.06 / 1000,
    'gpt-3.5-turbo': 0.002 / 1000,
    'gpt-3.5-turbo-16k': 0.004 / 1000
  },
  
  // Prompt Templates
  templates: {
    codeReview: `You are a senior software engineer reviewing code. Analyze the provided code for:
1. Code quality and best practices
2. Performance optimizations
3. Security vulnerabilities
4. Error handling
5. Documentation

Provide specific recommendations for improvement.`,
    
    dockerGeneration: `You are a Docker expert. Generate an optimized Dockerfile with:
1. Multi-stage builds for minimal image size
2. Security best practices (non-root user, minimal layers)
3. Health checks
4. Proper labeling
5. Environment configuration

Return only the Dockerfile content.`,
    
    kubernetesGeneration: `You are a Kubernetes expert. Generate Kubernetes manifests including:
1. Deployment with proper labels and selectors
2. Service for networking
3. ConfigMaps and Secrets
4. Resource requests and limits
5. Liveness and readiness probes

Format as YAML.`,
    
    cicdGeneration: `You are a CI/CD pipeline expert. Generate pipeline configuration for:
1. Build stage (dependency installation, compilation)
2. Test stage (unit tests, integration tests)
3. Security scan (dependencies, container)
4. Deployment stage (to staging/production)
5. Rollback strategy

Include best practices for caching and optimization.`
  },
  
  // Response Parsing
  responseParsers: {
    json: (response) => {
      try {
        return JSON.parse(response);
      } catch (error) {
        return { raw: response };
      }
    },
    
    yaml: (response) => {
      const yaml = require('js-yaml');
      try {
        return yaml.load(response);
      } catch (error) {
        return response;
      }
    },
    
    markdown: (response) => {
      return response.split('\n').filter(line => line.trim());
    }
  },
  
  // Error Handling
  errorMessages: {
    rateLimit: 'Rate limit exceeded. Please try again in a few moments.',
    modelOverload: 'AI service is currently overloaded. Please try again later.',
    invalidRequest: 'Invalid request. Please check your input.',
    apiError: 'AI service error. Please try again.',
    timeout: 'Request timed out. Please try again.'
  },
  
  // Feature Flags
  features: {
    enableCodeReview: process.env.ENABLE_CODE_REVIEW !== 'false',
    enableDockerGeneration: process.env.ENABLE_DOCKER_GENERATION !== 'false',
    enableK8sGeneration: process.env.ENABLE_K8S_GENERATION !== 'false',
    enableCICDGeneration: process.env.ENABLE_CICD_GENERATION !== 'false',
    enableChat: process.env.ENABLE_CHAT !== 'false'
  },
  
  // Validation
  validateConfig: function() {
    const errors = [];
    
    if (!this.apiKey) {
      errors.push('OPENAI_API_KEY is required');
    }
    
    if (this.maxTokens < 1 || this.maxTokens > 8000) {
      errors.push('OPENAI_MAX_TOKENS must be between 1 and 8000');
    }
    
    if (this.temperature < 0 || this.temperature > 2) {
      errors.push('OPENAI_TEMPERATURE must be between 0 and 2');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },
  
  // Helper Methods
  calculateCost: function(model, tokens) {
    const costPerToken = this.costPerToken[model] || this.costPerToken['gpt-3.5-turbo'];
    return (tokens * costPerToken).toFixed(4);
  },
  
  getAvailableModels: function() {
    return Object.keys(this.costPerToken);
  },
  
  isModelAvailable: function(model) {
    return this.getAvailableModels().includes(model);
  }
};

// Export configuration
module.exports = openaiConfig;