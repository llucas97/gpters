import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getCurrentUser } from "../api/auth";
import GradingService from "../services/gradingService";

// ===== client id ===== (Not used in current implementation)
// const getClientId = (): string => {
//   const KEY = "gpters.clientId";
//   const stored =
//     typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
//   if (stored) return stored;
//
//   const rand = (n = 8) =>
//     Math.random()
//       .toString(36)
//       .slice(2, 2 + n);
//   // globalThis.crypto?.randomUUID() 가 있으면 사용, 없으면 fallback
//   const newId =
//     (typeof globalThis !== "undefined" &&
//       (globalThis as any).crypto?.randomUUID?.()) ||
//     `${rand(6)}-${Date.now().toString(36)}-${rand(6)}`;
//
//   if (typeof localStorage !== "undefined") {
//     localStorage.setItem(KEY, newId); // newId는 string 확정
//   }
//   return newId;
// };
//
// const CLIENT_ID = getClientId(); // Not used in current implementation

// 구문 강조 컴포넌트
const SyntaxHighlight = ({ code }: { code: string }) => {
  // JavaScript 키워드와 토큰 정의
  const keywords = ['let', 'const', 'var', 'if', 'else', 'for', 'while', 'function', 'return', 'true', 'false', 'null', 'undefined'];
  const operators = ['=', '+', '-', '*', '/', '>', '<', '>=', '<=', '==', '===', '!=', '!==', '&&', '||', '!'];
  const punctuation = ['{', '}', '(', ')', '[', ']', ';', ',', '.'];

  // 문자열 리터럴 찾기
  const stringRegex = /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/g;
  // 숫자 찾기
  const numberRegex = /\b\d+(\.\d+)?\b/g;
  // 주석 찾기
  const commentRegex = /\/\/.*$/gm;

  const highlightCode = (text: string) => {
    const tokens: Array<{ type: string; value: string; start: number; end: number }> = [];

    // 문자열 찾기
    let match;
    while ((match = stringRegex.exec(text)) !== null) {
      tokens.push({
        type: 'string',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
    }

    // 숫자 찾기
    stringRegex.lastIndex = 0;
    while ((match = numberRegex.exec(text)) !== null) {
      // 문자열 안에 있는지 확인
      const isInString = tokens.some(token => 
        token.type === 'string' && match!.index >= token.start && match!.index < token.end
      );
      if (!isInString) {
        tokens.push({
          type: 'number',
          value: match[0],
          start: match.index,
          end: match.index + match[0].length
        });
      }
    }

    // 주석 찾기
    numberRegex.lastIndex = 0;
    while ((match = commentRegex.exec(text)) !== null) {
      tokens.push({
        type: 'comment',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
    }

    // 토큰을 위치 순으로 정렬
    tokens.sort((a, b) => a.start - b.start);

    // 겹치지 않는 토큰들만 필터링
    const filteredTokens = tokens.filter((token, index) => {
      if (index === 0) return true;
      const prevToken = tokens[index - 1];
      return token.start >= prevToken.end;
    });

    // JSX 요소들을 저장할 배열
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    filteredTokens.forEach((token, index) => {
      // 토큰 이전의 텍스트 처리
      if (token.start > lastIndex) {
        const beforeText = text.slice(lastIndex, token.start);
        elements.push(highlightKeywordsAndOperators(beforeText, `before-${index}`));
      }

      // 토큰 처리
      const color = getTokenColor(token.type);
      elements.push(
        <span key={`token-${index}`} style={{ color }}>
          {token.value}
        </span>
      );

      lastIndex = token.end;
    });

    // 마지막 토큰 이후의 텍스트 처리
    if (lastIndex < text.length) {
      const afterText = text.slice(lastIndex);
      elements.push(highlightKeywordsAndOperators(afterText, 'after'));
    }

    return elements;
  };

  const highlightKeywordsAndOperators = (text: string, key: string) => {
    const elements: React.ReactNode[] = [];
    
    // 줄바꿈으로 먼저 분리 (줄바꿈 보존)
    const lines = text.split('\n');
    
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) {
        // 줄바꿈 추가
        elements.push(<br key={`${key}-br-${lineIndex}`} />);
      }
      
      const words = line.split(/(\s+|[{}()\[\];,.])/);
      
      words.forEach((word, index) => {
        if (keywords.includes(word)) {
          elements.push(
            <span key={`${key}-keyword-${lineIndex}-${index}`} style={{ color: '#c586c0', fontWeight: 'bold' }}>
              {word}
            </span>
          );
        } else if (operators.includes(word)) {
          elements.push(
            <span key={`${key}-operator-${lineIndex}-${index}`} style={{ color: '#d4d4d4' }}>
              {word}
            </span>
          );
        } else if (punctuation.includes(word)) {
          elements.push(
            <span key={`${key}-punct-${lineIndex}-${index}`} style={{ color: '#ffd700' }}>
              {word}
            </span>
          );
        } else if (word.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)) {
          // 변수명이나 함수명
          elements.push(
            <span key={`${key}-identifier-${lineIndex}-${index}`} style={{ color: '#9cdcfe' }}>
              {word}
            </span>
          );
        } else {
          elements.push(
            <span key={`${key}-text-${lineIndex}-${index}`} style={{ color: '#d4d4d4' }}>
              {word}
            </span>
          );
        }
      });
    });
    
    return elements;
  };

  const getTokenColor = (type: string) => {
    switch (type) {
      case 'string': return '#ce9178'; // 주황색 (문자열)
      case 'number': return '#b5cea8'; // 연한 녹색 (숫자)
      case 'comment': return '#6a9955'; // 녹색 (주석)
      default: return '#d4d4d4'; // 기본 색상
    }
  };

  return <>{highlightCode(code)}</>;
};

