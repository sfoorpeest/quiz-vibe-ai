const Hero = ({ onExplore, onCreate, userName }) => {
  return (
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-50 to-sky-50 p-8 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">Học thông minh, tiến bộ nhanh</h1>
          <p className="mt-4 text-lg text-slate-700 max-w-2xl">Quiz Vibe AI giúp tạo quiz tự động, giải thích đáp án chi tiết và cá nhân hóa lộ trình học cho bạn — dành cho học sinh, sinh viên và giáo viên.</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={onExplore} className="px-6 py-3 bg-indigo-600 text-white rounded-xl shadow hover:scale-[1.02] transition">Khám phá quiz</button>
            <button onClick={onCreate} className="px-6 py-3 bg-white text-indigo-700 rounded-xl border border-indigo-100 shadow-sm hover:bg-indigo-50 transition">Tạo quiz với AI</button>
          </div>

          <div className="mt-6 text-sm text-slate-600">
            {userName ? `Xin chào, ${userName}!` : 'Đăng nhập để lưu tiến trình và tạo quiz cá nhân.'}
          </div>
        </div>

        <div className="flex-1">
          <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl">🧠</div>
              <div>
                <div className="text-sm text-slate-500">AI-powered</div>
                <div className="text-xl font-semibold text-slate-900">Tạo câu hỏi & giải thích</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-amber-50">
                <div className="text-sm text-amber-700 font-semibold">Tạo nhanh</div>
                <div className="text-sm text-slate-700">Chủ đề → Quiz</div>
              </div>
              <div className="p-3 rounded-lg bg-sky-50">
                <div className="text-sm text-sky-700 font-semibold">Giải thích</div>
                <div className="text-sm text-slate-700">Lí giải từng đáp án</div>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <div className="text-sm text-green-700 font-semibold">Theo dõi</div>
                <div className="text-sm text-slate-700">Tiến độ học</div>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <div className="text-sm text-purple-700 font-semibold">Tùy chỉnh</div>
                <div className="text-sm text-slate-700">Số câu, độ khó</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* soft decorative shapes */}
      <svg className="pointer-events-none absolute -right-10 -top-10 opacity-20" width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="120" cy="120" r="120" fill="url(#g)" />
        <defs>
          <radialGradient id="g" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(120 120) scale(120)">
            <stop stopColor="#7c3aed" stopOpacity="0.6" />
            <stop offset="1" stopColor="#06b6d4" stopOpacity="0.2" />
          </radialGradient>
        </defs>
      </svg>
    </header>
  );
};

export default Hero;
