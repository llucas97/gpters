/**
 * 사용자 학습 진도 관리 서비스
 */

const API_BASE_URL = 'http://localhost:3001/api/user-progress';

export interface RecentProblem {
  id: number;
  problemId: number | null;
  title: string;
  type: string;
  topic: string;
  language: string;
  description: string | null;
  level: number;
  isCorrect: boolean;
  score: number;
  blanksCorrect: number;
  blanksTotal: number;
  accuracy: number;
  finishedAt: string;
  durationMs: number;
}

export interface ProgressStats {
  basic: {
    solvedProblems: number;
    attemptedProblems: number;
    successRate: number;
    averageScore: number;
    totalAttempts: number;
    totalCorrect: number;
  };
  byLevel: Array<{
    level: number;
    total: number;
    correct: number;
    successRate: number;
  }>;
  byType: Array<{
    type: string;
    total: number;
    correct: number;
    successRate: number;
  }>;
}

class UserProgressService {
  /**
   * 최근 풀었던 문제 조회
   */
  static async getRecentProblems(userId: string, limit: number = 3): Promise<RecentProblem[]> {
    try {
      console.log('[UserProgressService] 최근 문제 조회:', { userId, limit });
      
      const response = await fetch(`${API_BASE_URL}/recent-problems/${userId}?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '최근 문제 조회 실패');
      }
      
      return result.data;
      
    } catch (error) {
      console.error('[UserProgressService] 최근 문제 조회 오류:', error);
      throw error;
    }
  }
  
  /**
   * 학습 진도 통계 조회
   */
  static async getProgressStats(userId: string): Promise<ProgressStats> {
    try {
      console.log('[UserProgressService] 학습 진도 통계 조회:', { userId });
      
      const response = await fetch(`${API_BASE_URL}/stats/${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '학습 진도 통계 조회 실패');
      }
      
      return result.data;
      
    } catch (error) {
      console.error('[UserProgressService] 학습 진도 통계 조회 오류:', error);
      throw error;
    }
  }
  
  /**
   * 문제 유형 한글 이름 반환
   */
  static getProblemTypeName(type: string): string {
    const typeNames: { [key: string]: string } = {
      'block': '블록코딩',
      'cloze': '빈칸채우기',
      'code_editor': '코드에디터',
      'ordering': '순서배열',
      'bug_fix': '버그수정'
    };
    return typeNames[type] || type;
  }
  
  /**
   * 문제 Topic 한글 이름 반환
   */
  static getTopicName(topic: string): string {
    const topicNames: { [key: string]: string } = {
      'graph': '그래프',
      'dp': '동적계획법',
      'greedy': '그리디',
      'tree': '트리',
      'string': '문자열',
      'math': '수학',
      'sort': '정렬',
      'search': '탐색',
      'stack': '스택',
      'queue': '큐',
      'hash': '해시',
      'heap': '힙',
      'programming': '프로그래밍'
    };
    return topicNames[topic] || topic;
  }
  
  /**
   * 프로그래밍 언어 한글 이름 반환
   */
  static getLanguageName(language: string): string {
    const languageNames: { [key: string]: string } = {
      'python': 'Python',
      'javascript': 'JavaScript',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'csharp': 'C#',
      'ruby': 'Ruby',
      'go': 'Go',
      'rust': 'Rust',
      'swift': 'Swift',
      'kotlin': 'Kotlin',
      'typescript': 'TypeScript'
    };
    return languageNames[language] || language;
  }
  
  /**
   * 난이도 배지 색상 반환
   */
  static getDifficultyBadgeColor(level: number): string {
    if (level <= 2) return 'success';
    if (level <= 4) return 'warning';
    return 'danger';
  }
  
  /**
   * 난이도 텍스트 반환
   */
  static getDifficultyText(level: number): string {
    if (level <= 2) return '초급';
    if (level <= 4) return '중급';
    return '고급';
  }
}

export default UserProgressService;

