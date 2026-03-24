import React from 'react';
// Chúng ta sẽ viết CSS trực tiếp trong này cho nhanh

const ResultPage = () => {
  // Dữ liệu giả lập
  const resultData = {
    score: 8,
    totalQuestions: 10,
    status: "Passed"
  };

  return (
    // Thẻ div ngoài cùng chứa nền tối và các hiệu ứng
    <div style={styles.container}>
      
      {/* 1. Các icon trang trí bay lơ lửng (giả lập giống trang chủ) */}
      <div style={{...styles.decorIcon, ...styles.icon1}}>🌐</div>
      <div style={{...styles.decorIcon, ...styles.icon2}}>🏆</div>
      <div style={{...styles.decorIcon, ...styles.icon3}}>💡</div>
      <div style={{...styles.decorIcon, ...styles.icon4}}>⭐</div>
      <div style={{...styles.decorIcon, ...styles.icon5}}>🪐</div>

      {/* 2. Khung nội dung chính (màu trắng) */}
      <div style={styles.card}>
        <h1 style={styles.title}>Kết Quả Bài Làm</h1>
        
        {/* Vòng tròn điểm số */}
        <div style={styles.scoreCircle}>
          {resultData.score}/{resultData.totalQuestions}
        </div>

        <p style={styles.message}>Chúc mừng bạn đã hoàn thành bài thi!</p>
        
        {/* Nút quay về (chúng ta sẽ thêm style giống trang chủ sau) */}
        <button 
          onClick={() => window.location.href = '/'} 
          style={styles.homeButton}
          onMouseOver={(e) => e.target.style.backgroundColor = '#1565c0'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#1976d2'}
        >
          Quay về trang chủ
        </button>
      </div>
    </div>
  );
};

// --- CSS styles viết trực tiếp trong JS ---
const styles = {
  container: {
    // Nền tối Gradient giống trang chủ
    background: 'linear-gradient(135deg, #0d1117 0%, #1a1f2e 100%)',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative', // Để các icon trang trí canh lề theo cái này
    overflow: 'hidden', // Không cho icon bay ra ngoài
    fontFamily: 'sans-serif',
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '20px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)', // Bóng đổ đậm hơn trên nền tối
    textAlign: 'center',
    width: '100%',
    maxWidth: '400px',
    zIndex: 10, // Đảm bảo khung này luôn nằm trên các icon trang trí
    position: 'relative',
  },
  title: {
    color: '#333',
    fontSize: '24px',
    marginBottom: '20px',
    fontWeight: 'bold',
  },
  scoreCircle: {
    fontSize: '60px',
    fontWeight: 'bold',
    color: '#4caf50', // Màu xanh lá cho điểm số
    margin: '30px 0',
    display: 'inline-block',
    padding: '10px 20px',
    border: '5px solid #4caf50',
    borderRadius: '100px',
  },
  message: {
    color: '#666',
    fontSize: '16px',
    marginBottom: '30px',
  },
  homeButton: {
    backgroundColor: '#1976d2', // Màu xanh dương giống nút "Đăng ký"
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
    textDecoration: 'none',
    display: 'inline-block',
  },
  
  // Style chung cho các icon trang trí
  decorIcon: {
    position: 'absolute',
    opacity: 0.15, // Làm mờ đi giống trang chủ
    color: 'white',
    fontSize: '40px',
    pointerEvents: 'none', // Không cho người dùng bấm vào
  },
  
  // Vị trí cụ thể của từng icon
  icon1: { top: '15%', left: '10%' },
  icon2: { top: '20%', right: '15%', transform: 'rotate(15deg)' },
  icon3: { bottom: '25%', left: '18%', fontSize: '30px' },
  icon4: { top: '60%', right: '10%', opacity: 0.1 },
  icon5: { top: '80%', left: '40%', fontSize: '50px' },
};

export default ResultPage;