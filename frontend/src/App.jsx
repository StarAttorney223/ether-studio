import { Navigate, Route, Routes } from "react-router-dom";
import AuthGate from "./components/auth/AuthGate";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import ContentGeneratorPage from "./pages/ContentGeneratorPage";
import ImageGeneratorPage from "./pages/ImageGeneratorPage";
import SchedulerPage from "./pages/SchedulerPage";
import ChatbotPage from "./pages/ChatbotPage";
import CreatePostPage from "./pages/CreatePostPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import SignupPage from "./pages/SignupPage";

function App() {
  return (
    <Routes>
      <Route element={<AuthGate requireAuth={false} />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route element={<AuthGate requireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/content-generator" element={<ContentGeneratorPage />} />
          <Route path="/image-generator" element={<ImageGeneratorPage />} />
          <Route path="/scheduler" element={<SchedulerPage />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route path="/create-post" element={<CreatePostPage />} />
          <Route path="/create-post/:id" element={<CreatePostPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
