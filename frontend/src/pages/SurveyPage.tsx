import React, { useState } from 'react';
import './SurveyPage.css';
import { submitSurvey } from '../api/survey'; // 🔹 설문 결과 저장 API
import { useAuth } from '../contexts/AuthContext';


interface SurveyData {
  occupation: string;
  purpose: string;
  level: string;
  motivation: string;
}

interface StepProps {
  data: SurveyData;
  onDataChange: (data: Partial<SurveyData>) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
  isValid: boolean;
  isSubmitting?: boolean;
}

// API 호출 함수
// const submitSurvey = async (surveyData: SurveyData) => {
//   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
//   try {
//     const response = await fetch(`${API_BASE_URL}/api/survey`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         ...surveyData,
//         userId: null // 현재는 로그인 기능이 없으므로 null
//       }),
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || '설문조사 제출에 실패했습니다.');
//     }

//     const result = await response.json();
//     return result;
//   } catch (error) {
//     console.error('Survey submission error:', error);
//     throw error;
//   }
// };

// 1단계: 직업
const Step1: React.FC<StepProps> = ({ data, onDataChange, onNext, isValid }) => {
  const occupations = [
    { value: 'developer', label: '개발자', icon: '💻' },
    { value: 'student', label: '학생', icon: '🎓' },
    { value: 'job-seeker', label: '취준생', icon: '📝' },
    { value: 'employee', label: '직장인', icon: '🏢' },
    { value: 'freelancer', label: '프리랜서', icon: '🚀' },
    { value: 'other', label: '기타', icon: '👤' }
  ];

  return (
    <div className="survey-step">
      <h3 className="step-title">어떤 일을 하고 계신가요?</h3>
      <p className="step-description">현재 상황에 가장 가까운 것을 선택해주세요</p>
      
      <div className="options-grid">
        {occupations.map((option) => (
          <div
            key={option.value}
            className={`option-card ${data.occupation === option.value ? 'selected' : ''}`}
            onClick={() => onDataChange({ occupation: option.value })}
          >
            <div className="option-icon">{option.icon}</div>
            <div className="option-label">{option.label}</div>
          </div>
        ))}
      </div>

      <div className="step-actions">
        <button
          className="btn btn-primary btn-lg"
          onClick={onNext}
          disabled={!isValid}
        >
          다음 단계
          <i className="bi bi-arrow-right ms-2"></i>
        </button>
      </div>
    </div>
  );
};

// 2단계: 목적
const Step2: React.FC<StepProps> = ({ data, onDataChange, onNext, onPrev, isValid }) => {
  const purposes = [
    { value: 'job-prep', label: '취업 준비', icon: '💼' },
    { value: 'skill-improvement', label: '개발 실력 향상', icon: '📈' },
    { value: 'coding-test', label: '코딩테스트 준비', icon: '⌨️' },
    { value: 'new-tech', label: '새로운 기술 학습', icon: '🔬' },
    { value: 'portfolio', label: '포트폴리오 개발', icon: '📁' },
    { value: 'other', label: '기타', icon: '🎯' }
  ];

  return (
    <div className="survey-step">
      <h3 className="step-title">학습의 목적이 무엇인가요?</h3>
      <p className="step-description">가장 중요한 목표를 선택해주세요</p>
      
      <div className="options-grid">
        {purposes.map((option) => (
          <div
            key={option.value}
            className={`option-card ${data.purpose === option.value ? 'selected' : ''}`}
            onClick={() => onDataChange({ purpose: option.value })}
          >
            <div className="option-icon">{option.icon}</div>
            <div className="option-label">{option.label}</div>
          </div>
        ))}
      </div>

      <div className="step-actions">
        <button
          className="btn btn-outline-secondary btn-lg"
          onClick={onPrev}
        >
          <i className="bi bi-arrow-left me-2"></i>
          이전
        </button>
        <button
          className="btn btn-primary btn-lg"
          onClick={onNext}
          disabled={!isValid}
        >
          다음 단계
          <i className="bi bi-arrow-right ms-2"></i>
        </button>
      </div>
    </div>
  );
};

// 3단계: 현재 레벨
const Step3: React.FC<StepProps> = ({ data, onDataChange, onNext, onPrev, isValid }) => {
  const levels = [
    { 
      value: 'beginner', 
      label: '초급', 
      icon: '🌱',
      description: '프로그래밍을 시작한 지 얼마 안 됨'
    },
    { 
      value: 'intermediate', 
      label: '중급', 
      icon: '🌿',
      description: '기본 문법과 간단한 프로젝트 경험'
    },
    { 
      value: 'advanced', 
      label: '고급', 
      icon: '🌳',
      description: '실무 경험이나 복잡한 프로젝트 경험'
    },
    { 
      value: 'expert', 
      label: '전문가', 
      icon: '🏆',
      description: '다년간의 실무 경험과 깊은 이해'
    }
  ];

  return (
    <div className="survey-step">
      <h3 className="step-title">현재 개발 실력은 어느 정도인가요?</h3>
      <p className="step-description">솔직하게 평가해주세요. 맞춤형 학습을 제공해드릴게요</p>
      
      <div className="level-options">
        {levels.map((option) => (
          <div
            key={option.value}
            className={`level-card ${data.level === option.value ? 'selected' : ''}`}
            onClick={() => onDataChange({ level: option.value })}
          >
            <div className="level-header">
              <div className="level-icon">{option.icon}</div>
              <div className="level-label">{option.label}</div>
            </div>
            <div className="level-description">{option.description}</div>
          </div>
        ))}
      </div>

      <div className="step-actions">
        <button
          className="btn btn-outline-secondary btn-lg"
          onClick={onPrev}
        >
          <i className="bi bi-arrow-left me-2"></i>
          이전
        </button>
        <button
          className="btn btn-primary btn-lg"
          onClick={onNext}
          disabled={!isValid}
        >
          다음 단계
          <i className="bi bi-arrow-right ms-2"></i>
        </button>
      </div>
    </div>
  );
};

