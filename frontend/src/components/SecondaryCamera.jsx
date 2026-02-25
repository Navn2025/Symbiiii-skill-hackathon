import {useState, useEffect, useRef} from 'react';
import socketService from '../services/socket';
import {Smartphone as PhoneIcon, AlertCircle as AlertIcon, Clipboard as ClipboardIcon, Check as CheckIcon} from 'lucide-react';
import './SecondaryCamera.css';

function SecondaryCamera({interviewId, userName, isPhone=false})
{
    const [stream, setStream]=useState(null);
    const [isConnected, setIsConnected]=useState(false);
    const [connectionCode, setConnectionCode]=useState('');
    const [showQR, setShowQR]=useState(false);
    const [cameraError, setCameraError]=useState(null);
    const [linkCopied, setLinkCopied]=useState(false);
    const videoRef=useRef();
    // Use ref for stream to avoid stale closure in cleanup
    const streamRef=useRef(null);
    // Track snapshot interval for cleanup
    const snapshotIntervalRef=useRef(null);

    useEffect(() =>
    {
        let cleanupSocket=null;
        if (isPhone)
        {
            startPhoneCamera();
        } else
        {
            generateConnectionCode();
            cleanupSocket=listenForSecondaryCamera();
        }

        return () =>
        {
            // Use ref to avoid stale closure
            if (streamRef.current)
            {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            // Clear snapshot interval
            if (snapshotIntervalRef.current)
            {
                clearInterval(snapshotIntervalRef.current);
            }
            // Clean up socket listeners
            if (cleanupSocket) cleanupSocket();
        };
    }, []);

    const generateConnectionCode=() =>
    {
        // Use crypto for unpredictable connection codes
        const randomPart=crypto.randomUUID? crypto.randomUUID():
            `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        const code=`${interviewId}-${randomPart}`;
        setConnectionCode(code);

        // Store in socket for pairing
        socketService.registerSecondaryCamera(interviewId, code);
    };

    const startPhoneCamera=async () =>
    {
        try
        {
            // Request back/environment camera for phone
            const mediaStream=await navigator.mediaDevices.getUserMedia({
                video: {
                    width: {ideal: 1280},
                    height: {ideal: 720},
                    facingMode: {ideal: 'environment'} // Back camera
                },
                audio: false
            });

            setStream(mediaStream);
            streamRef.current=mediaStream;
            if (videoRef.current)
            {
                videoRef.current.srcObject=mediaStream;
            }

            // Notify server about secondary camera connection
            const urlParams=new URLSearchParams(window.location.search);
            const code=urlParams.get('code');

            if (code)
            {
                socketService.connectSecondaryCamera(code, 'connected');
                setIsConnected(true);

                // Send periodic snapshots for proctoring
                startSnapshotCapture(mediaStream);
            }
        } catch (error)
        {
            console.error('Failed to start phone camera:', error);
            setCameraError('Error accessing camera. Please allow camera permissions.');
        }
    };

    const startSnapshotCapture=(mediaStream) =>
    {
        const canvas=document.createElement('canvas');
        const context=canvas.getContext('2d');

        // Store interval ID for cleanup
        snapshotIntervalRef.current=setInterval(() =>
        {
            if (videoRef.current&&videoRef.current.readyState===4)
            {
                canvas.width=videoRef.current.videoWidth;
                canvas.height=videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);

                // Convert to base64 and send snapshot
                const snapshot=canvas.toDataURL('image/jpeg', 0.5);
                const urlParams=new URLSearchParams(window.location.search);
                const code=urlParams.get('code');

                socketService.sendSecondarySnapshot(code, snapshot);
            }
        }, 3000); // Send snapshot every 3 seconds
    };

    const listenForSecondaryCamera=() =>
    {
        const socket=socketService.connect();

        const handleConnected=(data) =>
        {
            console.log('Secondary camera connected');
            setIsConnected(true);
        };

        const handleSnapshot=(data) =>
        {
            console.log('Received snapshot from secondary camera');
        };

        socket.on('secondary-camera-connected', handleConnected);
        socket.on('secondary-snapshot', handleSnapshot);

        // Return cleanup function
        return () =>
        {
            socket.off('secondary-camera-connected', handleConnected);
            socket.off('secondary-snapshot', handleSnapshot);
        };
    };

    const getQRCodeURL=() =>
    {
        const phoneURL=`${window.location.origin}/secondary-camera?code=${connectionCode}`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(phoneURL)}`;
    };

    const copyLinkToClipboard=async () =>
    {
        const phoneURL=`${window.location.origin}/secondary-camera?code=${connectionCode}`;
        try
        {
            await navigator.clipboard.writeText(phoneURL);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 3000);
        } catch (err)
        {
            // Fallback: select text from a temporary input
            console.warn('Clipboard API unavailable, using fallback');
            const tempInput=document.createElement('input');
            tempInput.value=phoneURL;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 3000);
        }
    };

    if (isPhone)
    {
        // Phone view - show camera stream
        return (
            <div className="secondary-camera-phone">
                <div className="phone-header">
                    <h2><PhoneIcon size={20} /> Secondary Camera</h2>
                    {isConnected&&<span className="connected-badge"><CheckIcon size={14} /> Connected</span>}
                </div>
                {cameraError&&(
                    <div style={{padding: '16px', color: '#ef4444', textAlign: 'center'}}>{cameraError}</div>
                )}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="phone-video"
                />
                <div className="phone-instructions">
                    <p>Position your phone to show:</p>
                    <ul>
                        <li>Your workspace from the side</li>
                        <li>Your hands and keyboard</li>
                        <li>Room environment</li>
                    </ul>
                    <p className="warning"><AlertIcon size={14} /> Keep this window open during the interview</p>
                </div>
            </div>
        );
    }

    // Main device view - show connection setup
    return (
        <div className="secondary-camera-setup">
            <div className="setup-header">
                <h4><PhoneIcon size={18} /> Secondary Camera Setup</h4>
                {isConnected? (
                    <span className="status connected"><CheckIcon size={14} /> Connected</span>
                ):(
                    <span className="status disconnected">○ Not Connected</span>
                )}
            </div>

            {!isConnected&&(
                <div className="connection-methods">
                    <div className="method">
                        <h5>Option 1: Scan QR Code</h5>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowQR(!showQR)}
                        >
                            {showQR? 'Hide QR Code':'Show QR Code'}
                        </button>
                        {showQR&&(
                            <div className="qr-container">
                                <img
                                    src={getQRCodeURL()}
                                    alt="QR Code"
                                    className="qr-code"
                                />
                                <p className="qr-instruction">Scan with your phone camera</p>
                            </div>
                        )}
                    </div>

                    <div className="method-divider">OR</div>

                    <div className="method">
                        <h5>Option 2: Copy Link</h5>
                        <button
                            className="btn btn-secondary"
                            onClick={copyLinkToClipboard}
                        >
                            <ClipboardIcon size={16} /> {linkCopied? 'Link Copied!':'Copy Connection Link'}
                        </button>
                        <p className="method-instruction">Open the link on your phone browser</p>
                    </div>
                </div>
            )}

            {isConnected&&(
                <div className="connected-info">
                    <div className="info-icon"><CheckIcon size={18} /></div>
                    <div className="info-text">
                        <p>Secondary camera is active</p>
                        <small>Receiving snapshots every 3 seconds</small>
                    </div>
                </div>
            )}

            <div className="setup-instructions">
                <h5>Instructions:</h5>
                <ol>
                    <li>Use your phone as a secondary camera</li>
                    <li>Position it to show your workspace from the side</li>
                    <li>Keep the camera active throughout the interview</li>
                </ol>
            </div>
        </div>
    );
}

export default SecondaryCamera;
