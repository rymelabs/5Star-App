# Admin Notification System

## Overview
A comprehensive notification system that allows admins to send announcements and important information to all app users.

## Features

### 1. Admin Notification Management (`/admin/notifications`)
- Create and send notifications to all users
- Multiple notification types:
  - **Information** - General information
  - **Announcement** - Important announcements
  - **Warning** - Warnings or alerts
  - **App Update** - App updates and new features
  - **Special Event** - Special events and promotions

- Priority levels:
  - **Low Priority** - Optional information
  - **Normal Priority** - Standard notifications
  - **High Priority** - Important, requires attention

- View notification history with stats:
  - View count
  - Dismiss count
  - Creation date

### 2. Notification Popup Modal
### 2. Notification Popup Modal
- **Automatically shows on the home page** when users visit after login
- Appears 2 seconds after the home page loads
- Displays notifications one at a time with Next/Previous navigation
- Users can dismiss notifications or close the modal
- Beautiful color-coded design based on notification type
- Priority badges for high-priority notifications
- Tracks which notifications users have seen/dismissed (localStorage)
- Shows once per session (uses sessionStorage)### 3. Notification Inbox Integration
- Admin announcements section at the top
- Separated from personal notifications
- Shows:
  - Admin announcements with priority badges
  - Personal notifications from app activities
  - Unified notification management

## Technical Implementation

### Files Created
1. **`src/pages/admin/AdminNotifications.jsx`**
   - Admin interface for creating notifications
   - Form with validation
   - Notification history display
   - Delete functionality

2. **`src/components/NotificationModal.jsx`**
   - Popup modal for displaying notifications
   - Navigation between notifications
   - Tracking views and dismissals
   - localStorage persistence

3. **Updated Files:**
   - `src/pages/Latest.jsx` - Added notification modal to home page
   - `src/pages/NotificationInbox.jsx` - Added admin notifications section
   - `src/pages/admin/AdminDashboard.jsx` - Added notifications link
   - `src/AppContent.jsx` - Added route for admin notifications
   - `firestore.rules` - Added permissions for adminNotifications collection

### Firestore Collection: `adminNotifications`

**Structure:**
```javascript
{
  title: string,           // Notification title
  message: string,         // Notification message
  type: string,           // 'info' | 'announcement' | 'warning' | 'update' | 'event'
  priority: string,       // 'low' | 'normal' | 'high'
  createdAt: timestamp,   // Server timestamp
  active: boolean,        // Whether notification is active
  viewCount: number,      // Number of views
  dismissCount: number,   // Number of dismissals
}
```

**Permissions:**
- Read: Public (all users)
- Write: Admin only

### LocalStorage Keys
- `dismissedNotifications` - Array of dismissed notification IDs
- `hasSeenNotifications` - Session flag (sessionStorage)

## Usage Instructions

### For Admins:
1. Navigate to Admin Dashboard
2. Click "Notifications Management"
3. Fill out the notification form:
   - Enter a title
   - Write your message
   - Select notification type
   - Choose priority level
4. Click "Send Notification"
5. Notification appears instantly to all users

### For Users:
1. Visit the home page (Latest) after logging in
2. Notification modal appears automatically after 2 seconds
3. Read the notification
4. Options:
   - Click "Dismiss" to permanently hide the current notification
   - Click "Next" to view the next notification (if available)
   - Click "Done" after viewing all notifications
   - Close modal with × button (notifications will show again next session if not dismissed)
5. Dismissed notifications won't appear again
6. View all notifications (dismissed and new) in the Notifications page

## Notification Flow

```
Admin creates notification
       ↓
Saved to Firestore (adminNotifications)
       ↓
User visits home page (Latest)
       ↓
Check for undismissed notifications
       ↓
Show modal after 2 seconds
       ↓
User views/dismisses
       ↓
Save dismissal to localStorage
       ↓
Update viewCount/dismissCount in Firestore
       ↓
Dismissed notifications won't show again
```

## Styling

### Color Scheme by Type:
- **Info**: Blue (`text-blue-400`, `bg-blue-500/10`)
- **Announcement**: Purple (`text-purple-400`, `bg-purple-500/10`)
- **Warning**: Yellow (`text-yellow-400`, `bg-yellow-500/10`)
- **Update**: Green (`text-green-400`, `bg-green-500/10`)
- **Event**: Orange (`text-orange-400`, `bg-orange-500/10`)

### Priority Indicators:
- **High**: Red badge with "IMPORTANT" label, thicker border
- **Normal**: Standard appearance
- **Low**: Subtle gray styling

## Future Enhancements (Optional)
- [ ] Schedule notifications for future dates
- [ ] Target specific user groups
- [ ] Rich text formatting in messages
- [ ] Image/media attachments
- [ ] Push notification integration
- [ ] Notification expiration dates
- [ ] Analytics dashboard for notification performance
- [ ] Draft notifications (save without sending)
- [ ] Edit active notifications
- [ ] Duplicate notification feature

## Notes
- Notifications appear as a modal popup on the home page (Latest)
- Modal shows 2 seconds after page load to avoid interrupting UX
- Notifications are stored in Firestore, not sent as push notifications
- Users see notifications in-app only
- Dismissed notifications are tracked locally per device (localStorage)
- Session tracking prevents modal from showing multiple times (sessionStorage)
- View/dismiss counts are approximate (based on user interactions)
- Modal shows once per session - if user navigates away and returns, it won't show again
- Users can always view all notifications (including dismissed ones) in the Notifications page
