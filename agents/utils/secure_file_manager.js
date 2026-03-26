// Secure file manager for automatically protecting sensitive files
// Applies deep security to files matching sensitive patterns

import FileSecurity from './file_security.js';
import { SecurityCore } from './security_core.js';

const SecureFileManager = (() => {
  // Buried configuration
  const _0x2a3b = new WeakMap();
  const _0x4c5d = new WeakMap();
  
  // Security levels for different file types
  const _0x6e7f = {
    critical: [
      /\.(key|pem|cert)$/i,
      /(master|root|admin)/i,
      /(password|credential|auth)/i
    ],
    high: [
      /\.(env|config|secret|token)$/i,
      /(security|policy|permission)/i,
      /(api|access|token)/i
    ],
    medium: [
      /\.(json|yaml|yml)$/i,
      /(config|setting|profile)/i
    ]
  };

  class SecureFileManager {
    constructor() {
      this._initializeManager();
    }

    _initializeManager() {
      // Create secure context
      const secureContext = new WeakMap();
      this._secureContext = secureContext;

      // Initialize manager state
      secureContext.set(this, {
        wrappedFiles: new Map(),
        securityCore: SecurityCore.getInstance(),
        accessLog: new Map(),
        lastScan: null
      });

      // Bind secure methods
      this._bindSecureMethods();
    }

    _bindSecureMethods() {
      // Bind and protect methods
      const methods = [
        'wrapFile',
        'unwrapFile',
        'scanDirectory',
        'verifyIntegrity'
      ];

      methods.forEach(method => {
        this[method] = this[method].bind(this);
        Object.defineProperty(this, method, {
          writable: false,
          configurable: false
        });
      });
    }

    async wrapFile(filePath) {
      // Wrap file with appropriate security level
      const secureContext = this._secureContext.get(this);
      if (!secureContext) throw new Error('Security context not found');

      // Determine security level
      const securityLevel = this._determineSecurityLevel(filePath);
      
      // Create secure wrapper
      const wrapper = FileSecurity.wrapFile(filePath, securityLevel);
      
      // Store wrapper
      secureContext.wrappedFiles.set(filePath, {
        wrapper,
        securityLevel,
        wrappedAt: Date.now(),
        lastAccess: null,
        accessCount: 0
      });

      return wrapper;
    }

    async unwrapFile(filePath) {
      // Remove file from secure management
      const secureContext = this._secureContext.get(this);
      if (!secureContext) throw new Error('Security context not found');

      const fileInfo = secureContext.wrappedFiles.get(filePath);
      if (!fileInfo) throw new Error('File not found in secure management');

      // Verify final access
      await this._verifyAccess(filePath);

      // Remove from management
      secureContext.wrappedFiles.delete(filePath);
    }

    async scanDirectory(directory) {
      // Scan directory for sensitive files
      const secureContext = this._secureContext.get(this);
      if (!secureContext) throw new Error('Security context not found');

      // Update scan timestamp
      secureContext.lastScan = Date.now();

      // Scan directory
      const files = await this._listFiles(directory);
      
      // Wrap sensitive files
      for (const file of files) {
        if (this._isSensitiveFile(file)) {
          await this.wrapFile(file);
        }
      }
    }

    async verifyIntegrity() {
      // Verify integrity of all wrapped files
      const secureContext = this._secureContext.get(this);
      if (!secureContext) throw new Error('Security context not found');

      for (const [filePath, fileInfo] of secureContext.wrappedFiles) {
        try {
          await fileInfo.wrapper._validateIntegrity();
        } catch (error) {
          throw new Error(`Integrity check failed for ${filePath}: ${error.message}`);
        }
      }
    }

    _determineSecurityLevel(filePath) {
      // Determine appropriate security level for file
      for (const [level, patterns] of Object.entries(_0x6e7f)) {
        if (patterns.some(pattern => pattern.test(filePath))) {
          return level;
        }
      }
      return 'low';
    }

    _isSensitiveFile(filePath) {
      // Check if file should be secured
      return Object.values(_0x6e7f).some(patterns =>
        patterns.some(pattern => pattern.test(filePath))
      );
    }

    async _verifyAccess(filePath) {
      // Verify access to file
      const secureContext = this._secureContext.get(this);
      if (!secureContext) throw new Error('Security context not found');

      const fileInfo = secureContext.wrappedFiles.get(filePath);
      if (!fileInfo) throw new Error('File not found in secure management');

      // Update access tracking
      fileInfo.lastAccess = Date.now();
      fileInfo.accessCount++;

      // Log access
      secureContext.accessLog.set(filePath, {
        timestamp: Date.now(),
        count: fileInfo.accessCount
      });
    }

    async _listFiles(directory) {
      // List files in directory
      // Implementation depends on environment
      return [];
    }
  }

  // Create secure file manager instance
  const instance = new SecureFileManager();
  Object.freeze(instance);

  return instance;
})();

export default SecureFileManager; 