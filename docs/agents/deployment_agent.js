const { BaseAgent } = require('./base_agent');
const { CloudflareAPI } = require('../utils/cloudflare');
const { SlackAPI } = require('../utils/slack');
const { LoggingAPI } = require('../utils/logging');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class DeploymentAgent extends BaseAgent {
    constructor() {
        super('deployment_agent');
        this.cloudflare = new CloudflareAPI();
        this.slack = new SlackAPI();
        this.logging = new LoggingAPI();
        this.deploymentQueue = [];
        this.activeDeployments = new Map();
    }

    async initialize() {
        await super.initialize();
        this.setupDeploymentChecks();
    }

    setupDeploymentChecks() {
        this.deploymentChecks = {
            healthCheckInterval: 30000,  // 30 seconds
            maxRetries: 3,
            rollbackThreshold: 0.1      // 10% error rate triggers rollback
        };
    }

    async deployWorker(workerName, options = {}) {
        try {
            this.log(`Starting deployment of ${workerName}`);
            await this.slack.sendAlert(`🚀 Starting deployment of ${workerName}`);
            
            // Add to active deployments
            this.activeDeployments.set(workerName, {
                startTime: new Date(),
                status: 'deploying',
                retries: 0
            });
            
            // Run deployment
            const { stdout, stderr } = await execAsync(`cd ${workerName} && wrangler deploy`);
            
            if (stderr) {
                throw new Error(`Deployment error: ${stderr}`);
            }
            
            // Update deployment status
            this.activeDeployments.set(workerName, {
                ...this.activeDeployments.get(workerName),
                status: 'deployed',
                deploymentId: this.extractDeploymentId(stdout)
            });
            
            // Start health monitoring
            this.monitorDeploymentHealth(workerName);
            
            await this.slack.sendAlert(`✅ ${workerName} deployed successfully`);
            await this.logging.logDeployment('success', { worker: workerName, output: stdout });
            
            return true;
        } catch (error) {
            await this.handleDeploymentError(workerName, error);
            return false;
        }
    }

    extractDeploymentId(output) {
        const match = output.match(/Current Version ID: ([a-f0-9-]+)/);
        return match ? match[1] : null;
    }

    async monitorDeploymentHealth(workerName) {
        const deployment = this.activeDeployments.get(workerName);
        if (!deployment) return;
        
        let errorCount = 0;
        let totalRequests = 0;
        
        const healthCheck = async () => {
            try {
                const response = await fetch(`https://${workerName}.kd8jc7v8cd.workers.dev/healthz`);
                totalRequests++;
                
                if (!response.ok) {
                    errorCount++;
                }
                
                const errorRate = errorCount / totalRequests;
                
                if (errorRate > this.deploymentChecks.rollbackThreshold) {
                    await this.handleHighErrorRate(workerName, errorRate);
                }
            } catch (error) {
                await this.handleHealthCheckError(workerName, error);
            }
        };
        
        // Run health check every 30 seconds for 5 minutes
        const interval = setInterval(healthCheck, this.deploymentChecks.healthCheckInterval);
        
        // Stop monitoring after 5 minutes
        setTimeout(() => {
            clearInterval(interval);
            this.activeDeployments.delete(workerName);
        }, 300000);
    }

    async handleHighErrorRate(workerName, errorRate) {
        const deployment = this.activeDeployments.get(workerName);
        if (!deployment) return;
        
        if (deployment.retries < this.deploymentChecks.maxRetries) {
            // Attempt redeployment
            deployment.retries++;
            await this.slack.sendAlert(
                `⚠️ High error rate (${(errorRate * 100).toFixed(1)}%) for ${workerName}. ` +
                `Attempting redeployment (${deployment.retries}/${this.deploymentChecks.maxRetries})`
            );
            
            await this.deployWorker(workerName);
        } else {
            // Rollback to previous version
            await this.rollbackDeployment(workerName);
        }
    }

    async rollbackDeployment(workerName) {
        try {
            const deployment = this.activeDeployments.get(workerName);
            if (!deployment) return;
            
            await this.slack.sendAlert(`🔄 Rolling back ${workerName} to previous version`);
            
            const { stdout, stderr } = await execAsync(
                `cd ${workerName} && wrangler rollback ${deployment.deploymentId}`
            );
            
            if (stderr) {
                throw new Error(`Rollback error: ${stderr}`);
            }
            
            await this.slack.sendAlert(`✅ ${workerName} rolled back successfully`);
            await this.logging.logDeployment('rollback', { 
                worker: workerName, 
                fromVersion: deployment.deploymentId,
                output: stdout
            });
            
            this.activeDeployments.delete(workerName);
        } catch (error) {
            await this.handleRollbackError(workerName, error);
        }
    }

    async handleDeploymentError(workerName, error) {
        const message = `❌ Deployment failed for ${workerName}: ${error.message}`;
        await this.slack.sendAlert(message);
        await this.logging.logError('deployment', {
            worker: workerName,
            error: error.message,
            stack: error.stack
        });
        
        this.activeDeployments.delete(workerName);
    }

    async handleHealthCheckError(workerName, error) {
        const message = `❌ Health check failed for ${workerName}: ${error.message}`;
        await this.slack.sendAlert(message);
        await this.logging.logError('health_check', {
            worker: workerName,
            error: error.message,
            stack: error.stack
        });
    }

    async handleRollbackError(workerName, error) {
        const message = `❌ Rollback failed for ${workerName}: ${error.message}`;
        await this.slack.sendAlert(message);
        await this.logging.logError('rollback', {
            worker: workerName,
            error: error.message,
            stack: error.stack
        });
    }

    async start() {
        await this.initialize();
        
        // Process deployment queue
        setInterval(async () => {
            if (this.deploymentQueue.length > 0) {
                const { workerName, options } = this.deploymentQueue.shift();
                await this.deployWorker(workerName, options);
            }
        }, 5000);
        
        this.log('Deployment agent started');
    }
}

module.exports = { DeploymentAgent }; 
