#!/usr/bin/env node

import orchestrator from '../agents/orchestrator.js';
import { LoggingAPI } from '../utils/logging.js';
import { SlackAPI } from '../utils/slack.js';

async function main() {
    const logging = new LoggingAPI();
    const slack = new SlackAPI();
    
    try {
        // Log startup
        await logging.logInfo('system', 'Starting agent system...');
        await slack.sendAlert('🚀 Starting Project Ignite agent system');
        
        // Start all agents
        await orchestrator.startAllAgents();
        
        // Log successful startup
        await logging.logInfo('system', 'Agent system started successfully');
        await slack.sendAlert('✅ Project Ignite agent system started successfully');
        
        // Handle process termination
        process.on('SIGINT', async () => {
            await handleShutdown('SIGINT');
        });
        
        process.on('SIGTERM', async () => {
            await handleShutdown('SIGTERM');
        });
        
    } catch (error) {
        await handleStartupError(error);
    }
}

async function handleShutdown(signal) {
    const logging = new LoggingAPI();
    const slack = new SlackAPI();
    
    try {
        await logging.logInfo('system', `Received ${signal}, shutting down...`);
        await slack.sendAlert(`🛑 Shutting down Project Ignite agent system (${signal})`);
        
        // Stop all agents
        await orchestrator.stopAllAgents();
        
        await logging.logInfo('system', 'Agent system shut down successfully');
        await slack.sendAlert('✅ Project Ignite agent system shut down successfully');
        
        process.exit(0);
    } catch (error) {
        await logging.logError('system', {
            context: 'shutdown',
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
}

async function handleStartupError(error) {
    const logging = new LoggingAPI();
    const slack = new SlackAPI();
    
    await logging.logError('system', {
        context: 'startup',
        error: error.message,
        stack: error.stack
    });
    
    await slack.sendAlert(
        `❌ Failed to start Project Ignite agent system:\n` +
        `Error: ${error.message}\n` +
        `Check logs for details.`
    );
    
    process.exit(1);
}

// Start the system
main().catch(handleStartupError); 