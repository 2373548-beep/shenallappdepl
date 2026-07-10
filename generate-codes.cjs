
const fs = require('fs');
const path = require('path');

function generateUniqueCode(existing) {
  let code;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (existing.has(code));
  existing.add(code);
  return code;
}

const existing = new Set();
const codes = [];

// 1 Admin code
const adminCode = generateUniqueCode(existing);
codes.push({ code: adminCode, type: 'admin' });
console.log(`Admin code: ${adminCode}`);

// 2000 - 15 days
for (let i = 0; i < 2000; i++) {
  codes.push({ code: generateUniqueCode(existing), type: '15_days' });
}

// 1000 - 1 month
for (let i = 0; i < 1000; i++) {
  codes.push({ code: generateUniqueCode(existing), type: '1_month' });
}

// 100 - lifetime
for (let i = 0; i < 100; i++) {
  codes.push({ code: generateUniqueCode(existing), type: 'lifetime' });
}

// Save to public folder for easy access
const outputPath = path.join(__dirname, 'public', 'access-codes.txt');
const textOutput = codes.map(c => `${c.code} | ${c.type}`).join('\n');
fs.writeFileSync(outputPath, textOutput, 'utf8');
console.log(`Generated ${codes.length} codes saved to public/access-codes.txt!`);
console.log('Copy of the codes is also saved in src/lib/db/parsed-codes.ts for the app!');

const tsOutput = `// Auto-generated access codes
import type { AccessCode } from './types';
const now = () => new Date().toISOString();
export const generatedCodes: AccessCode[] = [
${codes.map(c => `  {
    id: crypto.randomUUID(),
    code: '${c.code}',
    tier: '${c.type === 'admin' ? 'lifetime' : c.type}',
    duration_days: ${c.type === '15_days' ? 15 : c.type === '1_month' ? 30 : null},
    first_used_at: null,
    is_revoked: false,
    is_admin: ${c.type === 'admin'},
    created_at: now(),
  }`).join(',\n')}
];`;

fs.writeFileSync(path.join(__dirname, 'src', 'lib', 'db', 'parsed-codes.ts'), tsOutput, 'utf8');
