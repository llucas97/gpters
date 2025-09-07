import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ProfilePage from './pages/ProfilePage'
import SurveyPage from './pages/SurveyPage'
import LevelTestPage from './pages/LevelTestPage'

function App() {
  return (
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
        </Routes>
      </main>
    </div>
  )
}

export default App
