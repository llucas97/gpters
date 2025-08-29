// frontend/src/api/auth.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const registerUser = async (data: {
  email: string;
  password: string;
  username: string;
  fullName: string;   // 프론트에서 변수는 그대로 fullName
}) => {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      username: data.username,
      full_name: data.fullName,   // ✅ key만 snake_case로 맞춤
    }),
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const error = await response.json();
      throw new Error(error.message || '회원가입 실패');
    } else {
      const text = await response.text();
      throw new Error(`서버가 JSON 대신 HTML/Text를 반환: ${text.slice(0, 100)}...`);
    }
  }

  return response.json();
};

