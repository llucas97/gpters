// frontend/src/api/auth.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';  // 기본값 추가

export const registerUser = async (data: {
  email: string;
  password: string;
  username: string;
  fullName: string;
}) => {
const response = await fetch(`${API_URL}/signup`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: data.email,
    password: data.password,
    username: data.username,
    fullName: data.fullName,
  }),
});
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '회원가입 실패');
  }

  return response.json();
};

export const loginUser = async (data: { email: string; password: string }) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    credentials: 'include',  // 세션 쿠키 포함 중요!
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: data.email,
      password: data.password,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '로그인 실패');
  }

  return response.json();  // { success: true, user_id: ... }
};
