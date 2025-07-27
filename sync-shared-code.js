#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const MOBILE_APP_DIR = './MealPlannerApp';
const WEB_APP_DIR = './MealPlannerWeb';

// Directories and files to sync
const SYNC_PATHS = [
  'src/services',
  'src/types',
  'src/utils',
  'src/config/env.ts',
  'src/config/firebase.ts',
];

// Files/patterns to exclude from sync
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.test.',
  '.spec.',
  '__tests__',
  '__mocks__',
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyFileWithBackup(source, destination) {
  // Create backup if destination exists
  if (fs.existsSync(destination)) {
    const backupPath = `${destination}.backup`;
    fs.copyFileSync(destination, backupPath);
  }
  
  // Copy the file
  fs.copyFileSync(source, destination);
}

function syncDirectory(sourceDir, destDir, direction) {
  if (!fs.existsSync(sourceDir)) {
    log(`  ⚠️  Source directory not found: ${sourceDir}`, colors.yellow);
    return { copied: 0, skipped: 0 };
  }

  ensureDirectoryExists(destDir);
  
  let stats = { copied: 0, skipped: 0 };
  
  const files = fs.readdirSync(sourceDir);
  
  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(destDir, file);
    
    if (shouldExclude(sourcePath)) {
      stats.skipped++;
      return;
    }
    
    const stat = fs.statSync(sourcePath);
    
    if (stat.isDirectory()) {
      const subStats = syncDirectory(sourcePath, destPath, direction);
      stats.copied += subStats.copied;
      stats.skipped += subStats.skipped;
    } else {
      copyFileWithBackup(sourcePath, destPath);
      stats.copied++;
      log(`    ✓ ${file}`, colors.green);
    }
  });
  
  return stats;
}

function syncPath(relativePath, direction) {
  const sourcePath = direction === 'mobile-to-web' 
    ? path.join(MOBILE_APP_DIR, relativePath)
    : path.join(WEB_APP_DIR, relativePath);
    
  const destPath = direction === 'mobile-to-web'
    ? path.join(WEB_APP_DIR, relativePath)
    : path.join(MOBILE_APP_DIR, relativePath);
  
  log(`\n  Syncing: ${relativePath}`, colors.blue);
  
  const stat = fs.existsSync(sourcePath) && fs.statSync(sourcePath);
  
  if (!stat) {
    log(`  ⚠️  Source not found: ${sourcePath}`, colors.yellow);
    return { copied: 0, skipped: 0 };
  }
  
  if (stat.isDirectory()) {
    return syncDirectory(sourcePath, destPath, direction);
  } else {
    // Single file
    ensureDirectoryExists(path.dirname(destPath));
    copyFileWithBackup(sourcePath, destPath);
    log(`    ✓ ${path.basename(sourcePath)}`, colors.green);
    return { copied: 1, skipped: 0 };
  }
}

function getGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    return status.trim().split('\n').filter(line => line.trim());
  } catch (error) {
    return [];
  }
}

// Main sync function
function syncSharedCode(direction = 'mobile-to-web', options = {}) {
  const { dryRun = false, verbose = false } = options;
  
  log(`\n🔄 Syncing Shared Code`, colors.bright);
  log(`Direction: ${direction}`, colors.blue);
  
  if (dryRun) {
    log(`DRY RUN - No files will be modified`, colors.yellow);
  }
  
  // Check for uncommitted changes
  const gitChanges = getGitStatus();
  if (gitChanges.length > 0) {
    log(`\n⚠️  Warning: You have uncommitted changes:`, colors.yellow);
    gitChanges.slice(0, 5).forEach(change => log(`  ${change}`, colors.yellow));
    if (gitChanges.length > 5) {
      log(`  ... and ${gitChanges.length - 5} more`, colors.yellow);
    }
    log(`\nConsider committing your changes first!`, colors.yellow);
  }
  
  let totalStats = { copied: 0, skipped: 0 };
  
  // Sync each configured path
  SYNC_PATHS.forEach(syncPathConfig => {
    const stats = syncPath(syncPathConfig, direction);
    totalStats.copied += stats.copied;
    totalStats.skipped += stats.skipped;
  });
  
  // Summary
  log(`\n✅ Sync Complete!`, colors.green);
  log(`   Files copied: ${totalStats.copied}`, colors.green);
  log(`   Files skipped: ${totalStats.skipped}`, colors.yellow);
  
  // Remind about manual steps
  log(`\n📝 Don't forget to:`, colors.blue);
  log(`   1. Test both apps after syncing`);
  log(`   2. Update platform-specific code if needed`);
  log(`   3. Commit changes in both projects`);
}

// CLI interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  switch (command) {
    case 'mobile-to-web':
    case 'mtw':
      syncSharedCode('mobile-to-web');
      break;
      
    case 'web-to-mobile':
    case 'wtm':
      syncSharedCode('web-to-mobile');
      break;
      
    case 'watch':
      log(`👀 Watching for changes...`, colors.blue);
      log(`Press Ctrl+C to stop\n`, colors.yellow);
      
      // Watch for changes in mobile app
      const watchDir = path.join(MOBILE_APP_DIR, 'src/services');
      
      require('fs').watch(watchDir, { recursive: true }, (eventType, filename) => {
        if (filename && !shouldExclude(filename)) {
          log(`\n📝 Change detected: ${filename}`, colors.yellow);
          syncSharedCode('mobile-to-web');
        }
      });
      break;
      
    case 'help':
    default:
      log(`
🔧 Shared Code Sync Tool

Usage:
  node sync-shared-code.js [command]

Commands:
  mobile-to-web (mtw)  - Sync from mobile app to web app
  web-to-mobile (wtm)  - Sync from web app to mobile app  
  watch               - Watch mobile app and auto-sync changes
  help                - Show this help message

Examples:
  node sync-shared-code.js mtw        # Sync mobile → web
  node sync-shared-code.js watch      # Auto-sync on changes

Configuration:
  Edit SYNC_PATHS in this script to customize what gets synced
      `, colors.blue);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { syncSharedCode }; 