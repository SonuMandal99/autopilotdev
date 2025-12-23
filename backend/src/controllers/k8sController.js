const k8s = require('@kubernetes/client-node');
const logger = require('../utils/logger');
const AIService = require('../services/ai/openaiService');

class K8sController {
  constructor() {
    this.kc = new k8s.KubeConfig();
    this.kc.loadFromDefault();
    this.k8sApi = this.kc.makeApiClient(k8s.CoreV1Api);
    this.appsApi = this.kc.makeApiClient(k8s.AppsV1Api);
  }

  async generateManifests(req, res) {
    try {
      const { analysisId, type = 'all', options = {} } = req.body;
      
      const manifests = {};
      
      if (type === 'deployment' || type === 'all') {
        manifests.deployment = await this.generateDeployment(analysisId, options);
      }
      
      if (type === 'service' || type === 'all') {
        manifests.service = await this.generateService(analysisId, options);
      }
      
      if (type === 'ingress' || type === 'all') {
        manifests.ingress = await this.generateIngress(analysisId, options);
      }
      
      res.json({
        success: true,
        data: {
          manifests,
          yaml: this.manifestsToYaml(manifests)
        }
      });
    } catch (error) {
      logger.error('K8s manifest generation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate manifests'
      });
    }
  }

  async deployToCluster(req, res) {
    try {
      const { manifests, namespace = 'default', dryRun = false } = req.body;
      const deploymentId = `deploy_${Date.now()}`;
      
      // Simulate deployment
      const results = [];
      
      for (const [type, manifest] of Object.entries(manifests)) {
        if (dryRun) {
          results.push({
            type,
            status: 'dry-run-success',
            message: `Validated ${type} manifest`
          });
        } else {
          results.push({
            type,
            status: 'deployed',
            message: `Created ${type} in namespace ${namespace}`
          });
        }
      }
      
      res.json({
        success: true,
        data: {
          deploymentId,
          namespace,
          results,
          status: dryRun ? 'validated' : 'deployed'
        }
      });
    } catch (error) {
      logger.error('K8s deployment failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to deploy to cluster'
      });
    }
  }

  async listDeployments(req, res) {
    try {
      const { namespace = 'default', limit = 10 } = req.query;
      
      // Mock deployments for demo
      const deployments = [
        {
          name: 'api-deployment',
          namespace,
          replicas: 3,
          available: 3,
          age: '2d',
          status: 'Running'
        },
        {
          name: 'web-deployment',
          namespace,
          replicas: 2,
          available: 2,
          age: '1d',
          status: 'Running'
        }
      ];
      
      res.json({
        success: true,
        data: deployments.slice(0, limit)
      });
    } catch (error) {
      logger.error('List deployments failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list deployments'
      });
    }
  }

  async listPods(req, res) {
    try {
      const { namespace = 'default', limit = 10 } = req.query;
      
      // Mock pods for demo
      const pods = [
        {
          name: 'api-deployment-abc123',
          namespace,
          status: 'Running',
          restarts: 0,
          age: '2d',
          node: 'node-1'
        },
        {
          name: 'web-deployment-xyz789',
          namespace,
          status: 'Running',
          restarts: 1,
          age: '1d',
          node: 'node-2'
        }
      ];
      
      res.json({
        success: true,
        data: pods.slice(0, limit)
      });
    } catch (error) {
      logger.error('List pods failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list pods'
      });
    }
  }

  async getPodLogs(req, res) {
    try {
      const { name } = req.params;
      const { namespace = 'default', tailLines = 100 } = req.query;
      
      // Mock logs for demo
      const logs = [
        `Starting ${name}...`,
        'Server listening on port 3000',
        'Database connection established',
        'Health check passed',
        'Ready to serve requests'
      ];
      
      res.json({
        success: true,
        data: {
          pod: name,
          namespace,
          logs: logs.slice(-tailLines)
        }
      });
    } catch (error) {
      logger.error('Get pod logs failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get pod logs'
      });
    }
  }

  async scaleDeployment(req, res) {
    try {
      const { name } = req.params;
      const { replicas } = req.body;
      const { namespace = 'default' } = req.query;
      
      res.json({
        success: true,
        data: {
          deployment: name,
          namespace,
          replicas: parseInt(replicas),
          status: 'scaled'
        }
      });
    } catch (error) {
      logger.error('Scale deployment failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to scale deployment'
      });
    }
  }

  async getClusterHealth(req, res) {
    try {
      res.json({
        success: true,
        data: {
          status: 'healthy',
          nodes: 3,
          pods: {
            total: 15,
            running: 15,
            pending: 0,
            failed: 0
          },
          components: {
            api: 'healthy',
            scheduler: 'healthy',
            controller: 'healthy',
            etcd: 'healthy'
          }
        }
      });
    } catch (error) {
      logger.error('Get cluster health failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get cluster health'
      });
    }
  }

  // Helper methods
  async generateDeployment(analysisId, options) {
    const aiTemplate = await AIService.generateK8sDeployment(analysisId, options);
    
    return {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: options.name || 'app-deployment',
        namespace: options.namespace || 'default'
      },
      spec: {
        replicas: options.replicas || 1,
        selector: {
          matchLabels: {
            app: options.name || 'app'
          }
        },
        template: {
          metadata: {
            labels: {
              app: options.name || 'app'
            }
          },
          spec: {
            containers: [{
              name: options.name || 'app',
              image: options.image || 'nginx:latest',
              ports: (options.ports || [80]).map(p => ({
                containerPort: p
              })),
              env: (options.env || []).map(e => ({
                name: e.name,
                value: e.value
              }))
            }]
          }
        }
      }
    };
  }

  async generateService(analysisId, options) {
    return {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: `${options.name || 'app'}-service`,
        namespace: options.namespace || 'default'
      },
      spec: {
        selector: {
          app: options.name || 'app'
        },
        ports: (options.ports || [80]).map(p => ({
          port: p,
          targetPort: p
        })),
        type: options.serviceType || 'ClusterIP'
      }
    };
  }

  async generateIngress(analysisId, options) {
    return {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'Ingress',
      metadata: {
        name: `${options.name || 'app'}-ingress`,
        namespace: options.namespace || 'default',
        annotations: {
          'nginx.ingress.kubernetes.io/rewrite-target': '/'
        }
      },
      spec: {
        rules: [{
          host: options.host || 'app.local',
          http: {
            paths: [{
              path: '/',
              pathType: 'Prefix',
              backend: {
                service: {
                  name: `${options.name || 'app'}-service`,
                  port: {
                    number: options.ports?.[0] || 80
                  }
                }
              }
            }]
          }
        }]
      }
    };
  }

  manifestsToYaml(manifests) {
    const yaml = require('js-yaml');
    let yamlOutput = '';
    
    for (const manifest of Object.values(manifests)) {
      yamlOutput += '---\n';
      yamlOutput += yaml.dump(manifest);
    }
    
    return yamlOutput;
  }

  // WebSocket methods
  async getDeploymentStatus(name, namespace) {
    return {
      name,
      namespace,
      status: 'Running',
      replicas: 3,
      available: 3,
      unavailable: 0,
      conditions: [
        {
          type: 'Available',
          status: 'True',
          lastUpdateTime: new Date().toISOString()
        }
      ]
    };
  }

  async streamPodLogs(podName, namespace) {
    const { Readable } = require('stream');
    const stream = new Readable({
      read() {
        const logs = [
          `[INFO] Starting pod ${podName}`,
          '[INFO] Container starting up',
          '[INFO] Application initialized',
          '[INFO] Listening on port 3000',
          '[INFO] Health check passed'
        ];
        
        logs.forEach((log, i) => {
          setTimeout(() => {
            this.push(log + '\n');
            if (i === logs.length - 1) {
              this.push(null);
            }
          }, i * 1000);
        });
      }
    });
    
    return stream;
  }
}

module.exports = new K8sController();