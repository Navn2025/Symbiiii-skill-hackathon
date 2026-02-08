# 📱 Secondary Camera Feature

## Overview

The Secondary Camera feature enhances interview integrity by requiring candidates to use a second device (typically a smartphone) as an additional monitoring camera. This provides a 360-degree view of the candidate's workspace and helps prevent unauthorized materials or assistance.

## Why Secondary Camera?

### Enhanced Monitoring

- **Workspace View**: Captures the candidate's desk, keyboard, and surrounding area
- **Side Angle**: Monitors from a different perspective than the main webcam
- **Physical Environment**: Ensures no unauthorized materials or assistance
- **Blind Spot Coverage**: Eliminates areas not visible to the main camera

### Common Use Cases

- Detecting notes or reference materials on the desk
- Monitoring for additional devices (tablet, second phone)
- Verifying the candidate is alone in the room
- Observing typing and physical behavior
- Preventing off-screen assistance

## How It Works

### For Candidates

#### 1. **Connection Setup**

When joining an interview as a candidate, you'll see a "Secondary Camera Setup" panel with two connection options:

**Option A: QR Code**

1. Click "Show QR Code"
2. Scan the QR code with your phone camera
3. Your phone browser will open the secondary camera page
4. Allow camera permissions
5. Wait for "Connected" status

**Option B: Connection Link**

1. Click "Copy Connection Link"
2. Send the link to your phone (via email, messaging, etc.)
3. Open the link on your phone browser
4. Allow camera permissions
5. Wait for "Connected" status

#### 2. **Phone Positioning**

Position your phone to capture:

- ✅ Your desk and workspace from the side
- ✅ Your hands and keyboard
- ✅ Room surroundings
- ✅ Any materials on your desk

**Best Placement:**

- 45-degree angle from your main computer
- 2-3 feet away from your workspace
- Stable position (use a phone stand or prop)
- Good lighting

#### 3. **During the Interview**

- Keep the phone camera page open in the browser
- Don't lock your phone screen
- Ensure stable internet connection
- The phone will automatically send snapshots every 3 seconds

### For Recruiters

#### Monitoring Features

- Real-time snapshots from candidate's secondary camera
- Timestamp on each snapshot
- Alert if secondary camera disconnects
- Side-by-side view of both cameras

#### What to Watch For

- ⚠️ Unauthorized materials on desk
- ⚠️ Additional devices or screens
- ⚠️ People in the background
- ⚠️ Off-camera communication
- ⚠️ Suspicious movements or behavior

## Technical Details

### Connection Flow

```
Main Device                    Phone Device
     |                              |
     |-- Generate QR Code --------->|
     |                              |
     |<------ Scan & Connect -------|
     |                              |
     |<----- Start Camera Stream ---|
     |                              |
     |<-- Snapshots (every 3s) -----|
```

### Data Transfer

- **Snapshot Interval**: 3 seconds
- **Image Format**: JPEG (compressed)
- **Quality**: 50% (optimized for bandwidth)
- **Transfer Method**: WebSocket (Socket.IO)
- **Encryption**: HTTPS/WSS

### Browser Requirements

#### Main Device

- Modern browser (Chrome, Firefox, Edge, Safari)
- WebRTC support
- JavaScript enabled
- Camera permissions

#### Phone Device

- Mobile browser (Chrome recommended)
- Camera permissions required
- Stable internet connection (WiFi or 4G/5G)
- Screen should stay awake (automatic)

### Privacy & Security

#### Data Handling

- Snapshots are transmitted in real-time only
- No permanent storage of secondary camera feed
- Data encrypted during transmission
- Automatically deleted after interview ends

#### Permissions

- Camera access requested explicitly
- User can deny (but interview may not proceed)
- Permissions can be revoked anytime
- Transparent about data usage

## Setup Instructions

### Candidate Setup

#### Before the Interview

1. **Prepare your phone:**
   - Fully charged or plugged in
   - Stable internet connection
   - Browser updated
   - Notifications silenced

2. **Prepare your workspace:**
   - Clear desk of unauthorized materials
   - Good lighting from side angle
   - Stable phone position (stand or prop)
   - Test camera view

#### Connection Steps

```
1. Start interview on main computer
2. See "Secondary Camera Setup" panel
3. Choose QR Code or Link method
4. Open on phone browser
5. Allow camera permissions
6. Wait for "Connected" confirmation
7. Position phone correctly
8. Begin interview
```

### Troubleshooting

#### Connection Issues

**Problem**: QR code won't scan

- ✅ Ensure good lighting
- ✅ Hold phone steady
- ✅ Try zooming in/out
- ✅ Use "Copy Link" method instead

**Problem**: Camera not connecting

