#!/usr/bin/env node
/**
 * Auto-increment version script
 * Run with: node scripts/bump-version.js [major|minor|patch]
 * Default: patch
 *
 * Updates both version.ts and sw.js to keep them in sync
 */

const fs = require('fs');
const path = require('path');

const versionFile = path.join(__dirname, '../src/utils/version.ts');
const swFile = path.join(__dirname, '../public/sw.js');

// Read current version
const content = fs.readFileSync(versionFile, 'utf8');
const versionMatch = content.match(/APP_VERSION = '(\d+)\.(\d+)\.(\d+)'/);

if (!versionMatch) {
  console.error('Could not find version in version.ts');
  process.exit(1);
}

let [, major, minor, patch] = versionMatch.map(Number);

// Determine bump type from argument
const bumpType = process.argv[2] || 'patch';

switch (bumpType) {
  case 'major':
    major++;
    minor = 0;
    patch = 0;
    break;
  case 'minor':
    minor++;
    patch = 0;
    break;
  case 'patch':
  default:
    patch++;
    break;
}

const newVersion = `${major}.${minor}.${patch}`;
const today = new Date().toISOString().split('T')[0];

// Update version.ts
const newContent = `// App version - auto-updated on build
// Format: MAJOR.MINOR.PATCH
export const APP_VERSION = '${newVersion}';

// Build timestamp - updated each build
export const BUILD_DATE = '${today}';

// Full version string for display
export const VERSION_STRING = \`Suprik v\${APP_VERSION}\`;
`;

fs.writeFileSync(versionFile, newContent);

// Update sw.js version
const swContent = fs.readFileSync(swFile, 'utf8');
const updatedSwContent = swContent.replace(
  /const VERSION = '[^']+';/,
  `const VERSION = '${newVersion}';`
);
fs.writeFileSync(swFile, updatedSwContent);

console.log(`Version bumped: ${versionMatch[0].split("'")[1]} -> ${newVersion}`);
console.log(`Build date: ${today}`);
console.log(`Service Worker version synced: ${newVersion}`);
