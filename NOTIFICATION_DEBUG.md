# Notification Modal Debugging Guide

## Issue: Modal Not Showing

### Quick Fixes to Try:

#### 1. Clear Session Storage (Most Common Issue)
The modal tracks the last notification you've seen. If you want to see it again:

**Option A: Clear in Browser Console**
1. Open browser DevTools (F12 or Right-click → Inspect)
2. Go to Console tab
3. Type: `sessionStorage.removeItem('lastNotificationCheck')`
4. Press Enter
5. Refresh the page

**Option B: Clear in Application Tab**
1. Open browser DevTools (F12)
2. Go to Application tab (Chrome) or Storage tab (Firefox)
3. Find "Session Storage" in the left sidebar
4. Click on your localhost URL
5. Find `lastNotificationCheck` and delete it
6. Refresh the page

#### 2. Clear Dismissed Notifications (If notifications were dismissed)
If you dismissed the notification previously:
1. Open browser DevTools Console
2. Type: `localStorage.removeItem('dismissedNotifications')`
3. Press Enter
4. Refresh the page

#### 3. Check Console Logs
Open the browser console to see debug messages:
- "Latest page: Checking notifications modal" - Shows user state
- "Latest page: Session check" - Shows if session was already marked
- "Latest page: Showing notification modal now" - Modal should appear
- "Fetched notifications: X" - Shows how many notifications were fetched

### Checklist:

- [ ] Are you logged in as a user?
- [ ] Are you on the home page (Latest)?
- [ ] Have you created a notification in `/admin/notifications`?
- [ ] Is the notification set to "active: true"?
- [ ] Have you cleared sessionStorage?
- [ ] Have you cleared localStorage dismissed notifications?
- [ ] Do you see console logs in the browser?

### Manual Test:

Add this temporary button to test the modal directly:

1. Open browser console
2. Type: `sessionStorage.clear()`
3. Type: `localStorage.removeItem('dismissedNotifications')`
4. Refresh the page
5. Wait 2 seconds - modal should appear!

### Common Issues:

**Issue:** "I see the session was already marked"
- **Solution:** Clear sessionStorage as shown above

**Issue:** "Modal shows but is empty"
- **Solution:** Check if notifications exist in Firestore admin panel
- Make sure `active: true` is set on the notification

**Issue:** "No console logs appear"
- **Solution:** Make sure you're on the Latest/Home page, not another page

**Issue:** "Fetched notifications: 0"
- **Solution:** 
  - Go to `/admin/notifications` and create a new notification
  - Or check if you dismissed all notifications (clear localStorage)

### Firebase Console Check:

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Find `adminNotifications` collection
4. Check if your notification has:
   - `active: true`
   - `title: "your title"`
   - `message: "your message"`
   - `createdAt: timestamp`

### Development Mode Quick Reset:

Run these commands in browser console to completely reset:
```javascript
// Clear everything
sessionStorage.clear();
localStorage.removeItem('dismissedNotifications');
location.reload();
```

After 2 seconds on the home page, the modal should appear!
