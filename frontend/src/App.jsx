import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import UploadCenter from './pages/UploadCenter';
import ChangePassword from './pages/ChangePassword';
import ProtectedRoute from './components/ProtectedRoute';
import ResultPage from './pages/ResultPage/ResultPage';
import LearningView from './pages/LearningView';
import ForgotPassword from './pages/ForgotPassword';
import AdminDashboard from './pages/AdminDashboard';
import QuizPage from './pages/QuizPage';
import Profile from './pages/Profile';
import ContactPage from './pages/ContactPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';

// === BỔ SUNG: Import trang Dashboard Giáo viên mới ===
import TeacherDashboard from './pages/Teacher/TeacherDashboard'; 

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/change-password" 
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/result" element={<ResultPage />} />
          
          <Route 
            path="/upload" 
            element={
              <ProtectedRoute>
                <UploadCenter />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/learn/:id" 
            element={
              <ProtectedRoute>
                <LearningView />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/quiz/start" 
            element={
              <ProtectedRoute>
                <QuizPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* === BỔ SUNG: Route dành cho Giáo viên === */}
          <Route 
            path="/teacher" 
            element={
              <ProtectedRoute>
                <TeacherDashboard />
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;