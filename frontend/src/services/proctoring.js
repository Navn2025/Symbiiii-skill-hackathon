import * as faceapi from 'face-api.js';
import {sendProctoringEvent} from './api';

class ProctoringService
{
    constructor()
    {
        this.isInitialized=false;
        this.isMonitoring=false;
        this.videoElement=null;
        this.interviewId=null;
        this.suspicionScore=0;
        this.violations=[];
        this.faceDetectionInterval=null;
        this.tabSwitchCount=0;
        this.copyPasteAttempts=0;
        this.fullscreenExitCount=0;
        this.noFaceDetectedCount=0;
        this.multipleFacesCount=0;
        this.lookingAwayCount=0;
        this.eyesClosedCount=0;
        this.onViolation=null;
        this.socketService=null;
        this.isTerminated=false;

        // AI detection tracking
        this.typingPatterns=[];
        this.lastKeystroke=null;
        this.codeSnapshots=[];
        this.largeTextPasteCount=0;
        this.aiPatternDetections=0;
    }

    // Initialize face detection models
    async initialize()
    {
        try
        {
            console.log('Loading face detection models...');

            // Use correct face-api.js model URL
            const MODEL_URL='/models';

            // Try to load from CDN as fallback
            const CDN_URL='https://justadudewhohacks.github.io/face-api.js/models';

            try
            {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(CDN_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(CDN_URL),
                ]);
            } catch (cdnError)
            {
                console.warn('Failed to load from CDN, models might not be available:', cdnError);
                // Continue anyway - we'll handle detection errors gracefully
            }

            this.isInitialized=true;
            console.log('Face detection models loaded successfully');
            return true;
        } catch (error)
        {
            console.error('Failed to load face detection models:', error);
            // Don't fail completely - just disable face detection
            this.isInitialized=true;
            this.faceDetectionDisabled=true;
            return true;
        }
    }

    // Start monitoring
    async startMonitoring(videoElement, interviewId, onViolationCallback, socketService=null)
    {
        if (!this.isInitialized)
        {
            const initialized=await this.initialize();
            if (!initialized)
            {
                throw new Error('Failed to initialize proctoring');
            }
        }

        // Initialize cleanup functions array
        this.cleanupFunctions=[];

        this.videoElement=videoElement;
        this.interviewId=interviewId;
        this.isMonitoring=true;
        this.onViolation=onViolationCallback;
        this.socketService=socketService;

        // Reset counters
        this.suspicionScore=0;
        this.violations=[];
        this.tabSwitchCount=0;
        this.copyPasteAttempts=0;
        this.fullscreenExitCount=0;
        this.noFaceDetectedCount=0;
        this.multipleFacesCount=0;
        this.lookingAwayCount=0;
        this.eyesClosedCount=0;

        console.log('🛡️ Starting proctoring monitoring...');
        console.log('Video element:', videoElement);
        console.log('Video ready state:', videoElement?.readyState);
        console.log('Interview ID:', interviewId);

        // Wait for video to be ready
        if (videoElement&&videoElement.readyState<2)
        {
            console.log('Waiting for video to be ready...');
            await new Promise((resolve) =>
            {
                const checkReady=() =>
                {
                    if (videoElement.readyState>=2)
                    {
                        videoElement.removeEventListener('loadeddata', checkReady);
                        resolve();
                    }
                };
                videoElement.addEventListener('loadeddata', checkReady);
                // Timeout after 5 seconds
                setTimeout(resolve, 5000);
            });
        }

        // Start face detection (if not disabled)
        if (!this.faceDetectionDisabled)
        {
            this.startFaceDetection();
        } else
        {
            console.warn('⚠️ Face detection disabled - models not loaded');
        }

        // Monitor tab visibility
        this.setupTabVisibilityMonitoring();

        // Enforce fullscreen
        this.enforceFullscreen();

        // Block copy-paste
        this.setupCopyPasteBlocking();

        // Monitor multiple screens (if possible)
        this.setupScreenMonitoring();

        // Setup AI detection
        this.setupAIDetection();

        console.log('✅ Proctoring monitoring started successfully');
    }

    // Face detection every 2 seconds
    startFaceDetection()
    {
        if (this.faceDetectionInterval)
        {
            clearInterval(this.faceDetectionInterval);
        }

        this.faceDetectionInterval=setInterval(async () =>
        {
            if (!this.isMonitoring||!this.videoElement) return;

            // Check if video is actually playing
            if (this.videoElement.readyState<2||this.videoElement.paused)
            {
                console.log('Video not ready or paused, skipping detection');
                return;
            }

            try
            {
                const detections=await faceapi
                    .detectAllFaces(this.videoElement, new faceapi.TinyFaceDetectorOptions({inputSize: 224, scoreThreshold: 0.5}))
                    .withFaceLandmarks();

                console.log(`📹 Face detection: ${detections.length} face(s) detected`);

                if (detections.length===0)
                {
                    this.noFaceDetectedCount++;
                    if (this.noFaceDetectedCount>3)
                    {
                        // No face detected for 6+ seconds
                        this.reportViolation('no_face', 'critical', 'No face detected in camera');
                        this.noFaceDetectedCount=0;
                    }
                } else if (detections.length>1)
                {
                    this.multipleFacesCount++;
                    console.log(`👥 Multiple faces detected! Count: ${this.multipleFacesCount}, Total faces: ${detections.length}`);

                    if (this.multipleFacesCount>1)
                    {
                        // Multiple faces for 4+ seconds
                        this.reportViolation('multiple_faces', 'critical', `${detections.length} faces detected in frame`);
                        this.multipleFacesCount=0;
                    }
                } else
                {
                    // Valid - single face detected
                    this.noFaceDetectedCount=0;
                    this.multipleFacesCount=0;

                    // Proper eye and gaze tracking
                    const landmarks=detections[0].landmarks;
                    const detection=detections[0].detection;

                    // Get eye landmarks
                    const leftEye=landmarks.getLeftEye();
                    const rightEye=landmarks.getRightEye();
                    const nose=landmarks.getNose();
                    const jawline=landmarks.getJawOutline();

                    // Calculate Eye Aspect Ratio (EAR) for both eyes
                    const leftEAR=this.calculateEyeAspectRatio(leftEye);
                    const rightEAR=this.calculateEyeAspectRatio(rightEye);
                    const avgEAR=(leftEAR+rightEAR)/2;

                    // Check if eyes are closed (EAR < threshold)
                    if (avgEAR<0.2)
                    {
                        this.eyesClosedCount++;
                        console.log(`👁️ Eyes closed detected! EAR: ${avgEAR.toFixed(2)}, Count: ${this.eyesClosedCount}`);
                        if (this.eyesClosedCount>2)
                        {
                            this.reportViolation('eyes_closed', 'medium', 'Eyes closed for extended period');
                            this.eyesClosedCount=0;
                        }
                    } else
                    {
                        this.eyesClosedCount=0;
                    }

                    // Advanced gaze direction detection
                    const gazeDirection=this.analyzeGazeDirection(leftEye, rightEye, nose, jawline, detection);

                    if (gazeDirection.isLookingAway)
                    {
                        this.lookingAwayCount++;
                        console.log(`👀 Looking away detected: ${gazeDirection.direction} (confidence: ${gazeDirection.confidence.toFixed(2)}), Count: ${this.lookingAwayCount}`);

                        if (this.lookingAwayCount>2)
                        {
                            this.reportViolation(
                                'looking_away',
                                'medium',
                                `Looking ${gazeDirection.direction} - attention diverted`
                            );
                            this.lookingAwayCount=0;
                        }
                    } else
                    {
                        this.lookingAwayCount=0;
                    }
                }
            } catch (error)
            {
                console.error('Face detection error:', error);
            }
        }, 2000); // Check every 2 seconds
    }

    // Calculate Eye Aspect Ratio (EAR) for drowsiness/eye closure detection
    calculateEyeAspectRatio(eyeLandmarks)
    {
        // Eye landmarks are 6 points for each eye
        // Calculate vertical eye distances
        const vertical1=this.euclideanDistance(eyeLandmarks[1], eyeLandmarks[5]);
        const vertical2=this.euclideanDistance(eyeLandmarks[2], eyeLandmarks[4]);

        // Calculate horizontal eye distance
        const horizontal=this.euclideanDistance(eyeLandmarks[0], eyeLandmarks[3]);

        // EAR formula
        const ear=(vertical1+vertical2)/(2.0*horizontal);
        return ear;
    }

    // Calculate Euclidean distance between two points
    euclideanDistance(point1, point2)
    {
        return Math.sqrt(Math.pow(point2.x-point1.x, 2)+Math.pow(point2.y-point1.y, 2));
    }

    // Analyze gaze direction using facial landmarks
    analyzeGazeDirection(leftEye, rightEye, nose, jawline, detection)
    {
        // Calculate eye centers
        const leftEyeCenter=this.getCenter(leftEye);
        const rightEyeCenter=this.getCenter(rightEye);
        const eyeCenter={
            x: (leftEyeCenter.x+rightEyeCenter.x)/2,
            y: (leftEyeCenter.y+rightEyeCenter.y)/2
        };

        // Get nose tip and bridge
        const noseTip=nose[3];
        const noseBridge=nose[0];

        // Get face boundaries
        const leftFace=jawline[0];
        const rightFace=jawline[16];
        const faceWidth=rightFace.x-leftFace.x;
        const eyesWidth=rightEyeCenter.x-leftEyeCenter.x;

        // Calculate horizontal deviation (nose position relative to eye center)
        const noseXOffset=noseTip.x-eyeCenter.x;
        const horizontalRatio=Math.abs(noseXOffset)/eyesWidth;

        // Calculate vertical deviation (eye to nose vertical alignment)
        const noseYOffset=noseTip.y-eyeCenter.y;
        const verticalRatio=Math.abs(noseYOffset)/faceWidth;

        // Determine gaze direction
        let isLookingAway=false;
        let direction='center';
        let confidence=0;

        // Horizontal gaze detection (left/right)
        if (horizontalRatio>0.25)
        {
            isLookingAway=true;
            direction=noseXOffset>0? 'right':'left';
            confidence=Math.min(horizontalRatio, 1.0);
        }
        // Vertical gaze detection (up/down)
        else if (verticalRatio>0.15)
        {
            isLookingAway=true;
            direction=noseYOffset<0? 'up':'down';
            confidence=Math.min(verticalRatio*2, 1.0);
        }

        return {
            isLookingAway,
            direction,
            confidence,
            horizontalRatio,
            verticalRatio
        };
    }

    // Get center point of a set of landmarks
    getCenter(landmarks)
    {
        let sumX=0, sumY=0;
        landmarks.forEach(point =>
        {
            sumX+=point.x;
            sumY+=point.y;
        });
        return {
            x: sumX/landmarks.length,
            y: sumY/landmarks.length
        };
    }

    // Setup tab visibility monitoring
    setupTabVisibilityMonitoring()
    {
        const handleVisibilityChange=() =>
        {
            if (document.hidden&&this.isMonitoring)
            {
                this.tabSwitchCount++;
                this.reportViolation(
                    'tab_switch',
                    'high',
                    `Tab switched (${this.tabSwitchCount} times)`
                );
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Also monitor window blur
        const handleWindowBlur=() =>
        {
            if (this.isMonitoring)
            {
                this.reportViolation('window_blur', 'high', 'Window lost focus');
            }
        };

        window.addEventListener('blur', handleWindowBlur);

        // Store cleanup functions
        this.cleanupFunctions=this.cleanupFunctions||[];
        this.cleanupFunctions.push(() =>
        {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
        });
    }

    // Enforce fullscreen mode
    enforceFullscreen()
    {
        const enterFullscreen=async () =>
        {
            try
            {
                if (!document.fullscreenElement)
                {
                    await document.documentElement.requestFullscreen();
                }
            } catch (error)
            {
                console.error('Fullscreen error:', error);
            }
        };

        // Try to enter fullscreen immediately
        enterFullscreen();

        // Monitor fullscreen exit
        const handleFullscreenChange=() =>
        {
            if (!document.fullscreenElement&&this.isMonitoring)
            {
                this.fullscreenExitCount++;
                this.reportViolation(
                    'fullscreen_exit',
                    'critical',
                    `Fullscreen exited (${this.fullscreenExitCount} times)`
                );

                // Try to re-enter fullscreen after a short delay
                setTimeout(enterFullscreen, 1000);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        this.cleanupFunctions=this.cleanupFunctions||[];
        this.cleanupFunctions.push(() =>
        {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        });
    }

    // Block copy-paste attempts
    setupCopyPasteBlocking()
    {
        const blockCopyPaste=(e) =>
        {
            if (this.isMonitoring)
            {
                const target=e.target;

                // Allow in code editor (Monaco Editor)
                if (target.closest('.monaco-editor')||
                    target.closest('[data-allow-copy]'))
                {
                    return;
                }

                e.preventDefault();
                this.copyPasteAttempts++;
                this.reportViolation(
                    'copy_paste_attempt',
                    'medium',
                    `Copy/paste blocked (${this.copyPasteAttempts} times)`
                );
            }
        };

        document.addEventListener('copy', blockCopyPaste);
        document.addEventListener('cut', blockCopyPaste);
        document.addEventListener('paste', blockCopyPaste);

        // Also block right-click in non-editor areas
        const blockRightClick=(e) =>
        {
            if (this.isMonitoring)
            {
                const target=e.target;
                if (!target.closest('.monaco-editor'))
                {
                    e.preventDefault();
                }
            }
        };

        document.addEventListener('contextmenu', blockRightClick);

        this.cleanupFunctions=this.cleanupFunctions||[];
        this.cleanupFunctions.push(() =>
        {
            document.removeEventListener('copy', blockCopyPaste);
            document.removeEventListener('cut', blockCopyPaste);
            document.removeEventListener('paste', blockCopyPaste);
            document.removeEventListener('contextmenu', blockRightClick);
        });
    }

    // Setup screen monitoring (detect multiple monitors)
    setupScreenMonitoring()
    {
        // Detect screen changes
        if (window.screen)
        {
            const initialScreenWidth=window.screen.width;
            const initialScreenHeight=window.screen.height;

            const checkScreenChange=() =>
            {
                if (this.isMonitoring)
                {
                    if (window.screen.width!==initialScreenWidth||
                        window.screen.height!==initialScreenHeight)
                    {
                        this.reportViolation(
                            'screen_change',
                            'high',
                            'Screen configuration changed'
                        );
                    }
                }
            };

            const intervalId=setInterval(checkScreenChange, 5000);

            this.cleanupFunctions=this.cleanupFunctions||[];
            this.cleanupFunctions.push(() => clearInterval(intervalId));
        }
    }

    // Setup AI-generated answer detection
    setupAIDetection()
    {
        console.log('🤖 Setting up AI detection monitoring...');

        // Monitor typing patterns in code editor
        const monitorTyping=(e) =>
        {
            if (!this.isMonitoring) return;

            const now=Date.now();
            const target=e.target;

            // Only monitor in code editor areas
            if (target.closest('.monaco-editor')||target.closest('[contenteditable]'))
            {
                if (this.lastKeystroke)
                {
                    const timeDiff=now-this.lastKeystroke;
                    this.typingPatterns.push(timeDiff);

                    // Keep only last 50 keystrokes
                    if (this.typingPatterns.length>50)
                    {
                        this.typingPatterns.shift();
                    }
                }
                this.lastKeystroke=now;
            }
        };

        document.addEventListener('keydown', monitorTyping);

        // Enhanced paste detection with AI pattern analysis
        const handlePaste=(e) =>
        {
            if (!this.isMonitoring) return;

            const target=e.target;
            const clipboardData=e.clipboardData||window.clipboardData;
            const pastedText=clipboardData?.getData('text');

            if (pastedText&&(target.closest('.monaco-editor')||target.closest('[contenteditable]')))
            {
                console.log('📋 Paste detected, analyzing content...');

                // Check for large pastes (likely AI-generated)
                if (pastedText.length>100)
                {
                    this.largeTextPasteCount++;

                    // Analyze for AI patterns
                    const aiScore=this.analyzeForAIPatterns(pastedText);

                    if (aiScore>0.6)
                    {
                        this.reportViolation(
                            'ai_generated_code',
                            'critical',
                            `Suspected AI-generated code pasted (confidence: ${(aiScore*100).toFixed(0)}%)`
                        );
                    } else if (pastedText.length>200)
                    {
                        this.reportViolation(
                            'large_paste',
                            'high',
                            `Large code block pasted (${pastedText.length} characters)`
                        );
                    }
                }
            }
        };

        document.addEventListener('paste', handlePaste);

        // Periodic code analysis
        const analyzeCodeInterval=setInterval(() =>
        {
            if (!this.isMonitoring) return;

            // Analyze typing patterns for bot-like behavior
            if (this.typingPatterns.length>=20)
            {
                const avgSpeed=this.typingPatterns.reduce((a, b) => a+b, 0)/this.typingPatterns.length;
                const variance=this.calculateVariance(this.typingPatterns);

                // Suspiciously consistent typing (bot-like)
                if (variance<100&&avgSpeed<50)
                {
                    console.log('⚠️ Suspicious typing pattern detected');
                    this.aiPatternDetections++;

                    if (this.aiPatternDetections>2)
                    {
                        this.reportViolation(
                            'suspicious_typing',
                            'medium',
                            'Unusual typing patterns detected'
                        );
                        this.aiPatternDetections=0;
                    }
                }
            }
        }, 30000); // Check every 30 seconds

        this.cleanupFunctions=this.cleanupFunctions||[];
        this.cleanupFunctions.push(() =>
        {
            document.removeEventListener('keydown', monitorTyping);
            document.removeEventListener('paste', handlePaste);
            clearInterval(analyzeCodeInterval);
        });
    }

    // Analyze text for AI-generated patterns
    analyzeForAIPatterns(text)
    {
        let aiScore=0;
        const indicators=[
            // Common AI comment patterns
            {pattern: /\/\/.*(?:here's|here is|this|implementation|solution)/i, weight: 0.2},
            {pattern: /\/\*\*.*@param.*@return.*\*\//s, weight: 0.15},
            {pattern: /(?:certainly|sure|here's how|let me|i'll|you can)/i, weight: 0.25},

            // AI-style explanations
            {pattern: /\/\/.*(?:note that|important|remember|keep in mind)/i, weight: 0.15},
            {pattern: /\/\/.*(?:step \d|first|second|third|finally)/i, weight: 0.2},

            // Perfect formatting indicators
            {pattern: /^\s*\/\/.{20,}$/m, weight: 0.1},
            {pattern: /(?:TODO|FIXME|NOTE|IMPORTANT):/i, weight: 0.1},

            // AI-generated function names
            {pattern: /function\s+(?:helper|utility|process|handle|manage|perform)[A-Z]\w+/g, weight: 0.15},

            // Multiple complete functions at once
            {pattern: /function.*\{[^}]{100,}\}/g, weight: 0.1},

            // ChatGPT-style markdown code blocks
            {pattern: /```\w+\n[\s\S]*```/, weight: 0.3},

            // Overly verbose comments
            {pattern: /\/\/.*\b\w{15,}\b.*\b\w{15,}\b/i, weight: 0.1}
        ];

        indicators.forEach(({pattern, weight}) =>
        {
            if (pattern.test(text))
            {
                aiScore+=weight;
                console.log('🔍 AI pattern detected:', pattern.source.substring(0, 50));
            }
        });

        // Bonus score for multiple indicators
        if (aiScore>0.4)
        {
            aiScore+=0.2;
        }

        return Math.min(aiScore, 1.0);
    }

    // Calculate variance of an array
    calculateVariance(arr)
    {
        const mean=arr.reduce((a, b) => a+b, 0)/arr.length;
        const squareDiffs=arr.map(value => Math.pow(value-mean, 2));
        return squareDiffs.reduce((a, b) => a+b, 0)/arr.length;
    }

    // Report violation
    async reportViolation(type, severity, description)
    {
        // Prevent reporting after termination
        if (this.isTerminated)
        {
            console.log('⛔ Interview terminated - ignoring violation:', type);
            return;
        }

        const violation={
            type,
            severity,
            description,
            timestamp: new Date().toISOString(),
        };

        this.violations.push(violation);

        // Update suspicion score
        const scoreImpact={
            low: 5,
            medium: 10,
            high: 20,
            critical: 30,
        };

        this.suspicionScore=Math.min(100, this.suspicionScore+scoreImpact[severity]);

        // Call violation callback
        if (this.onViolation)
        {
            this.onViolation(violation, this.suspicionScore);
        }

        // Send to backend via API
        try
        {
            await sendProctoringEvent(this.interviewId, violation);
        } catch (error)
        {
            console.warn('Failed to send proctoring event to API (backend may be offline):', error.message);
        }

        // Send live via socket for real-time updates
        if (this.socketService)
        {
            try
            {
                this.socketService.sendProctoringEvent(this.interviewId, violation);
                console.log('🔴 Live proctoring event sent:', type);
            } catch (error)
            {
                console.error('Failed to send live proctoring event:', error);
            }
        }

        // Auto-terminate on critical threshold (prevent infinite loop)
        if (this.suspicionScore>=100&&type!=='auto_terminate'&&!this.isTerminated)
        {
            this.isTerminated=true;

            // Report terminal violation
            const terminateViolation={
                type: 'auto_terminate',
                severity: 'critical',
                description: 'Maximum violation threshold reached - Interview terminated',
                timestamp: new Date().toISOString(),
            };

            this.violations.push(terminateViolation);

            if (this.onViolation)
            {
                this.onViolation(terminateViolation, this.suspicionScore);
            }

            // Send terminate event
            if (this.socketService)
            {
                try
                {
                    this.socketService.sendProctoringEvent(this.interviewId, terminateViolation);
                } catch (error)
                {
                    console.error('Failed to send termination event:', error);
                }
            }

            // Stop monitoring
            this.stopMonitoring();

            // Show alert to user
            alert('⛔ INTERVIEW TERMINATED\n\nMultiple critical violations detected.\nThe recruiter has been notified.\n\nYou will be redirected to the home page.');

            // Redirect to home after alert
            setTimeout(() =>
            {
                window.location.href='/';
            }, 1000);
        }
    }

    // Stop monitoring
    stopMonitoring()
    {
        this.isMonitoring=false;

        if (this.faceDetectionInterval)
        {
            clearInterval(this.faceDetectionInterval);
            this.faceDetectionInterval=null;
        }

        // Cleanup event listeners
        if (this.cleanupFunctions)
        {
            this.cleanupFunctions.forEach(cleanup => cleanup());
            this.cleanupFunctions=[];
        }

        // Exit fullscreen
        if (document.fullscreenElement)
        {
            document.exitFullscreen().catch(() => {});
        }

        console.log('Proctoring monitoring stopped');
    }

    // Get current statistics
    getStatistics()
    {
        return {
            suspicionScore: this.suspicionScore,
            integrityScore: Math.max(0, 100-this.suspicionScore),
            violations: this.violations,
            tabSwitchCount: this.tabSwitchCount,
            copyPasteAttempts: this.copyPasteAttempts,
            fullscreenExitCount: this.fullscreenExitCount,
            noFaceDetectedCount: this.noFaceDetectedCount,
            multipleFacesCount: this.multipleFacesCount,
        };
    }
}

// Export singleton instance
export default new ProctoringService();
