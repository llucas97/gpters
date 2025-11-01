import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <nav className="navbar navbar-expand-lg">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <span style={{ fontSize: '1.25rem' }}>🚀</span> Gpters
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                홈
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/survey">
                <i className="bi bi-clipboard-data me-1"></i>
                설문조사
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/level-test">
                <i className="bi bi-award me-1"></i>
                레벨테스트
              </Link>
            </li>

            
            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/solve">
                    <i className="bi bi-code-slash me-1"></i>
                    문제 해결
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/dashboard">
                    <i className="bi bi-graph-up me-1"></i>
                    학습 진도
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/stats">
                    <i className="bi bi-bar-chart me-1"></i>
                    통계 분석
                  </Link>
                </li>
              </>
            )}

            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/profile">
                    <i className="bi bi-person-circle me-1"></i>
                    {user?.username || '사용자'}님
                  </Link>
                </li>
                <li className="nav-item">
                  <button 
                    className="nav-link btn btn-outline-secondary px-3 ms-2" 
                    onClick={handleLogout}
                    style={{ border: 'none' }}
                  >
                    로그아웃
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link px-3" to="/login" style={{ border: 'none' }}>
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                    로그인
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link btn btn-primary text-white px-3 ms-2" to="/signup">
                    <i className="bi bi-person-plus me-1"></i>
                    회원가입
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 