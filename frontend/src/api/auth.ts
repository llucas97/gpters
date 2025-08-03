// frontend/src/api/auth.ts
const API_URL = import.meta.env.VITE_API_URL;

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
    full_name: data.fullName,
  }),
});
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '회원가입 실패');
  }

  return response.json();
};
