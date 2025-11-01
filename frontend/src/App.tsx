import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import SurveyPage from "./pages/SurveyPage";
import LevelTestPage from "./pages/LevelTestPage";
import DashboardPage from "./pages/DashboardPage";
import SolvedPage from "./pages/SolvedPage";
import UserStatsPage from "./pages/UserStatsPage";

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/survey" element={<SurveyPage />} />
            <Route path="/level-test" element={<LevelTestPage />} />
            <Route path="/problems" element={<DashboardPage />} />
            <Route path="/quiz" element={<Navigate to="/solve" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/solve" element={<SolvedPage />} />
            <Route path="/solved" element={<SolvedPage />} />
            <Route path="/stats" element={<UserStatsPage />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
