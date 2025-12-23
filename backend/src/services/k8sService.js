const k8s = require('@kubernetes/client-node');
const logger = require('../utils/logger');

class K8sService {
  constructor() {
    this.kc = new k8s.KubeConfig();
    this.connected = false;
  }

  async initialize() {
    try {
      this.kc.loadFromDefault();
      this.k8sApi = this.kc.makeApiClient(k8s.CoreV1Api);
      this.appsApi = this.kc.makeApiClient(k8s.AppsV1Api);
      
      // Test connection
      await this.k8sApi.listNamespace();
      this.connected = true;
      logger.info('✅ Kubernetes service connected');
      return true;
    } catch (error) {
      logger.warn('⚠️ Kubernetes not available, using mock operations');
      this.connected = false;
      return false;
    }
  }

  async listDeployments(namespace = 'default', options = {}) {
    if (!this.connected) {
      return this.mockListDeployments(namespace, options);
    }

    try {
      const response = await this.appsApi.listNamespacedDeployment(
        namespace,
        options.labelSelector,
        options.fieldSelector,
        options.pretty,
        options.continue,
        options.limit,
        options.resourceVersion,
        options.resourceVersionMatch,
        options.timeoutSeconds,
        options.watch
      );

      return response.body.items.map(deploy => ({
        name: deploy.metadata.name,
        namespace: deploy.metadata.namespace,
        replicas: deploy.spec.replicas,
        available: deploy.status.availableReplicas || 0,
        ready: deploy.status.readyReplicas || 0,
        age: this.calculateAge(deploy.metadata.creationTimestamp),
        labels: deploy.metadata.labels
      }));
    } catch (error) {
      logger.error('List deployments failed:', error);
      throw error;
    }
  }

  async listPods(namespace = 'default', options = {}) {
    if (!this.connected) {
      return this.mockListPods(namespace, options);
    }

    try {
      const response = await this.k8sApi.listNamespacedPod(
        namespace,
        options.labelSelector,
        options.fieldSelector,
        options.pretty,
        options.continue,
        options.limit,
        options.resourceVersion,
        options.resourceVersionMatch,
        options.timeoutSeconds,
        options.watch
      );

      return response.body.items.map(pod => ({
        name: pod.metadata.name,
        namespace: pod.metadata.namespace,
        status: pod.status.phase,
        node: pod.spec.nodeName,
        restarts: pod.status.containerStatuses?.reduce((sum, cs) => sum + cs.restartCount, 0) || 0,
        age: this.calculateAge(pod.metadata.creationTimestamp),
        ip: pod.status.podIP,
        labels: pod.metadata.labels
      }));
    } catch (error) {
      logger.error('List pods failed:', error);
      throw error;
    }
  }

  async getPodLogs(podName, namespace = 'default', options = {}) {
    if (!this.connected) {
      return this.mockGetPodLogs(podName, namespace, options);
    }

    try {
      const response = await this.k8sApi.readNamespacedPodLog(
        podName,
        namespace,
        options.container,
        options.follow,
        options.limitBytes,
        options.pretty,
        options.previous,
        options.sinceSeconds,
        options.tailLines,
        options.timestamps
      );

      return response.body;
    } catch (error) {
      logger.error('Get pod logs failed:', error);
      throw error;
    }
  }

  async createDeployment(deployment, namespace = 'default') {
    if (!this.connected) {
      return this.mockCreateDeployment(deployment, namespace);
    }

    try {
      const response = await this.appsApi.createNamespacedDeployment(
        namespace,
        deployment
      );

      return {
        name: response.body.metadata.name,
        namespace: response.body.metadata.namespace,
        status: 'created'
      };
    } catch (error) {
      logger.error('Create deployment failed:', error);
      throw error;
    }
  }

  async updateDeployment(name, namespace, patch) {
    if (!this.connected) {
      return this.mockUpdateDeployment(name, namespace, patch);
    }

    try {
      const response = await this.appsApi.patchNamespacedDeployment(
        name,
        namespace,
        patch,
        undefined,
        undefined,
        undefined,
        undefined,
        { headers: { 'Content-Type': 'application/strategic-merge-patch+json' } }
      );

      return response.body;
    } catch (error) {
      logger.error('Update deployment failed:', error);
      throw error;
    }
  }

  async deleteDeployment(name, namespace = 'default', options = {}) {
    if (!this.connected) {
      return this.mockDeleteDeployment(name, namespace, options);
    }

    try {
      await this.appsApi.deleteNamespacedDeployment(
        name,
        namespace,
        options.pretty,
        options.gracePeriodSeconds,
        options.orphanDependents,
        options.propagationPolicy,
        options.dryRun
      );

      return { success: true, message: `Deployment ${name} deleted` };
    } catch (error) {
      logger.error('Delete deployment failed:', error);
      throw error;
    }
  }

