const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PG_DATA = "C:\\Program Files\\PostgreSQL\\18\\data";
const PG_BIN = "C:\\Program Files\\PostgreSQL\\18\\bin\\postgres.exe";
const PID_FILE = path.join(PG_DATA, 'postmaster.pid');

// Clear stale postmaster.pid if it exists
if (fs.existsSync(PID_FILE)) {
  try {
    fs.unlinkSync(PID_FILE);
    console.log('Removed stale postmaster.pid file.');
  } catch (err) {
    console.error('Failed to remove stale postmaster.pid:', err.message);
  }
}

let pgProcess = null;
let nextProcess = null;

function cleanup() {
  console.log('\nShutting down servers...');
  if (pgProcess) {
    console.log('Stopping PostgreSQL...');
    pgProcess.kill();
  }
  if (nextProcess) {
    console.log('Stopping Next.js...');
    nextProcess.kill();
  }
  // Wait a moment and ensure lock file is deleted
  setTimeout(() => {
    if (fs.existsSync(PID_FILE)) {
      try {
        fs.unlinkSync(PID_FILE);
        console.log('Cleaned up postmaster.pid lock file.');
      } catch (err) {}
    }
    process.exit(0);
  }, 1000);
}

// Register cleanup on termination signals
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

console.log('Starting PostgreSQL server...');
pgProcess = spawn(PG_BIN, ['-D', PG_DATA], { stdio: 'inherit' });

pgProcess.on('error', (err) => {
  console.error('Failed to start PostgreSQL:', err.message);
});

// Wait 2.5 seconds for PostgreSQL to initialize before starting Next.js
setTimeout(() => {
  console.log('Starting Next.js development server...');
  const isWindows = process.platform === 'win32';
  const nextCmd = isWindows ? 'npx.cmd' : 'npx';
  nextProcess = spawn(nextCmd, ['next', 'dev'], { stdio: 'inherit', shell: true });

  nextProcess.on('error', (err) => {
    console.error('Failed to start Next.js dev server:', err.message);
  });

  nextProcess.on('exit', (code) => {
    console.log(`Next.js process exited with code ${code}`);
    cleanup();
  });
}, 2500);
