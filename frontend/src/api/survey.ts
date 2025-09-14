const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const submitSurvey = async (data: {
  occupation: string;
  purpose: string;
  level: string;
  preferredLanguage: string;
  motivation: string;
}) => {
  const res = await fetch(`${API_BASE_URL}/api/survey/submit`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      job_title: data.occupation,
      learning_purpose: data.purpose,
      current_skill_level: data.level,
      preferred_language: data.preferredLanguage,
      motivation: data.motivation,
      time_availability: 'flexible' // 기본값 설정
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || '설문 제출 실패');
  }

  return res.json();
};
