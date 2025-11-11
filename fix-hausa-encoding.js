import fs from 'fs';

// Mapping of corrupted patterns to correct ones for Hausa
const hausaFixes = [
  // ƙ (k with hook) replacements
  ['�\"', 'ƙ'],
  // ɗ (d with hook) replacements
  ['�\u0014', 'ɗ'],
  ['�\u001c', 'ɓ'],
  // Special cases
  ['�S\u001c', '✓'],
  // Ensure all Ƙ (capital K with hook) are correct
  ['��', 'Ƙ']
];

// Read the file
const filePath = 'src/locales/ha.json';
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Fixing Hausa encoding issues...\n');

let fixCount = 0;
for (const [pattern, replacement] of hausaFixes) {
  const before = content;
  content = content.replaceAll(pattern, replacement);
  if (before !== content) {
    console.log(`✅ Fixed: "${pattern}" → "${replacement}"`);
    fixCount++;
  }
}

// Write back
fs.writeFileSync(filePath, content, { encoding: 'utf8' });

console.log(`\n✨ Applied ${fixCount} fixes to ha.json`);
console.log('📝 File saved with UTF-8 encoding');
