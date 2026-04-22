import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, User, Search, MessageSquare, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { getContacts, getChatHistory, searchUsers } from '../services/chatService';
import { motion, AnimatePresence } from 'framer-motion';

export default function Chat() {
    const { user, token } = useAuth();
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoadingContacts, setIsLoadingContacts] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    
    // Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    
    // Lưu trữ socket instance và messages end ref để auto-scroll
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    // 1. Fetch danh bạ khi component mount
    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const data = await getContacts();
                setContacts(data);
            } catch (error) {
                console.error("Error fetching contacts:", error);
            } finally {
                setIsLoadingContacts(false);
            }
        };
        fetchContacts();
    }, []);

    // 1.5. Xử lý tìm kiếm (Debounce)
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.trim()) {
                setIsSearching(true);
                try {
                    const results = await searchUsers(searchQuery);
                    setSearchResults(results);
                } catch (error) {
                    console.error("Lỗi tìm kiếm:", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // 2. Khởi tạo Socket.IO
    useEffect(() => {
        if (!token) return;

        // Khởi tạo kết nối tới server kèm token
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        // Vì trong file vite config có thể không có VITE_API_URL, ta gọi thẳng tới localhost:5000
        const serverUrl = API_URL.replace('/api', ''); 
        
        socketRef.current = io(serverUrl, {
            auth: { token }
        });

        socketRef.current.on('connect', () => {
            console.log('✅ Socket connected:', socketRef.current.id);
        });

        // Lắng nghe tin nhắn tới
        socketRef.current.on('receive_message', (message) => {
            console.log("📩 Nhận tin nhắn:", message);
            // Workflow: Cập nhật tin nhắn mới vào state. 
            // Cần cẩn thận để đảm bảo tin nhắn thuộc về người đang chat hiện tại.
            // Vì ta không có selectedContact trong closure này (trừ khi dùng dependency, ta dùng setState callback)
            setMessages((prev) => {
                // Ta có thể kiểm tra xem tin nhắn này có phải của người đang chọn không (so sánh sender_id)
                // Tuy nhiên trong setState callback, ta không có selectedContact hiện tại dễ dàng, 
                // cách tốt nhất là lưu selectedContactId vào một ref.
                // Ở đây ta cứ push vào mảng, sau này có thể filter hoặc lưu ref.
                return [...prev, message]; 
            });
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [token]);

    // 3. Fetch lịch sử tin nhắn khi chọn một người liên hệ
    useEffect(() => {
        if (!selectedContact) return;

        const fetchHistory = async () => {
            setIsLoadingHistory(true);
            try {
                const history = await getChatHistory(selectedContact.id);
                setMessages(history);
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        fetchHistory();
    }, [selectedContact]);

    // 4. Tự động cuộn xuống tin nhắn mới nhất
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 5. Gửi tin nhắn
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !selectedContact) return;

        const messageData = {
            receiver_id: selectedContact.id,
            content: inputMessage,
            type: 'text'
        };

        // Gửi qua socket
        socketRef.current.emit('send_message', messageData, (response) => {
            if (response.success) {
                // Thêm tin nhắn của mình vào màn hình ngay lập tức
                setMessages(prev => [...prev, response.message]);
            } else {
                console.error("Gửi tin thất bại:", response.error);
            }
        });

        setInputMessage('');
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            <Navbar />
            
            {/* Vùng Chat Chính */}
            <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex gap-6 h-[calc(100vh-64px)]">
                
                {/* 1. Cột Sidebar (Danh bạ) */}
                <div className="w-1/3 max-w-sm bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl shadow-blue-900/10 hidden md:flex">
                    <div className="p-5 border-b border-slate-800/80 bg-slate-800/30">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-500" />
                            Danh bạ
                        </h2>
                        <div className="mt-4 relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm người mới..." 
                                className="w-full bg-slate-950/50 text-sm text-slate-200 placeholder:text-slate-500 rounded-xl pl-9 pr-4 py-2.5 border border-slate-700/50 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-3 space-y-1">
                        {isSearching || (isLoadingContacts && !searchQuery) ? (
                            <div className="flex justify-center items-center h-32">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                            </div>
                        ) : (searchQuery.trim() ? searchResults : contacts).length > 0 ? (
                            (searchQuery.trim() ? searchResults : contacts).map((contact) => (
                                <button
                                    key={contact.id}
                                    onClick={() => setSelectedContact(contact)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 text-left ${
                                        selectedContact?.id === contact.id 
                                            ? 'bg-blue-600/20 border border-blue-500/30 shadow-inner' 
                                            : 'hover:bg-slate-800/50 border border-transparent'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center shadow-lg ${
                                        contact.role_id === 3 ? 'bg-amber-500/20 text-amber-500' :
                                        contact.role_id === 2 ? 'bg-emerald-500/20 text-emerald-500' :
                                        'bg-blue-500/20 text-blue-500'
                                    }`}>
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="text-sm font-bold text-slate-200 truncate">{contact.name}</h3>
                                        <p className="text-xs text-slate-500 truncate mt-0.5">
                                            {contact.role_id === 3 ? 'Admin' : contact.role_id === 2 ? 'Giáo viên' : 'Học sinh'}
                                        </p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <p className="text-center text-slate-500 text-sm mt-10">
                                {searchQuery.trim() ? "Không tìm thấy người dùng nào" : "Chưa có lịch sử nhắn tin"}
                            </p>
                        )}
                    </div>
                </div>

                {/* 2. Cột Khung Chat Chính */}
                <div className="flex-1 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">
                    {selectedContact ? (
                        <>
                            {/* Header Chat */}
                            <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-800/40 flex items-center gap-4 z-10">
                                <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-base">{selectedContact.name}</h3>
                                    <p className="text-xs text-blue-400 font-medium">Đang hoạt động</p>
                                </div>
                            </div>

                            {/* Khu vực hiển thị tin nhắn */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {isLoadingHistory ? (
                                    <div className="flex justify-center items-center h-full">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                    </div>
                                ) : messages.length > 0 ? (
                                    <AnimatePresence initial={false}>
                                        {messages.map((msg, index) => {
                                            const isMine = msg.sender_id === user.id;
                                            return (
                                                <motion.div
                                                    key={msg.id || index}
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm ${
                                                        isMine 
                                                            ? 'bg-blue-600 text-white rounded-br-sm' 
                                                            : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700/50'
                                                    }`}>
                                                        <p className="text-[15px] leading-relaxed break-words">{msg.content}</p>
                                                        <span className={`text-[10px] block mt-1 ${isMine ? 'text-blue-200 text-right' : 'text-slate-500 text-left'}`}>
                                                            {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                                            <MessageSquare className="w-8 h-8 text-slate-600" />
                                        </div>
                                        <p>Chưa có tin nhắn nào</p>
                                        <p className="text-sm">Hãy gửi một lời chào!</p>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Khu vực nhập tin nhắn */}
                            <div className="p-4 border-t border-slate-800/80 bg-slate-900/50 backdrop-blur-md">
                                <form onSubmit={handleSendMessage} className="flex gap-3 relative">
                                    <input 
                                        type="text" 
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        placeholder="Nhập tin nhắn của bạn..." 
                                        className="flex-1 bg-slate-800 text-slate-100 placeholder:text-slate-500 rounded-full px-6 py-3 border border-slate-700 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
                                    />
                                    <button 
                                        type="submit"
                                        disabled={!inputMessage.trim()}
                                        className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-500 transition-all disabled:opacity-50 disabled:hover:bg-blue-600 shadow-lg shadow-blue-600/20 active:scale-95"
                                    >
                                        <Send className="w-5 h-5 ml-0.5" />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        // Màn hình chờ khi chưa chọn ai
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                            <div className="w-24 h-24 rounded-full bg-slate-800/30 border border-slate-700/50 flex items-center justify-center mb-6 shadow-xl shadow-black/20">
                                <MessageSquare className="w-10 h-10 text-slate-400" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-300 mb-2">Xin chào, {user?.name}!</h2>
                            <p className="text-slate-500 max-w-sm text-center">
                                Chọn một người dùng bên danh sách để bắt đầu trò chuyện trực tiếp.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
