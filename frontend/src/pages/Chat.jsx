import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Search, MessageSquare, Loader2, Paperclip, FileText, Download, Forward, X, Check, CheckCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import Navbar from '../components/Navbar';
import AnimatedBackground from '../components/AnimatedBackground';
import { searchUsers, uploadFileMessage, forwardMessage } from '../services/chatService';
import { motion, AnimatePresence } from 'framer-motion';

// Helper: Lấy icon và màu sắc phù hợp với loại file dựa trên MIME type
const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return { label: 'PDF', color: 'text-rose-400 bg-rose-500/20' };
    if (fileType?.includes('word') || fileType?.includes('document')) return { label: 'DOCX', color: 'text-blue-400 bg-blue-500/20' };
    if (fileType?.includes('text')) return { label: 'TXT', color: 'text-slate-300 bg-slate-500/20' };
    return { label: 'FILE', color: 'text-slate-300 bg-slate-500/20' };
};

// Helper: Kiểm tra xem hai ngày có giống nhau không
const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

// Helper: Định dạng ngày hiển thị thanh phân cách
const formatDateSeparator = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (isSameDay(date, today)) return 'Hôm nay';
    if (isSameDay(date, yesterday)) return 'Hôm qua';

    return date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).replace(/^\w/, (c) => c.toUpperCase());
};

