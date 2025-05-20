import { BaseAgent } from './base_agent.js';

export class PrioritizerAgent extends BaseAgent {
  constructor(ctx, env) {
    super(ctx, env);
    this.name = 'prioritizer-agent';
    this.version = '1.0.0';
    
    // Task priority levels (aligned with Jira)
    this.PRIORITIES = {
      BLOCKER: 0,     // Jira Blocker
      CRITICAL: 1,    // Jira Critical
      HIGH: 2,        // Jira High
      MEDIUM: 3,      // Jira Medium
      LOW: 4          // Jira Low
    };

    // Task categories (aligned with Jira issue types)
    this.TASK_CATEGORIES = {
      BUG: 'bug',
      TASK: 'task',
      STORY: 'story',
      EPIC: 'epic',
      SUBTASK: 'subtask',
      DEPLOYMENT: 'deployment',
      DOCUMENTATION: 'documentation',
      CODE_REVIEW: 'code_review',
      OPTIMIZATION: 'optimization',
      TERMINAL: 'terminal_command'
    };

    // Resource allocation limits
    this.RESOURCE_LIMITS = {
      BLOCKER: { maxConcurrent: 2, timeout: 300000 },   // 5 minutes
      CRITICAL: { maxConcurrent: 3, timeout: 600000 },  // 10 minutes
      HIGH: { maxConcurrent: 5, timeout: 900000 },      // 15 minutes
      MEDIUM: { maxConcurrent: 10, timeout: 1800000 },  // 30 minutes
      LOW: { maxConcurrent: 20, timeout: 3600000 }      // 1 hour
    };

    // Track active tasks and their resources
    this.activeTasks = new Map();
    this.taskQueue = [];
    
    // MCP coordination
    this.mcpStatus = {
      isAvailable: true,
      lastHeartbeat: Date.now(),
      activeDeployments: 0
    };
  }

  /**
   * Initialize the prioritizer agent
   */
  async initialize() {
    await super.initialize();
    this.log('Prioritizer agent initialized');
    
    // Register with MCP
    await this.registerWithMCP();
    
    // Start monitoring task queue
    this.startTaskMonitor();
  }

  /**
   * Register with MCP as a sub-agent
   */
  async registerWithMCP() {
    try {
      await this.mcp.callTool({
        name: 'agent/register',
        arguments: {
          name: this.name,
          version: this.version,
          type: 'prioritizer',
          capabilities: Object.values(this.TASK_CATEGORIES),
          parent: 'mcp'
        }
      });
      this.log('Registered with MCP as prioritizer agent');
    } catch (error) {
      this.log('Failed to register with MCP:', error);
      throw error;
    }
  }

  /**
   * Start monitoring the task queue
   */
  async startTaskMonitor() {
    while (true) {
      try {
        await this.processTaskQueue();
        await new Promise(r => setTimeout(r, 5000)); // Poll every 5 seconds
      } catch (error) {
        this.log('Error in task monitor:', error);
        await this.escalate('CRITICAL', `Task monitor error: ${error.message}`);
      }
    }
  }

  /**
   * Process the task queue
   */
  async processTaskQueue() {
    // Check MCP status first
    await this.checkMCPStatus();
    
    // Get current tasks from MCP
    const tasks = await this.fetchTasks();
    
    // Update queue with new tasks
    this.updateTaskQueue(tasks);
    
    // Process tasks based on priority
    await this.executePrioritizedTasks();
  }

  /**
   * Check MCP status and availability
   */
  async checkMCPStatus() {
    try {
      const status = await this.mcp.callTool({
        name: 'status/check',
        arguments: {}
      });
      
      this.mcpStatus = {
        isAvailable: status.available,
        lastHeartbeat: Date.now(),
        activeDeployments: status.activeDeployments || 0
      };
      
      // Adjust resource limits based on MCP load
      this.adjustResourceLimits();
    } catch (error) {
      this.log('Error checking MCP status:', error);
      this.mcpStatus.isAvailable = false;
    }
  }

