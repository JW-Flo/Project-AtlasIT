const { BaseAgent } = require('./base_agent');
const { InfrastructureAgent } = require('./infrastructure_agent');
const { ProductionManagerAgent } = require('./production_manager_agent');
const { LoggingAPI } = require('../utils/logging');
const { SlackAPI } = require('../utils/slack');

class GCPPOCAgent extends BaseAgent {
    constructor() {
        super('gcp_poc_agent');
        this.infrastructure = new InfrastructureAgent();
        this.production = new ProductionManagerAgent();
        this.logging = new LoggingAPI();
        this.slack = new SlackAPI();
        this.pocTasks = new Map();
    }

    async initialize() {
        await super.initialize();
        this.setupPOCTasks();
    }

    setupPOCTasks() {
        // Define GCP POC tasks
        this.pocTasks.set('setup_gcp', {
            steps: [
                {
                    name: 'terraform_init',
                    action: 'init',
                    workspace: 'gcp-poc'
                },
                {
                    name: 'terraform_plan',
                    action: 'plan',
                    workspace: 'gcp-poc'
                },
                {
                    name: 'terraform_apply',
                    action: 'apply',
                    workspace: 'gcp-poc'
                }
            ],
            dependencies: []
        });

        this.pocTasks.set('deploy_cloud_functions', {
            steps: [
                {
                    name: 'deploy_okta_ramp_sync',
                    action: 'deploy',
                    target: 'cloud-functions/oktaRampSync'
                },
                {
                    name: 'deploy_auto_doc',
                    action: 'deploy',
                    target: 'cloud-functions/autoDoc'
                }
            ],
            dependencies: ['setup_gcp']
        });

        this.pocTasks.set('configure_monitoring', {
            steps: [
                {
                    name: 'setup_logging',
                    action: 'configure',
                    target: 'logging'
                },
                {
                    name: 'setup_alerting',
                    action: 'configure',
                    target: 'alerting'
                }
            ],
            dependencies: ['setup_gcp']
        });
    }

    async executePOCTask(taskName) {
        const task = this.pocTasks.get(taskName);
        if (!task) {
            throw new Error(`Unknown POC task: ${taskName}`);
        }

        await this.slack.sendAlert(`🚀 Starting GCP POC task: ${taskName}`);
        await this.logging.logInfo('gcp_poc', { task: taskName, status: 'started' });

        try {
            // Check dependencies
            for (const dep of task.dependencies) {
                const depStatus = await this.getTaskStatus(dep);
                if (depStatus !== 'completed') {
                    throw new Error(`Dependency ${dep} not completed (status: ${depStatus})`);
                }
            }

            // Execute steps
            for (const step of task.steps) {
                await this.executeStep(step);
            }

            await this.slack.sendAlert(`✅ GCP POC task completed: ${taskName}`);
            await this.logging.logInfo('gcp_poc', { task: taskName, status: 'completed' });
            
            return true;
        } catch (error) {
            await this.handleTaskError(taskName, error);
            return false;
        }
    }

    async executeStep(step) {
        await this.logging.logInfo('gcp_poc', { step: step.name, status: 'started' });

        try {
            let result;
            switch (step.action) {
                case 'init':
                case 'plan':
                case 'apply':
                    result = await this.infrastructure.handleTerraform(step);
                    break;
                case 'deploy':
                    result = await this.production.executeTask({
                        action: 'deploy',
                        params: { target: step.target }
                    });
                    break;
                case 'configure':
                    result = await this.infrastructure.handleMonitor(step);
                    break;
                default:
                    throw new Error(`Unknown step action: ${step.action}`);
            }

            await this.logging.logInfo('gcp_poc', { 
                step: step.name, 
                status: 'completed',
                result
            });

            return result;
        } catch (error) {
            await this.handleStepError(step, error);
            throw error;
        }
    }

    async getTaskStatus(taskName) {
        // Check if task exists and get its status
        const task = this.pocTasks.get(taskName);
        if (!task) {
            return 'unknown';
        }

        // Check if all steps are completed
        const stepStatuses = await Promise.all(
            task.steps.map(step => this.getStepStatus(step))
        );

        if (stepStatuses.every(status => status === 'completed')) {
            return 'completed';
        } else if (stepStatuses.some(status => status === 'failed')) {
            return 'failed';
        } else if (stepStatuses.some(status => status === 'in_progress')) {
            return 'in_progress';
        } else {
            return 'pending';
        }
    }

    async getStepStatus(step) {
        // Check step status in infrastructure or production agent
        if (['init', 'plan', 'apply'].includes(step.action)) {
            return await this.infrastructure.getOperationStatus(step);
        } else if (step.action === 'deploy') {
            return await this.production.getTaskStatus(step);
        } else {
            return 'unknown';
        }
    }

    async handleTaskError(taskName, error) {
        const message = `❌ GCP POC task failed: ${taskName}\nError: ${error.message}`;
        await this.slack.sendAlert(message);
        await this.logging.logError('gcp_poc', {
            task: taskName,
            error: error.message,
            stack: error.stack
        });
    }

    async handleStepError(step, error) {
        const message = `❌ Step failed: ${step.name}\nError: ${error.message}`;
        await this.slack.sendAlert(message);
        await this.logging.logError('gcp_poc', {
            step: step.name,
            error: error.message,
            stack: error.stack
        });
    }

    async start() {
        await this.initialize();
        
        // Start executing POC tasks
        for (const [taskName, task] of this.pocTasks) {
            await this.executePOCTask(taskName);
        }
        
        this.log('GCP POC agent started');
    }
}

module.exports = { GCPPOCAgent }; 