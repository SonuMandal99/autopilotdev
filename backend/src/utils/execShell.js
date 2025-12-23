const { exec, spawn } = require('child_process');
const util = require('util');
const logger = require('./logger');

const execPromise = util.promisify(exec);

class ExecShell {
  /**
   * Execute a shell command and return the result
   * @param {string} command - Command to execute
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Command result
   */
  async execute(command, options = {}) {
    const startTime = Date.now();
    
    try {
      logger.debug(`Executing command: ${command}`);
      
      const { stdout, stderr } = await execPromise(command, {
        cwd: options.cwd || process.cwd(),
        env: { ...process.env, ...options.env },
        timeout: options.timeout || 30000, // 30 seconds default
        maxBuffer: options.maxBuffer || 1024 * 1024 * 10, // 10MB
        ...options
      });

      const duration = Date.now() - startTime;
      
      logger.debug(`Command executed successfully in ${duration}ms`, {
        command,
        duration,
        stdoutLength: stdout.length,
        stderrLength: stderr.length
      });

      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        duration,
        command
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`Command execution failed: ${command}`, {
        error: error.message,
        code: error.code,
        signal: error.signal,
        duration,
        killed: error.killed,
        timedOut: error.timedOut
      });

      return {
        success: false,
        error: error.message,
        code: error.code,
        stdout: error.stdout?.toString().trim() || '',
        stderr: error.stderr?.toString().trim() || '',
        duration,
        command
      };
    }
  }

  /**
   * Execute command with streaming output
   * @param {string} command - Command to execute
   * @param {Function} onData - Callback for data
   * @param {Function} onError - Callback for errors
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Command result
   */
  async executeStream(command, onData, onError, options = {}) {
    return new Promise((resolve, reject) => {
      logger.debug(`Executing streaming command: ${command}`);
      
      const child = spawn(command, {
        shell: true,
        cwd: options.cwd || process.cwd(),
        env: { ...process.env, ...options.env }
      });

      let stdout = '';
      let stderr = '';
      const startTime = Date.now();

      child.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        if (onData) onData(output);
      });

      child.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        if (onError) onError(output);
      });

      child.on('close', (code) => {
        const duration = Date.now() - startTime;
        
        if (code === 0) {
          logger.debug(`Streaming command completed in ${duration}ms`, {
            command,
            duration,
            code
          });
          
          resolve({
            success: true,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            duration,
            code,
            command
          });
        } else {
          logger.error(`Streaming command failed with code ${code}`, {
            command,
            duration,
            code,
            stderr: stderr.trim()
          });
          
          resolve({
            success: false,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            duration,
            code,
            command
          });
        }
      });

      child.on('error', (error) => {
        const duration = Date.now() - startTime;
        
        logger.error(`Streaming command error: ${command}`, {
          error: error.message,
          duration
        });
        
        reject({
          success: false,
          error: error.message,
          duration,
          command
        });
      });

      // Set timeout if specified
      if (options.timeout) {
        setTimeout(() => {
          child.kill('SIGTERM');
          reject({
            success: false,
            error: 'Command timeout',
            duration: Date.now() - startTime,
            command
          });
        }, options.timeout);
      }
    });
  }

  /**
   * Execute multiple commands sequentially
   * @param {Array<string>} commands - Commands to execute
   * @param {Object} options - Execution options
   * @returns {Promise<Array>} Results array
   */
  async executeSequential(commands, options = {}) {
    const results = [];
    
    for (const command of commands) {
      try {
        const result = await this.execute(command, options);
        results.push(result);
        
        // Stop on first failure if stopOnError is true
        if (!result.success && options.stopOnError) {
          break;
        }
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          command
        });
        
        if (options.stopOnError) {
          break;
        }
      }
    }
    
    return results;
  }

  /**
   * Execute multiple commands in parallel
   * @param {Array<string>} commands - Commands to execute
   * @param {Object} options - Execution options
   * @returns {Promise<Array>} Results array
   */
  async executeParallel(commands, options = {}) {
    const promises = commands.map(command => 
      this.execute(command, options).catch(error => ({
        success: false,
        error: error.message,
        command
      }))
    );
    
    return Promise.all(promises);
  }

  /**
   * Check if a command exists in the system
   * @param {string} command - Command to check
   * @returns {Promise<boolean>} True if command exists
   */
  async commandExists(command) {
    try {
      await this.execute(`command -v ${command}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Safely execute a command with sanitized input
   * @param {string} command - Command template
   * @param {Object} variables - Variables to inject
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Command result
   */
  async executeSafely(command, variables = {}, options = {}) {
    // Sanitize variables to prevent injection
    const sanitizedVars = {};
    for (const [key, value] of Object.entries(variables)) {
      if (typeof value === 'string') {
        // Remove dangerous characters
        sanitizedVars[key] = value.replace(/[;&|$`\\]/g, '');
      } else {
        sanitizedVars[key] = value;
      }
    }

    // Replace variables in command
    let safeCommand = command;
    for (const [key, value] of Object.entries(sanitizedVars)) {
      safeCommand = safeCommand.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    return this.execute(safeCommand, options);
  }

  // Common utility commands
  async gitClone(repoUrl, destination, options = {}) {
    const command = `git clone ${repoUrl} ${destination}`;
    return this.execute(command, { timeout: 60000, ...options });
  }

  async dockerBuild(context, tag, dockerfile = 'Dockerfile', options = {}) {
    const command = `docker build -t ${tag} -f ${dockerfile} ${context}`;
    return this.execute(command, { timeout: 300000, ...options }); // 5 minutes timeout
  }

  async dockerPush(image, options = {}) {
    const command = `docker push ${image}`;
    return this.execute(command, { timeout: 300000, ...options });
  }

  async npmInstall(directory, options = {}) {
    const command = `cd ${directory} && npm install`;
    return this.execute(command, { timeout: 300000, ...options });
  }

  async pythonPipInstall(directory, options = {}) {
    const command = `cd ${directory} && pip install -r requirements.txt`;
    return this.execute(command, { timeout: 300000, ...options });
  }

  // Health checks
  async checkDockerHealth() {
    return this.execute('docker ps');
  }

  async checkKubernetesHealth() {
    return this.execute('kubectl cluster-info');
  }

  async checkGitHealth() {
    return this.execute('git --version');
  }

  async checkNodeHealth() {
    return this.execute('node --version');
  }

  async checkPythonHealth() {
    return this.execute('python --version');
  }
}

// Export singleton instance
module.exports = new ExecShell();