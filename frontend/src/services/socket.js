import {io} from 'socket.io-client';

const SOCKET_URL='http://localhost:3001';

class SocketService
{
    constructor()
    {
        this.socket=null;
    }

    connect()
    {
        if (!this.socket)
        {
            this.socket=io(SOCKET_URL);

            this.socket.on('connect', () =>
            {
                console.log('Socket connected:', this.socket.id);
            });

            this.socket.on('disconnect', () =>
            {
                console.log('Socket disconnected');
            });
        }
        return this.socket;
    }

    disconnect()
    {
        if (this.socket)
        {
            this.socket.disconnect();
            this.socket=null;
        }
    }

    joinInterview(interviewId, userName, role)
    {
        if (this.socket)
        {
            this.socket.emit('join-interview', {interviewId, userName, role});
        }
    }

    leaveInterview(interviewId)
    {
        if (this.socket)
        {
            this.socket.emit('leave-interview', {interviewId});
        }
    }

    sendCodeUpdate(interviewId, code, language)
    {
        if (this.socket)
        {
            this.socket.emit('code-update', {interviewId, code, language});
        }
    }

    sendChatMessage(interviewId, message, userName)
    {
        if (this.socket)
        {
            this.socket.emit('chat-message', {interviewId, message, userName});
        }
    }

    sendProctoringEvent(interviewId, event)
    {
        if (this.socket)
        {
            this.socket.emit('proctoring-event', {interviewId, event});
        }
    }

    // Secondary camera methods
    registerSecondaryCamera(interviewId, code)
    {
        if (this.socket)
        {
            this.socket.emit('register-secondary-camera', {interviewId, code});
        }
    }

    connectSecondaryCamera(code, status)
    {
        if (this.socket)
        {
            this.socket.emit('connect-secondary-camera', {code, status});
        }
    }

    sendSecondarySnapshot(code, snapshot)
    {
        if (this.socket)
        {
            this.socket.emit('secondary-snapshot', {code, snapshot});
        }
    }

    // WebRTC signaling
    sendOffer(offer, to)
    {
        if (this.socket)
        {
            this.socket.emit('webrtc-offer', {offer, to});
        }
    }

    sendAnswer(answer, to)
    {
        if (this.socket)
        {
            this.socket.emit('webrtc-answer', {answer, to});
        }
    }

    sendIceCandidate(candidate, to)
    {
        if (this.socket)
        {
            this.socket.emit('webrtc-ice-candidate', {candidate, to});
        }
    }

    on(event, callback)
    {
        if (this.socket)
        {
            this.socket.on(event, callback);
        }
    }

    off(event, callback)
    {
        if (this.socket)
        {
            this.socket.off(event, callback);
        }
    }
}

export default new SocketService();