  /**
   * Adjust resource limits based on MCP load
   */
  adjustResourceLimits() {
    const baseLoad = this.mcpStatus.activeDeployments;
    
    // Reduce concurrent tasks if MCP is under heavy load
    if (baseLoad > 5) {
      for (const priority in this.RESOURCE_LIMITS) {
        this.RESOURCE_LIMITS[priority].maxConcurrent = Math.max(
          1,
          Math.floor(this.RESOURCE_LIMITS[priority].maxConcurrent * 0.7)
        );
      }
    } else {
      // Reset to default limits
      this.RESOURCE_LIMITS = {
        BLOCKER: { maxConcurrent: 2, timeout: 300000 },
        CRITICAL: { maxConcurrent: 3, timeout: 600000 },
        HIGH: { maxConcurrent: 5, timeout: 900000 },
        MEDIUM: { maxConcurrent: 10, timeout: 1800000 },
        LOW: { maxConcurrent: 20, timeout: 3600000 }
      };
    }
  }

  /**
   * Fetch tasks from MCP and Jira
   */
  async fetchTasks() {
    try {
      // Get tasks from MCP
      const mcpResponse = await this.mcp.callTool({
        name: 'task/list',
        arguments: { status: 'pending' }
      });
      
      // Get tasks from Jira
      const jiraResponse = await this.mcp.callTool({
        name: 'jira/tasks',
        arguments: { status: 'in_progress' }
      });
      
      // Combine and normalize tasks
      const tasks = [
        ...(mcpResponse.tasks || []),
        ...(jiraResponse.issues || []).map(issue => this.normalizeJiraTask(issue))
      ];
      
      return tasks;
    } catch (error) {
      this.log('Error fetching tasks:', error);
      return [];
    }
  }

  /**
   * Normalize Jira task to internal format
   */
  normalizeJiraTask(issue) {
    return {
      id: issue.key,
      title: issue.fields.summary,
      description: issue.fields.description,
      priority: this.mapJiraPriority(issue.fields.priority.name),
      category: this.mapJiraType(issue.fields.issuetype.name),
      status: issue.fields.status.name.toLowerCase(),
      assignee: issue.fields.assignee?.displayName,
      created: new Date(issue.fields.created).getTime(),
      updated: new Date(issue.fields.updated).getTime(),
      source: 'jira'
    };
  }

  /**
   * Map Jira priority to internal priority
   */
  mapJiraPriority(jiraPriority) {
    const priorityMap = {
      'Blocker': 'BLOCKER',
      'Critical': 'CRITICAL',
      'High': 'HIGH',
      'Medium': 'MEDIUM',
      'Low': 'LOW'
    };
    return priorityMap[jiraPriority] || 'MEDIUM';
  }

  /**
   * Map Jira issue type to internal category
   */
  mapJiraType(jiraType) {
    const typeMap = {
      'Bug': 'BUG',
      'Task': 'TASK',
      'Story': 'STORY',
      'Epic': 'EPIC',
      'Sub-task': 'SUBTASK'
    };
    return typeMap[jiraType] || 'TASK';
  }

  /**
   * Update the task queue with new tasks
   */
  updateTaskQueue(tasks) {
    // Add new tasks to queue
    for (const task of tasks) {
      if (!this.activeTasks.has(task.id)) {
        this.taskQueue.push(task);
      }
    }

    // Sort queue by priority
    this.taskQueue.sort((a, b) => {
      const priorityA = this.PRIORITIES[a.priority] ?? this.PRIORITIES.MEDIUM;
      const priorityB = this.PRIORITIES[b.priority] ?? this.PRIORITIES.MEDIUM;
      return priorityA - priorityB;
    });
  }

  /**
   * Execute tasks based on priority and resource limits
   */
  async executePrioritizedTasks() {
    for (const priority of Object.keys(this.PRIORITIES)) {
      const limit = this.RESOURCE_LIMITS[priority];
      const activeCount = Array.from(this.activeTasks.values())
        .filter(task => task.priority === priority).length;

      // Process tasks of this priority if under limit
      while (activeCount < limit.maxConcurrent && this.taskQueue.length > 0) {
        const task = this.taskQueue.shift();
        if (task.priority === priority) {
          await this.executeTask(task);
        } else {
          // Put back in queue if not matching priority
          this.taskQueue.unshift(task);
          break;
        }
      }
    }
  }

  /**
   * Execute a single task
   */
  async executeTask(task) {
    try {
      // Mark task as active
      this.activeTasks.set(task.id, {
        ...task,
        startTime: Date.now()
      });

      // Get appropriate agent for task
      const agent = await this.assignTaskToAgent(task);
      
      // Execute task
      const result = await agent.execute(task);
      
      // Handle result
      await this.handleTaskResult(task, result);
      
      // Remove from active tasks
      this.activeTasks.delete(task.id);
    } catch (error) {
      await this.handleTaskError(task, error);
    }
  }

  /**
   * Assign task to appropriate agent
   */
  async assignTaskToAgent(task) {
    // Get available agents from MCP
    const agents = await this.mcp.callTool({
      name: 'agent/list',
      arguments: { status: 'available' }
    });

    // Find best matching agent
    const agent = agents.find(a => a.capabilities.includes(task.category));
    if (!agent) {
      throw new Error(`No suitable agent found for task category: ${task.category}`);
    }

    return agent;
  }

  /**
   * Handle task execution result
   */
  async handleTaskResult(task, result) {
    // Update task status in MCP
    await this.mcp.callTool({
      name: 'task/update',
      arguments: {
        taskId: task.id,
        status: 'completed',
        result
      }
    });

    // Log completion
    this.log(`Task ${task.id} completed successfully`);
  }

  /**
   * Handle task execution error
   */
  async handleTaskError(task, error) {
    // Get current retry count
    const retryCount = (task.retryCount || 0) + 1;
    
    // Check if should escalate based on priority
    const shouldEscalate = this.shouldEscalateTask(task, retryCount);
    
    if (shouldEscalate) {
      await this.escalateTask(task, error);
    } else {
      // Retry task
      this.taskQueue.unshift({
        ...task,
        retryCount,
        lastError: error.message
      });
    }

    // Remove from active tasks
    this.activeTasks.delete(task.id);
  }

  /**
   * Determine if task should be escalated
   */
  shouldEscalateTask(task, retryCount) {
    const priority = task.priority || 'MEDIUM';
    
    switch (priority) {
      case 'BLOCKER':
        return retryCount >= 1;
      case 'CRITICAL':
        return retryCount >= 2;
      case 'HIGH':
        return retryCount >= 3;
      case 'MEDIUM':
        return retryCount >= 4;
      case 'LOW':
        return retryCount >= 2;
      default:
        return retryCount >= 3;
    }
  }

  /**
   * Escalate task to higher authority
   */
  async escalateTask(task, error) {
    const priority = task.priority || 'MEDIUM';
    const message = `Task ${task.id} failed after ${task.retryCount} retries. Error: ${error.message}`;
    
    // Escalate based on priority
    switch (priority) {
      case 'BLOCKER':
        // Escalate to department head, then executive, then MCP
        await this.escalate('CRITICAL', message);
        break;
      case 'CRITICAL':
        // Escalate to department head
        await this.escalate('CRITICAL', message);
        break;
      case 'HIGH':
        // Escalate to department head
        await this.escalate('HIGH', message);
        break;
      case 'MEDIUM':
        // Log and notify department head
        this.log(message);
        await this.escalate('MEDIUM', message);
        break;
      case 'LOW':
        // Just log
        this.log(message);
        break;
    }

    // Update task status in MCP
    await this.mcp.callTool({
      name: 'task/update',
      arguments: {
        taskId: task.id,
        status: 'failed',
        error: error.message,
        escalated: true
      }
    });
  }

  /**
   * Get current task queue status
   */
  async getQueueStatus() {
    return {
      activeTasks: Array.from(this.activeTasks.values()),
      queuedTasks: this.taskQueue,
      resourceUsage: this.calculateResourceUsage()
    };
  }

  /**
   * Calculate current resource usage
   */
  calculateResourceUsage() {
    const usage = {};
    for (const priority of Object.keys(this.PRIORITIES)) {
      const limit = this.RESOURCE_LIMITS[priority];
      const active = Array.from(this.activeTasks.values())
        .filter(task => task.priority === priority).length;
      
      usage[priority] = {
        active,
        limit: limit.maxConcurrent,
        utilization: (active / limit.maxConcurrent) * 100
      };
    }
    return usage;
  }
} 