import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ProfilePage from './pages/ProfilePage'
import SurveyPage from './pages/SurveyPage'
import LevelTestPage from './pages/LevelTestPage'

import QuizPage from './pages/QuizPage'

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/survey" element={<SurveyPage />} />
            <Route path="/level-test" element={<LevelTestPage />} />
            <Route path="/quiz" element={<QuizPage />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  )
}

export default App
