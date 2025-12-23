const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const logger = require('../utils/logger');

class RepoAnalyzer {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
    this.tempDir = path.join(__dirname, '../../temp/repos');
  }

  async analyzeRepository(url, options = {}) {
    try {
      logger.info(`Analyzing repository: ${url}`);
      
      const { branch = 'main', depth = 3, includeDependencies = true } = options;
      const repoInfo = this.parseRepoUrl(url);
      
      // Clone repository
      const repoPath = await this.cloneRepository(url, branch, depth);
      
      // Analyze structure
      const structure = await this.analyzeStructure(repoPath);
      
      // Get languages
      const languages = await this.detectLanguages(repoPath);
      
      // Find configuration files
      const configFiles = this.findConfigFiles(repoPath);
      
      // Analyze dependencies if requested
      let dependencies = [];
      if (includeDependencies) {
        dependencies = await this.analyzeDependencies(repoPath);
      }
      
      // Calculate metrics
      const metrics = await this.calculateMetrics(repoPath);
      
      // Clean up temp directory
      this.cleanupTempDir(repoPath);
      
      return {
        repository: repoInfo,
        branch,
        structure,
        languages,
        configFiles,
        dependencies,
        metrics,
        files: this.getFileList(repoPath)
      };
      
    } catch (error) {
      logger.error(`Repository analysis failed: ${error.message}`);
      throw error;
    }
  }

  async validateRepository(url) {
    try {
      const repoInfo = this.parseRepoUrl(url);
      
      if (repoInfo.platform === 'github') {
        await this.octokit.repos.get({
          owner: repoInfo.owner,
          repo: repoInfo.repo
        });
        return true;
      }
      
      // For other platforms, try to clone
      const repoPath = await this.cloneRepository(url, 'main', 1);
      this.cleanupTempDir(repoPath);
      return true;
      
    } catch (error) {
      return false;
    }
  }

  async getRepositoryMetadata(url) {
    const repoInfo = this.parseRepoUrl(url);
    
    if (repoInfo.platform === 'github') {
      const { data } = await this.octokit.repos.get({
        owner: repoInfo.owner,
        repo: repoInfo.repo
      });
      
      return {
        name: data.name,
        description: data.description,
        stars: data.stargazers_count,
        forks: data.forks_count,
        issues: data.open_issues_count,
        language: data.language,
        size: data.size,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    }
    
    return {
      name: repoInfo.repo,
      platform: repoInfo.platform
    };
  }

  // Helper Methods
  parseRepoUrl(url) {
    const patterns = {
      github: /github\.com\/([^\/]+)\/([^\/]+)/,
      gitlab: /gitlab\.com\/([^\/]+)\/([^\/]+)/,
      bitbucket: /bitbucket\.org\/([^\/]+)\/([^\/]+)/
    };
    
    for (const [platform, pattern] of Object.entries(patterns)) {
      const match = url.match(pattern);
      if (match) {
        return {
          platform,
          owner: match[1],
          repo: match[2].replace(/\.git$/, ''),
          url
        };
      }
    }
    
    return {
      platform: 'other',
      url
    };
  }

  async cloneRepository(url, branch, depth) {
    const repoId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const repoPath = path.join(this.tempDir, repoId);
    
    fs.mkdirSync(repoPath, { recursive: true });
    
    const cloneCmd = `git clone --depth ${depth} --branch ${branch} ${url} ${repoPath}`;
    
    try {
      await execPromise(cloneCmd);
      logger.info(`Cloned repository to ${repoPath}`);
      return repoPath;
    } catch (error) {
      // Try without branch
      const fallbackCmd = `git clone --depth ${depth} ${url} ${repoPath}`;
      await execPromise(fallbackCmd);
      return repoPath;
    }
  }

  async analyzeStructure(repoPath) {
    const structure = {
      directories: 0,
      files: 0,
      byType: {},
      maxDepth: 0
    };
    
    const walk = (dir, depth = 0) => {
      structure.maxDepth = Math.max(structure.maxDepth, depth);
      
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      items.forEach(item => {
        if (item.isDirectory()) {
          structure.directories++;
          walk(path.join(dir, item.name), depth + 1);
        } else {
          structure.files++;
          const ext = path.extname(item.name).toLowerCase();
          structure.byType[ext] = (structure.byType[ext] || 0) + 1;
        }
      });
    };
    
    walk(repoPath);
    return structure;
  }

  async detectLanguages(repoPath) {
    const extensions = {
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.go': 'Go',
      '.rs': 'Rust',
      '.rb': 'Ruby',
      '.php': 'PHP',
      '.cpp': 'C++',
      '.c': 'C',
      '.cs': 'C#',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.scala': 'Scala',
      '.html': 'HTML',
      '.css': 'CSS',
      '.json': 'JSON',
      '.yaml': 'YAML',
      '.yml': 'YAML',
      '.xml': 'XML',
      '.md': 'Markdown'
    };
    
    const languages = new Set();
    
    const walk = (dir) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      items.forEach(item => {
        if (item.isDirectory()) {
          walk(path.join(dir, item.name));
        } else {
          const ext = path.extname(item.name).toLowerCase();
          if (extensions[ext]) {
            languages.add(extensions[ext]);
          }
        }
      });
    };
    
    walk(repoPath);
    return Array.from(languages);
  }

  findConfigFiles(repoPath) {
    const configFiles = [];
    const patterns = [
      'package.json', 'package-lock.json', 'yarn.lock',
      'pom.xml', 'build.gradle', 'build.gradle.kts',
      'requirements.txt', 'Pipfile', 'pyproject.toml',
      'Cargo.toml', 'go.mod', 'composer.json',
      'docker-compose.yml', 'docker-compose.yaml',
      '.dockerignore', '.gitignore', '.env.example',
      'Makefile', 'Procfile', 'webpack.config.js',
      'tsconfig.json', '.eslintrc', '.prettierrc'
    ];
    
    const walk = (dir) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      items.forEach(item => {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
          walk(fullPath);
        } else if (patterns.includes(item.name)) {
          configFiles.push({
            name: item.name,
            path: path.relative(repoPath, fullPath),
            size: fs.statSync(fullPath).size
          });
        }
      });
    };
    
    walk(repoPath);
    return configFiles;
  }

  async analyzeDependencies(repoPath) {
    const dependencies = [];
    
    // Check for package.json (Node.js)
    const packageJsonPath = path.join(repoPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.dependencies) {
        Object.entries(packageJson.dependencies).forEach(([name, version]) => {
          dependencies.push({
            name,
            version: version.replace('^', '').replace('~', ''),
            type: 'runtime',
            manager: 'npm'
          });
        });
      }
    }
    
    // Check for requirements.txt (Python)
    const requirementsPath = path.join(repoPath, 'requirements.txt');
    if (fs.existsSync(requirementsPath)) {
      const content = fs.readFileSync(requirementsPath, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^([a-zA-Z0-9_-]+)==([0-9.]+)/);
        if (match) {
          dependencies.push({
            name: match[1],
            version: match[2],
            type: 'runtime',
            manager: 'pip'
          });
        }
      });
    }
    
    return dependencies;
  }

  async calculateMetrics(repoPath) {
    const metrics = {
      totalLines: 0,
      totalFiles: 0,
      avgLinesPerFile: 0,
      largestFile: { name: '', lines: 0 }
    };
    
    const walk = (dir) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      items.forEach(item => {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
          walk(fullPath);
        } else if (this.isTextFile(item.name)) {
          metrics.totalFiles++;
          
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n').length;
            metrics.totalLines += lines;
            
            if (lines > metrics.largestFile.lines) {
              metrics.largestFile = {
                name: path.relative(repoPath, fullPath),
                lines
              };
            }
          } catch (error) {
            // Skip binary files
          }
        }
      });
    };
    
    walk(repoPath);
    
    if (metrics.totalFiles > 0) {
      metrics.avgLinesPerFile = Math.round(metrics.totalLines / metrics.totalFiles);
    }
    
    return metrics;
  }

  getFileList(repoPath) {
    const files = [];
    
    const walk = (dir, relativePath = '') => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      items.forEach(item => {
        const fileRelativePath = path.join(relativePath, item.name);
        const fullPath = path.join(dir, item.name);
        
        files.push({
          name: item.name,
          path: fileRelativePath,
          isDirectory: item.isDirectory(),
          size: item.isDirectory() ? 0 : fs.statSync(fullPath).size,
          extension: path.extname(item.name).toLowerCase()
        });
        
        if (item.isDirectory()) {
          walk(fullPath, fileRelativePath);
        }
      });
    };
    
    walk(repoPath);
    return files;
  }

  isTextFile(filename) {
    const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg',
                             '.pdf', '.zip', '.tar', '.gz', '.exe', '.dll',
                             '.so', '.dylib', '.class', '.jar', '.war'];
    const ext = path.extname(filename).toLowerCase();
    return !binaryExtensions.includes(ext);
  }

  cleanupTempDir(repoPath) {
    try {
      fs.rmSync(repoPath, { recursive: true, force: true });
    } catch (error) {
      logger.warn(`Failed to clean up temp directory: ${repoPath}`);
    }
  }
}

module.exports = new RepoAnalyzer();