  async scaleDeployment(name, namespace, replicas) {
    if (!this.connected) {
      return this.mockScaleDeployment(name, namespace, replicas);
    }

    try {
      const patch = {
        spec: { replicas: parseInt(replicas) }
      };

      return await this.updateDeployment(name, namespace, patch);
    } catch (error) {
      logger.error('Scale deployment failed:', error);
      throw error;
    }
  }

  async listServices(namespace = 'default') {
    if (!this.connected) {
      return this.mockListServices(namespace);
    }

    try {
      const response = await this.k8sApi.listNamespacedService(namespace);
      return response.body.items.map(service => ({
        name: service.metadata.name,
        namespace: service.metadata.namespace,
        type: service.spec.type,
        clusterIP: service.spec.clusterIP,
        ports: service.spec.ports,
        age: this.calculateAge(service.metadata.creationTimestamp)
      }));
    } catch (error) {
      logger.error('List services failed:', error);
      throw error;
    }
  }

  async getClusterInfo() {
    if (!this.connected) {
      return this.mockGetClusterInfo();
    }

    try {
      const [nodes, namespaces] = await Promise.all([
        this.k8sApi.listNode(),
        this.k8sApi.listNamespace()
      ]);

      return {
        nodes: nodes.body.items.length,
        namespaces: namespaces.body.items.length,
        version: await this.getK8sVersion()
      };
    } catch (error) {
      logger.error('Get cluster info failed:', error);
      throw error;
    }
  }

  async getK8sVersion() {
    if (!this.connected) {
      return 'v1.25.0-mock';
    }

    try {
      const response = await this.k8sApi.getCode();
      return response.body.gitVersion;
    } catch (error) {
      return 'unknown';
    }
  }

  // Helper Methods
  calculateAge(creationTimestamp) {
    if (!creationTimestamp) return 'unknown';
    
    const created = new Date(creationTimestamp);
    const now = new Date();
    const diff = now - created;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  }

  // Mock Methods
  mockListDeployments(namespace, options) {
    return [
      {
        name: 'api-deployment',
        namespace,
        replicas: 3,
        available: 3,
        ready: 3,
        age: '2d',
        labels: { app: 'api' }
      },
      {
        name: 'web-deployment',
        namespace,
        replicas: 2,
        available: 2,
        ready: 2,
        age: '1d',
        labels: { app: 'web' }
      }
    ].slice(0, options.limit || 10);
  }

  mockListPods(namespace, options) {
    return [
      {
        name: 'api-deployment-abc123',
        namespace,
        status: 'Running',
        node: 'node-1',
        restarts: 0,
        age: '2h',
        ip: '10.244.1.2',
        labels: { app: 'api' }
      },
      {
        name: 'web-deployment-xyz789',
        namespace,
        status: 'Running',
        node: 'node-2',
        restarts: 1,
        age: '1h',
        ip: '10.244.2.3',
        labels: { app: 'web' }
      }
    ].slice(0, options.limit || 10);
  }

  mockGetPodLogs(podName, namespace, options) {
    const logs = [
      `Starting pod ${podName}...`,
      'Container starting up',
      'Application initialized',
      'Database connection established',
      'Server listening on port 3000',
      'Health check passed'
    ];
    
    return logs.slice(-(options.tailLines || 100)).join('\n');
  }

  mockCreateDeployment(deployment, namespace) {
    return {
      name: deployment.metadata.name,
      namespace,
      status: 'created'
    };
  }

  mockUpdateDeployment(name, namespace, patch) {
    return {
      metadata: { name, namespace },
      spec: patch.spec
    };
  }

  mockDeleteDeployment(name, namespace, options) {
    return { success: true, message: `Mock deleted deployment ${name}` };
  }

  mockScaleDeployment(name, namespace, replicas) {
    return {
      metadata: { name, namespace },
      spec: { replicas: parseInt(replicas) }
    };
  }

  mockListServices(namespace) {
    return [
      {
        name: 'api-service',
        namespace,
        type: 'ClusterIP',
        clusterIP: '10.96.123.45',
        ports: [{ port: 80, targetPort: 3000 }],
        age: '2d'
      },
      {
        name: 'web-service',
        namespace,
        type: 'LoadBalancer',
        clusterIP: '10.96.234.56',
        ports: [{ port: 80, targetPort: 80 }],
        age: '1d'
      }
    ];
  }

  mockGetClusterInfo() {
    return {
      nodes: 3,
      namespaces: 5,
      version: 'v1.25.0',
      health: 'healthy'
    };
  }
}

module.exports = new K8sService();