import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Minus, MessageSquare, User, Search, Send, 
    ChevronLeft, Loader2, FileText, Download, Check, CheckCheck, Sparkles
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
        <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end gap-6">
            <AnimatePresence>
                {!isMinimized && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.9, y: 40, filter: 'blur(10px)' }}
                        className="w-80 sm:w-96 h-[500px] bg-slate-950 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-slate-800 overflow-hidden flex flex-col relative"
                    >
                        {/* Header với Gradient Cao cấp */}
                        <div className="p-6 bg-linear-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shadow-xl relative z-10">
                            <div className="flex items-center gap-3">
                                {selectedContact ? (
                                    <button 
                                        onClick={() => setSelectedContact(null)}
                                        className="p-2 hover:bg-white/20 rounded-xl transition-all active:scale-90"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <div className="p-2 bg-white/10 rounded-xl">
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <span className="font-black text-sm tracking-tight truncate max-w-[150px]">
                                        {selectedContact ? selectedContact.name : 'Trung tâm Tin nhắn'}
                                    </span>
                                    {selectedContact && (
                                        <span className="text-[10px] font-bold text-blue-100/70 flex items-center gap-1 uppercase tracking-widest">
                                            {onlineUsers.has(Number(selectedContact.id)) ? (
                                                <><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Online</>
                                            ) : 'Offline'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setIsMinimized(true)}
                                    className="p-2 hover:bg-white/20 rounded-xl transition-all"
                                >
                                    <Minus className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => setIsBubbleOpen(false)}
                                    className="p-2 hover:bg-rose-500/30 text-white rounded-xl transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-hidden flex flex-col bg-slate-950">
                            {selectedContact ? (
                                <>
                                    {/* Messages List */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-950/50">
                                        {messages.map((msg, idx) => {
                                            const isMe = msg.sender_id === user.id;
                                            return (
                                                <motion.div 
                                                    key={msg.id || idx} 
                                                    initial={{ opacity: 0, x: isMe ? 10 : -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                        <div className={`px-5 py-3 rounded-[24px] text-sm shadow-xl relative ${
                                                            isMe 
                                                                ? 'bg-linear-to-br from-blue-600 to-blue-700 text-white rounded-br-sm border-t border-white/20' 
                                                                : 'bg-slate-800/90 text-slate-100 rounded-bl-sm border border-slate-700/50 backdrop-blur-sm'
                                                        }`}>
                                                            {msg.type === 'file' && (
                                                                <div className={`flex items-center gap-3 mb-2 p-3 rounded-xl border ${
                                                                    isMe ? 'bg-white/10 border-white/10' : 'bg-slate-900/60 border-slate-700'
                                                                }`}>
                                                                    <FileText className="w-5 h-5 text-blue-400" />
                                                                    <span className="truncate flex-1 text-xs font-bold">{msg.file_name}</span>
                                                                    <a href={`${import.meta.env.VITE_API_URL}${msg.file_path}`} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-white/10 rounded-lg transition-all">
                                                                        <Download className="w-4 h-4" />
                                                                    </a>
                                                                </div>
                                                            )}
                                                            <p className="whitespace-pre-wrap leading-relaxed font-medium">{msg.content}</p>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-1.5 opacity-40 px-1">
                                                            <span className="text-[9px] font-black uppercase tracking-widest">
                                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            {isMe && (
                                                                <span className="flex">
                                                                    {msg.status === 'sent' && <Check className="w-2.5 h-2.5" />}
                                                                    {msg.status === 'delivered' && <CheckCheck className="w-2.5 h-2.5" />}
                                                                    {msg.status === 'seen' && <CheckCheck className="w-2.5 h-2.5 text-blue-400" />}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Input Form */}
                                    <div className="p-5 border-t border-slate-800/50 bg-slate-900/40 backdrop-blur-xl">
                                        <form onSubmit={handleSend} className="flex items-center gap-3">
                                            <div className="flex-1 relative group">
                                                <input 
                                                    type="text"
                                                    value={inputMessage}
                                                    onChange={(e) => setInputMessage(e.target.value)}
                                                    placeholder="Nhập tin nhắn..."
                                                    className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                                                />
                                                <Sparkles className="w-4 h-4 text-slate-700 absolute right-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500/30 transition-colors" />
                                            </div>
                                            <button 
                                                type="submit"
                                                disabled={!inputMessage.trim()}
                                                className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-20 transition-all shrink-0 active:scale-90"
                                            >
                                                <Send className="w-5 h-5" />
                                            </button>
                                        </form>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Contacts Selector */}
                                    <div className="p-5 border-b border-slate-800/50">
                                        <div className="relative group">
                                            <Search className="w-5 h-5 text-slate-600 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors z-20" />
                                            <input 
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Tìm kiếm bạn bè..."
                                                className="w-full bg-slate-950/40 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                                        {(searchQuery.trim() ? searchResults : contacts).map(contact => (
                                            <button
                                                key={contact.id}
                                                onClick={() => setSelectedContact(contact)}
                                                className="w-full flex items-center gap-4 p-4 hover:bg-slate-800/40 rounded-[24px] transition-all text-left group border border-transparent hover:border-slate-700/30"
                                            >
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 relative shadow-2xl transition-transform group-hover:scale-105 border border-slate-700/50 ${
                                                    contact.role_id === 3 ? 'bg-amber-500/10 text-amber-500' :
                                                    contact.role_id === 2 ? 'bg-emerald-500/10 text-emerald-500' :
                                                    'bg-blue-500/10 text-blue-500'
                                                }`}>
                                                    <User className="w-6 h-6" />
                                                    {onlineUsers.has(Number(contact.id)) && (
                                                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-[3px] border-slate-900 rounded-full"></span>
                                                    )}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-sm font-black text-slate-100 truncate group-hover:text-blue-400 transition-colors">{contact.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                                        {contact.role_id === 3 ? 'Administrator' : contact.role_id === 2 ? 'Instructor' : 'Learner'}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                        {isLoadingContacts && (
                                            <div className="flex flex-col items-center justify-center p-12 gap-3">
                                                <Loader2 className="w-8 h-8 animate-spin text-blue-500/40" />
                                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Syncing Contacts</p>
                                            </div>
                                        )}
                                        {!isLoadingContacts && (searchQuery.trim() ? searchResults : contacts).length === 0 && (
                                            <div className="flex flex-col items-center justify-center p-12 text-slate-600">
                                                <p className="text-xs font-bold italic">No contacts found</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bubble Trigger Button */}
            <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                    if (isMinimized) setIsMinimized(false);
                    else setIsBubbleOpen(!isBubbleOpen);
                }}
                className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all border-2 relative overflow-hidden group ${
                    isMinimized || !isBubbleOpen
                        ? 'bg-linear-to-br from-blue-600 to-indigo-600 border-blue-400/50 text-white' 
                        : 'bg-slate-900 border-slate-700 text-blue-400'
                }`}
            >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {isMinimized || !isBubbleOpen ? (
                    <div className="relative">
                        <MessageSquare className="w-8 h-8" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-bounce"></span>
                    </div>
                ) : (
                    <X className="w-8 h-8" />
                )}
            </motion.button>
        </div>
    );
}
