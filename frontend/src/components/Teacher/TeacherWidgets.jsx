import React from 'react';
import { Share2, MoreVertical, Users, FilePlus, ExternalLink, ShieldCheck } from 'lucide-react';

// 1. Component Thẻ nhóm học sinh (Giữ nguyên cấu trúc cũ, thêm tương tác)
export const TeacherGroupCard = ({ name, count, color, textColor, onAssign }) => (
  <div className={`${color} p-4 rounded-2xl flex justify-between items-center border border-transparent hover:border-slate-200 transition-all cursor-pointer group`}>
    <div>
      <h4 className={`font-bold ${textColor}`}>{name}</h4>
      <p className="text-xs text-slate-500 font-medium">{count} học sinh</p>
    </div>
    <div className="flex items-center gap-2">
      {/* Nút giao bài nhanh cho nhóm */}
      <button 
        onClick={(e) => { e.stopPropagation(); onAssign?.(); }}
        className="opacity-0 group-hover:opacity-100 p-2 bg-white rounded-lg shadow-sm text-slate-400 hover:text-blue-600 transition-all"
      >
        <ExternalLink size={14} />
      </button>
      <MoreVertical size={16} className="text-slate-400" />
    </div>
  </div>
);

// 2. Component MỚI: Thẻ học liệu (Dành cho mục Upload + Lưu tài liệu)
export const MaterialCard = ({ title, date, author, onShare, onCreateWorksheet }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-start mb-6">
      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
        <ShieldCheck size={24} />
      </div>
      <button 
        onClick={() => onShare?.()}
        className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all"
      >
        <Share2 size={18} />
      </button>
    </div>
    
    <h3 className="font-bold text-slate-800 mb-1 line-clamp-1">{title}</h3>
    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">
      Tải lên: {date} • bởi {author}
    </p>

    <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-50">
      <button 
        onClick={() => onCreateWorksheet?.()}
        className="flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-lg shadow-blue-100"
      >
        <FilePlus size={14} /> Tạo phiếu
      </button>
      <button className="flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase transition-all">
        <Users size={14} /> Nhóm HS
      </button>
    </div>
  </div>
);

// 3. Component Bảng phiếu học tập (Nâng cấp thêm nút Thao tác)
export const WorksheetTable = ({ data = [1, 2, 3] }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead>
        <tr className="text-slate-400 text-[10px] uppercase tracking-[0.2em]">
          <th className="pb-4 font-black">Tên phiếu bài tập</th>
          <th className="pb-4 font-black text-center">Tiến độ nộp</th>
          <th className="pb-4 text-right font-black">Quản lý</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {data.map((i, index) => (
          <tr key={index} className="group hover:bg-slate-50/50 transition-colors">
            <td className="py-4 font-bold text-slate-700 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-violet-50 text-violet-600 rounded-lg flex items-center justify-center">
                  <FilePlus size={16} />
                </div>
                Kiểm tra Chương {i} - AI cơ bản
              </div>
            </td>
            <td className="py-4 text-center">
               <span className="font-bold text-blue-600 text-sm">25/40</span>
               <div className="w-20 h-1 bg-slate-100 rounded-full mx-auto mt-2 overflow-hidden">
                  <div className="w-[62%] h-full bg-blue-500 rounded-full"></div>
               </div>
            </td>
            <td className="py-4 text-right">
              <div className="flex justify-end gap-1">
                <button 
                  title="Chia sẻ link"
                  className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-blue-600 hover:shadow-sm transition-all"
                >
                  <Share2 size={18} />
                </button>
                <button 
                  title="Xem chi tiết"
                  className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-violet-600 hover:shadow-sm transition-all"
                >
                  <ExternalLink size={18} />
                </button>
                <button className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-900 hover:shadow-sm transition-all">
                  <MoreVertical size={18} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);