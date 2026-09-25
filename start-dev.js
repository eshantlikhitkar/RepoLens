const { spawn } = require('child_process');
const path = require('path');

console.log('========================================================');
console.log('🚀 Starting RepoLens AI (Backend + Frontend)...');
console.log('========================================================\n');

// 1. Start Backend
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true,
});

// 2. Start Frontend
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true,
});

function handleExit() {
  console.log('\nShutting down RepoLens AI processes...');
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit(0);
}

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
