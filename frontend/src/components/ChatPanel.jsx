import {useState, useEffect, useRef} from 'react';
import socketService from '../services/socket';
import {MessageCircle as ChatIcon} from 'lucide-react';
import './ChatPanel.css';

function ChatPanel({interviewId, userName})
{
    const [messages, setMessages]=useState([]);
    const [inputMessage, setInputMessage]=useState('');
    const messagesEndRef=useRef(null);

    useEffect(() =>
    {
        const socket=socketService.socket;
        if (!socket) return;

        socket.on('chat-message', (data) =>
        {
            setMessages(prev => [...prev, data]);
        });

        return () =>
        {
            socket.off('chat-message');
        };
    }, []);

    useEffect(() =>
    {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom=() =>
    {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
    };

    const handleSendMessage=() =>
    {
        if (!inputMessage.trim()) return;

        const message={
            message: inputMessage,
            userName,
            timestamp: new Date(),
            from: 'me',
        };

        setMessages(prev => [...prev, message]);
        socketService.sendChatMessage(interviewId, inputMessage, userName);
        setInputMessage('');
    };

    const handleKeyPress=(e) =>
    {
        if (e.key==='Enter'&&!e.shiftKey)
        {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="chat-panel">
            <div className="chat-header">
                <h3><ChatIcon size={18} /> Chat</h3>
            </div>

            <div className="chat-messages">
                {messages.length===0? (
                    <div className="no-messages">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ):(
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`chat-message ${msg.from==='me'? 'own':'other'}`}
                        >
                            <div className="message-header">
                                <span className="message-user">{msg.userName}</span>
                                <span className="message-time">
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                            <div className="message-body">
                                {msg.message}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input">
                <input
                    type="text"
                    className="input"
                    placeholder="Type a message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
                <button
                    className="btn btn-primary send-btn"
                    onClick={handleSendMessage}
                >
                    Send
                </button>
            </div>
        </div>
    );
}

export default ChatPanel;
