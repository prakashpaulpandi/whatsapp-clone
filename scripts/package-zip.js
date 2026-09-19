const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const zipFile = path.join(rootDir, 'ChatSphere-FullStack.zip');

console.log('Creating ChatSphere zip archive...');

try {
  // PowerShell Compress-Archive
  const psCmd = `powershell -Command "Compress-Archive -Path '${rootDir}\\backend', '${rootDir}\\frontend', '${rootDir}\\README.md', '${rootDir}\\package.json', '${rootDir}\\scripts', '${rootDir}\\.gitignore' -DestinationPath '${zipFile}' -Force"`;
  execSync(psCmd, { stdio: 'inherit' });
  console.log('Successfully created zip file at: ' + zipFile);
} catch (e) {
  console.error('Error creating zip:', e);
}
