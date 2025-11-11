import fs from 'fs';

// Comprehensive character mapping for all languages
const fixes = {
  // Common patterns across all files
  '�\u001e': 'Ń',  // Yoruba Ń
  '�\u001c': 'Ó',  // Yoruba/Igbo Ó  
  '�\u0019': 'Ò',  // Yoruba Ò
  '�\u001a': '£',  // Pound symbol
  '�S\u001c': '✓', // Checkmark
  
  // Hausa-specific
  '�\"': 'ƙ',      // Hausa k with hook
  '�\u0014': 'ɗ',  // Hausa d with hook  
  '�\u001c': 'ɓ',  // Hausa b with hook
};

const files = [
  { path: 'src/locales/yo.json', name: 'Yoruba' },
  { path: 'src/locales/ig.json', name: 'Igbo' },
  { path: 'src/locales/ha.json', name: 'Hausa' }
];

console.log('🔧 Fixing encoding issues across all language files...\n');

let totalFixes = 0;

files.forEach(({ path, name }) => {
  let content = fs.readFileSync(path, 'utf8');
  let fileFixes = 0;
  
  for (const [corrupt, correct] of Object.entries(fixes)) {
    const before = content;
    content = content.replaceAll(corrupt, correct);
    if (before !== content) {
      fileFixes++;
    }
  }
  
  fs.writeFileSync(path, content, { encoding: 'utf8' });
  
  if (fileFixes > 0) {
    console.log(`✅ ${name}: Applied ${fileFixes} fix patterns`);
    totalFixes += fileFixes;
  } else {
    console.log(`ℹ️  ${name}: No fixes needed`);
  }
});

console.log(`\n✨ Total: Applied ${totalFixes} fix patterns across all files`);
console.log('📝 All files saved with UTF-8 encoding\n');
console.log('⚠️  Note: Some characters may still need manual review');
