import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node scripts/wrangler-safe.mjs <wrangler-args...>');
  process.exit(1);
}

const invalidProxyPattern = /^https?:\/\/(?:127\.0\.0\.1|localhost):9\/?$/i;
const proxyVars = [
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'http_proxy',
  'https_proxy',
  'ALL_PROXY',
  'all_proxy',
];

const env = { ...process.env };
const removedProxyVars = [];

for (const proxyVar of proxyVars) {
  const value = env[proxyVar];
  if (typeof value === 'string' && invalidProxyPattern.test(value)) {
    delete env[proxyVar];
    removedProxyVars.push(`${proxyVar}=${value}`);
  }
}

if (removedProxyVars.length > 0) {
  console.log('Removing invalid proxy settings for Wrangler:');
  for (const removedProxyVar of removedProxyVars) {
    console.log(`- ${removedProxyVar}`);
  }
}

const localWranglerScript = path.resolve(
  'node_modules',
  'wrangler',
  'bin',
  'wrangler.js'
);

const hasLocalWranglerScript = existsSync(localWranglerScript);

const command = hasLocalWranglerScript
  ? process.execPath
  : process.platform === 'win32'
    ? 'npx.cmd'
    : 'npx';

const commandArgs = hasLocalWranglerScript
  ? [localWranglerScript, ...args]
  : ['--no-install', 'wrangler', ...args];

const child = spawn(command, commandArgs, {
  env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
