import fs from 'fs';

// Mapping of corrupted patterns to correct ones for Igbo
const igboFixes = [
  ['�9', 'ị'],
  ['�`', 'Ị'],
  ['�R', 'Ọ'],
  ['gh�9', 'ghị'],
  ['d�9', 'dị'],
  ['any�9', 'anyị'],
  ['Nd�9', 'Ndị'],
  ['ab�9', 'abịa'],
  ['�9hazi', 'ịhazi'],
  ['g�9', 'gị'],
  ['Ụd�9', 'Ụdị'],
  ['Gọọment�9', 'Gọọmentị'],
  ['�RN�RDỤ', 'ỌNỌDỤ'],
  ['�Rd�9', 'Ọdị'],
  ['" managed', '• managed']
];

// Read the file
const filePath = 'src/locales/ig.json';
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Fixing Igbo encoding issues...\n');

let fixCount = 0;
for (const [pattern, replacement] of igboFixes) {
  const before = content;
  content = content.replaceAll(pattern, replacement);
  if (before !== content) {
    console.log(`✅ Fixed: "${pattern}" → "${replacement}"`);
    fixCount++;
  }
}

// Write back
fs.writeFileSync(filePath, content, { encoding: 'utf8' });

console.log(`\n✨ Applied ${fixCount} fixes to ig.json`);
console.log('📝 File saved with UTF-8 encoding');
