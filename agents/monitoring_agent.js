import { BaseAgent } from './base_agent.js';
import { SlackAPI } from '../utils/slack.js';
import { LoggingAPI } from '../utils/logging.js';

export class MonitoringAgent extends BaseAgent {
    constructor() {
        super();
        this.name = 'monitoring-agent';
        this.slack = new SlackAPI();
        this.logging = new LoggingAPI();
        this.agentChecks = new Map();
        this.checkInterval = 60000; // Check every minute
        this.lastSuccessfulChecks = new Map();
        this.alertThresholds = {
            maxFailedChecks: 3,
            maxResponseTime: 5000, // 5 seconds
            maxMemoryUsage: 0.8, // 80% of available memory
            maxCPUUsage: 0.7 // 70% of available CPU
        };
    }

    async start() {
        await this.logging.logInfo('monitoring', 'Starting monitoring agent');
        await this.slack.sendAlert('🚀 Monitoring Agent Started');
        
        // Initialize agent checks
        this.initializeAgentChecks();
        
        // Start monitoring loop
        this.monitoringLoop = setInterval(() => this.checkAllAgents(), this.checkInterval);
        
        return true;
    }

    async stop() {
        if (this.monitoringLoop) {
            clearInterval(this.monitoringLoop);
        }
        await this.logging.logInfo('monitoring', 'Stopping monitoring agent');
        await this.slack.sendAlert('🛑 Monitoring Agent Stopped');
        return true;
    }

    initializeAgentChecks() {
        // Define health check functions for each agent
        this.agentChecks.set('security', async () => {
            const startTime = Date.now();
            try {
                // Check security agent's last activity and alert status
                const lastActivity = await this.checkAgentActivity('security');
                const alertStatus = await this.checkAlertStatus('security');
                const responseTime = Date.now() - startTime;

                return {
                    status: 'healthy',
                    lastCheck: Date.now(),
                    metrics: {
                        lastActivity,
                        alertStatus,
                        responseTime
                    }
                };
            } catch (error) {
                throw new Error(`Security check failed: ${error.message}`);
            }
        });

        this.agentChecks.set('deployment', async () => {
            const startTime = Date.now();
            try {
                // Check deployment agent's queue and recent deployments
                const queueStatus = await this.checkDeploymentQueue();
                const recentDeployments = await this.checkRecentDeployments();
                const responseTime = Date.now() - startTime;

                return {
                    status: 'healthy',
                    lastCheck: Date.now(),
                    metrics: {
                        queueStatus,
                        recentDeployments,
                        responseTime
                    }
                };
            } catch (error) {
                throw new Error(`Deployment check failed: ${error.message}`);
            }
        });

        this.agentChecks.set('infrastructure', async () => {
            const startTime = Date.now();
            try {
                // Check infrastructure agent's resource monitoring
                const resourceStatus = await this.checkResourceStatus();
                const responseTime = Date.now() - startTime;

                return {
                    status: 'healthy',
                    lastCheck: Date.now(),
                    metrics: {
                        resourceStatus,
                        responseTime
                    }
                };
            } catch (error) {
                throw new Error(`Infrastructure check failed: ${error.message}`);
            }
        });

        this.agentChecks.set('production', async () => {
            const startTime = Date.now();
            try {
                // Check production manager's status
                const productionStatus = await this.checkProductionStatus();
                const responseTime = Date.now() - startTime;

                return {
                    status: 'healthy',
                    lastCheck: Date.now(),
                    metrics: {
                        productionStatus,
                        responseTime
                    }
                };
            } catch (error) {
                throw new Error(`Production check failed: ${error.message}`);
            }
        });

        this.agentChecks.set('filesystem', async () => {
            const startTime = Date.now();
            try {
                // Check filesystem agent's operations
                const filesystemStatus = await this.checkFilesystemStatus();
                const responseTime = Date.now() - startTime;

                return {
                    status: 'healthy',
                    lastCheck: Date.now(),
                    metrics: {
                        filesystemStatus,
                        responseTime
                    }
                };
            } catch (error) {
                throw new Error(`Filesystem check failed: ${error.message}`);
            }
        });

        this.agentChecks.set('gcp_poc', async () => {
            const startTime = Date.now();
            try {
                // Check GCP POC agent's status
                const gcpStatus = await this.checkGCPStatus();
                const responseTime = Date.now() - startTime;

                return {
                    status: 'healthy',
                    lastCheck: Date.now(),
                    metrics: {
                        gcpStatus,
                        responseTime
                    }
                };
            } catch (error) {
                throw new Error(`GCP POC check failed: ${error.message}`);
            }
        });
    }

