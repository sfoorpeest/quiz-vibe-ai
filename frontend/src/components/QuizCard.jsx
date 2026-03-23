const QuizCard = ({ quiz, onStart }) => {
  return (
    <div className="rounded-2xl p-6 shadow-sm hover:shadow-lg transition bg-white border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-3xl">{quiz.icon}</div>
          <div>
            <div className="text-lg font-semibold text-slate-900">{quiz.title}</div>
            <div className="text-sm text-slate-500">{quiz.subject}</div>
          </div>
        </div>
        <div className="text-sm text-slate-600">{quiz.questions} câu</div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="px-3 py-1 text-xs rounded-full bg-indigo-50 text-indigo-600">{quiz.difficulty}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => onStart?.(quiz)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Làm bài</button>
          <button className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-slate-700">Thêm</button>
        </div>
      </div>
    </div>
  );
};

export default QuizCard;