export default function Chat() {
    const { user } = useAuth();
    const { 
        contacts, selectedContact, setSelectedContact, 
        messages, onlineUsers, isLoadingContacts, 
        sendMessage, fetchContacts 
    } = useChat();

    const [inputMessage, setInputMessage] = useState('');
    
    // Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // File upload states
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Forward modal states
    const [forwardingMessage, setForwardingMessage] = useState(null);
    const [isForwarding, setIsForwarding] = useState(false);
    const [forwardSearchQuery, setForwardSearchQuery] = useState('');
    const [forwardSearchResults, setForwardSearchResults] = useState([]);

    const messagesEndRef = useRef(null);

    // 1. Xử lý tìm kiếm (Debounce)
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

    // 2. Debounce tìm kiếm user để forward file
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

    // 3. Tự động cuộn xuống tin nhắn mới nhất
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 4. Gửi tin nhắn văn bản
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !selectedContact) return;
        sendMessage(inputMessage);
        setInputMessage('');
    };

    // 5. Xử lý upload file
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedContact) return;
        setSelectedFile(file);
    };

    const confirmSendFile = async () => {
        if (!selectedFile || !selectedContact) return;
        
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('receiver_id', selectedContact.id);
            if (inputMessage.trim()) {
                formData.append('content', inputMessage.trim());
            }

            await uploadFileMessage(formData);
            fetchContacts();
            setSelectedFile(null);
            setInputMessage('');
        } catch (error) {
            console.error("Lỗi gửi file:", error);
            alert("Lỗi khi gửi tài liệu. Vui lòng thử lại.");
        } finally {
            setIsUploading(false);
        }
    };

    // 6. Xử lý Forward
    const handleForward = async (receiverId) => {
        if (!forwardingMessage) return;
        setIsForwarding(true);
        try {
            await forwardMessage(forwardingMessage.id, receiverId);
            setForwardingMessage(null);
            setForwardSearchQuery('');
            fetchContacts();
        } catch (error) {
            console.error("Lỗi forward:", error);
            alert("Không thể chuyển tiếp tài liệu.");
        } finally {
            setIsForwarding(false);
        }
    };

    return (
        <div className="relative min-h-screen font-sans text-slate-50 flex flex-col overflow-hidden">
            <AnimatedBackground />
            <Navbar />
            
            <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex gap-6 h-[calc(100vh-64px)] relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* 1. Sidebar: Danh sách bạn bè */}
                <div className="w-80 lg:w-96 flex-shrink-0 bg-slate-900/60 backdrop-blur-2xl border border-slate-700/30 rounded-[32px] overflow-hidden flex flex-col shadow-2xl shadow-black/40 hidden md:flex">
                    <div className="p-6 border-b border-slate-800/50 bg-linear-to-b from-slate-800/30 to-transparent">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-white flex items-center gap-2">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <MessageSquare className="w-5 h-5 text-blue-400" />
                                </div>
                                Tin nhắn
                            </h2>
                            <div className="p-1.5 bg-slate-800/50 rounded-full border border-slate-700/50">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            </div>
                        </div>
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm hội thoại..." 
                                className="w-full bg-slate-950/40 text-sm text-slate-200 placeholder:text-slate-600 rounded-2xl pl-11 pr-4 py-3 border border-slate-700/50 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                        {isLoadingContacts ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500/50" />
                                <p className="text-xs font-bold tracking-widest uppercase">Đang đồng bộ...</p>
                            </div>
                        ) : (
                            (searchQuery.trim() ? searchResults : contacts).map((contact) => (
                                <button
                                    key={contact.id}
                                    onClick={() => setSelectedContact(contact)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left group relative ${
                                        selectedContact?.id === contact.id
                                            ? 'bg-blue-600/10 border border-blue-500/20 shadow-lg'
                                            : 'hover:bg-slate-800/40 border border-transparent'
                                    }`}
                                >
                                    {selectedContact?.id === contact.id && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full"></div>
                                    )}
                                    <div className={`w-12 h-12 rounded-2xl flex shrink-0 items-center justify-center shadow-2xl relative transition-transform group-hover:scale-105 ${
                                        contact.role_id === 3 ? 'bg-linear-to-br from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/20' :
                                        contact.role_id === 2 ? 'bg-linear-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/20' :
                                        'bg-linear-to-br from-blue-500/20 to-violet-500/20 text-blue-400 border border-blue-500/20'
                                    }`}>
                                        <User className="w-6 h-6" />
                                        {onlineUsers.has(Number(contact.id)) && (
                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-slate-900 rounded-full"></span>
                                        )}
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <h3 className="text-sm font-bold text-slate-100 truncate group-hover:text-white transition-colors">{contact.name}</h3>
                                            <span className="text-[10px] text-slate-500 font-medium">12:45</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-slate-500 truncate mt-0.5 font-medium italic">
                                                {contact.role_id === 3 ? 'Quản trị hệ thống' : contact.role_id === 2 ? 'Giáo viên bộ môn' : 'Học sinh năng động'}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* 2. Chat Area: Nội dung tin nhắn */}
                <div className="flex-1 bg-slate-900/40 backdrop-blur-3xl border border-slate-700/30 rounded-[40px] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                    {selectedContact ? (
                        <>
                            {/* Header Chat */}
                            <div className="px-8 py-5 border-b border-slate-800/50 bg-slate-900/40 flex items-center justify-between z-10 backdrop-blur-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                                        <User className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-white text-lg tracking-tight">{selectedContact.name}</h3>
                                        {onlineUsers.has(Number(selectedContact.id)) ? (
                                            <p className="text-[11px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                                                Online
                                            </p>
                                        ) : (
                                            <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest">Offline</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-2.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl border border-slate-700/50 text-slate-400 hover:text-white transition-all">
                                        <Search className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages Container */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-linear-to-b from-transparent to-slate-950/20 custom-scrollbar">
                                {messages.map((msg, index) => {
                                    const isMe = msg.sender_id === user.id;
                                    const showDateSeparator = index === 0 || !isSameDay(messages[index-1].createdAt, msg.createdAt);

                                    return (
                                        <React.Fragment key={msg.id || index}>
                                            {showDateSeparator && (
                                                <div className="flex justify-center my-10 relative">
                                                    <div className="absolute inset-0 flex items-center">
                                                        <div className="w-full border-t border-slate-800/50"></div>
                                                    </div>
                                                    <span className="relative px-6 py-2 rounded-full bg-slate-900 border border-slate-700/50 text-slate-400 text-[10px] font-black tracking-[0.2em] uppercase shadow-2xl">
                                                        {formatDateSeparator(msg.createdAt)}
                                                    </span>
                                                </div>
                                            )}
                                            <motion.div
                                                initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                    <div className={`group relative px-6 py-4 rounded-[28px] shadow-2xl transition-all hover:scale-[1.01] ${
                                                        isMe 
                                                            ? 'bg-linear-to-br from-blue-600 to-indigo-700 text-white rounded-br-md border-t border-white/20' 
                                                            : 'bg-slate-800/80 backdrop-blur-md text-slate-100 rounded-bl-md border border-slate-700/50 shadow-black/40'
                                                    }`}>
                                                        {/* File Attachment Styling */}
                                                        {msg.type === 'file' && (
                                                            <div className={`mb-3 p-4 rounded-2xl border flex items-center gap-4 ${
                                                                isMe ? 'bg-white/10 border-white/20' : 'bg-slate-950/40 border-slate-700'
                                                            }`}>
                                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${getFileIcon(msg.file_type).color}`}>
                                                                    <FileText className="w-6 h-6" />
                                                                </div>
                                                                <div className="overflow-hidden flex-1 pr-2">
                                                                    <p className="text-sm font-black truncate leading-tight mb-1">{msg.file_name}</p>
                                                                    <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest">{getFileIcon(msg.file_type).label}</p>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <a 
                                                                        href={`${import.meta.env.VITE_API_URL}${msg.file_path}`} 
                                                                        target="_blank" 
                                                                        rel="noreferrer"
                                                                        className={`p-2.5 rounded-xl transition-all ${isMe ? 'hover:bg-white/20' : 'hover:bg-slate-700/50'}`}
                                                                        title="Tải xuống"
                                                                    >
                                                                        <Download className="w-4 h-4" />
                                                                    </a>
                                                                    <button 
                                                                        onClick={() => setForwardingMessage(msg)}
                                                                        className={`p-2.5 rounded-xl transition-all ${isMe ? 'hover:bg-white/20' : 'hover:bg-slate-700/50'}`}
                                                                        title="Chuyển tiếp"
                                                                    >
                                                                        <Forward className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2 mt-2 px-2">
                                                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                                                            {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {isMe && (
                                                            <div className="flex items-center">
                                                                {msg.status === 'sent' && <Check className="w-3 h-3 text-slate-600" />}
                                                                {msg.status === 'delivered' && <CheckCheck className="w-3 h-3 text-slate-600" />}
                                                                {msg.status === 'seen' && <CheckCheck className="w-3 h-3 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />}
                                                            </div>
                                                        )}
                                                        {msg.is_forwarded && (
                                                            <span className="text-[9px] text-indigo-400 font-black bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                                                                REDIRECTED
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </React.Fragment>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area: Thanh nhập liệu */}
                            <div className="p-6 border-t border-slate-800/50 bg-slate-900/60 backdrop-blur-xl">
                                {selectedFile && (
                                    <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-blue-500/10 rounded-2xl border border-blue-500/30 text-sm text-blue-300 animate-in slide-in-from-bottom-2">
                                        <FileText className="w-5 h-5 text-blue-400" />
                                        <span className="flex-1 truncate font-bold uppercase tracking-tight">{selectedFile.name}</span>
                                        <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-all">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}

                                <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.docx,.doc,.txt" className="hidden" id="chat-file-input" />

                                    {(user?.role_id === 2 || user?.role_id === 3) && (
                                        <button 
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-14 h-14 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:border-blue-500/50 transition-all shrink-0 group active:scale-95"
                                        >
                                            <Paperclip className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                                        </button>
                                    )}

                                    <div className="flex-1 relative group">
                                        <input 
                                            type="text" 
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            placeholder={selectedFile ? "Thêm ghi chú..." : "Viết tin nhắn của bạn..."}
                                            className="w-full bg-slate-950/60 text-white placeholder:text-slate-600 rounded-2xl px-7 py-4 border border-slate-800 group-hover:border-slate-700 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner text-sm font-medium"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-slate-700 group-focus-within:text-blue-500/40 transition-colors" />
                                        </div>
                                    </div>

                                    <button 
                                        type="button"
                                        onClick={selectedFile ? confirmSendFile : handleSendMessage}
                                        disabled={isUploading || (!inputMessage.trim() && !selectedFile)}
                                        className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] disabled:opacity-30 disabled:grayscale transition-all active:scale-95 shrink-0"
                                    >
                                        {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="relative mb-10">
                                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-[60px] animate-pulse"></div>
                                <div className="relative w-32 h-32 rounded-[40px] bg-slate-800/50 border border-slate-700/50 flex items-center justify-center shadow-2xl rotate-12">
                                    <MessageSquare className="w-14 h-14 text-blue-400/60 -rotate-12" />
                                </div>
                            </div>
                            <h2 className="text-3xl font-black text-white mb-4 bg-linear-to-r from-white to-slate-400 bg-clip-text text-transparent">Trung tâm Liên lạc</h2>
                            <p className="text-slate-500 max-w-sm leading-relaxed font-medium">Chào mừng bạn trở lại! Hãy chọn một người bạn để bắt đầu trao đổi kiến thức hoặc giải đáp thắc mắc.</p>
                            <div className="mt-12 flex gap-4">
                                <div className="px-5 py-2 bg-slate-800/40 rounded-xl border border-slate-700/30 text-[10px] font-black uppercase tracking-widest text-slate-500">Fast Connect</div>
                                <div className="px-5 py-2 bg-slate-800/40 rounded-xl border border-slate-700/30 text-[10px] font-black uppercase tracking-widest text-slate-500">Secure P2P</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: Forwarding (Chuyển tiếp) */}
            <AnimatePresence>
                {forwardingMessage && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
                            className="bg-slate-900 w-full max-w-md rounded-[32px] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden p-8 border border-slate-700/50 relative"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                            
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black text-white flex items-center gap-3">
                                    <Forward className="w-6 h-6 text-indigo-400" /> Chuyển tiếp
                                </h3>
                                <button onClick={() => setForwardingMessage(null)} className="p-2 bg-slate-800/50 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-xl transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-6 p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center gap-4 text-sm">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-blue-400" />
                                </div>
                                <span className="text-slate-300 font-bold truncate">{forwardingMessage.file_name || 'Đang chọn...'}</span>
                            </div>

                            <div className="relative mb-4">
                                <Search className="w-4 h-4 text-slate-600 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input 
                                    type="text" 
                                    value={forwardSearchQuery}
                                    onChange={(e) => setForwardSearchQuery(e.target.value)}
                                    placeholder="Tìm người nhận..." 
                                    className="w-full bg-slate-950/40 text-sm text-white placeholder:text-slate-700 rounded-2xl pl-12 pr-4 py-3.5 border border-slate-800 focus:outline-none focus:border-indigo-500/50 transition-all"
                                    autoFocus
                                />
                            </div>

                            <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                {(forwardSearchQuery.trim() ? forwardSearchResults : contacts).map(contact => (
                                    <button
                                        key={contact.id}
                                        onClick={() => handleForward(contact.id)}
                                        disabled={isForwarding}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-800/30 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition-all text-left disabled:opacity-40 group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                            <User className="w-5 h-5 text-slate-400 group-hover:text-indigo-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-200">{contact.name}</p>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{contact.role_id === 3 ? 'ADMIN' : contact.role_id === 2 ? 'TEACHER' : 'STUDENT'}</p>
                                        </div>
                                        {isForwarding ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <Forward className="w-4 h-4 text-slate-600 group-hover:text-indigo-400" />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