// 4단계: 가입 동기
const Step4: React.FC<StepProps> = ({ data, onDataChange, onPrev, isValid, isSubmitting, onNext }) => {
  return (
    <div className="survey-step">
      <h3 className="step-title">Gpters에 가입하게 된 동기는 무엇인가요?</h3>
      <p className="step-description">자유롭게 작성해주세요. 더 나은 서비스를 위해 활용됩니다</p>
      
      <div className="motivation-section">
        <textarea
          className="form-control"
          rows={6}
          value={data.motivation}
          onChange={(e) => onDataChange({ motivation: e.target.value })}
          placeholder="예시:
• 체계적인 코딩 학습을 위해
• 취업 준비를 위한 실력 향상
• 새로운 기술을 배우고 싶어서
• 동료들과 함께 성장하고 싶어서
• 개발자로 전직하기 위해

솔직한 동기를 작성해주세요!"
        />
        <div className="character-count">
          {data.motivation.length} / 500자
        </div>
      </div>

      <div className="step-actions">
        <button
          className="btn btn-outline-secondary btn-lg"
          onClick={onPrev}
          disabled={isSubmitting}
        >
          <i className="bi bi-arrow-left me-2"></i>
          이전
        </button>
        <button
          className="btn btn-success btn-lg"
          onClick={onNext}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              설문 제출 중...
            </>
          ) : (
            <>
              <i className="bi bi-check-lg me-2"></i>
              설문 완료
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const SurveyPage: React.FC = () => {
  const { user, login } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveyData, setSurveyData] = useState<SurveyData>({
    occupation: '',
    purpose: '',
    level: '',
    motivation: ''
  });

  const totalSteps = 4;

  const handleDataChange = (newData: Partial<SurveyData>) => {
    setSurveyData(prev => ({ ...prev, ...newData }));
  };

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      // 마지막 단계에서 설문 제출
      await handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const result = await submitSurvey(surveyData);
      
      console.log('설문조사 제출 성공:', result);
      
      // AuthContext의 사용자 정보 업데이트
      if (user) {
        const updatedUser = {
          ...user,
          survey_completed: true
        };
        login(updatedUser);
      }
      
      // 성공 메시지 표시
      alert(`설문조사가 완료되었습니다! 감사합니다.\n\n설문 ID: ${result.data.surveyId}\n제출 시간: ${new Date(result.data.submittedAt).toLocaleString('ko-KR')}`);
      
      // 홈페이지로 리다이렉트
      window.location.href = '/';
      
    } catch (error) {
      console.error('설문조사 제출 실패:', error);
      
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      alert(`설문조사 제출에 실패했습니다.\n\n오류: ${errorMessage}\n\n다시 시도해주세요.`);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return !!surveyData.occupation;
      case 2:
        return !!surveyData.purpose;
      case 3:
        return !!surveyData.level;
      case 4:
        return surveyData.motivation.trim().length >= 10;
      default:
        return false;
    }
  };

  const renderStep = () => {
    const stepProps = {
      data: surveyData,
      onDataChange: handleDataChange,
      onNext: handleNext,
      onPrev: handlePrev,
      isFirst: currentStep === 1,
      isLast: currentStep === totalSteps,
      isValid: isStepValid(),
      isSubmitting
    };

    switch (currentStep) {
      case 1:
        return <Step1 {...stepProps} />;
      case 2:
        return <Step2 {...stepProps} />;
      case 3:
        return <Step3 {...stepProps} />;
      case 4:
        return <Step4 {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="survey-page w-100">
      <div className="container-fluid px-3">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
            <div className="survey-card">
              {/* 진행 상황 표시 */}
              <div className="progress-section">
                <div className="progress-header">
                  <h1 className="survey-title">
                    <i className="bi bi-clipboard-data me-2"></i>
                    온보딩 설문조사
                  </h1>
                  <div className="step-indicator">
                    {currentStep} / {totalSteps}
                  </div>
                </div>
                
                <div className="progress">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  ></div>
                </div>
                
                <div className="step-labels">
                  <span className={currentStep >= 1 ? 'active' : ''}>직업</span>
                  <span className={currentStep >= 2 ? 'active' : ''}>목적</span>
                  <span className={currentStep >= 3 ? 'active' : ''}>레벨</span>
                  <span className={currentStep >= 4 ? 'active' : ''}>동기</span>
                </div>
              </div>

              {/* 단계별 컨텐츠 */}
              <div className="step-content">
                {renderStep()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyPage; 