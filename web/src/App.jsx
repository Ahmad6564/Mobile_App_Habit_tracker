import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./store/useAuth";
import AppShell from "./components/AppShell";
import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import DashboardPage from "./pages/DashboardPage";
import HabitsPage from "./pages/HabitsPage";
import TasksPage from "./pages/TasksPage";
import CalendarPage from "./pages/CalendarPage";
import CommunityPage from "./pages/CommunityPage";
import CreatePostPage from "./pages/CreatePostPage";
import JourneyNewPage from "./pages/JourneyNewPage";
import JourneyDetailPage from "./pages/JourneyDetailPage";
import NutritionPage from "./pages/NutritionPage";
import NutritionUploadPage from "./pages/NutritionUploadPage";
import NutritionResultPage from "./pages/NutritionResultPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import CoachPage from "./pages/CoachPage";
import ReferralPage from "./pages/ReferralPage";
import NotFoundPage from "./pages/NotFoundPage";

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!isLoggedIn) return <Navigate to="/auth/sign-in" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/sign-in" element={<SignInPage />} />
      <Route path="/auth/sign-up" element={<SignUpPage />} />

      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/community/new-post" element={<CreatePostPage />} />
        <Route path="/journeys/new" element={<JourneyNewPage />} />
        <Route path="/journeys/:journeyId" element={<JourneyDetailPage />} />
        <Route path="/nutrition" element={<NutritionPage />} />
        <Route path="/nutrition/upload" element={<NutritionUploadPage />} />
        <Route path="/nutrition/result/:analysisId" element={<NutritionResultPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/coach" element={<CoachPage />} />
        <Route path="/referral" element={<ReferralPage />} />
      </Route>

      <Route path="/home" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
