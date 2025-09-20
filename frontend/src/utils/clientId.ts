// 클라이언트 ID 관리 유틸리티
export const getClientId = (): string => {
  const KEY = "gpters.clientId";
  let id = localStorage.getItem(KEY);
  if (!id) {
    // 간단 UUID 생성
    const rand = (n = 8) =>
      Math.random()
        .toString(36)
        .slice(2, 2 + n);
    id =
      (crypto as any)?.randomUUID?.() ||
      `${rand(6)}-${Date.now().toString(36)}-${rand(6)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
};

export const CLIENT_ID = getClientId();


