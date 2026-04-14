import React from 'react';
import { Share2, MoreHorizontal } from 'lucide-react';

export const WorksheetTable = ({ data = [] }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-slate-400 text-xs uppercase tracking-wider border-bottom border-slate-100">
            <th className="pb-4 font-black px-2">Tên phiếu học tập</th>
            <th className="pb-4 text-center font-black px-2">Tiến độ nộp</th>
            <th className="pb-4 text-center font-black px-2">Trạng thái</th>
            <th className="pb-4 text-right font-black px-2">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.length > 0 ? data.map((item) => (
            <tr key={item.id} className="group hover:bg-slate-50/50 transition-all">
              <td className="py-4 px-2 font-bold text-slate-700">{item.title}</td>
              <td className="py-4 px-2 text-center">
                <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm">
                  {item.progress || "0/40"}
                </span>
              </td>
              <td className="py-4 px-2 text-center">
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                  item.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {item.status === 'active' ? 'Đang mở' : 'Mới tạo'}
                </span>
              </td>
              <td className="py-4 px-2 text-right">
                <div className="flex justify-end gap-2">
                  <button className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-400 hover:text-blue-600 transition-all">
                    <Share2 size={18} />
                  </button>
                  <button className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-400 transition-all">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="4" className="py-12 text-center text-slate-400 font-medium italic">
                Chưa có phiếu học tập nào. Hãy nhấn "Tạo phiếu" từ học liệu của bạn!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};