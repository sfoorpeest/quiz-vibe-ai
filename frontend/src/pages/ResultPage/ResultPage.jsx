import React from 'react';
import './ResultPage.css';

const ResultPage = () => {
  return (
    <div style={{ padding: '50px', textAlign: 'center', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '15px', display: 'inline-block', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <h1 style={{ color: '#1890ff' }}>Kết Quả Bài Làm</h1>
        <div style={{ fontSize: '48px', fontWeight: 'bold', margin: '20px 0', color: '#52c41a' }}>
          8/10
        </div>
        <p>Chúc mừng bạn đã hoàn thành bài thi!</p>
        <button onClick={() => window.location.href = '/'} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>
          Quay về trang chủ
        </button>
      </div>
    </div>
  );
};

export default ResultPage; // Dòng này cực kỳ quan trọng