- ✅ Check camera permissions in browser settings
- ✅ Reload the page
- ✅ Try different browser (Chrome recommended)
- ✅ Check internet connection

**Problem**: Connection drops during interview

- ✅ Check WiFi signal strength
- ✅ Avoid background apps on phone
- ✅ Ensure phone battery is sufficient
- ✅ Rejoin using the same link/QR

#### Camera Issues

**Problem**: Camera not starting

- ✅ Allow camera permissions
- ✅ Check if another app is using camera
- ✅ Restart browser
- ✅ Try back camera instead of front

**Problem**: Poor image quality

- ✅ Clean camera lens
- ✅ Improve lighting
- ✅ Adjust phone position
- ✅ Check internet bandwidth

#### Phone Battery

**Problem**: Phone battery draining fast

- ✅ Keep phone plugged in during interview
- ✅ Reduce screen brightness
- ✅ Close other apps
- ✅ Disable background processes

## Best Practices

### For Optimal Monitoring

#### Phone Placement

```
        [Main Monitor]
             |
      [  Candidate  ]
            / \
           /   \
     [Keyboard]  [Phone 📱]
                 45° angle
```

#### Camera Angles

- **Primary (Webcam)**: Face-on view
- **Secondary (Phone)**: 45-degree side angle
- **Coverage**: Full workspace visibility

### Interview Day Checklist

- [ ] Phone fully charged/charging
- [ ] Stable internet on both devices
- [ ] Browser updated on phone
- [ ] Phone stand or stable position ready
- [ ] Workspace cleared
- [ ] Good lighting setup
- [ ] Test connection beforehand
- [ ] Notifications silenced

## Features

### Real-Time Monitoring

- Live snapshot transmission every 3 seconds
- Automatic reconnection on disconnect
- Bandwidth-optimized image compression
- Minimal battery impact

### Connection Security

- Unique connection codes per session
- Time-limited codes (expire after connection)
- Encrypted data transmission
- No public access to camera feeds

### User Experience

- Simple QR code scanning
- One-click link copying
- Automatic wake lock (screen stays on)
- Clear connection status indicators

## FAQ

### General Questions

**Q: Is a secondary camera mandatory?**
A: Yes, for proctored interviews. It's a requirement for maintaining interview integrity.

**Q: Can I use a tablet or laptop instead of a phone?**
A: Yes, any device with a camera and browser will work. Phones are most convenient due to portability.

**Q: Will this drain my phone battery?**
A: Yes, camera use does consume battery. We recommend keeping your phone plugged in during the interview.

**Q: Is my data secure?**
A: Yes, snapshots are transmitted with encryption and not permanently stored.

### Technical Questions

**Q: What if my phone disconnects?**
A: The system will alert the recruiter. You should reconnect using the same QR code or link.

**Q: Can I use the same phone twice?**
A: Yes, you can use the same device for multiple interviews. Each generates a new connection code.

**Q: Does it work on iOS and Android?**
A: Yes, works on all modern mobile browsers on both platforms.

**Q: What about data usage?**
A: Approximately 1-2 MB per minute. Use WiFi for best results.

## Support

### Need Help?

- Check browser console for error messages
- Verify camera permissions in browser settings
- Try different browsers (Chrome recommended)
- Contact support if issues persist

### Reporting Issues

When reporting problems, include:

- Device make and model
- Browser name and version
- Error messages
- Screenshot of the issue
- Steps to reproduce

---

## Configuration (For Developers)

### Snapshot Settings

```javascript
// In SecondaryCamera.jsx
const SNAPSHOT_INTERVAL = 3000; // milliseconds
const IMAGE_QUALITY = 0.5; // 0.0 to 1.0
const IMAGE_FORMAT = "image/jpeg";
```

### Connection Timeout

```javascript
// Backend configuration
const CONNECTION_TIMEOUT = 30000; // 30 seconds
const SNAPSHOT_TIMEOUT = 10000; // 10 seconds
```

### Camera Preferences

```javascript
// Video constraints
{
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: { ideal: 'environment' } // Back camera
  }
}
```

---

## Future Enhancements

### Planned Features

- [ ] Live video streaming (instead of snapshots)
- [ ] Multi-camera support (more than 2 cameras)
- [ ] Automatic workspace scanning
- [ ] AI-powered object detection
- [ ] Gesture recognition
- [ ] Audio monitoring option
- [ ] Screen recording capability
- [ ] Native mobile app

### Under Consideration

- Motion detection alerts
- Automatic environment verification
- Pre-interview camera test
- Bandwidth optimization
- Offline snapshot buffering

---

**Note**: Secondary camera monitoring significantly improves interview integrity and is considered a best practice in remote proctoring systems.
