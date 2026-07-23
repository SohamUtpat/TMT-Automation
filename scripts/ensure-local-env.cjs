/**
 * Ensures .env.local exists (copied from .env.local.example) for local Playwright runs.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const example = path.join(root, '.env.local.example');
const target = path.join(root, '.env.local');

if (fs.existsSync(target)) {
  console.log('.env.local already exists — not overwriting.');
  process.exit(0);
}

if (!fs.existsSync(example)) {
  console.error('Missing .env.local.example');
  process.exit(1);
}

fs.copyFileSync(example, target);
console.log('Created .env.local from .env.local.example');
console.log('Edit VALID_USERNAME / VALID_PASSWORD if your local admin differs.');
console.log('Then start backend + frontend and run: npm run test:local');
