import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to fix double-encoded UTF-8
function fixDoubleEncoding(text) {
  // Convert the string to a buffer treating it as Latin-1 (ISO-8859-1)
  // then decode it as UTF-8
  const buffer = Buffer.from(text, 'latin1');
  return buffer.toString('utf8');
}

// Function to recursively fix all strings in an object
function fixObject(obj) {
  if (typeof obj === 'string') {
    return fixDoubleEncoding(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(fixObject);
  } else if (typeof obj === 'object' && obj !== null) {
    const fixed = {};
    for (const [key, value] of Object.entries(obj)) {
      fixed[key] = fixObject(value);
    }
    return fixed;
  }
  return obj;
}

// Files to fix
const files = ['yo.json', 'ig.json', 'ha.json'];

files.forEach(filename => {
  const filePath = path.join(__dirname, 'src', 'locales', filename);
  
  console.log(`\nProcessing ${filename}...`);
  
  try {
    // Read the corrupted file, stripping BOM if present
    let rawData = fs.readFileSync(filePath, 'utf8');
    
    // Remove BOM if present
    if (rawData.charCodeAt(0) === 0xFEFF) {
      rawData = rawData.slice(1);
    }
    
    // Parse JSON (may contain garbled UTF-8)
    const data = JSON.parse(rawData);
    
    // Fix the encoding
    const fixed = fixObject(data);
    
    // Write back with proper UTF-8 encoding (no BOM)
    fs.writeFileSync(filePath, JSON.stringify(fixed, null, 4), { encoding: 'utf8' });
    
    console.log(`✅ Fixed ${filename}`);
    
    // Show samples
    console.log(`  loading: ${fixed.common.loading}`);
    console.log(`  error: ${fixed.common.error}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filename}:`, error.message);
    console.error(`  Stack:`, error.stack);
  }
});

console.log('\n✨ Encoding fix complete!');
