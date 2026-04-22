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
import MyLessons from './pages/MyLessons';
import Practice from './pages/Practice';
import Materials from './pages/Materials';
import EduGames from './pages/EduGames';
import TeacherGroupManagement from './pages/TeacherGroupManagement';
import WorksheetBuilder from './pages/WorksheetBuilder';
import WorksheetPublic from './pages/WorksheetPublic';
import Chat from './pages/Chat';

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
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } 
          />
          {/* === 4 TRANG TRUNG TÂM ĐIỀU HƯỚNG === */}
          <Route 
            path="/my-lessons" 
            element={
              <ProtectedRoute>
                <MyLessons />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/practice" 
            element={
              <ProtectedRoute>
                <Practice />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/materials" 
            element={
              <ProtectedRoute>
                <Materials />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/games" 
            element={
              <ProtectedRoute>
                <EduGames />
              </ProtectedRoute>
            } 
          />
          {/* === TEACHER ROUTES === */}
          <Route 
            path="/teacher/groups" 
            element={
              <ProtectedRoute>
                <TeacherGroupManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/worksheets" 
            element={
              <ProtectedRoute>
                <WorksheetBuilder />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/worksheets/:id" 
            element={
              <ProtectedRoute>
                <WorksheetBuilder />
              </ProtectedRoute>
            } 
          />
          <Route path="/shared/worksheet/:id" element={<WorksheetPublic />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

