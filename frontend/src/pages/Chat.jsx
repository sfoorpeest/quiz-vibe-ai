import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Search, MessageSquare, Loader2, Paperclip, FileText, Download, Forward, X, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import Navbar from '../components/Navbar';
import { searchUsers, uploadFileMessage, forwardMessage } from '../services/chatService';
import { motion, AnimatePresence } from 'framer-motion';

// Helper: Lấy icon và màu sắc phù hợp với loại file dựa trên MIME type
const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return { label: 'PDF', color: 'text-red-500 bg-red-100' };
    if (fileType?.includes('word') || fileType?.includes('document')) return { label: 'DOCX', color: 'text-blue-500 bg-blue-100' };
    if (fileType?.includes('text')) return { label: 'TXT', color: 'text-slate-600 bg-slate-100' };
    return { label: 'FILE', color: 'text-slate-600 bg-slate-100' };
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

            const newMessage = await uploadFileMessage(formData);
            // Re-fetch contacts để cập nhật preview nếu cần
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
            // Thông báo thành công hoặc fetch lại contacts
            fetchContacts();
        } catch (error) {
            console.error("Lỗi forward:", error);
            alert("Không thể chuyển tiếp tài liệu.");
        } finally {
            setIsForwarding(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />
            
            <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex gap-6 h-[calc(100vh-64px)]">
                
                {/* 1. Cột Sidebar (Danh bạ) */}
                <div className="w-1/3 max-w-sm bg-white border border-slate-300 rounded-3xl overflow-hidden flex flex-col shadow-xl shadow-slate-200/50 hidden md:flex">
                    <div className="p-5 border-b border-slate-200 bg-slate-50/50">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                            Danh bạ
                        </h2>
                        <div className="mt-4 relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm người mới..." 
                                className="w-full bg-white text-sm text-slate-800 placeholder:text-slate-500 rounded-xl pl-9 pr-4 py-2.5 border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {isLoadingContacts ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <p className="text-xs font-medium">Đang tải...</p>
                            </div>
                        ) : (
                            (searchQuery.trim() ? searchResults : contacts).map((contact) => (
                                <button
                                    key={contact.id}
                                    onClick={() => setSelectedContact(contact)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
                                        selectedContact?.id === contact.id
                                            ? 'bg-blue-50 border border-blue-100 shadow-sm'
                                            : 'hover:bg-slate-50 border border-transparent'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center shadow-lg relative ${
                                        contact.role_id === 3 ? 'bg-amber-500/20 text-amber-500' :
                                        contact.role_id === 2 ? 'bg-emerald-500/20 text-emerald-500' :
                                        'bg-blue-500/20 text-blue-500'
                                    }`}>
                                        <User className="w-5 h-5" />
                                        {/* Dot trạng thái online */}
                                        {onlineUsers.has(Number(contact.id)) && (
                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="text-sm font-bold text-slate-800 truncate">{contact.name}</h3>
                                        <p className="text-xs text-slate-500 truncate mt-0.5">
                                            {contact.role_id === 3 ? 'Admin' : contact.role_id === 2 ? 'Giáo viên' : 'Học sinh'}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* 2. Cột Nội dung Chat */}
                <div className="flex-1 bg-white border border-slate-300 rounded-3xl overflow-hidden flex flex-col shadow-xl shadow-slate-200/50">
                    {selectedContact ? (
                        <>
                            {/* Header Chat */}
                            <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center gap-4 z-10">
                                <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base">{selectedContact.name}</h3>
                                    {onlineUsers.has(Number(selectedContact.id)) ? (
                                        <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                            Đang hoạt động
                                        </p>
                                    ) : (
                                        <p className="text-xs text-slate-400 font-medium">Ngoại tuyến</p>
                                    )}
                                </div>
                            </div>

                            {/* Vùng Tin Nhắn */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                                {messages.map((msg, index) => {
                                    const isMe = msg.sender_id === user.id;
                                    const showDateSeparator = index === 0 || !isSameDay(messages[index-1].createdAt, msg.createdAt);

                                    return (
                                        <React.Fragment key={msg.id || index}>
                                            {showDateSeparator && (
                                                <div className="flex justify-center my-6">
                                                    <span className="px-4 py-1.5 rounded-full bg-white text-slate-500 text-[11px] font-semibold tracking-wider uppercase border border-slate-300/50 shadow-sm">
                                                        {formatDateSeparator(msg.createdAt)}
                                                    </span>
                                                </div>
                                            )}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                    <div className={`px-5 py-3 rounded-2xl shadow-sm border ${
                                                        isMe 
                                                            ? 'bg-blue-600 text-white rounded-br-sm border-blue-500 shadow-blue-200' 
                                                            : 'bg-white text-slate-800 rounded-bl-sm border-slate-300'
                                                    }`}>
                                                        {/* Hiển thị tệp đính kèm */}
                                                        {msg.type === 'file' && (
                                                            <div className="mb-2 p-3 bg-white/10 rounded-xl border border-white/20 flex items-center gap-3">
                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getFileIcon(msg.file_type).color}`}>
                                                                    <FileText className="w-5 h-5" />
                                                                </div>
                                                                <div className="overflow-hidden">
                                                                    <p className="text-sm font-bold truncate">{msg.file_name}</p>
                                                                    <p className="text-[10px] opacity-70 uppercase tracking-wider">{getFileIcon(msg.file_type).label}</p>
                                                                </div>
                                                                <a 
                                                                    href={msg.file_path} 
                                                                    target="_blank" 
                                                                    rel="noreferrer"
                                                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors ml-auto"
                                                                    title="Tải xuống"
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                </a>
                                                                {/* Nút Forward */}
                                                                <button 
                                                                    onClick={() => setForwardingMessage(msg)}
                                                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                                                    title="Chuyển tiếp"
                                                                >
                                                                    <Forward className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                        
                                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-1.5 mt-1.5 px-1">
                                                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                                                            {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {isMe && (
                                                            <div className="flex items-center">
                                                                {msg.status === 'sent' && <Check className="w-3 h-3 text-slate-300" />}
                                                                {msg.status === 'delivered' && <CheckCheck className="w-3 h-3 text-slate-300" />}
                                                                {msg.status === 'seen' && <CheckCheck className="w-3 h-3 text-blue-500" />}
                                                            </div>
                                                        )}
                                                        {msg.is_forwarded && (
                                                            <span className="text-[9px] text-blue-500 font-bold bg-blue-50 px-1.5 py-0.5 rounded italic">
                                                                ↪ Đã chuyển tiếp
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

                            {/* Khu vực nhập tin nhắn */}
                            <div className="p-4 border-t border-slate-200 bg-white flex flex-col gap-2">
                                {/* Preview file đã chọn (trước khi gửi) */}
                                {selectedFile && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-sm text-slate-600 animate-in slide-in-from-bottom-2">
                                        <FileText className="w-4 h-4 text-blue-500" />
                                        <span className="flex-1 truncate font-medium">{selectedFile.name}</span>
                                        <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-red-500">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                                    {/* Input File Ẩn */}
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileUpload}
                                        accept=".pdf,.docx,.doc,.txt"
                                        className="hidden"
                                        id="chat-file-input"
                                    />

                                    {/* Nút đính kèm file */}
                                    {(user?.role_id === 2 || user?.role_id === 3) && (
                                        <button 
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-11 h-11 rounded-full bg-slate-50 border border-slate-300 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-500/50 transition-all shrink-0"
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
                                        className="flex-1 bg-slate-50 text-slate-900 placeholder:text-slate-500 rounded-full px-6 py-3 border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all shadow-sm"
                                    />

                                    {/* Nút gửi */}
                                    <button 
                                        type="button"
                                        onClick={selectedFile ? confirmSendFile : handleSendMessage}
                                        disabled={isUploading || (!inputMessage.trim() && !selectedFile)}
                                        className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 shrink-0"
                                    >
                                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            {/* Màn hình chờ khi chưa chọn ai */}
                            <div className="w-24 h-24 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-6 shadow-xl shadow-slate-200/50">
                                <MessageSquare className="w-10 h-10 text-slate-300" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Xin chào, {user?.name}!</h2>
                            <p className="text-sm font-medium text-slate-500">Chọn một người từ danh bạ để bắt đầu trò chuyện</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Chuyển tiếp (Forward) */}
            <AnimatePresence>
                {forwardingMessage && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 border border-white"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Forward className="w-5 h-5 text-blue-600" /> Chuyển tiếp tài liệu
                                </h3>
                                <button onClick={() => setForwardingMessage(null)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Thông tin file đang được forward */}
                            <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-300 flex items-center gap-3 text-sm">
                                <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                                <span className="text-slate-700 truncate">{forwardingMessage.file_name || 'Tài liệu'}</span>
                            </div>

                            {/* Tìm kiếm người nhận */}
                            <div className="relative mb-3">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input 
                                    type="text" 
                                    value={forwardSearchQuery}
                                    onChange={(e) => setForwardSearchQuery(e.target.value)}
                                    placeholder="Tìm người để chuyển tiếp..." 
                                    className="w-full bg-slate-50 text-sm text-slate-800 placeholder:text-slate-500 rounded-xl pl-9 pr-4 py-2.5 border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                    autoFocus
                                />
                            </div>

                            {/* Danh sách kết quả tìm kiếm */}
                            <div className="max-h-52 overflow-y-auto space-y-1">
                                {(forwardSearchQuery.trim() ? forwardSearchResults : contacts).map(contact => (
                                    <button
                                        key={contact.id}
                                        onClick={() => handleForward(contact.id)}
                                        disabled={isForwarding}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all text-left disabled:opacity-60"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">{contact.name}</p>
                                            <p className="text-xs text-slate-500">{contact.role_id === 3 ? 'Admin' : contact.role_id === 2 ? 'Giáo viên' : 'Học sinh'}</p>
                                        </div>
                                        {isForwarding && <Loader2 className="w-4 h-4 animate-spin text-blue-500 ml-auto" />}
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
