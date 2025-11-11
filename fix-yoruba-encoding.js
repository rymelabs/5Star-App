import fs from 'fs';

// Mapping of corrupted characters/patterns to correct ones
const yorubaFixes = [
  // Fix combining diacritics that appear as separate
  [/([a-zA-Zàáèéìíòóùú]+)̬/g, (match, letter) => {
    const mapping = {
      'e̬': 'ẹ', 'E̬': 'Ẹ',
      'o̬': 'ọ', 'O̬': 'Ọ',
      'ẹ̬': 'ẹ', 'Ẹ̬': 'Ẹ', // already correct but combined
      'ọ̬': 'ọ', 'Ọ̬': 'Ọ', // already correct but combined
      'ṣe̬': 'ṣẹ', 'Ṣe̬': 'Ṣẹ',
      're̬': 'rẹ', 'Re̬': 'Rẹ',
      'be̬': 'bẹ', 'Be̬': 'Bẹ',
      'Te̬': 'Tẹ', 'te̬': 'tẹ',
      'le̬': 'lẹ', 'Le̬': 'Lẹ',
      'mo̬': 'mọ', 'Mo̬': 'Mọ',
      'so̬': 'sọ', 'So̬': 'Sọ',
      'to̬': 'tọ', 'To̬': 'Tọ',
      'ẹẹ̬': 'ẹẹ', 'Ẹẹ̬': 'Ẹẹ',
      'bọ̬': 'bọ', 'Bọ̬': 'Bọ',
      'pọ̬': 'pọ', 'Pọ̬': 'Pọ'
    };
    return mapping[match] || match.replace('̬', '');
  }],
  // Fix the special character patterns
  ['�\u001e', 'Ń'],
  ['�\u0019', 'Ò'],
  ['Ì̬', 'Ọ̀'],
  ['Ṣẹ̬', 'Ṣẹ'],
  ['rẹ̬', 'rẹ'],
  ['bẹ̬', 'bẹ'],
  ['Tẹ̬', 'Tẹ'],
  ['ṣẹl', 'ṣẹlẹ̀'],
  ['tẹ̬l', 'tẹ̀lé'],
  ['Ẹ̬', 'Ẹ'],
  ['ẹ̬', 'ẹ'],
  ['ọ̬', 'ọ'],
  ['Ọ̬', 'Ọ'],
  ['mọ̬', 'mọ̀'],
  ['sọ', 'sọ'],
  ['Wọl', 'Wọlé'],
  ['ìwọn', 'Àwọn'],
  // Double-check quote issue
  ['" managed', '• managed']
];

// Read the file
const filePath = 'src/locales/yo.json';
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Fixing remaining Yoruba encoding issues...\n');

let fixCount = 0;
for (const [pattern, replacement] of yorubaFixes) {
  const before = content;
  if (pattern instanceof RegExp) {
    content = content.replace(pattern, replacement);
  } else {
    content = content.replaceAll(pattern, replacement);
  }
  if (before !== content) {
    const label = pattern instanceof RegExp ? pattern.source : pattern;
    console.log(`✅ Fixed pattern: ${label}`);
    fixCount++;
  }
}

// Write back
fs.writeFileSync(filePath, content, { encoding: 'utf8' });

console.log(`\n✨ Applied ${fixCount} fixes to yo.json`);
console.log('📝 File saved with UTF-8 encoding');
