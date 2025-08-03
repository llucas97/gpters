const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const submitSurvey = async (data: {
  occupation: string;
  purpose: string;
  level: string;
  motivation: string;
}) => {
  const res = await fetch(`${API_BASE_URL}/api/survey`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, userId: null }), // 추후 로그인 연동 가능
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || '설문 제출 실패');
  }

  return res.json();
};
