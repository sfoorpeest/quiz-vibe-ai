import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getUnreadCount, getContacts as fetchContactsService, getChatHistory, markMessagesSeen } from '../services/chatService';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const { user, token } = useAuth();
    
    // UI States
    const [unreadCount, setUnreadCount] = useState(0);
    const [isBubbleOpen, setIsBubbleOpen] = useState(false);
    
    // Data States
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [isLoadingContacts, setIsLoadingContacts] = useState(false);
    
    const socketRef = useRef(null);
    const selectedContactIdRef = useRef(null);

    const refreshUnreadCount = async () => {
        if (!token) return;
        const count = await getUnreadCount();
        setUnreadCount(count);
    };

    const fetchContacts = async () => {
        if (!token) return;
        setIsLoadingContacts(true);
        try {
            const data = await fetchContactsService();
            setContacts(data);
        } catch (error) {
            console.error("Error fetching contacts:", error);
        } finally {
            setIsLoadingContacts(false);
        }
    };

    // Gửi tin nhắn
    const sendMessage = (content, type = 'text', material_id = null) => {
        if (!socketRef.current || !selectedContact) return;

        const messageData = {
            receiver_id: selectedContact.id,
            content,
            type,
            material_id
        };

        socketRef.current.emit('send_message', messageData, (response) => {
            if (response.success) {
                setMessages(prev => [...prev, response.message]);
            }
        });
    };

    // Đánh dấu đã xem
    const markSeen = async (senderId) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('mark_seen', { senderId });
        }
        await markMessagesSeen(senderId);
        refreshUnreadCount();
    };

    useEffect(() => {
        if (!token) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setUnreadCount(0);
            setContacts([]);
            setSelectedContact(null);
            setMessages([]);
            setOnlineUsers(new Set());
            return;
        }

        refreshUnreadCount();
        fetchContacts();

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const serverUrl = API_URL.replace('/api', '');
        
        if (!socketRef.current) {
            socketRef.current = io(serverUrl, { auth: { token } });

            socketRef.current.on('receive_message', (message) => {
                // Nếu đang mở chat với người này, thêm vào list messages
                if (message.sender_id === selectedContactIdRef.current) {
                    setMessages(prev => [...prev, message]);
                    markSeen(message.sender_id);
                } else {
                    // Nếu không, chỉ tăng count thông báo
                    setUnreadCount(prev => prev + 1);
                    // Refresh contacts để hiện tin nhắn mới nhất (nếu có logic đó)
                    fetchContacts();
                }
            });

            socketRef.current.on('message_delivered', ({ messageId, status }) => {
                setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, status } : msg));
            });

            socketRef.current.on('messages_seen', ({ by }) => {
                if (by === user?.id) {
                    refreshUnreadCount();
                } else {
                    setMessages(prev => prev.map(msg => msg.receiver_id === by ? { ...msg, status: 'seen' } : msg));
                }
            });

            socketRef.current.on('online_users_list', (userIds) => {
                setOnlineUsers(new Set(userIds.map(Number)));
            });

            socketRef.current.on('user_online', (userId) => {
                setOnlineUsers(prev => new Set([...prev, Number(userId)]));
            });

            socketRef.current.on('user_offline', (userId) => {
                setOnlineUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(Number(userId));
                    return newSet;
                });
            });
        }

        return () => {};
    }, [token, user?.id]);

    // Đồng bộ ref khi selectedContact thay đổi
    useEffect(() => {
        selectedContactIdRef.current = selectedContact?.id || null;
        if (selectedContact) {
            const fetchHistory = async () => {
                try {
                    const history = await getChatHistory(selectedContact.id);
                    setMessages(history);
                    markSeen(selectedContact.id);
                } catch (error) {
                    console.error("Error fetching history:", error);
                }
            };
            fetchHistory();
        }
    }, [selectedContact]);

    return (
        <ChatContext.Provider value={{ 
            unreadCount, 
            isBubbleOpen, setIsBubbleOpen,
            contacts, setContacts,
            selectedContact, setSelectedContact,
            messages, setMessages,
            onlineUsers,
            isLoadingContacts,
            fetchContacts,
            sendMessage,
            markSeen,
            refreshUnreadCount,
            socket: socketRef.current
        }}>
            {children}
        </ChatContext.Provider>
    );
};
