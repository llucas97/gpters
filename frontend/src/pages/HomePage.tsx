import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const HomePage = () => {
  const { isAuthenticated, user } = useAuth()
  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="hero-section text-center">
            <h1 className="hero-title">
              {isAuthenticated ? (
                <>안녕하세요, {user?.username}님! 🚀</>
              ) : (
                <>Gpters에 오신 것을 환영합니다! 🚀</>
              )}
            </h1>
            <p className="hero-subtitle">
              {isAuthenticated ? (
                <>오늘도 코딩 실력 향상을 위해 함께 학습해보세요!<br />
                레벨테스트부터 시작하거나 바로 문제풀이에 도전해보세요.</>
              ) : (
                <>코딩 실력을 체계적으로 키울 수 있는 종합 교육 플랫폼입니다.<br />
                레벨테스트, 문제해결, 리그전 등 다양한 기능으로 
                여러분의 프로그래밍 실력을 한 단계 업그레이드하세요.</>
              )}
            </p>
            
            <div className="d-grid gap-3 d-md-flex justify-content-md-center mb-4">
              {isAuthenticated ? (
                <>
                  <Link to="/level-test" className="btn btn-primary btn-lg px-4">
                    🎯 레벨테스트 시작
                  </Link>
                  <Link to="/survey" className="btn btn-outline-primary btn-lg px-4">
                    📋 설문조사
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-primary btn-lg px-4">
                    🎯 지금 시작하기
                  </Link>
                  <Link to="/login" className="btn btn-outline-primary btn-lg px-4">
                    로그인
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="row g-4">
            <div className="col-md-4">
              <div className="feature-card">
                <div className="card-body text-center">
                  <div className="mb-3" style={{ fontSize: '3rem' }}>🎯</div>
                  <h5 className="card-title">스마트 레벨테스트</h5>
                  <p className="card-text">
                    AI 기반 적응형 테스트로 현재 실력을 정확히 측정하고 
                    개인 맞춤형 학습 경로를 제공받으세요.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="feature-card">
                <div className="card-body text-center">
                  <div className="mb-3" style={{ fontSize: '3rem' }}>💡</div>
                  <h5 className="card-title">인터랙티브 문제해결</h5>
                  <p className="card-text">
                    레벨별 맞춤 인터페이스로 블록코딩부터 실전 코딩까지, 
                    단계적으로 성장할 수 있는 학습 환경을 제공합니다.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="feature-card">
                <div className="card-body text-center">
                  <div className="mb-3" style={{ fontSize: '3rem' }}>🏆</div>
                  <h5 className="card-title">실시간 리그전</h5>
                  <p className="card-text">
                    다른 사용자들과 실시간으로 경쟁하며 실력을 겨뤄보고, 
                    랭킹 시스템을 통해 동기부여를 받으세요.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="feature-card">
                <div className="card-body text-center">
                  <div className="mb-3" style={{ fontSize: '3rem' }}>📊</div>
                  <h5 className="card-title">학습 분석</h5>
                  <p className="card-text">
                    상세한 학습 패턴 분석과 진도 추적으로 
                    약점을 파악하고 효율적으로 학습하세요.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="feature-card">
                <div className="card-body text-center">
                  <div className="mb-3" style={{ fontSize: '3rem' }}>💰</div>
                  <h5 className="card-title">환급제 시스템</h5>
                  <p className="card-text">
                    꾸준한 출석과 학습으로 수강료를 환급받을 수 있는 
                    동기부여 시스템이 준비되어 있습니다.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="feature-card">
                <div className="card-body text-center">
                  <div className="mb-3" style={{ fontSize: '3rem' }}>🤖</div>
                  <h5 className="card-title">AI 문제 생성</h5>
                  <p className="card-text">
                    OpenAI 기반 문제 생성 엔진으로 무한한 문제를 제공하여 
                    지속적인 학습이 가능합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage 