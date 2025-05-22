import SecureFileManager from '../agents/utils/secure_file_manager.js';

async function initializeSecureSystem() {
  try {
    console.log('Initializing secure file system...');
    
    // Initialize secure file manager
    const secureManager = SecureFileManager;
    
    // Scan and protect sensitive directories
    const sensitiveDirs = process.env.SENSITIVE_DIRS.split(',');
    
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
