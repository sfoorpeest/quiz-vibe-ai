import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Send, User, Search, MessageSquare, Loader2, Paperclip, FileText, Download, Forward, X, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { getContacts, getChatHistory, searchUsers, uploadFileMessage, forwardMessage, markMessagesSeen } from '../services/chatService';
import { motion, AnimatePresence } from 'framer-motion';

// Helper: Lấy icon và màu sắc phù hợp với loại file dựa trên MIME type
const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return { label: 'PDF', color: 'text-red-400 bg-red-400/10' };
    if (fileType?.includes('word') || fileType?.includes('document')) return { label: 'DOCX', color: 'text-blue-400 bg-blue-400/10' };
    if (fileType?.includes('text')) return { label: 'TXT', color: 'text-slate-300 bg-slate-500/20' };
    return { label: 'FILE', color: 'text-slate-300 bg-slate-500/20' };
};

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

    // File upload states
    // selectedFile: file người dùng đã chọn (chưa gửi)
    // isUploading: đang trong quá trình upload lên server
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null); // Ref đến input[type=file] ẩn

    // Forward modal states
    // forwardingMessage: tin nhắn đang được chọn để forward
    // forwardSearchQuery/Results: tìm kiếm user để forward đến
    const [forwardingMessage, setForwardingMessage] = useState(null);
    const [isForwarding, setIsForwarding] = useState(false);
    const [forwardSearchQuery, setForwardSearchQuery] = useState('');
    const [forwardSearchResults, setForwardSearchResults] = useState([]);

    // Ref lưu selectedContact.id để dùng trong socket callback (tránh stale closure)
    const selectedContactIdRef = useRef(null);
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

    // 2. Khởi tạo Socket.IO và lắng nghe các sự kiện real-time
    useEffect(() => {
        if (!token) return;

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const serverUrl = API_URL.replace('/api', '');

        socketRef.current = io(serverUrl, { auth: { token } });

        socketRef.current.on('connect', () => {
            console.log('✅ Socket connected:', socketRef.current.id);
        });

        // Lắng nghe tin nhắn mới đến. Dùng selectedContactIdRef tránh stale closure.
        socketRef.current.on('receive_message', (message) => {
            setMessages(prev => {
                if (message.sender_id === selectedContactIdRef.current) {
                    return [...prev, message];
                }
                return prev;
            });
        });

        // Server thông báo tin nhắn đã delivered → cập nhật icon ✓ → ✓✓
        socketRef.current.on('message_delivered', ({ messageId, status }) => {
            setMessages(prev =>
                prev.map(msg => msg.id === messageId ? { ...msg, status } : msg)
            );
        });

        // Người nhận đã xem → cập nhật tất cả tin nhắn gửi cho họ thành 'seen'
        socketRef.current.on('messages_seen', ({ by }) => {
            setMessages(prev =>
                prev.map(msg =>
                    msg.receiver_id === by ? { ...msg, status: 'seen' } : msg
                )
            );
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [token]);


    // 3. Fetch lịch sử tin nhắn khi chọn một người liên hệ
    useEffect(() => {
        if (!selectedContact) return;

        // Cập nhật ref để socket callback có thể kiểm tra đúng contact đang mở
        selectedContactIdRef.current = selectedContact.id;

        const fetchHistory = async () => {
            setIsLoadingHistory(true);
            try {
                const history = await getChatHistory(selectedContact.id);
                setMessages(history);

                // Sau khi load xong lịch sử, emit 'mark_seen' qua socket để thông báo
                // rằng mình đã đọc tất cả tin nhắn từ người này
                if (socketRef.current?.connected) {
                    socketRef.current.emit('mark_seen', { senderId: selectedContact.id });
                }
                // Fallback: gọi HTTP nếu cần (socket đã xử lý DB, nên HTTP chỉ là backup)
                markMessagesSeen(selectedContact.id);
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        fetchHistory();

        // Cleanup: xóa ref khi bỏ chọn contact
        return () => { selectedContactIdRef.current = null; };
    }, [selectedContact]);

    // 3.5. Debounce tìm kiếm user để forward file
    useEffect(() => {
        if (!forwardSearchQuery.trim()) {
            setForwardSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                const results = await searchUsers(forwardSearchQuery);
                setForwardSearchResults(results);
            } catch (err) {
                console.error('Lỗi tìm kiếm forward:', err);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [forwardSearchQuery]);

    // 4. Tự động cuộn xuống tin nhắn mới nhất
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 5. Gửi tin nhắn văn bản qua socket
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !selectedContact) return;

        const messageData = {
            receiver_id: selectedContact.id,
            content: inputMessage,
            type: 'text'
        };

        socketRef.current.emit('send_message', messageData, (response) => {
            if (response.success) {
                setMessages(prev => [...prev, response.message]);
            } else {
                console.error("Gửi tin thất bại:", response.error);
            }
        });

        setInputMessage('');
    };

    // 6. Xử lý khi người dùng chọn file từ input[type=file]
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Kiểm tra kích thước: tối đa 10MB
        if (file.size > 10 * 1024 * 1024) {
            alert('File quá lớn! Giới hạn tối đa là 10MB.');
            e.target.value = '';
            return;
        }
        setSelectedFile(file);
    };

    // 7. Upload và gửi file qua HTTP (POST /api/chat/upload)
    const handleSendFile = async () => {
        if (!selectedFile || !selectedContact) return;
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('receiver_id', selectedContact.id);
            if (inputMessage.trim()) formData.append('content', inputMessage);

            const newMessage = await uploadFileMessage(formData);
            // Thêm tin nhắn vào danh sách hiển thị ngay lập tức
            setMessages(prev => [...prev, newMessage]);
            setSelectedFile(null);
            setInputMessage('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            alert('Upload thất bại. Vui lòng thử lại.');
            console.error('Upload error:', error);
        } finally {
            setIsUploading(false);
        }
    };

    // 8. Xử lý forward file đến một user khác
    const handleForward = async (receiverId) => {
        if (!forwardingMessage) return;
        setIsForwarding(true);
        try {
            const newMsg = await forwardMessage(forwardingMessage.id, receiverId);
            // Nếu người nhận là contact hiện tại đang mở, hiển thị luôn
            if (receiverId === selectedContactIdRef.current) {
                setMessages(prev => [...prev, newMsg]);
            }
            setForwardingMessage(null);
            setForwardSearchQuery('');
            setForwardSearchResults([]);
            alert('Đã chuyển tiếp thành công!');
        } catch (error) {
            alert('Chuyển tiếp thất bại. Vui lòng thử lại.');
            console.error('Forward error:', error);
        } finally {
            setIsForwarding(false);
        }
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
                                            const isFile = msg.type === 'file';
                                            const fileInfo = isFile ? getFileIcon(msg.file_type) : null;
                                            const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace('/api', '');

                                            return (
                                                <motion.div
                                                    key={msg.id || index}
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`}
                                                >
                                                    <div className="flex flex-col gap-1 max-w-[75%]">
                                                        {/* Badge "Đã chuyển tiếp" nếu là forwarded message */}
                                                        {msg.is_forwarded && (
                                                            <span className={`text-[10px] flex items-center gap-1 ${isMine ? 'text-blue-300 justify-end' : 'text-slate-500'}`}>
                                                                <Forward className="w-3 h-3" /> Đã chuyển tiếp
                                                            </span>
                                                        )}

                                                        <div className="flex items-end gap-2">
                                                            {/* Nút Forward (hiện khi hover vào tin nhắn có file) */}
                                                            {isFile && !isMine && (
                                                                <button
                                                                    onClick={() => setForwardingMessage(msg)}
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white shrink-0"
                                                                    title="Chuyển tiếp file"
                                                                >
                                                                    <Forward className="w-4 h-4" />
                                                                </button>
                                                            )}

                                                            {/* Bubble tin nhắn */}
                                                            <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                                                                isMine
                                                                    ? 'bg-blue-600 text-white rounded-br-sm'
                                                                    : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700/50'
                                                            }`}>
                                                                {/* Nội dung: file bubble hoặc text */}
                                                                {isFile ? (
                                                                    <div className="flex flex-col gap-2">
                                                                        {/* Hiển thị file với icon và tên */}
                                                                        <a
                                                                            href={`${API_BASE}${msg.file_path}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            download={msg.file_name}
                                                                            className="flex items-center gap-3 group/file"
                                                                        >
                                                                            <span className={`text-xs font-bold px-2 py-1 rounded ${fileInfo?.color} shrink-0`}>
                                                                                {fileInfo?.label}
                                                                            </span>
                                                                            <span className={`text-sm truncate max-w-[160px] ${isMine ? 'text-blue-100' : 'text-slate-300'} group-hover/file:underline`}>
                                                                                {msg.file_name || 'Tệp đính kèm'}
                                                                            </span>
                                                                            <Download className={`w-4 h-4 shrink-0 ${isMine ? 'text-blue-200' : 'text-slate-400'}`} />
                                                                        </a>
                                                                        {/* Lời nhắn kèm file (nếu có) */}
                                                                        {msg.content && (
                                                                            <p className="text-[14px] leading-relaxed border-t border-white/10 pt-2">{msg.content}</p>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-[15px] leading-relaxed break-words">{msg.content}</p>
                                                                )}

                                                                {/* Thời gian + Status icon (chỉ hiện với tin của mình) */}
                                                                <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                                    <span className={`text-[10px] ${isMine ? 'text-blue-200' : 'text-slate-500'}`}>
                                                                        {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                    {/* Icon trạng thái: chỉ hiện bên phải tin nhắn của mình */}
                                                                    {isMine && (
                                                                        <span title={msg.status === 'seen' ? 'Đã xem' : msg.status === 'delivered' ? 'Đã nhận' : 'Đã gửi'}>
                                                                            {msg.status === 'seen'
                                                                                ? <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                                                                                : msg.status === 'delivered'
                                                                                    ? <CheckCheck className="w-3.5 h-3.5 text-blue-200" />
                                                                                    : <Check className="w-3.5 h-3.5 text-blue-200/60" />
                                                                            }
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Nút Forward bên phải (tin nhắn của mình) */}
                                                            {isFile && isMine && (
                                                                <button
                                                                    onClick={() => setForwardingMessage(msg)}
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white shrink-0"
                                                                    title="Chuyển tiếp file"
                                                                >
                                                                    <Forward className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
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
                            <div className="p-4 border-t border-slate-800/80 bg-slate-900/50 backdrop-blur-md flex flex-col gap-2">
                                {/* Preview file đã chọn (trước khi gửi) */}
                                {selectedFile && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-sm text-slate-300">
                                        <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                                        <span className="truncate flex-1">{selectedFile.name}</span>
                                        <button onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-slate-500 hover:text-white">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                <form onSubmit={selectedFile ? (e) => { e.preventDefault(); handleSendFile(); } : handleSendMessage} className="flex gap-2">
                                    {/* Input file ẩn — chỉ hiện nút 📎 bên ngoài */}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        accept=".pdf,.docx,.doc,.txt"
                                        className="hidden"
                                        id="chat-file-input"
                                    />

                                    {/* Nút đính kèm file — chỉ Giáo viên (role_id=2) và Admin (role_id=3) */}
                                    {(user?.role_id === 2 || user?.role_id === 3) && (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:border-blue-500/50 transition-all shrink-0"
                                            title="Đính kèm tài liệu (PDF, DOCX, TXT)"
                                        >
                                            <Paperclip className="w-5 h-5" />
                                        </button>
                                    )}

                                    <input
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        placeholder={selectedFile ? "Thêm lời nhắn kèm file (tuỳ chọn)..." : "Nhập tin nhắn của bạn..."}
                                        className="flex-1 bg-slate-800 text-slate-100 placeholder:text-slate-500 rounded-full px-6 py-3 border border-slate-700 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
                                    />

                                    {/* Nút gửi */}
                                    <button
                                        type="submit"
                                        disabled={(!inputMessage.trim() && !selectedFile) || isUploading}
                                        className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-500 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20 active:scale-95 shrink-0"
                                    >
                                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
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

            {/* ===== MODAL FORWARD FILE ===== */}
            <AnimatePresence>
                {forwardingMessage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={(e) => { if (e.target === e.currentTarget) setForwardingMessage(null); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Forward className="w-5 h-5 text-blue-400" /> Chuyển tiếp tài liệu
                                </h3>
                                <button onClick={() => setForwardingMessage(null)} className="text-slate-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Thông tin file đang được forward */}
                            <div className="mb-4 p-3 bg-slate-800 rounded-xl border border-slate-700 flex items-center gap-3 text-sm">
                                <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                                <span className="text-slate-300 truncate">{forwardingMessage.file_name || 'Tài liệu'}</span>
                            </div>

                            {/* Tìm kiếm người nhận */}
                            <div className="relative mb-3">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={forwardSearchQuery}
                                    onChange={(e) => setForwardSearchQuery(e.target.value)}
                                    placeholder="Tìm người để chuyển tiếp..."
                                    className="w-full bg-slate-800 text-sm text-slate-200 placeholder:text-slate-500 rounded-xl pl-9 pr-4 py-2.5 border border-slate-700 focus:outline-none focus:border-blue-500/50 transition-all"
                                    autoFocus
                                />
                            </div>

                            {/* Danh sách kết quả tìm kiếm */}
                            <div className="max-h-52 overflow-y-auto space-y-1">
                                {/* Hiện contacts hiện tại nếu chưa tìm */}
                                {(forwardSearchQuery.trim() ? forwardSearchResults : contacts).map(contact => (
                                    <button
                                        key={contact.id}
                                        onClick={() => handleForward(contact.id)}
                                        disabled={isForwarding}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-all text-left disabled:opacity-60"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-200">{contact.name}</p>
                                            <p className="text-xs text-slate-500">{contact.role_id === 3 ? 'Admin' : contact.role_id === 2 ? 'Giáo viên' : 'Học sinh'}</p>
                                        </div>
                                        {isForwarding && <Loader2 className="w-4 h-4 animate-spin text-blue-400 ml-auto" />}
                                    </button>
                                ))}
                                {forwardSearchQuery.trim() && forwardSearchResults.length === 0 && (
                                    <p className="text-center text-slate-500 text-sm py-4">Không tìm thấy người dùng</p>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
