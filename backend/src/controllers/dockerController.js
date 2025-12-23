const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const AIService = require('../services/ai/openaiService');

class DockerController {
  constructor() {
    this.docker = new Docker();
  }

  async generateDockerfile(req, res) {
    try {
      const { analysisId, options = {} } = req.body;
      
      // Get AI-generated Dockerfile
      const dockerfile = await AIService.generateDockerfile(analysisId, options);
      
      res.json({
        success: true,
        data: {
          dockerfile,
          filename: 'Dockerfile',
          language: 'dockerfile'
        }
      });
    } catch (error) {
      logger.error('Dockerfile generation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate Dockerfile'
      });
    }
  }

  async validateDockerfile(req, res) {
    try {
      const { dockerfile } = req.body;
      
      const issues = [];
      const warnings = [];
      
      // Basic validation rules
      const lines = dockerfile.split('\n');
      
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('FROM')) {
          if (!trimmed.includes(':')) {
            warnings.push(`Line ${index + 1}: Consider specifying a tag in FROM instruction`);
          }
        }
        
        if (trimmed.startsWith('RUN') && trimmed.includes('apt-get')) {
          if (!trimmed.includes('clean')) {
            warnings.push(`Line ${index + 1}: Add 'apt-get clean' to reduce image size`);
          }
        }
        
        if (trimmed.startsWith('COPY') && trimmed.includes('*')) {
          warnings.push(`Line ${index + 1}: Consider using .dockerignore with COPY *`);
        }
      });
      
      // Check for exposed ports
      const hasExpose = lines.some(line => line.trim().startsWith('EXPOSE'));
      if (!hasExpose) {
        warnings.push('No EXPOSE instruction found');
      }
      
      // Check for WORKDIR
      const hasWorkdir = lines.some(line => line.trim().startsWith('WORKDIR'));
      if (!hasWorkdir) {
        warnings.push('Consider adding WORKDIR instruction');
      }
      
      res.json({
        success: true,
        data: {
          valid: issues.length === 0,
          issues,
          warnings,
          lineCount: lines.length
        }
      });
    } catch (error) {
      logger.error('Dockerfile validation failed:', error);
      res.status(400).json({
        success: false,
        error: 'Validation failed'
      });
    }
  }

  async generateComposeFile(req, res) {
    try {
      const { services, version = '3.8', networks = {}, volumes = {} } = req.body;
      
      const composeConfig = {
        version,
        services: {},
        networks,
        volumes
      };
      
      services.forEach(service => {
        composeConfig.services[service.name] = {
          image: service.image || `${service.name}:latest`,
          build: service.build || undefined,
          ports: service.ports || [],
          environment: service.environment || [],
          depends_on: service.depends_on || [],
          volumes: service.volumes || []
        };
      });
      
      res.json({
        success: true,
        data: {
          config: composeConfig,
          yaml: this.objectToYaml(composeConfig)
        }
      });
    } catch (error) {
      logger.error('Compose generation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate compose file'
      });
    }
  }

  async buildImage(req, res) {
    try {
      const { dockerfile, imageName, tags = ['latest'], buildArgs = {} } = req.body;
      const buildId = `build_${Date.now()}`;
      
      // Create temp directory for build context
      const tempDir = path.join(__dirname, '../../temp', buildId);
      fs.mkdirSync(tempDir, { recursive: true });
      
      // Save Dockerfile
      fs.writeFileSync(path.join(tempDir, 'Dockerfile'), dockerfile);
      
      // Start build
      const stream = await this.docker.buildImage({
        context: tempDir,
        src: ['.']
      }, {
        t: tags.map(tag => `${imageName}:${tag}`),
        buildargs: buildArgs
      });
      
      // Clean up temp directory after build
      setTimeout(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }, 60000);
      
      res.json({
        success: true,
        data: {
          buildId,
          imageName,
          tags,
          status: 'building'
        }
      });
    } catch (error) {
      logger.error('Image build failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to build image'
      });
    }
  }

  async listImages(req, res) {
    try {
      const images = await this.docker.listImages({ all: req.query.all === 'true' });
      
      const formattedImages = images.map(img => ({
        id: img.Id.substring(7, 19),
        tags: img.RepoTags || [],
        size: this.formatBytes(img.Size),
        created: new Date(img.Created * 1000).toISOString()
      }));
      
      res.json({
        success: true,
        data: formattedImages
      });
    } catch (error) {
      logger.error('List images failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list images'
      });
    }
  }

  async listContainers(req, res) {
    try {
      const containers = await this.docker.listContainers({
        all: req.query.all === 'true',
        limit: parseInt(req.query.limit) || 10
      });
      
      const formattedContainers = containers.map(container => ({
        id: container.Id.substring(0, 12),
        name: container.Names[0].replace('/', ''),
        image: container.Image,
        status: container.State,
        ports: container.Ports.map(p => `${p.PublicPort || ''}:${p.PrivatePort}`),
        created: new Date(container.Created * 1000).toISOString()
      }));
      
      res.json({
        success: true,
        data: formattedContainers
      });
    } catch (error) {
      logger.error('List containers failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list containers'
      });
    }
  }

  async runContainer(req, res) {
    try {
      const { image, name, ports = [], environment = [], volumes = [] } = req.body;
      
      const portBindings = {};
      ports.forEach(port => {
        const [host, container] = port.split(':');
        portBindings[`${container}/tcp`] = [{ HostPort: host }];
      });
      
      const container = await this.docker.createContainer({
        Image: image,
        name: name || `container_${Date.now()}`,
        Env: environment,
        HostConfig: {
          PortBindings: portBindings,
          Binds: volumes
        }
      });
      
      await container.start();
      
      res.json({
        success: true,
        data: {
          containerId: container.id.substring(0, 12),
          name: container.name,
          status: 'running'
        }
      });
    } catch (error) {
      logger.error('Run container failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to run container'
      });
    }
  }

  async getContainerLogs(req, res) {
    try {
      const { containerId } = req.params;
      const { tail = 100 } = req.query;
      
      const container = this.docker.getContainer(containerId);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: parseInt(tail),
        timestamps: true
      });
      
      res.json({
        success: true,
        data: {
          containerId,
          logs: logs.toString().split('\n')
        }
      });
    } catch (error) {
      logger.error('Get logs failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get container logs'
      });
    }
  }

  // Helper methods
  objectToYaml(obj) {
    const yaml = require('js-yaml');
    return yaml.dump(obj);
  }

  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  }

  // WebSocket methods
  async streamBuildLogs(buildId) {
    // Mock stream for demo
    const { Readable } = require('stream');
    const stream = new Readable({
      read() {
        const messages = [
          'Step 1/10 : FROM node:18-alpine',
          'Step 2/10 : WORKDIR /app',
          'Step 3/10 : COPY package*.json ./',
          'Step 4/10 : RUN npm ci --only=production',
          'Step 5/10 : COPY . .',
          'Step 6/10 : EXPOSE 3000',
          'Step 7/10 : CMD ["node", "server.js"]',
          'Build completed successfully'
        ];
        
        messages.forEach((msg, i) => {
          setTimeout(() => {
            this.push(msg + '\n');
            if (i === messages.length - 1) {
              this.push(null);
            }
          }, i * 1000);
        });
      }
    });
    
    return stream;
  }
}

module.exports = new DockerController();