import { FilesystemAgent } from '../agents/filesystem_agent.js';
import { InfrastructureAgent } from '../agents/infrastructure_agent.js';

async function startAgents() {
  try {
    // Create and initialize the filesystem agent
    const filesystemAgent = new FilesystemAgent();
    await filesystemAgent.init();
    console.log('Filesystem agent initialized successfully');
    console.log('Filesystem agent capabilities:', filesystemAgent.getCapabilities());

    // Create and initialize the infrastructure agent
    const infrastructureAgent = new InfrastructureAgent();
    await infrastructureAgent.init();
    console.log('Infrastructure agent initialized successfully');
    console.log('Infrastructure agent capabilities:', infrastructureAgent.getCapabilities());

    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('Shutting down agents...');
      await filesystemAgent.destroy();
      await infrastructureAgent.destroy();
      process.exit(0);
    });

  } catch (error) {
    console.error('Error starting agents:', error);
    process.exit(1);
  }
}

// Start the agents
startAgents(); 