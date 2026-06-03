#!/usr/bin/env node

const { execFileSync } = require('child_process');

const platformScripts = {
    darwin: 'build:mac',
    win32: 'build:win',
    linux: 'build:linux'
};

const script = platformScripts[process.platform];

if (!script) {
    console.error(`Unsupported platform for build: ${process.platform}`);
    process.exit(1);
}

console.log(`Running ${script} for ${process.platform}...`);
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
execFileSync(npmCommand, ['run', script], { stdio: 'inherit' });
