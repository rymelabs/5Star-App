import json
import codecs

def fix_encoding(text):
    """Fix double-encoded UTF-8 strings"""
    if not isinstance(text, str):
        return text
    try:
        # Encode as latin-1 then decode as utf-8
        return text.encode('latin-1').decode('utf-8')
    except (UnicodeDecodeError, UnicodeEncodeError):
        return text

def fix_dict(obj):
    """Recursively fix all strings in a dictionary"""
    if isinstance(obj, dict):
        return {key: fix_dict(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [fix_dict(item) for item in obj]
    elif isinstance(obj, str):
        return fix_encoding(obj)
    return obj

# Files to fix
files = ['yo.json', 'ig.json', 'ha.json']

for filename in files:
    filepath = f'src/locales/{filename}'
    print(f'\nProcessing {filename}...')
    
    try:
        # Read with UTF-8 encoding
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Fix encoding
        fixed_data = fix_dict(data)
        
        # Write back with UTF-8 encoding, no BOM
        with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
            json.dump(fixed_data, f, ensure_ascii=False, indent=4)
        
        print(f'✅ Fixed {filename}')
        
        # Show sample
        if 'common' in fixed_data and 'loading' in fixed_data['common']:
            print(f'Sample - loading: {fixed_data["common"]["loading"]}')
            print(f'Sample - error: {fixed_data["common"]["error"]}')
    
    except Exception as e:
        print(f'❌ Error fixing {filename}: {e}')

print('\n✨ Encoding fix complete!')
