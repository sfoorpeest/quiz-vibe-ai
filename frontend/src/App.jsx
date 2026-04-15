import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Import Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import UploadCenter from './pages/UploadCenter';
import ChangePassword from './pages/ChangePassword';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import ContactPage from './pages/ContactPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';

// Import Feature Pages
import LearningView from './pages/LearningView';
import ResultPage from './pages/ResultPage/ResultPage';
import QuizPage from './pages/QuizPage';
import QuizPlay from './pages/QuizPlay';

// Import Dashboards
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/Teacher/TeacherDashboard'; 

// Import Components
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/result" element={<ResultPage />} />

          {/* Protected Routes (Yêu cầu đăng nhập) */}
          <Route 
            path="/profile" 
            element={<ProtectedRoute><Profile /></ProtectedRoute>} 
          />
          <Route 
            path="/change-password" 
            element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} 
          />
          <Route 
            path="/upload" 
            element={<ProtectedRoute><UploadCenter /></ProtectedRoute>} 
          />
          <Route 
            path="/learn/:id" 
            element={<ProtectedRoute><LearningView /></ProtectedRoute>} 
          />
          <Route 
            path="/quiz/start" 
            element={<ProtectedRoute><QuizPage /></ProtectedRoute>} 
          />
          <Route 
            path="/quiz-play" 
            element={<ProtectedRoute><QuizPlay /></ProtectedRoute>} 
          />
          
          {/* Admin & Teacher Routes */}
          <Route 
            path="/admin" 
            element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/teacher" 
            element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} 
          />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>  
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;