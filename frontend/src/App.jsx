import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./index.css";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/student/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import CourseDetail from "./pages/student/CourseDetail";
import QuizAttempt from "./pages/student/QuizAttempt";
// import AssignmentSubmit from "./pages/student/AssignmentSubmit";
import LectureUpload from "./pages/teacher/LectureUpload";
import QuizAuthoring from "./pages/teacher/QuizAuthoring";
import ProgressDashboard from "./pages/teacher/ProgressDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyOtp from "./pages/auth/VerifyOtp";
import ResetPassword from "./pages/auth/ResetPassword";
import ReportCard from "./pages/student/ReportCard";
import ResultPage from "./pages/student/ResultPage";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import StudentAssignmentSubmit from "./pages/student/StudentAssignmentSubmit";
import TeacherAssignments from "./pages/teacher/TeacherAssignments";
import AssignmentSubmissions from "./pages/teacher/AssignmentSubmission";
import AssignmentList from "./pages/teacher/AssignmentList";  
import QuizHeatmap from "./components/QuizHeatmap";
import AdminHeatmapDownload from "./components/AdminHeatmapDownload";
import AdminDashboard from "./pages/admin/AdminDashboard";



export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* student-only */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRole="student">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/course/:courseId"
          element={
            <ProtectedRoute allowedRole="student">
              <CourseDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/course/:courseId/quiz/:quizId"
          element={
            <ProtectedRoute allowedRole="student">
              <QuizAttempt />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/course/:courseId/assignment/:assignmentId"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentAssignmentSubmit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/report/:studentId"
          element={
            <ProtectedRoute allowedRole="student">
              <ReportCard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/result/:quizId"
          element={
            <ProtectedRoute allowedRole="student">
              <ResultPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/course/:courseId/lectures"
          element={
            <ProtectedRoute allowedRole="teacher">
              <LectureUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/course/:courseId/quizzes"
          element={
            <ProtectedRoute allowedRole="teacher">
              <QuizAuthoring />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/course/:courseId/assignments"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherAssignments />
            </ProtectedRoute>
          }
        />
        {/** 1) List assignments to grade **/}
        <Route
          path="/teacher/course/:courseId/assignments/grade"
          element={
            <ProtectedRoute allowedRole="teacher">
              <AssignmentList />
            </ProtectedRoute>
          }
        />

        {/** 2) Grade a single assignment **/}
        <Route
          path="/teacher/course/:courseId/assignments/grade/:assignmentId"
          element={
            <ProtectedRoute allowedRole="teacher">
              <AssignmentSubmissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/course/:courseId/report-card/:studentId"
          element={
            <ProtectedRoute allowedRole="teacher">
              <ReportCard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/course/:courseId/progress"
          element={
            <ProtectedRoute allowedRole="teacher">
              <ProgressDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/heatmap"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminHeatmapDownload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        
        {/* fallback: anything else goes to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
