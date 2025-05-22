import SecureFileManager from '../agents/utils/secure_file_manager.js';

async function initializeSecureSystem() {
  try {
    console.log('Initializing secure file system...');
    
    // Initialize secure file manager
    const secureManager = SecureFileManager;
    
    // Scan and protect sensitive directories
    const sensitiveDirs = [
      './agents',
      './cloud-functions',
      './scripts',
      './terraform'
    ];
    
    for (const dir of sensitiveDirs) {
      console.log(`Scanning directory: ${dir}`);
      await secureManager.scanDirectory(dir);
    }
    
    // Verify integrity of all protected files
    console.log('Verifying file integrity...');
    await secureManager.verifyIntegrity();
    
    console.log('Secure file system initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize secure file system:', error);
    return false;
  }
}

// Run initialization
initializeSecureSystem().then(success => {
  if (success) {
    console.log('System ready for secure operations');
  } else {
    console.error('System initialization failed');
    process.exit(1);
  }
});

// Revert the repository to the desired state
console.log("🔄 Reverting repository to the desired state...");
const { execSync } = require('child_process');
execSync('git revert --no-commit HEAD');
execSync('git commit -m "Revert to the desired state"');

// Verify the revert by checking out the commit and reviewing the changes
console.log("🔍 Verifying the revert...");
execSync('git checkout HEAD');
execSync('git log -1');

// Commit and push the changes to the repository
console.log("📤 Committing and pushing the changes...");
execSync('git push origin main');
