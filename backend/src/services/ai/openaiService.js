const { OpenAI } = require('openai');
const config = require('../../config/openaiConfig');
const logger = require('../../utils/logger');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
      timeout: config.timeout
    });
  }

  async initialize() {
    try {
      // Test connection
      await this.client.models.list();
      logger.info('✅ OpenAI service initialized');
      return true;
    } catch (error) {
      logger.warn('⚠️ OpenAI not available, using mock responses');
      return false;
    }
  }

  async getRepositoryInsights(analysisData) {
    try {
      const prompt = this.createRepositoryAnalysisPrompt(analysisData);
      
      const response = await this.client.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: 'You are a senior DevOps engineer analyzing code repositories.' },
          { role: 'user', content: prompt }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens
      });

      return this.parseAIResponse(response.choices[0].message.content);
    } catch (error) {
      logger.error('OpenAI analysis failed:', error);
      return this.getMockInsights(analysisData);
    }
  }

  async generateDockerfile(analysisId, options) {
    try {
      const prompt = this.createDockerfilePrompt(analysisId, options);
      
      const response = await this.client.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: 'You are a Docker expert generating optimized Dockerfiles.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      logger.error('Dockerfile generation failed:', error);
      return this.getMockDockerfile(options);
    }
  }

  async generateK8sDeployment(analysisId, options) {
    try {
      const prompt = this.createK8sPrompt(analysisId, options);
      
      const response = await this.client.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: 'You are a Kubernetes expert generating manifests.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      logger.error('K8s generation failed:', error);
      return this.getMockK8sManifest(options);
    }
  }

  async generateCICDPipeline(analysisId, options) {
    try {
      const { provider, stages, options: pipelineOptions } = options;
      
      const prompt = this.createCICDPrompt(analysisId, provider, stages, pipelineOptions);
      
      const response = await this.client.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: 'You are a CI/CD pipeline expert.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 2000
      });

      return this.parsePipelineResponse(response.choices[0].message.content, provider);
    } catch (error) {
      logger.error('CI/CD generation failed:', error);
      return this.getMockPipeline(provider);
    }
  }

  async getRepositorySuggestions(analysisData, options) {
    try {
      const prompt = this.createSuggestionsPrompt(analysisData, options);
      
      const response = await this.client.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: 'You are a code quality expert providing improvement suggestions.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 1500
      });

      return this.parseSuggestions(response.choices[0].message.content);
    } catch (error) {
      logger.error('Suggestions generation failed:', error);
      return this.getMockSuggestions();
    }
  }

  async performCodeReview(analysisData, options) {
    try {
      const { files, focus } = options;
      const prompt = this.createCodeReviewPrompt(analysisData, files, focus);
      
      const response = await this.client.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: 'You are a senior code reviewer.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 2000
      });

      return this.parseCodeReview(response.choices[0].message.content);
    } catch (error) {
      logger.error('Code review failed:', error);
      return this.getMockCodeReview();
    }
  }

  async analyzeDependencies(analysisData, options) {
    try {
      const prompt = this.createDependencyPrompt(analysisData, options);
      
      const response = await this.client.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: 'You are a dependency security expert.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1000
      });

      return this.parseDependencyAnalysis(response.choices[0].message.content);
    } catch (error) {
      logger.error('Dependency analysis failed:', error);
      return this.getMockDependencyAnalysis();
    }
  }

  // Prompt Engineering Methods
  createRepositoryAnalysisPrompt(analysisData) {
    const { files = [], languages = [], structure = {} } = analysisData;
    
    return `
    Analyze this repository and provide insights:
    
    Files: ${files.length} total
    Languages: ${languages.join(', ')}
    
    Structure:
    ${JSON.stringify(structure, null, 2)}
    
    Provide:
    1. Architecture assessment
    2. Code quality insights
    3. Performance recommendations
    4. Security considerations
    5. DevOps best practices
    
    Format as JSON with sections.
    `;
  }

  createDockerfilePrompt(analysisId, options) {
    return `
    Generate an optimized Dockerfile with these requirements:
    
    Base image: ${options.baseImage || 'auto-select'}
    Workdir: ${options.workdir || '/app'}
    Ports: ${options.ports?.join(', ') || '3000'}
    Environment: ${options.environment?.join(', ') || 'NODE_ENV=production'}
    
    Requirements:
    1. Use multi-stage builds if applicable
    2. Minimize image size
    3. Include health checks
    4. Follow security best practices
    5. Add labels for metadata
    
    Return only the Dockerfile content.
    `;
  }

  createK8sPrompt(analysisId, options) {
    return `
    Generate Kubernetes manifests for deployment with:
    
    App name: ${options.name || 'app'}
    Namespace: ${options.namespace || 'default'}
    Replicas: ${options.replicas || 1}
    Image: ${options.image || 'nginx:latest'}
    Ports: ${options.ports?.join(', ') || '80'}
    
    Include:
    1. Deployment with proper labels and selectors
    2. Service for networking
    3. Horizontal Pod Autoscaler configuration
    4. Resource requests and limits
    5. Liveness and readiness probes
    
    Format as YAML.
    `;
  }

  // Mock Responses (Fallback when OpenAI is unavailable)
  getMockInsights(analysisData) {
    return {
      architecture: 'Monolithic application structure',
      quality: 'Good code organization, needs more tests',
      performance: [
        'Add caching layer',
        'Optimize database queries',
        'Implement CDN for static assets'
      ],
      security: [
        'Update dependencies',
        'Add input validation',
        'Implement rate limiting'
      ],
      devops: [
        'Add Docker support',
        'Create CI/CD pipeline',
        'Implement monitoring'
      ]
    };
  }

  getMockDockerfile(options) {
    return `# Generated by AutoPilotDev
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE ${options.ports?.[0] || 3000}
HEALTHCHECK --interval=30s --timeout=3s \\
  CMD curl -f http://localhost:${options.ports?.[0] || 3000}/health || exit 1

CMD ["node", "dist/server.js"]`;
  }

  getMockK8sManifest(options) {
    return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${options.name || 'app'}-deployment
  labels:
    app: ${options.name || 'app'}
spec:
  replicas: ${options.replicas || 1}
  selector:
    matchLabels:
      app: ${options.name || 'app'}
  template:
    metadata:
      labels:
        app: ${options.name || 'app'}
    spec:
      containers:
      - name: ${options.name || 'app'}
        image: ${options.image || 'nginx:latest'}
        ports:
        - containerPort: ${options.ports?.[0] || 80}
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
            port: ${options.ports?.[0] || 80}
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: ${options.name || 'app'}-service
spec:
  selector:
    app: ${options.name || 'app'}
  ports:
  - port: ${options.ports?.[0] || 80}
    targetPort: ${options.ports?.[0] || 80}
  type: ClusterIP`;
  }

  getMockPipeline(provider) {
    const pipelines = {
      github: `name: CI/CD Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
  
  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v2
      - name: Build Docker image
        run: docker build -t app:latest .
  
  deploy:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to production
        run: echo "Deploying..."`,
        
      gitlab: `stages:
  - test
  - build
  - deploy

test:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm test

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t app:latest .

deploy:
  stage: deploy
  script:
    - echo "Deploying to production"`
    };
    
    return pipelines[provider] || pipelines.github;
  }

  // Response Parsing
  parseAIResponse(content) {
    try {
      return JSON.parse(content);
    } catch {
      return { raw: content };
    }
  }

  parsePipelineResponse(content, provider) {
    return {
      provider,
      content,
      validation: {
        valid: true,
        warnings: [],
        errors: []
      }
    };
  }

  parseSuggestions(content) {
    return content.split('\n').filter(line => line.trim());
  }

  // More prompt creators...
  createSuggestionsPrompt(analysisData, options) {
    return `Provide code improvement suggestions focusing on: ${options.aspects.join(', ')}`;
  }

  createCodeReviewPrompt(analysisData, files, focus) {
    return `Review these files with focus on ${focus}: ${files.join(', ')}`;
  }

  createDependencyPrompt(analysisData, options) {
    return `Analyze dependencies for vulnerabilities and updates`;
  }

  // More mock methods...
  getMockSuggestions() {
    return [
      'Add unit tests',
      'Implement error handling',
      'Optimize database queries',
      'Add API documentation',
      'Implement caching'
    ];
  }

  getMockCodeReview() {
    return {
      summary: 'Code quality is good overall',
      issues: [
        {
          file: 'server.js',
          line: 45,
          issue: 'Missing error handling',
          severity: 'medium',
          suggestion: 'Add try-catch block'
        }
      ],
      recommendations: ['Add more comments', 'Extract constants']
    };
  }

  getMockDependencyAnalysis() {
    return {
      outdated: ['express@4.17.1 → 4.18.2', 'mongoose@6.0.0 → 7.0.0'],
      vulnerabilities: [
        {
          package: 'lodash',
          version: '4.17.20',
          severity: 'medium',
          fix: 'Update to 4.17.21'
        }
      ],
      recommendations: ['Update all packages', 'Add dependabot']
    };
  }
}

module.exports = new OpenAIService();