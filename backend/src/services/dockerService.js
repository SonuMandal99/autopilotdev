const Docker = require('dockerode');
const logger = require('../utils/logger');

class DockerService {
  constructor() {
    this.docker = new Docker();
    this.connected = false;
  }

  async initialize() {
    try {
      await this.docker.ping();
      this.connected = true;
      logger.info('✅ Docker service connected');
      return true;
    } catch (error) {
      logger.warn('⚠️ Docker not available, using mock operations');
      this.connected = false;
      return false;
    }
  }

  async listContainers(options = {}) {
    if (!this.connected) {
      return this.mockListContainers(options);
    }

    try {
      const containers = await this.docker.listContainers({
        all: options.all || false,
        limit: options.limit || 10
      });

      return containers.map(container => ({
        id: container.Id.substring(0, 12),
        name: container.Names[0].replace('/', ''),
        image: container.Image,
        status: container.State,
        ports: container.Ports,
        created: new Date(container.Created * 1000).toISOString()
      }));
    } catch (error) {
      logger.error('List containers failed:', error);
      throw error;
    }
  }

  async listImages(options = {}) {
    if (!this.connected) {
      return this.mockListImages(options);
    }

    try {
      const images = await this.docker.listImages({
        all: options.all || false
      });

      return images.map(image => ({
        id: image.Id.substring(7, 19),
        tags: image.RepoTags || [],
        size: this.formatBytes(image.Size),
        created: new Date(image.Created * 1000).toISOString()
      }));
    } catch (error) {
      logger.error('List images failed:', error);
      throw error;
    }
  }

  async runContainer(config) {
    if (!this.connected) {
      return this.mockRunContainer(config);
    }

    try {
      const container = await this.docker.createContainer({
        Image: config.image,
        name: config.name || `container_${Date.now()}`,
        Env: config.environment || [],
        HostConfig: {
          PortBindings: this.createPortBindings(config.ports || []),
          Binds: config.volumes || []
        },
        Cmd: config.command || []
      });

      await container.start();

      return {
        id: container.id.substring(0, 12),
        name: (await container.inspect()).Name.replace('/', ''),
        status: 'running'
      };
    } catch (error) {
      logger.error('Run container failed:', error);
      throw error;
    }
  }

  async buildImage(context, options) {
    if (!this.connected) {
      return this.mockBuildImage(options);
    }

    try {
      const stream = await this.docker.buildImage({
        context: context,
        src: ['Dockerfile', '.']
      }, {
        t: options.tags || ['latest'],
        buildargs: options.buildArgs || {},
        dockerfile: options.dockerfile || 'Dockerfile'
      });

      return new Promise((resolve, reject) => {
        this.docker.modem.followProgress(stream, (err, res) => {
          if (err) reject(err);
          else resolve(res);
        });
      });
    } catch (error) {
      logger.error('Build image failed:', error);
      throw error;
    }
  }

  async getContainerLogs(containerId, options = {}) {
    if (!this.connected) {
      return this.mockGetContainerLogs(containerId, options);
    }

    try {
      const container = this.docker.getContainer(containerId);
      const logs = await container.logs({
        stdout: options.stdout !== false,
        stderr: options.stderr !== false,
        tail: options.tail || 100,
        timestamps: options.timestamps || false,
        follow: options.follow || false
      });

      return logs.toString();
    } catch (error) {
      logger.error('Get container logs failed:', error);
      throw error;
    }
  }

  async stopContainer(containerId) {
    if (!this.connected) {
      return this.mockStopContainer(containerId);
    }

    try {
      const container = this.docker.getContainer(containerId);
      await container.stop();
      return { success: true, message: 'Container stopped' };
    } catch (error) {
      logger.error('Stop container failed:', error);
      throw error;
    }
  }

  async removeContainer(containerId, options = {}) {
    if (!this.connected) {
      return this.mockRemoveContainer(containerId, options);
    }

    try {
      const container = this.docker.getContainer(containerId);
      await container.remove({
        force: options.force || false,
        v: options.removeVolumes || false
      });
      return { success: true, message: 'Container removed' };
    } catch (error) {
      logger.error('Remove container failed:', error);
      throw error;
    }
  }

  async inspectContainer(containerId) {
    if (!this.connected) {
      return this.mockInspectContainer(containerId);
    }

    try {
      const container = this.docker.getContainer(containerId);
      return await container.inspect();
    } catch (error) {
      logger.error('Inspect container failed:', error);
      throw error;
    }
  }

  // Helper Methods
  createPortBindings(ports) {
    const bindings = {};
    
    ports.forEach(port => {
      const [host, container] = port.split(':');
      bindings[`${container}/tcp`] = [{ HostPort: host }];
    });
    
    return bindings;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Mock Methods for when Docker is not available
  mockListContainers(options) {
    return [
      {
        id: 'abc123def456',
        name: 'web-app',
        image: 'nginx:latest',
        status: 'running',
        ports: [{ PublicPort: 8080, PrivatePort: 80 }],
        created: new Date().toISOString()
      },
      {
        id: 'def789ghi012',
        name: 'api-server',
        image: 'node:18-alpine',
        status: 'exited',
        ports: [{ PublicPort: 3000, PrivatePort: 3000 }],
        created: new Date(Date.now() - 86400000).toISOString()
      }
    ].slice(0, options.limit || 10);
  }

  mockListImages(options) {
    return [
      {
        id: 'sha256:abc123',
        tags: ['nginx:latest', 'nginx:1.21'],
        size: '133MB',
        created: new Date().toISOString()
      },
      {
        id: 'sha256:def456',
        tags: ['node:18-alpine'],
        size: '178MB',
        created: new Date(Date.now() - 86400000).toISOString()
      }
    ];
  }

  mockRunContainer(config) {
    return {
      id: 'mock_' + Date.now().toString(36),
      name: config.name || 'mock-container',
      status: 'running'
    };
  }

  mockBuildImage(options) {
    return {
      stream: 'Mock build output...',
      imageId: 'mock_image_' + Date.now().toString(36),
      tags: options.tags || ['latest']
    };
  }

  mockGetContainerLogs(containerId, options) {
    const logs = [
      `Starting container ${containerId}...`,
      'Server listening on port 3000',
      'Database connection established',
      'Application initialized',
      'Ready to serve requests'
    ];
    
    return logs.slice(-(options.tail || 100)).join('\n');
  }

  mockStopContainer(containerId) {
    return { success: true, message: `Mock stopped container ${containerId}` };
  }

  mockRemoveContainer(containerId, options) {
    return { success: true, message: `Mock removed container ${containerId}` };
  }

  mockInspectContainer(containerId) {
    return {
      Id: containerId,
      Name: '/mock-container',
      State: {
        Status: 'running',
        Running: true,
        StartedAt: new Date().toISOString()
      },
      Config: {
        Image: 'nginx:latest',
        Env: ['NODE_ENV=production']
      },
      NetworkSettings: {
        Ports: {
          '80/tcp': [{ HostPort: '8080' }]
        }
      }
    };
  }
}

module.exports = new DockerService();