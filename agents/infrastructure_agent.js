import { BaseAgent } from './base_agent.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { CircuitBreaker } from './utils/circuit_breaker.js';
import { Logger } from './utils/logger.js';
import { MetricsCollector } from './utils/metrics.js';
import { SecurityEscalation } from './utils/security_escalation.js';
import { SecurityPolicy } from './utils/security_policy.js';

const execAsync = promisify(exec);

export class InfrastructureAgent extends BaseAgent {
  constructor(ctx, env) {
    super(ctx, env);
    this.name = 'infrastructure-agent';
    this.version = '1.0.0';
    this.terraformPath = path.join(process.cwd(), 'terraform');
    this.statePath = path.join(this.terraformPath, 'state');
    this.logger = new Logger('infrastructure-agent');
    this.metrics = new MetricsCollector();
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000
    });
    this.securityEscalation = new SecurityEscalation();
    this.securityPolicy = new SecurityPolicy();
  }

  async init() {
    await super.init();
    // Ensure state directory exists
    await fs.mkdir(this.statePath, { recursive: true });
    
    // Register infrastructure-specific capabilities
    this.registerCapabilities({
      tools: ['terraform', 'security', 'monitor', 'recover'],
      resources: ['terraform-state', 'security-config'],
      prompts: ['infrastructure', 'security']
    });

    // Initialize metrics collection
    await this.metrics.init();
    this.logger.info('Infrastructure agent initialized');
  }

  // Terraform operations with robust error handling and state management
  async handleTerraform(args) {
    const { action, workspace = 'default' } = args;
    
    return this.circuitBreaker.execute(async () => {
      try {
        const startTime = Date.now();
        this.logger.info(`Starting Terraform ${action} operation`, { workspace });

        // Validate workspace
        if (!await this.validateWorkspace(workspace)) {
          throw new Error(`Invalid workspace: ${workspace}`);
        }

        let result;
        switch (action) {
          case 'init':
            result = await this.terraformInit(workspace);
            break;
          case 'plan':
            result = await this.terraformPlan(workspace);
            break;
          case 'apply':
            result = await this.terraformApply(workspace);
            break;
          case 'destroy':
            result = await this.terraformDestroy(workspace);
            break;
          default:
            throw new Error(`Unknown terraform action: ${action}`);
        }

        // Record metrics
        const duration = Date.now() - startTime;
        await this.metrics.recordOperation('terraform', action, duration, true);

        this.logger.info(`Terraform ${action} completed successfully`, { workspace, duration });
        return { success: true, data: result };
      } catch (error) {
        // Record failure metrics
        await this.metrics.recordOperation('terraform', action, 0, false);
        this.logger.error(`Terraform ${action} failed`, { error: error.message, workspace });
        throw error;
      }
    });
  }

  async validateWorkspace(workspace) {
    try {
      const workspaces = await this.listWorkspaces();
      return workspaces.includes(workspace);
    } catch (error) {
      this.logger.error('Workspace validation failed', { error: error.message });
      return false;
    }
  }

  async listWorkspaces() {
    const { stdout } = await execAsync('terraform workspace list', { cwd: this.terraformPath });
    return stdout.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('*'));
  }

  async terraformInit(workspace) {
    await execAsync('terraform init', { cwd: this.terraformPath });
    await this.backupState(workspace);
    return 'Terraform initialized successfully';
  }

  async terraformPlan(workspace) {
    const { stdout } = await execAsync('terraform plan', { cwd: this.terraformPath });
    await this.backupState(workspace);
    return stdout;
  }

  async terraformApply(workspace) {
    const { stdout } = await execAsync('terraform apply -auto-approve', { cwd: this.terraformPath });
    await this.backupState(workspace);
    return stdout;
  }

  async terraformDestroy(workspace) {
    const { stdout } = await execAsync('terraform destroy -auto-approve', { cwd: this.terraformPath });
    await this.backupState(workspace);
    return stdout;
  }

  async backupState(workspace) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.statePath, `${workspace}-${timestamp}.tfstate`);
    await fs.copyFile(
      path.join(this.terraformPath, 'terraform.tfstate'),
      backupPath
    );
  }

  // Enhanced security operations with policy enforcement
  async handleSecurity(args) {
    const { action, target, severity = 'MEDIUM' } = args;
    
    // Validate operation against security policy
    await this.securityPolicy.validateOperation('security-scanning', 'execute', {
      operationType: action,
      resourceUsage: await this.getCurrentResourceUsage()
    });

    return this.circuitBreaker.execute(async () => {
      try {
        const startTime = Date.now();
        this.logger.info(`Starting security ${action} operation`, { target, severity });

        let result;
        switch (action) {
          case 'scan':
            result = await this.performSecurityScan(target);
            if (result.vulnerabilities.length > 0) {
              const classification = await this.securityPolicy.classifySecurityIssue(result);
              await this.handleSecurityFindings(result, target, classification);
            }
            break;
          case 'validate':
            result = await this.validateSecurityConfig(target);
            if (!result.passed) {
              const classification = await this.securityPolicy.classifySecurityIssue(result);
              await this.handleSecurityFindings(result, target, classification);
            }
            break;
          case 'rotate':
            // Check if approval is required
            const approvalRequired = await this.securityPolicy.getRequiredApprovals('credential-rotation');
            if (approvalRequired) {
              await this.requestApproval('credential-rotation', {
                target,
                reason: 'Credential rotation requested'
              });
            }
            result = await this.rotateCredentials(target);
            if (result.failed.length > 0) {
              const classification = await this.securityPolicy.classifySecurityIssue(result);
              await this.handleSecurityFindings(result, target, classification);
            }
            break;
          default:
            throw new Error(`Unknown security action: ${action}`);
        }

        // Record metrics
        const duration = Date.now() - startTime;
        await this.metrics.recordOperation('security', action, duration, true);

        this.logger.info(`Security ${action} completed successfully`, { target, duration });
        return { success: true, data: result };
      } catch (error) {
        await this.metrics.recordOperation('security', action, 0, false);
        this.logger.error(`Security ${action} failed`, { error: error.message, target });
        
        // Escalate security failures
        await this.handleSecurityFailure(action, target, error);
        throw error;
      }
    });
  }

  async handleSecurityFindings(findings, target, classification) {
    const incident = {
      severity: classification.severity,
      description: `Security findings in ${target}`,
      affectedSystems: [target],
      detectedBy: this.name,
      findings,
      classification
    };

    const escalation = await this.securityEscalation.escalate(incident);
    this.logger.info('Security incident escalated', { 
      incidentId: escalation.incidentId, 
      severity: classification.severity,
      confidence: classification.confidence
    });
    
    return escalation;
  }

  async handleSecurityFailure(action, target, error) {
    const incident = {
      severity: 'HIGH',
      description: `Security operation ${action} failed on ${target}`,
      affectedSystems: [target],
      detectedBy: this.name,
      error: error.message
    };

    const escalation = await this.securityEscalation.escalate(incident);
    this.logger.error('Security operation failure escalated', { 
      incidentId: escalation.incidentId,
      action,
      target
    });
    
    return escalation;
  }

  async requestApproval(action, context) {
    const approvalRequirements = await this.securityPolicy.getRequiredApprovals(action);
    if (!approvalRequirements) {
      return true; // No approval required
    }

    // Implement approval request logic
    this.logger.info('Requesting approval', { action, context });
    // Add actual approval request implementation
    return false;
  }

  async getCurrentResourceUsage() {
    // Implement actual resource usage monitoring
    return {
      cpu: 0.2,  // 20%
      memory: 1024,  // 1GB
      storage: 5120  // 5GB
    };
  }

  determineSeverity(findings) {
    // Implement severity determination logic based on findings
    if (findings.criticalIssues > 0) return 'CRITICAL';
    if (findings.highIssues > 0) return 'HIGH';
    if (findings.mediumIssues > 0) return 'MEDIUM';
    return 'LOW';
  }

  async performSecurityScan(target) {
    // Implement actual security scanning
    const scanResults = {
      vulnerabilities: [],
      misconfigurations: [],
      recommendations: [],
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0
    };
    
    // Add actual scanning logic here
    return scanResults;
  }

  async validateSecurityConfig(target) {
    // Implement actual security validation
    const validationResults = {
      passed: true,
      issues: [],
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0
    };
    
    // Add actual validation logic here
    return validationResults;
  }

  async rotateCredentials(target) {
    // Implement actual credential rotation
    const rotationResults = {
      rotated: [],
      failed: [],
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0
    };
    
    // Add actual rotation logic here
    return rotationResults;
  }

  // Enhanced monitoring operations
  async handleMonitor(args) {
    const { action, target } = args;
    
    return this.circuitBreaker.execute(async () => {
      try {
        const startTime = Date.now();
        this.logger.info(`Starting monitoring ${action} operation`, { target });

        let result;
        switch (action) {
          case 'status':
            result = await this.checkInfrastructureStatus(target);
            break;
          case 'metrics':
            result = await this.collectMetrics(target);
            break;
          case 'alerts':
            result = await this.checkAlerts(target);
            break;
          default:
            throw new Error(`Unknown monitor action: ${action}`);
        }

        // Record metrics
        const duration = Date.now() - startTime;
        await this.metrics.recordOperation('monitor', action, duration, true);

        this.logger.info(`Monitoring ${action} completed successfully`, { target, duration });
        return { success: true, data: result };
      } catch (error) {
        await this.metrics.recordOperation('monitor', action, 0, false);
        this.logger.error(`Monitoring ${action} failed`, { error: error.message, target });
        throw error;
      }
    });
  }

  async checkInfrastructureStatus(target) {
    // Implement actual status checking
    return {
      status: 'healthy',
      components: []
    };
  }

  async collectMetrics(target) {
    // Implement actual metrics collection
    return await this.metrics.getMetrics(target);
  }

  async checkAlerts(target) {
    // Implement actual alert checking
    return {
      active: [],
      resolved: []
    };
  }

  // Enhanced recovery operations
  async handleRecover(args) {
    const { action, target } = args;
    
    return this.circuitBreaker.execute(async () => {
      try {
        const startTime = Date.now();
        this.logger.info(`Starting recovery ${action} operation`, { target });

        let result;
        switch (action) {
          case 'backup':
            result = await this.createBackup(target);
            break;
          case 'restore':
            result = await this.restoreFromBackup(target);
            break;
          case 'failover':
            result = await this.handleFailover(target);
            break;
          default:
            throw new Error(`Unknown recovery action: ${action}`);
        }

        // Record metrics
        const duration = Date.now() - startTime;
        await this.metrics.recordOperation('recovery', action, duration, true);

        this.logger.info(`Recovery ${action} completed successfully`, { target, duration });
        return { success: true, data: result };
      } catch (error) {
        await this.metrics.recordOperation('recovery', action, 0, false);
        this.logger.error(`Recovery ${action} failed`, { error: error.message, target });
        throw error;
      }
    });
  }

  async createBackup(target) {
    // Implement actual backup creation
    return {
      backupId: 'backup-' + Date.now(),
      location: 'backup-location'
    };
  }

  async restoreFromBackup(target) {
    // Implement actual restore from backup
    return {
      restored: true,
      components: []
    };
  }

  async handleFailover(target) {
    // Implement actual failover handling
    return {
      failedOver: true,
      newPrimary: 'new-primary-target'
    };
  }

  // Override base tool implementations
  async handleToolCall(params) {
    const { name, args } = params;
    switch (name) {
      case 'terraform':
        return this.handleTerraform(args);
      case 'security':
        return this.handleSecurity(args);
      case 'monitor':
        return this.handleMonitor(args);
      case 'recover':
        return this.handleRecover(args);
      default:
        return super.handleToolCall(params);
    }
  }

  async destroy() {
    await this.metrics.close();
    await super.destroy();
  }
} 