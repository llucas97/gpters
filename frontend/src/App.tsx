import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import SurveyPage from "./pages/SurveyPage";
import LevelTestPage from "./pages/LevelTestPage";
import ProblemsPage from "./pages/ProblemsPage";
import QuizPage from "./pages/QuizPage";
import DashboardPage from "./pages/DashboardPage";
import SolvePage from "./pages/SolvePage";
import BlockCodingPage from "./pages/BlockCodingPage";
import ClozeTestPage from "./pages/ClozeTestPage";
import CodeEditorPage from "./pages/CodeEditorPage";

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
            <Route path="/problems" element={<ProblemsPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/block-coding" element={<BlockCodingPage />} />
            <Route path="/cloze-test" element={<ClozeTestPage />} />
            <Route path="/code-editor" element={<CodeEditorPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/solve" element={<SolvePage />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
