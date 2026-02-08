# Real-Time Proctor Dashboard

A comprehensive real-time monitoring dashboard for tracking all active interview sessions with advanced proctoring capabilities.

## Features

### 📊 Dashboard Overview

- **Live Session Monitoring** - Track all active interviews in real-time
- **Statistics Overview** - View total sessions, violations, and risk levels
- **Real-time Updates** - Socket.io integration for instant alert notifications
- **Advanced Filtering** - Filter by risk level, search candidates
- **Smart Sorting** - Sort by integrity score, time, or event count

### 🎯 Session Tracking

Each session card displays:

- **Candidate Information** - Name, email, avatar
- **Integrity Score** - Real-time score from 0-100
- **Session Duration** - Active time tracker
- **Violation Summary** - Categorized by severity (Critical, High, Medium, Low)
- **Recent Events** - Last 5 proctoring events
- **Status Indicators** - Good (✅), Warning (⚠️), Risk (❌)

### 🚨 Real-Time Alerts

The dashboard receives instant notifications for:

- Face detection violations
- Multiple faces detected
- Eye tracking anomalies
- Tab switching attempts
- Window focus loss
- AI-generated code detection
- Copy/paste attempts
- Suspicious typing patterns

## Access

### URL

```
http://localhost:5173/proctor-dashboard
```

### Navigation

- Access from the home page navbar: **"🎯 Proctor Dashboard"** button
- Bright red/orange gradient styling for easy identification

## API Endpoints

### Get All Active Sessions

```http
GET /api/proctoring/dashboard/sessions
```

Returns array of active sessions with:

- Session details (ID, candidate, recruiter, timestamps)
- Integrity scores (0-100)
- Violation breakdowns by severity
- Recent events (last 5)
- Session duration

### Register Session

```http
POST /api/proctoring/session
Content-Type: application/json

{
  "interviewId": "string",
  "candidateName": "string",
  "candidateEmail": "string",
  "recruiterName": "string",
  "startTime": "ISO8601 datetime"
}
```

### End Session

```http
DELETE /api/proctoring/session/:interviewId
```

### Get Session Details

```http
GET /api/proctoring/dashboard/:interviewId
```

## Socket Events

### Client Events (Dashboard Sends)

- `join-proctor-dashboard` - Join the dashboard room to receive updates

### Server Events (Dashboard Receives)

- `proctoring-alert` - Fired when a violation occurs in any session

  ```javascript
  {
    interviewId: "string",
    event: {
      eventType: "string",
      severity: "low|medium|high|critical",
      details: "string",
      timestamp: "ISO8601"
    }
  }
  ```

- `session-update` - Fired when session status changes
  ```javascript
  {
    interviewId: "string",
    type: "user-joined|user-left",
    userName: "string",
    role: "candidate|recruiter"
  }
  ```

## Dashboard Controls

### Search

Search across:

- Candidate names
- Candidate emails
- Session IDs

### Filters

- **All** - Show all active sessions
- **Risk** (❌) - Sessions with integrity score < 60
- **Warning** (⚠️) - Sessions with score 60-79
- **Good** (✅) - Sessions with score ≥ 80

### Sorting Options

- **Integrity Score** - Lowest to highest (shows risky sessions first)
- **Start Time** - Newest to oldest
- **Event Count** - Most violations first

## Statistics Cards

### Active Sessions

Total number of interviews currently in progress

### Good Standing (✅)

Sessions with integrity score ≥ 80

### Warnings (⚠️)

Sessions with integrity score 60-79

### High Risk (❌)

Sessions with integrity score < 60

### Total Violations

Sum of all proctoring events across all sessions

## Session Card Details

### Basic View

- Candidate avatar and name
- Integrity score with color coding
- Session duration
- Total event count
- Violation badges by severity

### Expanded View (Click to Expand)

- Recent events timeline with timestamps
- Event type indicators
- Severity color coding
- Action buttons:
  - **📋 View Full Report** - Detailed session analysis
  - **🎥 Join Session** - Join the active interview

## Severity Levels & Scoring

### Violation Severity

- **Low** 🔵 - 2 points deducted
- **Medium** 🟡 - 5 points deducted
- **High** 🔴 - 10 points deducted
- **Critical** 🔴 - 20 points deducted

### Integrity Score Ranges

- **80-100**: Good standing (✅ Green)
- **60-79**: Warning (⚠️ Orange)
- **0-59**: High risk (❌ Red)

## Auto-Refresh

The dashboard automatically refreshes every **5 seconds** to ensure real-time accuracy.

Manual refresh is also available via the **🔄 Refresh** button.

## Responsive Design

- Desktop: Multi-column grid layout
- Tablet: 2-column grid
- Mobile: Single-column stacked layout
- Touch-friendly controls
- Optimized for all screen sizes

## Integration with Interview Room

The InterviewRoom component automatically:

1. Registers the session when a candidate joins
2. Sends real-time proctoring events via Socket.io
3. Updates session activity timestamps
4. Deregisters on interview completion

## Future Enhancements

Potential features for future versions:

- [ ] Live video feed thumbnails
- [ ] Screen recording playback
- [ ] Export reports to PDF
- [ ] Email alerts for critical violations
- [ ] Historical data and analytics
- [ ] Comparison charts and trends
- [ ] Multi-dashboard support for large teams
- [ ] Role-based access control

## Usage Example

### For Proctors/Recruiters

1. Navigate to `/proctor-dashboard` or click the navbar link
2. View all active interview sessions at a glance
3. Monitor integrity scores in real-time
4. Filter high-risk sessions using the "Risk" filter
5. Click on any session card to expand details
6. Review recent violations and their severity
7. Take action if needed (join session, view full report)

### Session Lifecycle

1. **Candidate joins** → Session appears on dashboard (Good status)
2. **Violations occur** → Real-time alerts, score decreases
3. **Status changes** → Card updates color (Warning → Risk)
4. **Interview ends** → Session removed from active list

## File Structure

```
backend/
  routes/
    proctoring.js          # API endpoints for dashboard
  socket/
    handlers.js            # Socket.io event handlers

frontend/
  src/
    pages/
      ProctorDashboard.jsx # Main dashboard component
      ProctorDashboard.css # Dashboard styling
    App.jsx               # Route configuration
```

## Dependencies

### Backend

- Express.js
- Socket.io

### Frontend

- React 18+
- React Router DOM
- Socket.io-client
- CSS3 (Grid, Flexbox, Animations)

## Security Considerations

- All socket events are scoped to specific rooms
- Dashboard receives only aggregated data, not raw video
- Session data stored in-memory (resets on server restart)
- Consider adding authentication for production use
- Rate limiting recommended for API endpoints

## Performance

- Efficient socket broadcasting to dashboard room only
- Minimal re-renders using React hooks
- Debounced search input
- Lazy loading of session details
- Optimized CSS animations

---

**Status**: ✅ Fully Implemented and Ready for Use
