import { LoggingAPI } from './logging.js';

export class SlackAPI {
    constructor() {
        this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
        this.logging = new LoggingAPI();
        
        if (!this.webhookUrl) {
            console.warn('Warning: SLACK_WEBHOOK_URL not set. Slack notifications will be disabled.');
        }
    }

    async sendAlert(message) {
        if (!this.webhookUrl) {
            await this.logging.logWarning('slack', 'Slack notification skipped - webhook URL not configured');
            return;
        }

        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: message,
                    username: 'Project Ignite',
                    icon_emoji: ':rocket:'
                })
            });

            if (!response.ok) {
                throw new Error(`Slack API responded with status ${response.status}`);
            }

            await this.logging.logInfo('slack', 'Notification sent successfully');
        } catch (error) {
            await this.logging.logError('slack', {
                context: 'sendAlert',
                error: error.message,
                stack: error.stack
            });
            // Don't throw - we don't want Slack failures to break the main application
        }
    }
} 