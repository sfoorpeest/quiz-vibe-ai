import React, { useState } from 'react';
import { Send, Loader2, BrainCircuit, MessageSquare } from 'lucide-react';
import api from '../../api/axiosClient';

export default function ChatbotSection({ content }) {
  const [chatMessage, setChatMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { sender: 'ai', text: 'Chào bạn! Mình là trợ lý AI QuizVibe. Bạn có thắc mắc gì về nội dung bài học này không?' }
  ]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || isLoading) return;

    const newUserMsg = { sender: 'user', text: chatMessage };
    setChatHistory(prev => [...prev, newUserMsg]);
    setChatMessage('');
    setIsLoading(true);

    try {
      // Logic gọi API giữ nguyên như file LearningView cũ
      const response = await api.post('/api/edu/chat', {
        context: content, // Nhận từ props
        question: newUserMsg.text
      });

      if (response.data && response.data.answer) {
        setChatHistory(prev => [
          ...prev, 
          { sender: 'ai', text: response.data.answer }
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChatHistory(prev => [
        ...prev, 
        { sender: 'ai', text: "Hệ thống AI đang bận, bạn thử lại sau giây lát nhé!" }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl h-[500px]">
      {/* Header của Chatbot */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-3">
        <div className="p-2 bg-violet-500/10 rounded-lg">
          <BrainCircuit className="w-5 h-5 text-violet-400" />
        </div>
        <span className="font-bold text-white text-sm">AI Copilot</span>
      </div>

      {/* Danh sách tin nhắn */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/30">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
              msg.sender === 'user' 
              ? 'bg-blue-600 text-white rounded-tr-sm' 
              : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-sm border border-slate-700 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
              <span className="text-xs text-slate-400">AI đang nghĩ...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input gửi tin nhắn */}
      <form onSubmit={handleSendMessage} className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="relative flex items-center">
          <input 
            type="text" 
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            disabled={isLoading}
            placeholder="Hỏi AI về tài liệu này..."
            className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-violet-500 transition-all"
          />
          <button 
            type="submit"
            disabled={!chatMessage.trim() || isLoading}
            className="absolute right-2 p-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 rounded-lg text-white transition-all"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}