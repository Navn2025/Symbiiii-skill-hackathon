# 🔍 PROCTORING SYSTEM - TESTING GUIDE

## Quick Test Instructions

### 1. Start the Application

```bash
# Terminal 1 - Backend (port 3001)
cd backend
npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend
npm run dev
```

### 2. Join as Candidate

1. Go to http://localhost:5173
2. Select **"Recruiter Interview Mode"**
3. Enter:
   - Candidate Name: Test Candidate
   - Recruiter Name: Test Recruiter
4. Select Role: **Candidate**
5. Click "Start Interview"
6. **Allow camera permission** when prompted
7. Accept the security notice

### 3. Test Proctoring Features

#### ✅ Basic System Test

- Click the **"🧪 Test Alert"** button in the header
- You should see:
  - Orange security alert appear (top-right)
  - Integrity score decrease by 5 points
  - Event appear in proctoring monitor (if recruiter view)

#### ✅ Tab Switch Detection (HIGH Priority - 20 points)

1. Press `Alt+Tab` to switch to another window
2. Return to the interview
3. **Expected**:
   - Red security alert: "Tab switched"
   - Integrity score decreases by 20 points
   - Event logged in proctoring panel

#### ✅ Fullscreen Enforcement (CRITICAL - 30 points)

1. Press `Esc` or `F11` to exit fullscreen
2. **Expected**:
   - Red security alert: "Fullscreen exited"
   - System automatically re-enters fullscreen after 1 second
   - Integrity score decreases by 30 points

#### ✅ Copy-Paste Blocking (MEDIUM - 10 points)

1. Try to copy text from the question panel (`Ctrl+C`)
2. **Expected**:
   - Copy is blocked
   - Yellow security alert: "Copy/paste blocked"
   - Integrity score decreases by 10 points
3. Note: Copy-paste **is allowed** in the code editor

#### ⚠️ Face Detection (CRITICAL - 30 points)

**Note**: Face detection requires models to load from CDN. May not work immediately.

1. **No Face Test**: Cover your camera for 6+ seconds
   - **Expected**: "No face detected in camera" alert

2. **Multiple Faces Test**: Have someone stand behind you for 4+ seconds
   - **Expected**: "X faces detected" alert

3. **Looking Away Test**: Look significantly away from screen
   - **Expected**: "Candidate looking away from screen" alert

**If face detection doesn't work**:

- Check browser console for errors
- Face detection logs: "📹 Face detection: X face(s) detected" every 2 seconds
- System continues to work without face detection
- Tab switching, fullscreen, and copy-paste still monitored

### 4. Check Console Logs

Open browser DevTools (F12) and check Console:

**Successful initialization logs:**

```
🛡️ Starting proctoring monitoring...
Loading face detection models...
Face detection models loaded successfully
✅ Proctoring monitoring started successfully
```

**During monitoring:**

```
📹 Face detection: 1 face(s) detected
⚠️ Violation detected: {type: "tab_switch", severity: "high", ...}
📤 Proctoring event sent to server
```

### 5. Integrity Score System

**Starting Score**: 100 (perfect integrity)

**Deductions**:

- 🟢 Low (-5 points): Minor issues, test violations
- 🟡 Medium (-10 points): Copy-paste attempts, looking away
- 🔴 High (-20 points): Tab switches, window focus loss
- ⛔ Critical (-30 points): No face, multiple faces, fullscreen exit

**Auto-Termination**: At 100 points (0% integrity)

### 6. Recruiter View

To see the monitoring dashboard:

1. Open in a second browser/incognito window
2. Join same interview with Role: **Recruiter**
3. You'll see:
   - Proctoring Monitor panel (left side)
   - Real-time integrity score
   - Complete violation log with timestamps
   - Severity badges (Low/Medium/High/Critical)

## Troubleshooting

### Issue: Face detection not working

**Symptoms**: No face detection logs, or errors about face-api.js
**Solution**:

- Face detection is optional - other features still work
- Check internet connection (models load from CDN)
- System logs: "⚠️ Face detection disabled - models not loaded"

### Issue: No alerts appearing

**Symptoms**: Violations not showing
**Check**:

1. Console logs - are violations detected?
2. Is `role` set to "candidate"?
3. Try clicking "🧪 Test Alert" button
4. Check if there are JavaScript errors

### Issue: Tab switching not detected

**Check**:

1. Are you using a modern browser (Chrome/Edge/Firefox)?
2. Check console for errors
3. Try clicking away from browser then back

### Issue: Fullscreen immediately exits

**Check**:

1. Browser settings allow fullscreen
2. Not in incognito mode (some browsers block)
3. Try manually pressing F11

###Issue: Copy-paste still working
**Check**:

1. Are you copying from code editor? (That's allowed)
2. Try copying from question panel or chat
3. Check console logs

### Issue: Video not starting

**Check**:

1. Camera permissions granted
2. No other app using camera
3. Check console for errors
4. Look for logs: "📹 Video metadata loaded"

## Testing Checklist

Use this to verify all features:

- [ ] **Test Alert Button**: Works, shows alert, decreases score
- [ ] **Tab Switching**: Detected when switching windows
- [ ] **Fullscreen**: Auto-enforced, violations logged
- [ ] **Copy-Paste**: Blocked outside code editor
- [ ] **Face Detection**: (Optional) Detects faces
- [ ] **Integrity Score**: Decreases with violations
- [ ] **Security Alerts**: Appear in top-right corner
- [ ] **Proctoring Events**: Logged with timestamps
- [ ] **Console Logging**: Clear violation logs
- [ ] **Recruiter Dashboard**: Shows all violations

## Expected Console Output

### On Load (Candidate):

```
🎥 Video ready callback triggered
Role: candidate
VideoRef: Object
📹 Video metadata loaded
✅ Video playing
🔔 Calling onVideoReady callback
🛡️ Attempting to start proctoring...
Loading face detection models...
🛡️ Starting proctoring monitoring...
✅ Proctoring monitoring started successfully
```

### During Interview:

```
📹 Face detection: 1 face(s) detected
⚠️ Violation detected: {type: "tab_switch", severity: "high", description: "Tab switched (1 times)"}
New suspicion score: 20
📤 Proctoring event sent to server
```

### On Violation:

```
⚠️ Violation detected: {type: "fullscreen_exit", severity: "critical", ...}
New suspicion score: 50
📤 Proctoring event sent to server
```

## Performance Metrics

- **Face Detection**: Every 2 seconds
- **Tab Detection**: Instant (event-based)
- **Fullscreen Check**: Instant (event-based)
- **Copy-Paste Block**: Instant (event-based)
- **Auto Re-enter Fullscreen**: 1 second delay

## Notes

1. **Face detection is optional** - system works without it
2. **Browser compatibility**: Best in Chrome/Edge
3. **Privacy**: Video stays local, only violation events sent to server
4. **Test mode**: Use test button to verify system working
5. **Graceful degradation**: If one feature fails, others continue

---

## Quick Debug Commands

### Check if proctoring started:

```javascript
// In browser console
console.log(proctoringService.isMonitoring); // Should be true
console.log(proctoringService.violations); // Array of violations
```

### Manual test violation:

Click the "🧪 Test Alert" button - easiest way to verify system is working!

---

**System is working if**: You can trigger test alerts and see tab-switching work. Face detection is optional.

**System has issues if**: No console logs appear, test button doesn't work, or no violations detected.
