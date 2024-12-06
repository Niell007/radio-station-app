import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read schema file
const schema = readFileSync(join(__dirname, '../schema.sql'), 'utf-8');

// Create D1 database
console.log('Creating D1 database...');
execSync('npx wrangler d1 create radio-station-db', { stdio: 'inherit' });

// Create tables
console.log('Creating tables...');
execSync(`echo "${schema}" | npx wrangler d1 execute radio-station-db --local`, {
  stdio: 'inherit',
});

// Create KV namespace
console.log('Creating KV namespace...');
execSync('npx wrangler kv:namespace create "YOUR_NAMESPACE_NAME"', { stdio: 'inherit' });

console.log('Database and KV namespace initialization complete!');
