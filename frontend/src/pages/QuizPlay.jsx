import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const QuizPlay = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const initialQuestions = [
    {
      id: 1,
      question: "Trí tuệ nhân tạo (AI) là gì?",
      options: [
        "A. Một khái niệm chỉ thuộc về tương lai",
        "B. Lĩnh vực khoa học máy tính tạo ra máy móc có trí tuệ như con người",
        "C. Chỉ là phần mềm quản lý dữ liệu",
        "D. Công cụ vẽ biểu đồ thông minh"
      ],
      correct: 1,
      explanation: "AI là lĩnh vực khoa học máy tính hướng tới việc tạo ra các cỗ máy thông minh có khả năng thực hiện các nhiệm vụ đòi hỏi trí tuệ con người."
    },
    {
      id: 2,
      question: "Machine Learning (Học máy) là gì?",
      options: [
        "A. Hệ thống chỉ chạy theo quy tắc lập trình sẵn",
        "B. Tập con của AI, cho phép hệ thống học hỏi từ dữ liệu và cải thiện theo thời gian",
        "C. Công cụ tính toán bảng Excel nâng cao",
        "D. Phần mềm chat tự động"
      ],
      correct: 1,
      explanation: "Machine Learning là tập con của AI, tập trung vào việc học từ dữ liệu mà không cần lập trình cụ thể."
    },
    {
      id: 3,
      question: "Deep Learning (Học sâu) lấy cảm hứng từ đâu?",
      options: [
        "A. Cơ sở dữ liệu quan hệ",
        "B. Mạng nơ-ron nhân tạo mô phỏng não bộ con người",
        "C. Máy tính lượng tử",
        "D. Web 2.0"
      ],
      correct: 1,
      explanation: "Deep Learning sử dụng mạng nơ-ron nhân tạo lấy cảm hứng từ não bộ con người."
    },
    {
      id: 4,
      question: "Deep Learning đặc biệt xuất sắc trong lĩnh vực nào?",
      options: [
        "A. Tính toán bảng tính",
        "B. Nhận dạng hình ảnh, giọng nói và xử lý ngôn ngữ tự nhiên",
        "C. Gửi email tự động",
        "D. In ấn tài liệu"
      ],
      correct: 1,
      explanation: "Deep Learning đặc biệt xuất sắc trong nhận dạng hình ảnh, giọng nói và xử lý ngôn ngữ tự nhiên."
    },
    {
      id: 5,
      question: "Ứng dụng thực tế nào sau đây sử dụng AI?",
      options: [
        "A. Chỉ có Siri và Alexa",
        "B. Trợ lý ảo, gợi ý sản phẩm, xe tự lái, hỗ trợ chẩn đoán y khoa",
        "C. Chỉ dùng để tính toán Excel",
        "D. Chỉ dùng để tạo file PDF"
      ],
      correct: 1,
      explanation: "AI được ứng dụng rộng rãi trong trợ lý ảo, gợi ý sản phẩm, xe tự lái và y tế."
    }
  ];

  // Lấy questions từ state hoặc dùng dữ liệu mặc định
  const questionsFromState = location.state?.questions;
  const [questions] = useState(questionsFromState || initialQuestions);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleSelect = (questionId, optionIndex) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = () => {
    let total = 0;
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correct) total++;
    });
    setScore(total);
    setSubmitted(true);
  };

  const backToLearning = () => navigate(-1);

  return (
    <div className="min-h-screen bg-[#0a0a2a] text-white flex flex-col">
      {/* Header giống trang Learning */}
      <div className="bg-[#111133] border-b border-violet-500 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={backToLearning}
            className="text-violet-400 hover:text-white flex items-center gap-2"
          >
            ← Quay lại
          </button>
          <h1 className="text-xl font-semibold text-violet-200">
            Nhập môn Trí tuệ Nhân tạo cơ bản - Quiz
          </h1>
        </div>
        <div className="text-sm text-gray-400">5 câu trắc nghiệm • AI Generated</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">

          {!submitted ? (
            <>
              <div className="text-center mb-10">
                <h2 className="text-3xl font-semibold text-violet-100">Thử thách kiến thức</h2>
                <p className="text-gray-400 mt-2">Chọn đáp án đúng cho từng câu hỏi</p>
              </div>

              <div className="space-y-8">
                {questions.map((q) => (
                  <div key={q.id} className="bg-[#16162a] rounded-3xl p-8 border border-gray-800">
                    <p className="text-lg font-medium mb-7 leading-relaxed">
                      {q.id}. {q.question}
                    </p>
                    <div className="space-y-3">
                      {q.options.map((option, idx) => (
                        <label
                          key={idx}
                          className={`flex items-center gap-4 px-6 py-4 rounded-2xl border-2 cursor-pointer transition-all text-base ${
                            selectedAnswers[q.id] === idx
                              ? 'border-violet-500 bg-violet-500/10'
                              : 'border-gray-700 hover:border-violet-400 hover:bg-[#1f1f38]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            checked={selectedAnswers[q.id] === idx}
                            onChange={() => handleSelect(q.id, idx)}
                            className="w-5 h-5 accent-violet-500"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-10">
                <button
                  onClick={handleSubmit}
                  disabled={Object.keys(selectedAnswers).length < 5}
                  className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed px-14 py-4 rounded-2xl text-xl font-semibold shadow-lg transition-all"
                >
                  📤 Nộp bài
                </button>
              </div>
            </>
          ) : (
            /* === MÀN HÌNH KẾT QUẢ === */
            <div className="bg-[#16162a] rounded-3xl p-10 border border-gray-800 shadow-2xl">
              <div className="text-center mb-10">
                <div className="mx-auto w-20 h-20 mb-4">🏆</div>
                <div className="text-6xl font-bold text-violet-300 mb-2">{score}/5</div>
                <p className="text-2xl text-gray-300">
                  {score === 5 ? 'Hoàn hảo!' : score >= 4 ? 'Rất tốt!' : score >= 3 ? 'Khá tốt' : 'Cần ôn lại thêm'}
                </p>
              </div>

              <div className="space-y-8">
                {questions.map((q) => {
                  const isCorrect = selectedAnswers[q.id] === q.correct;
                  return (
                    <div key={q.id} className="border border-gray-700 rounded-3xl p-7">
                      <div className="flex justify-between items-start mb-5">
                        <p className="font-medium text-lg pr-8">
                          {q.id}. {q.question}
                        </p>
                        <span className={`font-bold text-xl flex-shrink-0 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                          {isCorrect ? '✓ Đúng' : '✕ Sai'}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {q.options.map((option, idx) => (
                          <div
                            key={idx}
                            className={`px-6 py-4 rounded-2xl text-base border-2 transition-all ${
                              idx === q.correct
                                ? 'border-green-400 bg-green-500/10'
                                : idx === selectedAnswers[q.id]
                                ? 'border-red-400 bg-red-500/10'
                                : 'border-gray-700 bg-[#1a1a2e]'
                            }`}
                          >
                            {option}
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 text-sm text-violet-200 italic bg-[#1a1a2e] p-5 rounded-2xl">
                        💡 Giải thích: {q.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4 justify-center mt-12">
                <button
                  onClick={backToLearning}
                  className="bg-violet-600 hover:bg-violet-500 px-10 py-4 rounded-2xl text-lg font-medium"
                >
                  ← Quay lại trang học
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gray-700 hover:bg-gray-600 px-10 py-4 rounded-2xl text-lg font-medium"
                >
                  Làm lại Quiz
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPlay;