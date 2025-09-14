import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { loginUser, getCurrentUser } from '../api/auth'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.'
    }
    
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.'
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다.'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    
    try {
      // 실제 API 호출
      console.log('로그인 시도:', formData)
      const loginResponse = await loginUser({
        email: formData.email,
        password: formData.password
      })
      
      console.log('로그인 응답:', loginResponse)
      
      // 로그인 응답에서 사용자 정보 추출
      if (loginResponse.user) {
        // 사용자 정보를 Context에 저장
        const userData = {
          id: loginResponse.user.id.toString(),
          email: loginResponse.user.email,
          username: loginResponse.user.username,
          survey_completed: loginResponse.user.survey_completed
        }
        
        login(userData)
      } else {
        // 기존 방식으로 사용자 정보 조회
        const userInfo = await getCurrentUser()
        console.log('사용자 정보:', userInfo)
        
        const userData = {
          id: userInfo.user_id.toString(),
          email: userInfo.email,
          username: userInfo.username,
          survey_completed: userInfo.survey_completed
        }
        
        login(userData)
      }
      
      alert('로그인 성공!')
      
      // 로그인 성공 후 홈으로 이동
      navigate('/')
      
    } catch (error) {
      console.error('로그인 에러:', error)
      setErrors({ general: error instanceof Error ? error.message : '로그인에 실패했습니다. 다시 시도해주세요.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="text-center mb-4">
        <h2>로그인</h2>
        <p className="auth-subtitle">계정에 로그인하여 학습을 계속하세요</p>
      </div>
      
      {errors.general && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {errors.general}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            이메일 주소
          </label>
          <input
            type="email"
            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="이메일을 입력하세요"
            autoComplete="email"
          />
          {errors.email && (
            <div className="invalid-feedback">
              {errors.email}
            </div>
          )}
        </div>
        
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            비밀번호
          </label>
          <input
            type="password"
            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="비밀번호를 입력하세요"
            autoComplete="current-password"
          />
          {errors.password && (
            <div className="invalid-feedback">
              {errors.password}
            </div>
          )}
        </div>
        
        <div className="form-check mb-4">
          <input 
            type="checkbox" 
            className="form-check-input" 
            id="rememberMe" 
          />
          <label className="form-check-label" htmlFor="rememberMe">
            로그인 상태 유지
          </label>
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary w-100 mb-3"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              로그인 중....
            </>
          ) : (
            '로그인'
          )}
        </button>
      </form>
      
      <div className="text-center">
        <p className="mb-0" style={{ color: 'var(--text-secondary)' }}>
          아직 계정이 없으신가요?{' '}
          <Link to="/signup">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage 