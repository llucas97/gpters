const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const fetchProfile = async () => {
  const res = await fetch(`${API_BASE_URL}/api/profile`, {
    method: 'GET',
    credentials: 'include', // 세션 쿠키 포함
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('프로필 조회 실패');
  return res.json().then(res => res.data);
};

export const updateProfile = async (data: any) => {
  const res = await fetch(`${API_BASE_URL}/api/profile`, {
    method: 'PUT',
    credentials: 'include', // 세션 쿠키 포함
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('프로필 업데이트 실패');
  return res.json().then(res => res.data);
};
