# Team Following Notification System

## Overview
This document outlines the notification system for team followers. Users can follow teams and receive notifications about matches, scores, and news related to their followed teams.

## User Settings
Users can control their notification preferences in Settings > Team Following Notifications:

### Available Settings
1. **Team Notifications** (Master Toggle)
   - Enables/disables all team-related notifications
   - Default: `true`

2. **Upcoming Matches**
   - Notifies 24 hours before a followed team's match
   - Requires: Team Notifications enabled
   - Default: `true`
   - Example: "⏰ Manchester United plays tomorrow at 3:00 PM vs Liverpool"

3. **Live Match Alerts**
   - Notifies when a followed team's match goes live
   - Requires: Team Notifications enabled
   - Default: `true`
   - Example: "🔴 LIVE: Manchester United vs Liverpool - Kick-off!"

4. **Match Results**
   - Notifies when a followed team's match ends
   - Requires: Team Notifications enabled
   - Default: `true`
   - Example: "⚽ Full Time: Manchester United 2-1 Liverpool - Victory!"

5. **Team News**
   - Notifies about news articles mentioning followed teams
   - Requires: Team Notifications enabled
   - Default: `true`
   - Example: "📰 Manchester United signs new striker from Barcelona"

## Notification Delivery Methods
Users can choose how they want to receive notifications:

1. **Push Notifications** (`notifications.push`)
   - In-app browser notifications
   - Requires user permission

2. **Email Notifications** (`notifications.email`)
   - Sent to user's registered email
   - Includes unsubscribe option

## Trigger Points

### 1. Fixture Creation (addFixture)
**Location:** `src/context/FootballContext.jsx` - `addFixture()`

**Trigger:** When admin creates a new fixture

**Action:**
- Schedule notification for 24 hours before match time
- Send to followers of both teams (home & away)
- Check user setting: `notifications.upcomingMatches`

**Implementation TODO:**
```javascript
// Get followers of both teams
const homeFollowers = homeTeam.followers || [];
const awayFollowers = awayTeam.followers || [];
const allFollowers = [...new Set([...homeFollowers, ...awayFollowers])];

// For each follower, check their notification settings
// Schedule notification for (matchTime - 24 hours)
```

### 2. Match Goes Live (updateFixture)
**Location:** `src/context/FootballContext.jsx` - `updateFixture()`

**Trigger:** When fixture status changes from 'scheduled' to 'live'

**Action:**
- Send immediate notification
- Send to followers of both teams
- Check user setting: `notifications.liveMatches`

**Implementation TODO:**
```javascript
if (statusChangedToLive) {
  const homeFollowers = fixture.homeTeam.followers || [];
  const awayFollowers = fixture.awayTeam.followers || [];
  
  // Send push/email notifications
  // Message: "🔴 LIVE: {homeTeam} vs {awayTeam} - Kick-off!"
}
```

### 3. Match Completed (updateFixture)
**Location:** `src/context/FootballContext.jsx` - `updateFixture()`

**Trigger:** When fixture status changes to 'completed' with scores

**Action:**
- Send immediate notification with final score
- Send to followers of both teams
- Check user setting: `notifications.matchResults`
- Customize message based on result (win/loss/draw)

**Implementation TODO:**
```javascript
if (isNowCompleted && hasScores) {
  // Determine result for each team
  // For home team followers: "Victory!" / "Defeat" / "Draw"
  // For away team followers: opposite
  
  // Message examples:
  // "⚽ Full Time: Manchester United 2-1 Liverpool - Victory!"
  // "⚽ Full Time: Manchester United 0-0 Liverpool - Draw"
}
```

### 4. Score Update During Live Match (updateFixture)
**Location:** `src/context/FootballContext.jsx` - `updateFixture()`

**Trigger:** When homeScore or awayScore changes during a live match

**Action:**
- Send immediate notification with updated score
- Send to followers of both teams
- Check user setting: `notifications.liveMatches`

**Implementation TODO:**
```javascript
if (fixture.status === 'live' && (scoreChanged)) {
  // Message: "⚽ GOAL! Manchester United 1-0 Liverpool ({minute}')"
}
```

### 5. News Article Published (addArticle)
**Location:** `src/context/NewsContext.jsx` - `addArticle()`

**Trigger:** When admin publishes a new article

**Action:**
- Parse article for team mentions (title + content)
- Send to followers of mentioned teams
- Check user setting: `notifications.teamNews`

**Implementation TODO:**
```javascript
// Parse article title and content for team names
const mentionedTeams = extractTeamMentions(articleData.title, articleData.content);

// For each mentioned team
mentionedTeams.forEach(team => {
  const followers = team.followers || [];
  
  // Send notification
  // Message: "📰 {articleTitle}"
  // Include: team badge, article snippet
});
```

## Data Structure

### Team Schema
```javascript
{
  id: string,
  name: string,
  logo: string,
  followers: string[], // Array of user UIDs
  followerCount: number,
  // ... other team fields
}
```

### User Notification Settings
```javascript
{
  notifications: {
    push: boolean,
    email: boolean,
    teamFollowing: boolean, // Master toggle
    upcomingMatches: boolean,
    liveMatches: boolean,
    matchResults: boolean,
    teamNews: boolean
  }
}
```

## Implementation Steps

### Phase 1: Core Infrastructure (COMPLETED ✅)
- [x] Add followers array to teams
- [x] Implement follow/unfollow functions
- [x] Update Firestore security rules
- [x] Add UI for following teams
- [x] Add notification preference settings

### Phase 2: Notification Service (TODO)
- [ ] Create notification service module
- [ ] Implement push notification system
- [ ] Implement email notification system
- [ ] Add notification scheduling (for upcoming matches)
- [ ] Create notification templates

### Phase 3: Integration (TODO)
- [ ] Integrate with fixture creation
- [ ] Integrate with fixture updates
- [ ] Integrate with news publishing
- [ ] Add notification history/inbox
- [ ] Add unsubscribe functionality

### Phase 4: Advanced Features (TODO)
- [ ] Batch notifications (daily digest)
- [ ] Personalized notification timing
- [ ] In-app notification center
- [ ] Notification analytics
- [ ] A/B testing for notification content

## Security Considerations

1. **Rate Limiting**
   - Limit notifications per user per day
   - Prevent notification spam

2. **Privacy**
   - Allow users to completely opt-out
   - Never share follower lists publicly
   - Respect email preferences

3. **Data Protection**
   - Store notification preferences in Firestore
   - Encrypt sensitive notification data
   - Comply with GDPR/privacy laws

## Testing Checklist

- [ ] Test notification delivery (push)
- [ ] Test notification delivery (email)
- [ ] Test notification scheduling
- [ ] Test notification preferences
- [ ] Test follow/unfollow flow
- [ ] Test notification for multiple teams
- [ ] Test notification muting
- [ ] Test unsubscribe flow

## Future Enhancements

1. **Smart Notifications**
   - ML-based notification timing
   - Personalized content based on user behavior
   - Notification priority levels

2. **Rich Notifications**
   - Include images/videos
   - Interactive actions (view match, read article)
   - Real-time score updates in notification

3. **Social Features**
   - Share notifications with friends
   - Group notifications for shared teams
   - Community alerts

4. **Multi-language Support**
   - Localized notification content
   - User language preferences
   - Regional formatting

## Support Resources

- Firebase Cloud Messaging (FCM) for push notifications
- SendGrid/AWS SES for email notifications
- Cloud Functions for scheduling and processing
- Firestore for storing notification history
