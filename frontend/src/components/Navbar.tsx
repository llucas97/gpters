import { Link } from 'react-router-dom'

const Navbar = () => {
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
            <li className="nav-item">
              <Link className="nav-link" to="/profile">
                <i className="bi bi-person-circle me-1"></i>
                프로필
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/login">
                로그인
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link btn btn-primary text-white px-3 ms-2" to="/signup">
                회원가입
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 