// 문제 타입 정의 (SolvePage.tsx와 동일하게 확장)
type Blank = { id: number | string; hint?: string; answer?: string };
type Example = { input: string; output: string; explanation?: string };
type Solution = { placeholder: string; answer: string; hint?: string };
type Problem = {
  id?: number;
  title: string;
  statement?: string;
  description?: string;
  instruction?: string;
  input_spec?: string;
  output_spec?: string;
  constraints?: string;
  examples?: Example[];
  code?: string;
  blanks?: Blank[];
  solutions?: Solution[];
  level?: number;
  topic?: string;
  language?: string;
  // 블록코딩 관련 필드
  blankedCode?: string;
  templateCode?: string;
  blocks?: Array<{
    id: string | number;
    text: string;
    type: 'answer' | 'distractor';
  }>;
  blankCount?: number;
  keywordsToBlank?: string[]; // 빈칸 채우기용 정답 키워드 배열
};

// 채점 결과 타입
type GradingResult = {
  isCorrect: boolean;
  score: number;
  totalBlanks: number;
  correctBlanks: number;
  experience?: number;
  details: Array<{
    blankId: number;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
};

export default function SolvedPage() {
  const { user, updateUser } = useAuth(); // 사용자 정보 가져오기
  
  const [uiLevel, setUiLevel] = useState<number>(2); // 기본값 2
  const [language, setLanguage] = useState<string>("javascript");
  const [loading, setLoading] = useState<boolean>(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [err, setErr] = useState<string>("");
  const [startTime, setStartTime] = useState<number>(0); // 문제 시작 시간
  const [showHints, setShowHints] = useState<boolean>(false); // 힌트 표시 여부
  
  // 모달 관련 상태
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);

  // 사용자 레벨에 맞춰 UI Level 자동 설정
  useEffect(() => {
    const fetchUserLevel = async () => {
      console.log('[SolvedPage] useEffect 실행 - user:', user);
      console.log('[SolvedPage] user.current_level:', user?.current_level);
      
      // 먼저 localStorage의 user 정보 확인
      let userLevel = user?.current_level;
      
      // user가 있지만 current_level이 없거나, 서버에서 최신 정보 가져오기
      if (user?.id) {
        try {
          const userInfo = await getCurrentUser();
          console.log('[SolvedPage] 서버에서 가져온 사용자 정보:', userInfo);
          
          // getCurrentUser는 직접 사용자 정보를 반환 (user 객체 없이)
          if (userInfo && userInfo.current_level !== undefined && userInfo.current_level !== null) {
            userLevel = userInfo.current_level;
            console.log('[SolvedPage] 서버에서 가져온 레벨:', userLevel);
            // Context 업데이트 (레벨이 변경된 경우)
            if (userLevel !== user?.current_level) {
              console.log(`[SolvedPage] 레벨 업데이트: ${user?.current_level} → ${userLevel}`);
              updateUser({ current_level: userLevel });
            }
          }
        } catch (error) {
          console.error('[SolvedPage] 사용자 정보 가져오기 실패:', error);
        }
      }
      
      // 사용자 레벨을 0-5 범위로 제한
      if (userLevel !== undefined && userLevel !== null) {
        const validLevel = Math.max(0, Math.min(5, userLevel));
        console.log(`[SolvedPage] UI Level을 ${validLevel}로 설정합니다 (원래 레벨: ${userLevel})`);
        setUiLevel(validLevel);
      } else {
        console.log('[SolvedPage] 사용자 레벨 정보가 없습니다. 기본값 2 유지');
        setUiLevel(2);
      }
    };
    
    fetchUserLevel();
  }, [user]);

  // 문제 생성 함수 - 레벨에 따라 다른 API 사용
  const handleGenerateProblem = async () => {
    try {
      // 문제 생성 시 즉시 기존 문제 숨기기
      setProblem(null);
      setUserAnswers({});
      setErr("");
      setLoading(true);
      
      const topics = ["graph", "dp", "greedy", "tree", "string", "math"];
      const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

      // UI Level을 기준으로 문제 생성
      const targetLevel = uiLevel;

      const params = {
        level: targetLevel,
        topic: pick(topics),
        language: language,
      };

      // 레벨에 따라 다른 API 사용
      // 레벨 0-2: 블록코딩 API, 레벨 3-5: Cloze API
      const apiEndpoint = targetLevel <= 2 
        ? "/api/block-coding/generate"
        : "/api/problem-bank/generate";
      
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      const response = await res.json();
      // 블록코딩 API 응답: { success: true, data: problem }
      // Cloze API 응답: { id: ..., ...problem }
      const problemData: Problem = response.data || response;
      
      // 레벨 3-5는 모두 동일한 로직 사용 (빈칸 개수만 다름)
      // 백엔드에서 레벨에 맞는 빈칸 개수를 자동으로 생성하므로 프론트엔드에서는 별도 조정 불필요
      
      setProblem(problemData);
      setStartTime(Date.now()); // 문제 시작 시간 기록
      setShowHints(false); // 새 문제 생성 시 힌트 숨김
      
    } catch (error: any) {
      setErr(String(error?.message || error));
      console.error("문제 생성 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  // 직접 입력 핸들러 (레벨 3-5용)
  const handleInputChange = (blankId: number, value: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [blankId]: value
    }));
  };

  // 드래그 앤 드롭 핸들러 (레벨 0-2용)
  const handleDrop = (blankId: number, blockText: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [blankId]: blockText
    }));
  };

  // 빈칸 클리어
  const clearBlank = (blankId: number) => {
    setUserAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[blankId];
      return newAnswers;
    });
  };

  // 제출하기 - 실제 채점 API 사용
  const handleSubmit = async () => {
    if (!problem) return;
    
    // 문제에서 실제 빈칸 개수 확인 (BLANK_1 형식 또는 __1__ 형식 모두 처리)
    const blankedCode = problem.blankedCode || problem.templateCode || problem.code || "";
    const blankMatches = blankedCode.match(/(BLANK_\d+|__\d+__)/g) || [];
    const blankIds = [...new Set(blankMatches.map(m => {
      if (m.startsWith('BLANK_')) {
        return parseInt(m.replace('BLANK_', ''));
      } else if (m.match(/^__\d+__$/)) {
        return parseInt(m.replace(/__/g, ''));
      }
      return 0;
    }).filter(id => id > 0))].sort((a, b) => a - b);
    const blankCount = blankIds.length || problem.blankCount || problem.blanks?.length || problem.keywordsToBlank?.length || problem.solutions?.length || 1;
    
    // 빈칸 번호 순서대로 답안 배열 생성
    const userAnswersArray: string[] = [];
    
    // keywordsToBlank나 solutions가 있으면 그것을 기준으로, 없으면 blankIds 사용
    if (problem.keywordsToBlank && Array.isArray(problem.keywordsToBlank)) {
      // keywordsToBlank의 길이를 기준으로
      for (let i = 1; i <= problem.keywordsToBlank.length; i++) {
        userAnswersArray.push((userAnswers[i] || "").trim());
      }
    } else if (problem.solutions && Array.isArray(problem.solutions)) {
      // solutions의 길이를 기준으로
      for (let i = 1; i <= problem.solutions.length; i++) {
        userAnswersArray.push((userAnswers[i] || "").trim());
      }
    } else {
      // blankIds를 기준으로
      for (let i = 0; i < blankIds.length; i++) {
        const blankId = blankIds[i];
        userAnswersArray.push((userAnswers[blankId] || "").trim());
      }
    }
    
    // 빈칸 개수와 답안 배열 길이가 일치하지 않으면 조정
    if (userAnswersArray.length !== blankCount) {
      console.warn(`[SolvedPage] 답안 배열 길이 불일치: ${userAnswersArray.length} != ${blankCount}. 조정합니다.`);
      while (userAnswersArray.length < blankCount) {
        userAnswersArray.push("");
      }
      if (userAnswersArray.length > blankCount) {
        userAnswersArray.splice(blankCount);
      }
    }
    
    // 빈 답안 확인 (빈 문자열 체크)
    const emptyAnswers = userAnswersArray.filter(answer => !answer || answer.trim() === "");
    if (emptyAnswers.length > 0 && 
        !confirm(`${emptyAnswers.length}개의 빈칸이 비어 있습니다. 제출할까요?`)) {
      return;
    }
    
    try {
      // GradingService를 사용하여 실제 채점 (userId 포함)
      const userId = user?.id?.toString();
      const timeSpent = startTime > 0 ? Math.floor((Date.now() - startTime) / 1000) : 0; // 초 단위
      
      const currentLevel = problem.level || uiLevel;
      const isBlockCoding = currentLevel <= 2; // 레벨 0-2는 블록코딩
      
      console.log('[SolvedPage] 채점 제출:', {
        userId,
        problemTitle: problem.title,
        level: currentLevel,
        problemType: isBlockCoding ? 'block' : 'cloze',
        userAnswersCount: userAnswersArray.length,
        timeSpent: `${timeSpent}초`
      });
      
      // 레벨에 따라 적절한 채점 함수 사용
      // 레벨 0-2: 블록코딩, 레벨 3-5: 빈칸채우기
      const result: any = isBlockCoding
        ? await GradingService.gradeBlockCoding(
            problem,
            userAnswersArray, // 블록코딩에서는 userBlocks 배열로 전달
            currentLevel,
            userId,
            timeSpent
          )
        : await GradingService.gradeClozeTest(
            problem,
            userAnswersArray,
            currentLevel,
            userId,
            timeSpent
          );
      
      if (result.success) {
        // API 응답을 GradingResult 형식으로 변환
        const gradingData: GradingResult = {
          isCorrect: result.isCorrect,
          score: result.score,
          totalBlanks: result.totalCount || blankCount,
          correctBlanks: result.correctCount || 0,
          experience: result.experience?.gained || 0,
          details: (result.results || []).map((r: any, idx: number) => ({
            blankId: idx + 1,
            userAnswer: userAnswersArray[idx] || "",
            correctAnswer: r.correctAnswer || r.expected || "",
            isCorrect: r.isCorrect || false
          }))
        };
        
        setGradingResult(gradingData);
        setShowResultModal(true);
        
        console.log('[SolvedPage] 채점 성공:', {
          score: result.score,
          isCorrect: result.isCorrect,
          experience: result.experience
        });
      } else {
        throw new Error(result.error || '채점에 실패했습니다');
      }
      
    } catch (error: any) {
      console.error("[SolvedPage] 채점 오류:", error);
      alert(`채점 중 오류가 발생했습니다: ${error.message}`);
    }
  };
  
  // 다시 풀기
  const handleRetry = () => {
    setUserAnswers({});
    setShowResultModal(false);
    setGradingResult(null);
    setShowHints(false); // 다시 풀기 시 힌트 숨김
  };
  
  // 새 문제 생성
  const handleNewProblem = () => {
    setShowResultModal(false);
    setGradingResult(null);
    handleGenerateProblem();
  };

  return (
    <div className="container-fluid" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", minHeight: "100vh", padding: "2rem 0" }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10">
            {/* 제목 */}
            <h1 className="text-white text-center mb-4" style={{ fontSize: "2.5rem", fontWeight: "bold" }}>
              레벨별 문제 해결
            </h1>

            {/* 메인 컨트롤 패널 */}
            <div className="card shadow-lg mb-4" style={{ borderRadius: "20px", border: "none" }}>
              <div className="card-body p-4">
                <div className="row g-3">
                  {/* UI Level 슬라이더 */}
                  <div className="col-12 col-md-6">
                    <label className="form-label text-muted fw-semibold">
                      UI Level (0~5)
                    </label>
                    <div className="position-relative">
                      <input
                        type="range"
                        className="form-range"
                        min="0"
                        max="5"
                        value={uiLevel}
                        onChange={(e) => setUiLevel(Number(e.target.value))}
                        style={{
                          background: `linear-gradient(to right, #667eea 0%, #667eea ${(uiLevel / 5) * 100}%, #e9ecef ${(uiLevel / 5) * 100}%, #e9ecef 100%)`
                        }}
                      />
                      <div className="d-flex justify-content-between mt-1">
                        <small className="text-muted">0</small>
                        <small className="text-muted">1</small>
                        <small className="text-muted">2</small>
                        <small className="text-muted">3</small>
                        <small className="text-muted">4</small>
                        <small className="text-muted">5</small>
                      </div>
                    </div>
                    <small className="text-muted">
                      0-2: 드래그 앤 드롭 / 3-5: 키보드 직접 입력
                      {user && (
                        <span className="ms-2 text-primary fw-semibold">
                          (내 레벨: {user.current_level ?? 0})
                        </span>
                      )}
                    </small>
                  </div>

                  {/* 언어 선택 */}
                  <div className="col-12 col-md-3">
                    <label className="form-label text-muted fw-semibold">
                      Editor Language
                    </label>
                    <select
                      className="form-select"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      style={{ borderRadius: "10px" }}
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                    </select>
                  </div>

                  {/* 문제 생성 버튼 */}
                  <div className="col-12 col-md-3">
                    <label className="form-label text-muted fw-semibold">
                      문제 생성
                    </label>
                    <button
                      className="btn w-100"
                      onClick={handleGenerateProblem}
                      disabled={loading}
                      style={{
                        background: "linear-gradient(45deg, #667eea, #764ba2)",
                        border: "none",
                        borderRadius: "10px",
                        color: "white",
                        fontWeight: "600",
                        padding: "0.5rem 1rem",
                        transition: "all 0.3s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          생성 중...
                        </>
                      ) : (
                        "문제 생성"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 에러 표시 */}
            {err && (
              <div className="alert alert-danger mb-4" style={{ borderRadius: "15px" }}>
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                에러: {err}
              </div>
            )}

            {/* 문제 영역 */}
            {!problem ? (
              // 문제가 없을 때
              <div className="card shadow-lg" style={{ borderRadius: "20px", border: "none", minHeight: "400px" }}>
                <div className="card-body d-flex align-items-center justify-content-center">
                  <div className="text-center">
                    <div className="mb-4">
                      <i className="bi bi-code-square" style={{ fontSize: "4rem", color: "#667eea" }}></i>
                    </div>
                    <h4 className="text-muted mb-3">문제를 생성해보세요!</h4>
                    <p className="text-muted">
                      위의 설정을 조정하고 "문제 생성" 버튼을 클릭하여<br />
                      레벨에 맞는 문제를 생성할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // 문제가 있을 때 - 통합된 하나의 카드
              <div className="card shadow-lg" style={{ borderRadius: "20px", border: "none" }}>
                <div className="card-body p-0" style={{ borderRadius: "20px", overflow: "hidden" }}>
                  
                  {/* 문제 전문 */}
                  <div className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h3 className="text-dark mb-0 fw-bold">문제 전문</h3>
                      {/* 힌트 토글 버튼 */}
                      <button
                        className="btn btn-sm"
                        onClick={() => setShowHints(!showHints)}
                        style={{
                          background: showHints ? "linear-gradient(45deg, #f093fb, #f5576c)" : "linear-gradient(45deg, #667eea, #764ba2)",
                          border: "none",
                          borderRadius: "10px",
                          color: "white",
                          fontWeight: "600",
                          padding: "0.4rem 1rem",
                          transition: "all 0.3s ease",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
                        }}
                      >
                        <i className={`bi ${showHints ? 'bi-lightbulb-fill' : 'bi-lightbulb'} me-2`}></i>
                        {showHints ? '힌트 숨기기' : '힌트 보기'}
                      </button>
                    </div>
                    <div className="bg-white rounded p-3" style={{ borderRadius: "15px" }}>
                      <h5 className="fw-bold mb-2 text-dark">[{problem.title}]</h5>
                      <p className="text-dark mb-2">
                        {problem.description || problem.statement || "문제 설명이 없습니다."}
                      </p>
                      {problem.instruction && (() => {
                        // 지시사항에서 정답 관련 내용 제거
                        let cleanInstruction = problem.instruction;
                        
                        // 정답 키워드 목록 (keywordsToBlank가 있으면 사용)
                        const answerKeywords = problem.keywordsToBlank || [];
                        
                        // 1. "답:", "정답:", "Answer:", "답안:" 등으로 시작하는 줄 전체 제거
                        cleanInstruction = cleanInstruction.replace(/^답\s*[:：]\s*.*$/gmi, '');
                        cleanInstruction = cleanInstruction.replace(/^정답\s*[:：]\s*.*$/gmi, '');
                        cleanInstruction = cleanInstruction.replace(/^Answer\s*[:：]\s*.*$/gmi, '');
                        cleanInstruction = cleanInstruction.replace(/^답안\s*[:：]\s*.*$/gmi, '');
                        
                        // 2. "정답은 ...", "답은 ..." 같은 패턴 제거
                        cleanInstruction = cleanInstruction.replace(/정답은\s+[^\n\.]+/gi, '');
                        cleanInstruction = cleanInstruction.replace(/답은\s+[^\n\.]+/gi, '');
                        cleanInstruction = cleanInstruction.replace(/정답\s+[^\n\.]+/gi, '');
                        
                        // 3. "목적:" 이후에 정답 관련 내용이 있는 경우 처리
                        if (cleanInstruction.includes('목적:')) {
                          // "목적:" 뒤에 "답:", "정답:" 같은 패턴이 있으면 그 이후 부분 제거
                          const purposeIndex = cleanInstruction.indexOf('목적:');
                          const afterPurpose = cleanInstruction.substring(purposeIndex);
                          
                          // "목적: ..." 부분 찾기 (줄 끝이나 답 관련 패턴 전까지)
                          const answerPatternMatch = afterPurpose.match(/답\s*[:：]|정답\s*[:：]/i);
                          
                          if (answerPatternMatch) {
                            // "목적:" 부분과 그 직후 가이드 문구만 유지, "답:" 이후 제거
                            const beforeAnswer = afterPurpose.substring(0, answerPatternMatch.index);
                            cleanInstruction = cleanInstruction.substring(0, purposeIndex) + beforeAnswer.trim();
                          } else {
                            // "목적:" 이후에 정답 키워드가 직접 포함되어 있는 경우
                            // "목적: ..." 부분만 유지하고 나머지 제거
                            const purposeMatch = afterPurpose.match(/목적\s*[:：]\s*[^\n]*/);
                            if (purposeMatch) {
                              const beforePurpose = cleanInstruction.substring(0, purposeIndex);
                              // "목적: 문제 해결을 위한 가이드" 같은 패턴만 유지
                              const purposeLine = purposeMatch[0].trim();
                              cleanInstruction = beforePurpose + purposeLine;
                            }
                          }
                        }
                        
                        // 4. keywordsToBlank에 있는 정답 키워드들을 포함한 문장 제거 (단, "목적:" 줄은 제외)
                        answerKeywords.forEach((keyword: string) => {
                          // 이스케이프 처리
                          const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                          // 키워드를 포함한 문장 제거 (단, "목적:"이 포함된 줄은 제외)
                          cleanInstruction = cleanInstruction.replace(
                            new RegExp(`^(?!.*목적[:：])[^\\n]*${escapedKeyword}[^\\n]*$`, 'gmi'),
                            ''
                          );
                        });
                        
                        // 5. 연속된 공백과 줄바꿈 정리
                        cleanInstruction = cleanInstruction.replace(/\n\s*\n+/g, '\n').trim();
                        
                        // 정리된 instruction이 비어있지 않을 때만 표시
                        return cleanInstruction ? (
                          <p className="text-muted mb-0"><strong>지시사항:</strong> {cleanInstruction}</p>
                        ) : null;
                      })()}
                      <div className="mt-2">
                        <span className="badge bg-danger me-2">레벨 {problem.level || uiLevel}</span>
                        {problem.topic && (
                          <span className="badge bg-info me-2">
                            {problem.topic === 'graph' ? '그래프' :
                             problem.topic === 'dp' ? '동적계획법' :
                             problem.topic === 'greedy' ? '그리디' :
                             problem.topic === 'tree' ? '트리' :
                             problem.topic === 'string' ? '문자열' :
                             problem.topic === 'math' ? '수학' :
                             problem.topic}
                          </span>
                        )}
                        <span className="badge bg-primary">언어: {problem.language || language}</span>
                      </div>
                    </div>
                    
                    {/* 힌트 표시 영역 */}
                    {showHints && (
                      <div className="mt-3 p-3 rounded" style={{ 
                        background: "linear-gradient(135deg, #FFF9E6 0%, #FFF3CC 100%)",
                        border: "2px solid #FFD700",
                        borderRadius: "15px"
                      }}>
                        <h6 className="fw-bold mb-2" style={{ color: "#B8860B" }}>
                          <i className="bi bi-lightbulb-fill me-2"></i>
                          힌트
                        </h6>
                        {problem.blanks && problem.blanks.length > 0 && problem.blanks.some(b => b.hint) ? (
                          <div className="ms-3">
                            {problem.blanks.map((blank, idx) => 
                              blank.hint ? (
                                <div key={idx} className="mb-2">
                                  <span className="badge bg-warning text-dark me-2">빈칸 {idx + 1}</span>
                                  <span style={{ color: "#6B5504" }}>{blank.hint}</span>
                                </div>
                              ) : null
                            )}
                          </div>
                        ) : problem.solutions && problem.solutions.length > 0 && problem.solutions.some(s => s.hint) ? (
                          <div className="ms-3">
                            {problem.solutions.map((solution, idx) => 
                              solution.hint ? (
                                <div key={idx} className="mb-2">
                                  <span className="badge bg-warning text-dark me-2">힌트 {idx + 1}</span>
                                  <span style={{ color: "#6B5504" }}>{solution.hint}</span>
                                </div>
                              ) : null
                            )}
                          </div>
                        ) : (
                          <p className="text-muted mb-0 ms-3">이 문제에는 힌트가 제공되지 않습니다.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 1) 코드에 빈칸 채우기 */}
                  <div className="p-4 bg-white">
                    <h4 className="text-dark mb-3 fw-bold">
                      1) 코드에 빈칸 채우기
                      <small className="ms-2 text-muted" style={{ fontSize: '0.9rem' }}>
                        {uiLevel <= 2 ? '(드래그 앤 드롭)' : '(직접 입력)'}
                      </small>
                    </h4>
                    <div className="bg-dark rounded p-3" style={{ borderRadius: "15px", fontFamily: "monospace" }}>
                      <pre className="text-light mb-0" style={{ fontSize: "14px", lineHeight: "1.5", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        <code style={{ display: "block" }}>
                          {(() => {
                            const codeText = problem.blankedCode || problem.templateCode || problem.code || "";
                            const lines = codeText.split('\n');
                            
                            return lines.map((line, lineIndex) => {
                              const parts = line.split(/(BLANK_\d+|__\d+__)/);
                              
                              return (
                                <span key={lineIndex} style={{ display: "block" }}>
                                  {parts.map((part: string, partIndex: number) => {
                                    let blankId: number | null = null;
                                    
                                    // BLANK_1 형식 처리
                                    if (part.startsWith('BLANK_')) {
                                      blankId = parseInt(part.replace('BLANK_', ''));
                                    }
                                    // __1__ 형식 처리 (Cloze API)
                                    else if (part.match(/^__\d+__$/)) {
                                      blankId = parseInt(part.replace(/__/g, ''));
                                    }
                                    
                                    if (blankId !== null) {
                                      // 레벨 0-2: 드래그 앤 드롭 영역
                                      if (uiLevel <= 2) {
                                        return (
                                          <span
                                            key={`${lineIndex}-${partIndex}`}
                                            className="d-inline-block"
                                            style={{
                                              background: "#4a5568",
                                              border: "2px dashed #718096",
                                              borderRadius: "6px",
                                              padding: "4px 16px",
                                              margin: "0 4px",
                                              minWidth: "120px",
                                              textAlign: "center",
                                              color: "#e2e8f0",
                                              fontSize: "13px",
                                              fontWeight: "500",
                                              letterSpacing: "0.5px",
                                              cursor: "pointer",
                                              transition: "all 0.2s ease"
                                            }}
                                            onDrop={(e) => {
                                              e.preventDefault();
                                              const blockText = e.dataTransfer.getData("text/plain");
                                              if (blockText) handleDrop(blankId, blockText);
                                            }}
                                            onDragOver={(e) => {
                                              e.preventDefault();
                                              e.currentTarget.style.background = "#5a6578";
                                              e.currentTarget.style.borderColor = "#a0aec0";
                                            }}
                                            onDragLeave={(e) => {
                                              e.currentTarget.style.background = "#4a5568";
                                              e.currentTarget.style.borderColor = "#718096";
                                            }}
                                          >
                                            {userAnswers[blankId] ? (
                                              <>
                                                <span style={{ color: "#90cdf4" }}>{userAnswers[blankId]}</span>
                                                <button 
                                                  onClick={() => clearBlank(blankId)}
                                                  className="btn btn-sm ms-2"
                                                  style={{ 
                                                    fontSize: "12px", 
                                                    padding: "0 4px", 
                                                    border: "1px solid #718096", 
                                                    background: "#2d3748",
                                                    color: "#e2e8f0",
                                                    borderRadius: "3px",
                                                    lineHeight: "1"
                                                  }}
                                                >
                                                  ×
                                                </button>
                                              </>
                                            ) : (
                                              <span style={{ color: "#a0aec0", fontStyle: "italic" }}>BLANK</span>
                                            )}
                                          </span>
                                        );
                                      } 
                                      // 레벨 3-5: 직접 입력 필드
                                      else {
                                        return (
                                          <input
                                            key={`${lineIndex}-${partIndex}`}
                                            type="text"
                                            className="d-inline-block"
                                            value={userAnswers[blankId] || ""}
                                            onChange={(e) => handleInputChange(blankId, e.target.value)}
                                            placeholder={`빈칸 ${blankId}`}
                                            style={{
                                              background: "#4a5568",
                                              border: "2px solid #718096",
                                              borderRadius: "6px",
                                              padding: "4px 12px",
                                              margin: "0 4px",
                                              minWidth: "100px",
                                              maxWidth: "150px",
                                              textAlign: "center",
                                              color: "#90cdf4",
                                              fontSize: "13px",
                                              fontWeight: "500",
                                              outline: "none",
                                              fontFamily: "monospace"
                                            }}
                                            onFocus={(e) => {
                                              e.currentTarget.style.borderColor = "#a0aec0";
                                              e.currentTarget.style.background = "#5a6578";
                                            }}
                                            onBlur={(e) => {
                                              e.currentTarget.style.borderColor = "#718096";
                                              e.currentTarget.style.background = "#4a5568";
                                            }}
                                          />
                                        );
                                      }
                                    }
                                    // 빈칸이 아닌 일반 코드 부분
                                    if (part.trim() === '') {
                                      return <span key={`${lineIndex}-${partIndex}`}>{part}</span>;
                                    }
                                    return <SyntaxHighlight key={`${lineIndex}-${partIndex}`} code={part} />;
                                  })}
                                </span>
                              );
                            });
                          })()}
                        </code>
                      </pre>
                    </div>
                  </div>

                  {/* 2) 드래그할 블록들 (레벨 0-2만 표시) */}
                  {uiLevel <= 2 && (
                    <div className="p-4 bg-white">
                      <h4 className="text-dark mb-3 fw-bold">2) 드래그할 블록들</h4>
                      <div className="d-flex flex-wrap gap-2">
                        {(problem.blocks || []).length > 0 ? (
                          problem.blocks!.map((block) => (
                            <div
                              key={block.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData("text/plain", block.text);
                              }}
                              className="btn"
                              style={{
                                background: "linear-gradient(180deg, #EEF2FF 0%, #E0E7FF 100%)",
                                border: "2px solid #7C83FF",
                                borderRadius: "12px",
                                color: "#1e1b4b",
                                fontWeight: "600",
                                cursor: "grab",
                                userSelect: "none"
                              }}
                              onMouseDown={(e) => e.currentTarget.style.cursor = "grabbing"}
                              onMouseUp={(e) => e.currentTarget.style.cursor = "grab"}
                            >
                              {block.text}
                            </div>
                          ))
                        ) : (
                          <span className="text-muted">블록이 없습니다.</span>
                        )}
                      </div>
                      {(problem.blocks || []).length > 0 && (
                        <div className="mt-2 text-muted small">
                          정답 블록: {problem.blocks!.filter(b => b.type === 'answer').length}개 | 
                          오답 블록: {problem.blocks!.filter(b => b.type === 'distractor').length}개
                        </div>
                      )}
                    </div>
                  )}

                  {/* 제출하기 */}
                  <div className="p-4 bg-light" style={{ borderTop: "1px solid #e9ecef" }}>
                    <h4 className="text-dark mb-3 fw-bold">
                      {uiLevel <= 2 ? '3)' : '2)'} 제출하기
                    </h4>
                    <button
                      onClick={handleSubmit}
                      className="btn btn-primary btn-lg px-4 py-2"
                      style={{
                        background: "linear-gradient(45deg, #667eea, #764ba2)",
                        border: "none",
                        borderRadius: "12px",
                        fontWeight: "700"
                      }}
                    >
                      제출하기
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 채점 결과 모달 */}
      {showResultModal && gradingResult && (
        <div 
          className="modal show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowResultModal(false)}
        >
          <div 
            className="modal-dialog modal-dialog-centered modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content" style={{ borderRadius: '20px', border: 'none', overflow: 'hidden' }}>
              
              {/* 모달 헤더 */}
              <div 
                className="modal-header border-0 p-4"
                style={{
                  background: gradingResult.isCorrect 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white'
                }}
              >
                <div className="w-100 text-center">
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                    {gradingResult.isCorrect ? '🎉' : '💪'}
                  </div>
                  <h3 className="modal-title fw-bold mb-2">
                    {gradingResult.isCorrect ? '정답입니다!' : '아쉽네요!'}
                  </h3>
                  <h1 className="display-3 fw-bold mb-0">
                    {gradingResult.score}점
                  </h1>
                  <p className="mb-0 mt-2" style={{ fontSize: '1.1rem' }}>
                    {gradingResult.correctBlanks} / {gradingResult.totalBlanks} 정답
                  </p>
                  {gradingResult.experience && gradingResult.experience > 0 && (
                    <p className="mb-0 mt-3" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                      <span style={{ 
                        background: 'rgba(255, 255, 255, 0.3)', 
                        padding: '0.5rem 1rem', 
                        borderRadius: '20px',
                        display: 'inline-block'
                      }}>
                        ✨ +{gradingResult.experience} EXP
                      </span>
                    </p>
                  )}
                </div>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowResultModal(false)}
                  style={{ position: 'absolute', right: '1rem', top: '1rem' }}
                ></button>
              </div>

              {/* 모달 바디 */}
              <div className="modal-body p-4">
                <h5 className="fw-bold mb-3 text-dark">상세 결과</h5>
                
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th className="text-center" style={{ width: '80px' }}>빈칸</th>
                        <th className="text-center" style={{ width: '80px' }}>결과</th>
                        <th>내 답안</th>
                        <th>정답</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gradingResult.details.map((detail) => (
                        <tr key={detail.blankId} className={detail.isCorrect ? 'table-success' : 'table-danger'}>
                          <td className="text-center fw-bold">
                            #{detail.blankId}
                          </td>
                          <td className="text-center">
                            <span style={{ fontSize: '1.5rem' }}>
                              {detail.isCorrect ? '✓' : '✗'}
                            </span>
                          </td>
                          <td>
                            <code 
                              className="px-2 py-1 rounded"
                              style={{
                                background: detail.isCorrect ? '#d1e7dd' : '#f8d7da',
                                color: detail.isCorrect ? '#0a3622' : '#58151c',
                                fontFamily: 'monospace'
                              }}
                            >
                              {detail.userAnswer || '(비어있음)'}
                            </code>
                          </td>
                          <td>
                            <code 
                              className="px-2 py-1 rounded"
                              style={{
                                background: '#e7f1ff',
                                color: '#004085',
                                fontFamily: 'monospace'
                              }}
                            >
                              {detail.correctAnswer}
                            </code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {!gradingResult.isCorrect && (
                  <div className="alert alert-info mt-3" style={{ borderRadius: '12px' }}>
                    <i className="bi bi-lightbulb-fill me-2"></i>
                    <strong>힌트:</strong> 틀린 부분을 다시 한 번 확인해보세요!
                  </div>
                )}
              </div>

              {/* 모달 푸터 */}
              <div className="modal-footer border-0 p-4 bg-light">
                <button 
                  className="btn btn-lg px-4"
                  onClick={handleRetry}
                  style={{
                    background: 'white',
                    border: '2px solid #667eea',
                    color: '#667eea',
                    borderRadius: '12px',
                    fontWeight: '600'
                  }}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  다시 풀기
                </button>
                <button 
                  className="btn btn-lg px-4"
                  onClick={handleNewProblem}
                  style={{
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '12px',
                    fontWeight: '600'
                  }}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  새 문제
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
