import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read and fix each file using regex patterns
const files = ['yo.json', 'ig.json', 'ha.json'];

files.forEach(filename => {
  const filePath = path.join(__dirname, 'src', 'locales', filename);
  console.log(`\n🔧 Processing ${filename}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let fixCount = 0;
  
  // Pattern-based replacements using character codes
  const patterns = [
    // Replace �\u001e with Ń  
    [/\uFFFD\u001e/g, 'Ń'],
    // Replace �\u001c with Ó
    [/\uFFFD\u001c/g, 'Ó'],
    // Replace �\u0019 with Ò
    [/\uFFFD\u0019/g, 'Ò'],
    // Replace �\u001a with £
    [/\uFFFD\u001a/g, '£'],
    // Replace �" with ƙ (Hausa)
    [/\uFFFD"/g, 'ƙ'],
    // Replace �\u0014 with ɗ (Hausa)
    [/\uFFFD\u0014/g, 'ɗ'],
    // Replace �S\u001c with ✓
    [/\uFFFDS\u001c/g, '✓'],
  ];
  
  patterns.forEach(([pattern, replacement]) => {
    const before = content;
    content = content.replace(pattern, replacement);
    if (before !== content) {
      fixCount++;
      console.log(`  ✅ Fixed pattern → ${replacement}`);
    }
  });
  
  // Write back
  fs.writeFileSync(filePath, content, { encoding: 'utf8' });
  
  console.log(`  📊 Applied ${fixCount} fixes`);
});

console.log('\n✨ Encoding fix complete!');