    async checkAllAgents() {
        const results = new Map();
        let hasIssues = false;
        let failedChecks = 0;

        for (const [agentName, checkFn] of this.agentChecks) {
            try {
                const result = await checkFn();
                results.set(agentName, result);

                // Check response time
                if (result.metrics.responseTime > this.alertThresholds.maxResponseTime) {
                    await this.handlePerformanceIssue(agentName, 'response_time', result.metrics.responseTime);
                    hasIssues = true;
                }

                // Check resource usage
                if (result.metrics.memoryUsage > this.alertThresholds.maxMemoryUsage) {
                    await this.handlePerformanceIssue(agentName, 'memory_usage', result.metrics.memoryUsage);
                    hasIssues = true;
                }

                if (result.metrics.cpuUsage > this.alertThresholds.maxCPUUsage) {
                    await this.handlePerformanceIssue(agentName, 'cpu_usage', result.metrics.cpuUsage);
                    hasIssues = true;
                }

                if (result.status !== 'healthy') {
                    hasIssues = true;
                    failedChecks++;
                    await this.handleAgentIssue(agentName, result);
                } else {
                    this.lastSuccessfulChecks.set(agentName, Date.now());
                }
            } catch (error) {
                hasIssues = true;
                failedChecks++;
                await this.handleAgentError(agentName, error);
            }
        }

        // Check if we've exceeded the failed checks threshold
        if (failedChecks >= this.alertThresholds.maxFailedChecks) {
            await this.handleCriticalFailure(failedChecks);
        }

        // Send summary to Slack if there are issues
        if (hasIssues) {
            await this.sendStatusSummary(results);
        }

        return results;
    }

    async handleAgentIssue(agentName, result) {
        const message = `⚠️ Agent Issue Detected\nAgent: ${agentName}\nStatus: ${result.status}\nLast Check: ${new Date(result.lastCheck).toISOString()}\nMetrics: ${JSON.stringify(result.metrics, null, 2)}`;
        await this.slack.sendAlert(message);
        await this.logging.logWarning('monitoring', `Issue with ${agentName}: ${result.status}`);
    }

    async handleAgentError(agentName, error) {
        const message = `❌ Agent Error\nAgent: ${agentName}\nError: ${error.message}\nTime: ${new Date().toISOString()}`;
        await this.slack.sendAlert(message);
        await this.logging.logError('monitoring', {
            context: `Error in ${agentName}`,
            error: error.message,
            stack: error.stack
        });
    }

    async handlePerformanceIssue(agentName, metric, value) {
        const message = `⚡ Performance Issue\nAgent: ${agentName}\nMetric: ${metric}\nValue: ${value}\nThreshold: ${this.alertThresholds[metric]}`;
        await this.slack.sendAlert(message);
        await this.logging.logWarning('monitoring', `Performance issue with ${agentName}: ${metric} = ${value}`);
    }

    async handleCriticalFailure(failedChecks) {
        const message = `🚨 Critical System Alert\nMultiple agent failures detected: ${failedChecks} agents failed\nTime: ${new Date().toISOString()}`;
        await this.slack.sendAlert(message);
        await this.logging.logError('monitoring', {
            context: 'Critical System Failure',
            failedChecks
        });
    }

    async sendStatusSummary(results) {
        const summary = Array.from(results.entries())
            .map(([name, result]) => {
                const metrics = result.metrics ? `\nMetrics: ${JSON.stringify(result.metrics, null, 2)}` : '';
                return `${name}: ${result.status}${metrics}`;
            })
            .join('\n');
        
        await this.slack.sendAlert(`📊 Agent Status Summary:\n${summary}`);
    }

    async handleSecurityError(error) {
        // Special handling for security-related issues
        const message = `🔒 Security Alert\nError: ${error.message}\nTime: ${new Date().toISOString()}\nSeverity: High`;
        await this.slack.sendAlert(message);
        await this.logging.logError('monitoring', {
            context: 'Security Error',
            error: error.message,
            stack: error.stack,
            severity: 'high'
        });
    }

    // Helper methods for specific checks
    async checkAgentActivity(agentName) {
        // Implementation for checking agent activity
        return { lastActivity: Date.now() };
    }

    async checkAlertStatus(agentName) {
        // Implementation for checking alert status
        return { activeAlerts: 0 };
    }

    async checkDeploymentQueue() {
        // Implementation for checking deployment queue
        return { queueLength: 0, pendingDeployments: [] };
    }

    async checkRecentDeployments() {
        // Implementation for checking recent deployments
        return { recentDeployments: [], successRate: 1.0 };
    }

    async checkResourceStatus() {
        // Implementation for checking resource status
        return { cpu: 0.2, memory: 0.3, disk: 0.4 };
    }

    async checkProductionStatus() {
        // Implementation for checking production status
        return { status: 'operational', uptime: '99.9%' };
    }

    async checkFilesystemStatus() {
        // Implementation for checking filesystem status
        return { status: 'healthy', freeSpace: '80%' };
    }

    async checkGCPStatus() {
        // Implementation for checking GCP status
        return { status: 'connected', resources: 'operational' };
    }
} 