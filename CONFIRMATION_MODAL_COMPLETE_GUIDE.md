# Complete Confirmation Modal Implementation Guide

## Files Updated with ConfirmationModal

### ✅ Fully Implemented:
1. **AdminNotifications.jsx** - Delete notification confirmation
2. **AdminTeams.jsx** - Delete team confirmation  
3. **AdminNews.jsx** - Has ConfirmationModal import (needs state and logic update)

### 📝 Needs Implementation:

#### AdminFixtures.jsx
- **Line 1095**: Delete fixture (currently just console.log, not implemented)
- **Action**: Skip for now as delete isn't actually implemented

#### AdminSeasons.jsx  
- **Line 65**: `if (!confirm('Are you sure you want to delete this season? This action cannot be undone.'))`
- **Action**: Add confirmDelete state and modal

#### AdminLeagues.jsx
- **Line 52**: `if (!confirm(\`Are you sure you want to delete "${leagueName}"? This action cannot be undone.\`))`
- **Action**: Add confirmDelete state and modal

#### SeasonDetail.jsx (Multiple confirmations needed):
1. **Line 113**: Generate fixtures
   - `if (!confirm('Generate fixtures for all groups? This will create all group stage matches.'))`
   
2. **Line 137**: Delete all fixtures
   - `if (!confirm('⚠️ DELETE all fixtures for this season? This action cannot be undone!'))`
   
3. **Line 151**: Clean up broken fixtures
   - `if (!confirm('Clean up broken fixtures? This will delete all fixtures with missing team IDs.'))`
   
4. **Line 165**: Regenerate fixtures
   - `if (!confirm('⚠️ REGENERATE all fixtures? This will delete existing fixtures and create new ones with correct team IDs.'))`
   
5. **Line 193**: Seed knockout stage
   - `if (!confirm('Seed knockout stage? This will automatically create knockout brackets from group qualifiers.'))`

## Implementation Pattern:

### 1. Add state:
```javascript
const [confirmAction, setConfirmAction] = useState({ 
  isOpen: false, 
  type: '',  // 'delete', 'generate', 'cleanup', etc.
  data: null 
});
```

### 2. Replace confirm() with:
```javascript
// Old:
if (!confirm('message')) return;
doAction();

// New:
const handleAction = () => {
  setConfirmAction({ isOpen: true, type: 'actionName', data: itemData });
};

const confirmActionHandler = async () => {
  // Do the action
  setConfirmAction({ isOpen: false, type: '', data: null });
};
```

### 3. Add modal before closing tag:
```jsx
<ConfirmationModal
  isOpen={confirmAction.isOpen}
  onClose={() => setConfirmAction({ isOpen: false, type: '', data: null })}
  onConfirm={confirmActionHandler}
  title="Action Title"
  message="Confirmation message"
  confirmText="Confirm"
  type="danger" // or "warning", "info"
/>
```

## Next Steps:
Run the script below to complete all implementations.
