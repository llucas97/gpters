import { useState } from 'react'
import { Link } from 'react-router-dom'

const SignupPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    fullName: '',
    password: '',
    confirmPassword: ''
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
    
    if (!formData.username) {
      newErrors.username = '사용자명을 입력해주세요.'
    } else if (formData.username.length < 3) {
      newErrors.username = '사용자명은 최소 3자 이상이어야 합니다.'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = '사용자명은 영문, 숫자, 언더스코어만 사용 가능합니다.'
    }
    
    if (!formData.fullName) {
      newErrors.fullName = '이름을 입력해주세요.'
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = '이름은 최소 2자 이상이어야 합니다.'
    }
    
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.'
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다.'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = '비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다.'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.'
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
      // TODO: API 호출
      console.log('회원가입 시도:', formData)
      
      // 임시 성공 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      alert('회원가입 성공! 로그인 페이지로 이동합니다.')
      // TODO: 실제로는 로그인 페이지로 리다이렉트하거나 자동 로그인
      
    } catch (error) {
      console.error('회원가입 에러:', error)
      setErrors({ general: '회원가입에 실패했습니다. 다시 시도해주세요.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="text-center mb-4">
        <h2>회원가입</h2>
        <p className="auth-subtitle">계정을 만들고 Gpters와 함께 코딩 여정을 시작하세요</p>
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
            이메일 주소 <span style={{ color: '#ef4444' }}>*</span>
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
          <label htmlFor="username" className="form-label">
            사용자명 <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            className={`form-control ${errors.username ? 'is-invalid' : ''}`}
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="사용자명을 입력하세요"
            autoComplete="username"
          />
          {errors.username && (
            <div className="invalid-feedback">
              {errors.username}
            </div>
          )}
          <div className="form-text">영문, 숫자, 언더스코어(_)만 사용 가능합니다.</div>
        </div>
        
        <div className="mb-3">
          <label htmlFor="fullName" className="form-label">
            이름 <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="실명을 입력하세요"
            autoComplete="name"
          />
          {errors.fullName && (
            <div className="invalid-feedback">
              {errors.fullName}
            </div>
          )}
        </div>
        
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            비밀번호 <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="password"
            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="비밀번호를 입력하세요"
            autoComplete="new-password"
          />
          {errors.password && (
            <div className="invalid-feedback">
              {errors.password}
            </div>
          )}
          <div className="form-text">8자 이상, 대소문자와 숫자를 포함해야 합니다.</div>
        </div>
        
        <div className="mb-3">
          <label htmlFor="confirmPassword" className="form-label">
            비밀번호 확인 <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="password"
            className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="비밀번호를 다시 입력하세요"
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <div className="invalid-feedback">
              {errors.confirmPassword}
            </div>
          )}
        </div>
        
        <div className="form-check mb-4">
          <input type="checkbox" className="form-check-input" id="agreeTerms" required />
          <label className="form-check-label" htmlFor="agreeTerms">
            <Link to="/terms">이용약관</Link> 및{' '}
            <Link to="/privacy">개인정보처리방침</Link>에 동의합니다. <span style={{ color: '#ef4444' }}>*</span>
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
              회원가입 중...
            </>
          ) : (
            '계정 만들기'
          )}
        </button>
      </form>
      
      <div className="text-center">
        <p className="mb-0" style={{ color: 'var(--text-secondary)' }}>
          이미 계정이 있으신가요?{' '}
          <Link to="/login">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SignupPage 