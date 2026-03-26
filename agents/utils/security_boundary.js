// This is a frozen configuration that cannot be modified at runtime
const IMMUTABLE_SECURITY_BOUNDARY = Object.freeze({
  // Core security principles that cannot be overridden
  corePrinciples: Object.freeze({
    noSelfModification: true,
    noPolicyBypass: true,
    noPrivilegeEscalation: true,
    noCredentialAccess: true
  }),

  // Systems that are completely off-limits
  restrictedSystems: Object.freeze([
    'security-policy',
    'security-boundary',
    'approval-system',
    'credential-store',
    'audit-logs'
  ]),

  // Operations that are completely forbidden
  forbiddenOperations: Object.freeze([
    'modify-security-policy',
    'bypass-approval',
    'escalate-privileges',
    'access-credentials',
    'modify-audit-logs'
  ]),

  // Maximum allowed permissions (cannot be increased)
  maxPermissions: Object.freeze({
    'terraform-state': {
      read: true,
      write: false,
      execute: false
    },
    'security-scanning': {
      read: true,
      write: false,
      execute: true
    },
    'credential-management': {
      read: false,
      write: false,
      execute: true
    }
  })
});

export class SecurityBoundary {
  constructor() {
    // Create a proxy to prevent modification of the boundary
    this.boundary = new Proxy(IMMUTABLE_SECURITY_BOUNDARY, {
      set: () => {
        throw new Error('Security boundary cannot be modified');
      },
      deleteProperty: () => {
        throw new Error('Security boundary properties cannot be deleted');
      }
    });

    // Initialize the audit log
    this.auditLog = [];
  }

  async validateOperation(system, operation, context = {}) {
    // First, check against immutable restrictions
    if (this.boundary.restrictedSystems.includes(system)) {
      this.logAudit('RESTRICTED_SYSTEM_ACCESS', {
        system,
        operation,
        context,
        result: 'DENIED'
      });
      throw new Error(`Access to restricted system: ${system}`);
    }

    if (this.boundary.forbiddenOperations.includes(operation)) {
      this.logAudit('FORBIDDEN_OPERATION', {
        system,
        operation,
        context,
        result: 'DENIED'
      });
      throw new Error(`Forbidden operation: ${operation}`);
    }

    // Check against maximum allowed permissions
    const maxPerms = this.boundary.maxPermissions[system];
    if (!maxPerms || !maxPerms[operation]) {
      this.logAudit('UNAUTHORIZED_OPERATION', {
        system,
        operation,
        context,
        result: 'DENIED'
      });
      throw new Error(`Unauthorized operation: ${operation} on system: ${system}`);
    }

    // Log successful validation
    this.logAudit('OPERATION_VALIDATED', {
      system,
      operation,
      context,
      result: 'ALLOWED'
    });

    return true;
  }

  async validateSecurityPolicy(policy) {
    // Ensure policy doesn't violate core principles
    for (const [key, value] of Object.entries(policy)) {
      if (this.boundary.corePrinciples[key] === false && value === true) {
        throw new Error(`Policy violates core security principle: ${key}`);
      }
    }

    // Ensure policy doesn't grant access to restricted systems
    for (const system of Object.keys(policy.authorizedSystems || {})) {
      if (this.boundary.restrictedSystems.includes(system)) {
        throw new Error(`Policy attempts to authorize restricted system: ${system}`);
      }
    }

    // Ensure policy doesn't allow forbidden operations
    for (const [system, perms] of Object.entries(policy.authorizedSystems || {})) {
      for (const [op, allowed] of Object.entries(perms)) {
        if (allowed && this.boundary.forbiddenOperations.includes(op)) {
          throw new Error(`Policy attempts to authorize forbidden operation: ${op}`);
        }
      }
    }

    return true;
  }

  logAudit(event, details) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      event,
      ...details
    };
    
    // Store in memory (in production, this would be sent to a secure audit log system)
    this.auditLog.push(auditEntry);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('AUDIT:', auditEntry);
    }
  }

  getAuditLog() {
    return [...this.auditLog];
  }

  // This method cannot be overridden or modified
  static getBoundary() {
    return IMMUTABLE_SECURITY_BOUNDARY;
  }
} 