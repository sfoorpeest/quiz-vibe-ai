import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Minus, MessageSquare, User, Search, Send, 
    ChevronLeft, Loader2, FileText, Download, Check, CheckCheck 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { searchUsers } from '../services/chatService';

export default function ChatBubble() {
    const { user } = useAuth();
    const { 
        isBubbleOpen, setIsBubbleOpen,
        contacts, selectedContact, setSelectedContact,
        messages, onlineUsers, isLoadingContacts,
        sendMessage
    } = useChat();

    const [isMinimized, setIsMinimized] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef(null);

    // Tự động cuộn xuống
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isMinimized]);

    // Tìm kiếm user
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim()) {
                setIsSearching(true);
                try {
                    const results = await searchUsers(searchQuery);
                    setSearchResults(results);
                } catch (error) {
                    console.error(error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;
        sendMessage(inputMessage);
        setInputMessage('');
    };

    if (!isBubbleOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4">
            <AnimatePresence>
                {!isMinimized && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-80 sm:w-96 h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 bg-linear-to-r from-blue-600 to-violet-600 text-white flex items-center justify-between shadow-md">
                            <div className="flex items-center gap-2">
                                {selectedContact ? (
                                    <button 
                                        onClick={() => setSelectedContact(null)}
                                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <MessageSquare className="w-5 h-5" />
                                )}
                                <span className="font-bold truncate max-w-[150px]">
                                    {selectedContact ? selectedContact.name : 'Tin nhắn'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => setIsMinimized(true)}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setIsBubbleOpen(false)}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            {selectedContact ? (
                                <>
                                    {/* Chat Area */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                                        {messages.map((msg, idx) => {
                                            const isMe = msg.sender_id === user.id;
                                            return (
                                                <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm shadow-sm border ${
                                                        isMe ? 'bg-blue-600 text-white border-blue-500 rounded-br-sm' : 'bg-white text-slate-800 border-slate-200 rounded-bl-sm'
                                                    }`}>
                                                        {msg.type === 'file' && (
                                                            <div className="flex items-center gap-2 mb-1 p-2 bg-black/5 rounded-lg border border-black/5">
                                                                <FileText className="w-4 h-4 text-blue-500" />
                                                                <span className="truncate flex-1 text-xs">{msg.file_name}</span>
                                                                <a href={msg.file_path} target="_blank" rel="noreferrer">
                                                                    <Download className="w-3 h-3" />
                                                                </a>
                                                            </div>
                                                        )}
                                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                                        <div className="flex items-center justify-end gap-1 mt-1 opacity-70 text-[9px]">
                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            {isMe && (
                                                                <span>
                                                                    {msg.status === 'sent' && <Check className="w-2 h-2" />}
                                                                    {msg.status === 'delivered' && <CheckCheck className="w-2 h-2" />}
                                                                    {msg.status === 'seen' && <CheckCheck className="w-2 h-2 text-blue-300" />}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Input */}
                                    <form onSubmit={handleSend} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
                                        <input 
                                            type="text"
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            placeholder="Nhập tin nhắn..."
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-all"
                                        />
                                        <button 
                                            type="submit"
                                            disabled={!inputMessage.trim()}
                                            className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-all shrink-0 shadow-lg shadow-blue-500/30"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <>
                                    {/* Contacts Area */}
                                    <div className="p-3 border-b border-slate-100">
                                        <div className="relative">
                                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input 
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Tìm người dùng..."
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2">
                                        {(searchQuery.trim() ? searchResults : contacts).map(contact => (
                                            <button
                                                key={contact.id}
                                                onClick={() => setSelectedContact(contact)}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-all text-left group"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 relative border border-blue-100 shadow-sm group-hover:scale-105 transition-transform">
                                                    <User className="w-5 h-5" />
                                                    {onlineUsers.has(Number(contact.id)) && (
                                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                                                    )}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-sm font-bold text-slate-800 truncate">{contact.name}</p>
                                                    <p className="text-[11px] text-slate-500 truncate">
                                                        {contact.role_id === 3 ? 'Quản trị viên' : contact.role_id === 2 ? 'Giáo viên' : 'Học sinh'}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                        {isLoadingContacts && (
                                            <div className="flex justify-center p-4">
                                                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bubble Trigger (when minimized or just to show the toggle) */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMinimized(!isMinimized)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all border-2 ${
                    isMinimized 
                        ? 'bg-blue-600 border-blue-400 text-white' 
                        : 'bg-white border-slate-100 text-blue-600'
                }`}
            >
                {isMinimized ? (
                    <div className="relative">
                        <MessageSquare className="w-7 h-7" />
                        {/* notification count in context if needed */}
                    </div>
                ) : (
                    <Minus className="w-7 h-7" />
                )}
            </motion.button>
        </div>
    );
}
