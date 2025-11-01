import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import ExperienceDisplay from '../components/ExperienceDisplay'
import UserProgressService, { RecentProblem, ProgressStats } from '../services/userProgressService'

const DashboardPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  
  const [recentProblems, setRecentProblems] = useState<RecentProblem[]>([])
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null)
  const [loading, setLoading] = useState(true)

  // 데이터 로드
  useEffect(() => {
    if (user?.id) {
      loadUserProgress()
    }
  }, [user?.id])
  
  const loadUserProgress = async () => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      const [problems, stats] = await Promise.all([
        UserProgressService.getRecentProblems(user.id, 3),
        UserProgressService.getProgressStats(user.id)
      ])
      
      setRecentProblems(problems)
      setProgressStats(stats)
    } catch (error) {
      console.error('사용자 진도 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }
  
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
          </div>
        </div>

        {/* 경험치 및 레벨 표시 */}
        {user?.id && (
          <div className="col-12 mb-4">
            <ExperienceDisplay 
              userId={user.id} 
              showStats={true} 
              showRanking={true}
              className="mb-4"
            />
          </div>
        )}

        {/* 최근 풀었던 문제 섹션 */}
        <div className="col-12 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">📝 최근 풀었던 문제</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">로딩 중...</span>
                  </div>
                </div>
              ) : recentProblems.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <p>아직 풀은 문제가 없습니다.</p>
                  <button 
                    className="btn btn-primary mt-2"
                    onClick={() => navigate('/solve')}
                  >
                    문제 풀러 가기
                  </button>
                </div>
              ) : (
                <div className="row g-3">
                  {recentProblems.map((problem, index) => (
                    <div key={problem.id} className="col-md-4">
                      <div className="border rounded p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="mb-0">{problem.title}</h6>
                          {problem.isCorrect ? (
                            <span className="badge bg-success">✓ 정답</span>
                          ) : (
                            <span className="badge bg-danger">✗ 오답</span>
                          )}
                        </div>
                        <div className="mb-2">
                          <span className="badge bg-primary me-1">
                            레벨 {problem.level}
                          </span>
                          <span className="badge bg-secondary me-1">
                            {UserProgressService.getLanguageName(problem.language)}
                          </span>
                          <span className="badge bg-info">
                            {UserProgressService.getTopicName(problem.topic)}
                          </span>
                        </div>
                        <div className="small text-muted">
                          <div>점수: {problem.score}점</div>
                          <div>정답률: {problem.blanksCorrect}/{problem.blanksTotal}</div>
                          {problem.finishedAt && (
                            <div className="mt-1">
                              {new Date(problem.finishedAt).toLocaleDateString('ko-KR')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">로딩 중...</span>
                  </div>
                </div>
              ) : progressStats ? (
                <>
                  <div className="row mb-4">
                    <div className="col-md-4">
                      <div className="text-center">
                        <h3 className="text-success">{progressStats.basic.solvedProblems}</h3>
                        <p className="text-muted">해결한 문제</p>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-center">
                        <h3 className="text-warning">{progressStats.basic.attemptedProblems}</h3>
                        <p className="text-muted">시도한 문제</p>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-center">
                        <h3 className="text-info">{progressStats.basic.successRate.toFixed(1)}%</h3>
                        <p className="text-muted">정답률</p>
                      </div>
                    </div>
                  </div>
                  
                  {progressStats.byLevel.length > 0 && (
                    <div className="mt-4">
                      <h6 className="mb-3">레벨별 통계</h6>
                      <div className="row g-2">
                        {progressStats.byLevel.map((level) => (
                          <div key={level.level} className="col-md-4">
                            <div className="border rounded p-2 small">
                              <div className="fw-bold">레벨 {level.level}</div>
                              <div className="text-muted">
                                정답: {level.correct}/{level.total} ({level.successRate.toFixed(1)}%)
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-muted">
                  <p>학습 진도 정보를 불러올 수 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage