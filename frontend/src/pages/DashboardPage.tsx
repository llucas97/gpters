import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import ExperienceDisplay from '../components/ExperienceDisplay'

const DashboardPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  // 로그인하지 않은 사용자 처리
  if (!isAuthenticated) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card">
              <div className="card-body p-4 text-center">
                <h3>로그인이 필요합니다</h3>
                <p className="text-muted">문제를 풀기 위해서는 먼저 로그인해주세요.</p>
                <button 
                  className="btn btn-primary" 
                  onClick={() => navigate('/login')}
                >
                  로그인하러 가기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>💡 문제 풀이</h1>
            <div className="text-muted">
              안녕하세요, {user?.username}님!
            </div>
          </div>
        </div>

        {/* 경험치 및 레벨 표시 */}
        <div className="col-12 mb-4">
          <ExperienceDisplay 
            userId={user?.id} 
            showStats={true} 
            showRanking={true}
            className="mb-4"
          />
        </div>

        {/* 추천 문제 섹션 */}
        <div className="col-12 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">🎯 추천 문제</h5>
            </div>
            <div className="card-body">
              <p className="text-muted">
                설문조사 결과를 바탕으로 맞춤형 문제를 추천해드립니다.
              </p>
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="border rounded p-3">
                    <h6>두 수의 합</h6>
                    <span className="badge bg-success">초급</span>
                    <p className="small text-muted mt-2">
                      배열에서 두 수를 더해 목표값을 만드는 문제
                    </p>
                    <button className="btn btn-sm btn-outline-primary">
                      문제 풀기
                    </button>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="border rounded p-3">
                    <h6>문자열 뒤집기</h6>
                    <span className="badge bg-success">초급</span>
                    <p className="small text-muted mt-2">
                      주어진 문자열을 뒤집는 다양한 방법을 학습
                    </p>
                    <button className="btn btn-sm btn-outline-primary">
                      문제 풀기
                    </button>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="border rounded p-3">
                    <h6>팩토리얼 계산</h6>
                    <span className="badge bg-warning">중급</span>
                    <p className="small text-muted mt-2">
                      재귀함수를 활용한 팩토리얼 계산 문제
                    </p>
                    <button className="btn btn-sm btn-outline-primary">
                      문제 풀기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 학습 진도 */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">📊 학습 진도</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <div className="text-center">
                    <h3 className="text-success">0</h3>
                    <p className="text-muted">해결한 문제</p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center">
                    <h3 className="text-warning">0</h3>
                    <p className="text-muted">시도한 문제</p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center">
                    <h3 className="text-info">0%</h3>
                    <p className="text-muted">정답률</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage