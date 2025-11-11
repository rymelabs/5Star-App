import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src', 'locales', 'ha.json');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Fixing all remaining Hausa encoding issues...\n');

// Simple string replacements for Hausa special characters
const replacements = [
  // ƙ (k with hook) patterns
  ['�\"', 'ƙ'],
  // ɗ (d with hook) patterns  
  ['�\u0014', 'ɗ'],
  ['�`', 'ɗ'],  // Another encoding of ɗ
  // ɓ (b with hook)
  ['�\u001c', 'ɓ'],
  // Zaɓi (select/choose)
  ['Za�\u001c', 'Zaɓ'],
  // £ symbol
  ['�\u001a', '£'],
  // haɗin (combination/integration)
  ['ha�\u0014', 'haɗ'],
];

let fixCount = 0;
for (const [pattern, replacement] of replacements) {
  const before = content;
  content = content.replaceAll(pattern, replacement);
  if (before !== content) {
    fixCount++;
    console.log(`✅ Fixed: "${pattern}" → "${replacement}"`);
  }
}

// Write back
fs.writeFileSync(filePath, content, { encoding: 'utf8' });

console.log(`\n✨ Applied ${fixCount} fixes to ha.json`);
console.log('📝 File saved with UTF-8 encoding');
