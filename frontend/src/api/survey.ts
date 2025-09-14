const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const submitSurvey = async (data: {
  occupation: string;
  purpose: string;
  level: string;
  preferredLanguage: string;
  motivation: string;
}) => {
  // 스킬 레벨을 숫자로 매핑
  const skillLevelMap: { [key: string]: number } = {
    'beginner': 1,
    'intermediate': 2,
    'advanced': 3,
    'expert': 4
  };

  const res = await fetch(`${API_BASE_URL}/api/survey/submit`, {
    method: 'POST',
    credentials: 'include', // 세션 쿠키 포함
    headers: { 
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      job_title: data.occupation,
      learning_purpose: data.purpose,
      current_skill_level: skillLevelMap[data.level] || 1, // 숫자로 변환
      preferred_language: data.preferredLanguage,
      motivation: data.motivation,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || '설문 제출 실패');
  }

  return res.json();
};

// 설문조사 결과 조회
export const getSurveyResult = async () => {
  const response = await fetch(`${API_BASE_URL}/api/survey/result`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || '설문조사 결과 조회에 실패했습니다.');
  }

  return response.json();
};

// 설문조사 완료 상태 확인
export const getSurveyStatus = async () => {
  const response = await fetch(`${API_BASE_URL}/api/survey/status`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || '설문조사 상태 조회에 실패했습니다.');
  }

  return response.json();
};
