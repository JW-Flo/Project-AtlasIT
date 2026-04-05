const { BaseAgent } = require('./base_agent');
const { OktaAPI } = require('../utils/okta');
const { SlackAPI } = require('../utils/slack');
const { LoggingAPI } = require('../utils/logging');

class SecurityAgent extends BaseAgent {
    constructor() {
        super('security_agent');
        this.okta = new OktaAPI();
        this.slack = new SlackAPI();
        this.logging = new LoggingAPI();
        this.suspiciousActivities = new Set();
        this.accessLogs = new Map();
    }

    async initialize() {
        await super.initialize();
        this.setupSecurityChecks();
    }

    setupSecurityChecks() {
        // Security check intervals
        this.securityChecks = {
            accessReview: 3600000, // 1 hour
            threatScan: 300000,    // 5 minutes
            auditLog: 900000      // 15 minutes
        };
    }

    async monitorAccess() {
        try {
            const recentLogins = await this.okta.getRecentLogins();
            
            for (const login of recentLogins) {
                if (this.isSuspiciousLogin(login)) {
                    await this.handleSuspiciousLogin(login);
                }
                
                // Track access patterns
                this.trackAccessPattern(login);
            }
        } catch (error) {
            await this.handleSecurityError('access_monitoring', error);
        }
    }

    isSuspiciousLogin(login) {
        const suspiciousPatterns = [
            login.ipAddress.includes('unknown'),
            login.location.country === 'Unknown',
            login.device.type === 'Unknown',
            login.factorType === 'sms' && login.status === 'SUCCESS' && login.factorResult === 'SUCCESS'
        ];
        
        return suspiciousPatterns.some(pattern => pattern === true);
    }

    async handleSuspiciousLogin(login) {
        const message = `🚨 Suspicious login detected!\n` +
            `User: ${login.user.email}\n` +
            `IP: ${login.ipAddress}\n` +
            `Location: ${login.location.city}, ${login.location.country}\n` +
            `Device: ${login.device.type}`;
            
        await this.slack.sendAlert(message);
        await this.logging.logSecurityEvent('suspicious_login', login);
        
        // Add to suspicious activities
        this.suspiciousActivities.add(login.id);
        
        // Optionally trigger additional security measures
        await this.triggerSecurityMeasures(login);
    }

    async triggerSecurityMeasures(login) {
        try {
            // Require additional authentication
            await this.okta.requireAdditionalAuth(login.user.id);
            
            // Notify user
            await this.okta.sendSecurityAlert(login.user.id, {
                type: 'suspicious_login',
                details: login
            });
            
            // Log security measure
            await this.logging.logSecurityEvent('security_measure_triggered', {
                login,
                measures: ['additional_auth', 'user_notification']
            });
        } catch (error) {
            await this.handleSecurityError('security_measures', error);
        }
    }

    trackAccessPattern(login) {
        const userKey = login.user.id;
        if (!this.accessLogs.has(userKey)) {
            this.accessLogs.set(userKey, []);
        }
        
        const userLogs = this.accessLogs.get(userKey);
        userLogs.push({
            timestamp: new Date(),
            ip: login.ipAddress,
            location: login.location,
            device: login.device
        });
        
        // Keep only last 100 entries
        if (userLogs.length > 100) {
            userLogs.shift();
        }
    }

    async reviewAccessPatterns() {
        for (const [userId, logs] of this.accessLogs) {
            if (this.hasUnusualPattern(logs)) {
                await this.handleUnusualPattern(userId, logs);
            }
        }
    }

    hasUnusualPattern(logs) {
        if (logs.length < 3) return false;
        
        const recentLogs = logs.slice(-3);
        const locations = new Set(recentLogs.map(log => log.location.country));
        const ips = new Set(recentLogs.map(log => log.ip));
        
        // Unusual if multiple countries or IPs in short time
        return locations.size > 1 || ips.size > 1;
    }

    async handleUnusualPattern(userId, logs) {
        const message = `⚠️ Unusual access pattern detected for user ${userId}\n` +
            `Recent locations: ${[...new Set(logs.slice(-3).map(l => l.location.country))].join(', ')}\n` +
            `Recent IPs: ${[...new Set(logs.slice(-3).map(l => l.ip))].join(', ')}`;
            
        await this.slack.sendAlert(message);
        await this.logging.logSecurityEvent('unusual_pattern', { userId, logs: logs.slice(-3) });
    }

    async handleSecurityError(context, error) {
        const message = `❌ Security error in ${context}: ${error.message}`;
        await this.slack.sendAlert(message);
        await this.logging.logError('security', {
            context,
            error: error.message,
            stack: error.stack
        });
    }

    async start() {
        await this.initialize();
        
        // Start access monitoring
        setInterval(async () => {
            await this.monitorAccess();
        }, this.securityChecks.threatScan);
        
        // Start access pattern review
        setInterval(async () => {
            await this.reviewAccessPatterns();
        }, this.securityChecks.accessReview);
        
        this.log('Security agent started');
    }
}

module.exports = { SecurityAgent }; 