import type { ApiError } from '../types/api';

// API 에러 처리 유틸리티
export class ApiErrorHandler {
  static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      
      try {
        const errorData: ApiError = await response.json();
        errorMessage = errorData.detail || errorData.error || errorMessage;
      } catch {
        // JSON 파싱 실패 시 기본 메시지 사용
        const text = await response.text().catch(() => '');
        errorMessage = text || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
    
    return response.json();
  }
  
  static formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error || '알 수 없는 오류가 발생했습니다');
  }
}

// 숫자 변환 헬퍼
export const numericHelpers = {
  toNumber: (value: any): number => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  },
  
  toFixed: (value: any, decimals = 1): string => {
    return numericHelpers.toNumber(value).toFixed(decimals);
  }
};


