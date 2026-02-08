import {useState, useEffect, useRef} from 'react';
import Peer from 'simple-peer';
import socketService from '../services/socket';
import {Video as VideoIcon, VideoOff as VideoOffIcon, Mic as MicIcon, MicOff as MicOffIcon, Loader2 as LoadingIcon} from 'lucide-react';
import './VideoPanel.css';

function VideoPanel({interviewId, userName, role, videoRef, onVideoReady})
{
    const [localStream, setLocalStream]=useState(null);
    const [remoteStream, setRemoteStream]=useState(null);
    const [isVideoOn, setIsVideoOn]=useState(true);
    const [isAudioOn, setIsAudioOn]=useState(true);
    const [remotePeerId, setRemotePeerId]=useState(null);
    const [isLoading, setIsLoading]=useState(true);

    const internalVideoRef=useRef();
    const localVideoRef=videoRef||internalVideoRef;
    const remoteVideoRef=useRef();
    const peerRef=useRef();

    useEffect(() =>
    {
        startLocalStream();
        setupWebRTC();

        return () =>
        {
            if (localStream)
            {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (peerRef.current)
            {
                peerRef.current.destroy();
            }
        };
    }, []);

    const startLocalStream=async () =>
    {
        try
        {
            const stream=await navigator.mediaDevices.getUserMedia({
                video: {
                    width: {ideal: 1280},
                    height: {ideal: 720},
                    facingMode: 'user'
                },
                audio: true,
            });

            setLocalStream(stream);
            if (localVideoRef.current)
            {
                localVideoRef.current.srcObject=stream;

                // Wait for video to load before starting proctoring
                const handleLoadedMetadata=() =>
                {
                    console.log('Video metadata loaded');
                    console.log('Video dimensions:', localVideoRef.current.videoWidth, 'x', localVideoRef.current.videoHeight);
                    console.log('Video ready state:', localVideoRef.current.readyState);
                    setIsLoading(false);

                    // Ensure video is playing
                    localVideoRef.current.play().then(() =>
                    {
                        console.log('Video playing');
                        if (onVideoReady)
                        {
                            console.log('Calling onVideoReady callback');
                            onVideoReady(stream);
                        }
                    }).catch(err =>
                    {
                        console.error('Error playing video:', err);
                        // Try calling anyway
                        if (onVideoReady)
                        {
                            onVideoReady(stream);
                        }
                    });
                };

                localVideoRef.current.onloadedmetadata=handleLoadedMetadata;

                // If metadata already loaded, call immediately
                if (localVideoRef.current.readyState>=1)
                {
                    console.log('Video metadata already loaded');
                    handleLoadedMetadata();
                }
            }
        } catch (error)
        {
            console.error('Error accessing media devices:', error);
            setIsLoading(false);
            alert('Camera access denied. Please allow camera permissions to join the interview.');
        }
    };

    const setupWebRTC=() =>
    {
        const socket=socketService.socket;
        if (!socket) return;

        // Listen for new user
        socket.on('user-joined', (data) =>
        {
            console.log('User joined:', data);
            setRemotePeerId(data.userId);

            // Initiate call if you're the recruiter
            if (role==='recruiter')
            {
                initiateCall(data.userId);
            }
        });

        // Listen for offer
        socket.on('webrtc-offer', async (data) =>
        {
            console.log('Received offer from:', data.from);
            await handleOffer(data.offer, data.from);
        });

        // Listen for answer
        socket.on('webrtc-answer', async (data) =>
        {
            console.log('Received answer from:', data.from);
            if (peerRef.current)
            {
                await peerRef.current.signal(data.answer);
            }
        });

        // Listen for ICE candidate
        socket.on('webrtc-ice-candidate', (data) =>
        {
            if (peerRef.current)
            {
                peerRef.current.signal(data.candidate);
            }
        });
    };

    const initiateCall=(remotePeerId) =>
    {
        if (!localStream) return;

        const peer=new Peer({
            initiator: true,
            trickle: true,
            stream: localStream,
        });

        peer.on('signal', (signal) =>
        {
            socketService.sendOffer(signal, remotePeerId);
        });

        peer.on('stream', (stream) =>
        {
            setRemoteStream(stream);
            if (remoteVideoRef.current)
            {
                remoteVideoRef.current.srcObject=stream;
            }
        });

        peerRef.current=peer;
    };

    const handleOffer=async (offer, fromPeerId) =>
    {
        if (!localStream) return;

        const peer=new Peer({
            initiator: false,
            trickle: true,
            stream: localStream,
        });

        peer.on('signal', (signal) =>
        {
            socketService.sendAnswer(signal, fromPeerId);
        });

        peer.on('stream', (stream) =>
        {
            setRemoteStream(stream);
            if (remoteVideoRef.current)
            {
                remoteVideoRef.current.srcObject=stream;
            }
        });

        peer.signal(offer);
        peerRef.current=peer;
    };

    const toggleVideo=() =>
    {
        if (localStream)
        {
            localStream.getVideoTracks().forEach(track =>
            {
                track.enabled=!track.enabled;
            });
            setIsVideoOn(!isVideoOn);
        }
    };

    const toggleAudio=() =>
    {
        if (localStream)
        {
            localStream.getAudioTracks().forEach(track =>
            {
                track.enabled=!track.enabled;
            });
            setIsAudioOn(!isAudioOn);
        }
    };

    return (
        <div className="video-panel card">
            <div className="video-header">
                <h3><VideoIcon size={18} /> Video Call</h3>
            </div>

            <div className="videos">
                {/* Local Video */}
                <div className="video-container local">
                    {isLoading&&(
                        <div className="waiting">
                            <div className="waiting-icon"><LoadingIcon size={24} /></div>
                            <p>Starting camera...</p>
                        </div>
                    )}
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="video"
                        style={{display: isLoading? 'none':'block'}}
                    />
                    {!isLoading&&<div className="video-label">You ({userName})</div>}
                </div>

                {/* Remote Video */}
                <div className="video-container remote">
                    {remoteStream? (
                        <>
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="video"
                            />
                            <div className="video-label">Remote User</div>
                        </>
                    ):(
                        <div className="waiting">
                            <div className="waiting-icon"><LoadingIcon size={24} /></div>
                            <p>Waiting for other participant...</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="video-controls">
                <button
                    className={`control-btn ${!isVideoOn? 'off':''}`}
                    onClick={toggleVideo}
                    title="Toggle Video"
                >
                    {isVideoOn? <VideoIcon size={18} />:<VideoOffIcon size={18} />}
                </button>
                <button
                    className={`control-btn ${!isAudioOn? 'off':''}`}
                    onClick={toggleAudio}
                    title="Toggle Audio"
                >
                    {isAudioOn? <MicIcon size={18} />:<MicOffIcon size={18} />}
                </button>
            </div>
        </div>
    );
}

export default VideoPanel;
