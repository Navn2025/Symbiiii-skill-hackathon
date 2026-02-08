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
    const videoRef=useRef();

    useEffect(() =>
    {
        if (isPhone)
        {
            // Phone device - start camera and connect
            startPhoneCamera();
        } else
        {
            // Main device - generate connection code
            generateConnectionCode();
            listenForSecondaryCamera();
        }

        return () =>
        {
            if (stream)
            {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const generateConnectionCode=() =>
    {
        const code=`${interviewId}-${userName}-${Date.now()}`;
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
            alert('Error accessing camera. Please allow camera permissions.');
        }
    };

    const startSnapshotCapture=(mediaStream) =>
    {
        const canvas=document.createElement('canvas');
        const context=canvas.getContext('2d');

        setInterval(() =>
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

        socket.on('secondary-camera-connected', (data) =>
        {
            console.log('Secondary camera connected');
            setIsConnected(true);
        });

        socket.on('secondary-snapshot', (data) =>
        {
            console.log('Received snapshot from secondary camera');
            // Display snapshot in monitor
        });
    };

    const getQRCodeURL=() =>
    {
        const phoneURL=`${window.location.origin}/secondary-camera?code=${connectionCode}`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(phoneURL)}`;
    };

    const copyLinkToClipboard=() =>
    {
        const phoneURL=`${window.location.origin}/secondary-camera?code=${connectionCode}`;
        navigator.clipboard.writeText(phoneURL);
        alert('Link copied! Open on your phone to connect secondary camera.');
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
                            <ClipboardIcon size={16} /> Copy Connection Link
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
