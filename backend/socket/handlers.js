import geminiAI from '../services/geminiAI.js';
import pineconeService from '../services/pineconeService.js';
import {addMessage, getChatMessages} from '../routes/axiomChat.js';

export function setupSocketHandlers(io)
{
    // Store secondary camera mappings
    const secondaryCameraMappings=new Map(); // code -> {interviewId, socketId}

    // Store proctor dashboard sockets
    const proctorDashboardSockets=new Set();

    io.on('connection', (socket) =>
    {
        console.log(`User connected: ${socket.id}`);

        // Join proctor dashboard room
        socket.on('join-proctor-dashboard', () =>
        {
            socket.join('proctor-dashboard');
            proctorDashboardSockets.add(socket.id);
            console.log(`Proctor joined dashboard: ${socket.id}`);
        });

        // Join interview room
        socket.on('join-interview', (data) =>
        {
            const {interviewId, userName, role}=data;
            socket.join(interviewId);

            console.log(`${userName} (${role}) joined interview ${interviewId}`);

            // Notify others in the room
            socket.to(interviewId).emit('user-joined', {
                userId: socket.id,
                userName,
                role,
            });

            // Notify proctor dashboard of new session
            io.to('proctor-dashboard').emit('session-update', {
                interviewId,
                type: 'user-joined',
                userName,
                role,
            });
        });

        // Leave interview room
        socket.on('leave-interview', (data) =>
        {
            const {interviewId}=data;
            socket.leave(interviewId);

            socket.to(interviewId).emit('user-left', {
                userId: socket.id,
            });
        });

        // WebRTC signaling - offer
        socket.on('webrtc-offer', (data) =>
        {
            const {offer, to}=data;
            io.to(to).emit('webrtc-offer', {
                offer,
                from: socket.id,
            });
        });

        // WebRTC signaling - answer
        socket.on('webrtc-answer', (data) =>
        {
            const {answer, to}=data;
            io.to(to).emit('webrtc-answer', {
                answer,
                from: socket.id,
            });
        });

        // WebRTC signaling - ICE candidate
        socket.on('webrtc-ice-candidate', (data) =>
        {
            const {candidate, to}=data;
            io.to(to).emit('webrtc-ice-candidate', {
                candidate,
                from: socket.id,
            });
        });

        // Code updates (real-time collaboration)
        socket.on('code-update', (data) =>
        {
            const {interviewId, code, language}=data;
            socket.to(interviewId).emit('code-update', {
                code,
                language,
                from: socket.id,
            });
        });

        // Question updates (interviewer changes question)
        socket.on('question-update', (data) =>
        {
            const {interviewId, question}=data;
            console.log(`Question updated in interview ${interviewId}:`, question.title);
            socket.to(interviewId).emit('question-update', {
                question,
                from: socket.id,
            });
        });

        // Chat messages
        socket.on('chat-message', (data) =>
        {
            const {interviewId, message, userName}=data;
            io.to(interviewId).emit('chat-message', {
                message,
                userName,
                timestamp: new Date(),
                from: socket.id,
            });
        });

        // Proctoring events
        socket.on('proctoring-event', (data) =>
        {
            const {interviewId, event}=data;

            // Notify recruiter about the event
            socket.to(interviewId).emit('proctoring-alert', {
                event,
                timestamp: new Date(),
            });

            // Notify proctor dashboard
            io.to('proctor-dashboard').emit('proctoring-alert', {
                interviewId,
                event,
                timestamp: new Date(),
            });
        });

        // Secondary camera - register mapping
        socket.on('register-secondary-camera', (data) =>
        {
            const {interviewId, code}=data;
            secondaryCameraMappings.set(code, {
                interviewId,
                mainSocketId: socket.id
            });
            console.log(`📱 Secondary camera registered: ${code} for interview ${interviewId}`);
        });

        // Secondary camera - phone connection
        socket.on('connect-secondary-camera', (data) =>
        {
            const {code, status}=data;
            const mapping=secondaryCameraMappings.get(code);

            if (mapping)
            {
                // Store phone socket ID
                mapping.phoneSocketId=socket.id;
                secondaryCameraMappings.set(code, mapping);

                // Notify main device
                io.to(mapping.mainSocketId).emit('secondary-camera-connected', {
                    status,
                    timestamp: new Date()
                });

                console.log(`📱 Secondary camera connected: ${code}`);
            }
        });

        // Secondary camera - receive snapshot
        socket.on('secondary-snapshot', (data) =>
        {
            const {code, snapshot}=data;
            const mapping=secondaryCameraMappings.get(code);

            if (mapping)
            {
                // Forward snapshot to main device and recruiter in the room
                io.to(mapping.mainSocketId).emit('secondary-snapshot', {
                    snapshot,
                    timestamp: new Date()
                });

                // Also send to interview room for recruiter
                socket.to(mapping.interviewId).emit('secondary-snapshot', {
                    snapshot,
                    timestamp: new Date()
                });

                // Remove from proctor dashboard if applicable
                if (proctorDashboardSockets.has(socket.id))
                {
                    proctorDashboardSockets.delete(socket.id);
                }
            }
        });

        // Disconnect
        socket.on('disconnect', () =>
        {
            console.log(`User disconnected: ${socket.id}`);
        });

        // ========================================
        // Axiom AI Chat Handlers
        // ========================================

        // Handle AI chat messages
        socket.on('ai-message', async (data) =>
        {
            try
            {
                const {chatId, content, userId='anonymous'}=data;

                if (!chatId||!content)
                {
                    socket.emit('ai-error', {error: 'Missing chatId or content'});
                    return;
                }

                console.log(`📨 AI message from ${userId} in chat ${chatId}`);

                // Add user message
                const userMessage=addMessage(chatId, {
                    role: 'user',
                    content,
                    userId
                });

                // Generate embedding for user message
                const userVector=await geminiAI.generateEmbedding(content);

                // Store in Pinecone
                await pineconeService.createMemory(
                    userVector,
                    {
                        chatId,
                        userId,
                        role: 'user',
                        text: content
                    },
                    userMessage.id
                );

                // Query long-term memory (similar past conversations)
                const memories=await pineconeService.queryMemory(
                    userVector,
                    3,
                    {chatId}
                );

                // Get recent chat history (short-term memory)
                const chatHistory=getChatMessages(chatId).slice(-10);

                // Format context for AI
                const memoryContext=memories.length>0
                    ? `\n\nRelevant past context:\n${memories.map(m => m.metadata?.text||'').join('\n')}`
                    :'';

                const conversationHistory=chatHistory.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));

                // Add memory context as system message
                if (memoryContext)
                {
                    conversationHistory.unshift({
                        role: 'user',
                        content: `Here's some relevant context from previous conversations:${memoryContext}\n\nNow, let's continue our current conversation.`
                    });
                }

                // Generate AI response
                const aiResponse=await geminiAI.generateResponse(
                    conversationHistory,
                    "You are Spec AI, a helpful and knowledgeable AI assistant built into the HireSpec recruitment platform. Be conversational, friendly, and provide clear, accurate information."
                );

                // Add AI message
                const aiMessage=addMessage(chatId, {
                    role: 'model',
                    content: aiResponse,
                    userId: 'aurora'
                });

                // Generate embedding for AI response
                const aiVector=await geminiAI.generateEmbedding(aiResponse);

                // Store AI response in Pinecone
                await pineconeService.createMemory(
                    aiVector,
                    {
                        chatId,
                        userId,
                        role: 'model',
                        text: aiResponse
                    },
                    aiMessage.id
                );

                // Send response back to client
                socket.emit('ai-response', {
                    content: aiResponse,
                    chatId,
                    messageId: aiMessage.id,
                    timestamp: aiMessage.timestamp
                });

                console.log(`✅ AI response sent for chat ${chatId}`);
            } catch (error)
            {
                console.error('AI message error:', error);
                socket.emit('ai-error', {
                    error: 'Failed to process message',
                    details: error.message
                });
            }
        });
    });
}
