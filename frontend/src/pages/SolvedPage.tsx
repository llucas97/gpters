import { useState } from "react";

// ===== client id =====
const getClientId = (): string => {
  const KEY = "gpters.clientId";
  const stored =
    typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
  if (stored) return stored;

  const rand = (n = 8) =>
    Math.random()
      .toString(36)
      .slice(2, 2 + n);
  // globalThis.crypto?.randomUUID() 가 있으면 사용, 없으면 fallback
  const newId =
    (typeof globalThis !== "undefined" &&
      (globalThis as any).crypto?.randomUUID?.()) ||
    `${rand(6)}-${Date.now().toString(36)}-${rand(6)}`;

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(KEY, newId); // newId는 string 확정
  }
  return newId;
};

const CLIENT_ID = getClientId(); // eslint-disable-line @typescript-eslint/no-unused-vars

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
    const words = text.split(/(\s+|[{}()\[\];,.])/);
    
    words.forEach((word, index) => {
      if (keywords.includes(word)) {
        elements.push(
          <span key={`${key}-keyword-${index}`} style={{ color: '#c586c0', fontWeight: 'bold' }}>
            {word}
          </span>
        );
      } else if (operators.includes(word)) {
        elements.push(
          <span key={`${key}-operator-${index}`} style={{ color: '#d4d4d4' }}>
            {word}
          </span>
        );
      } else if (punctuation.includes(word)) {
        elements.push(
          <span key={`${key}-punct-${index}`} style={{ color: '#ffd700' }}>
            {word}
          </span>
        );
      } else if (word.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)) {
        // 변수명이나 함수명
        elements.push(
          <span key={`${key}-identifier-${index}`} style={{ color: '#9cdcfe' }}>
            {word}
          </span>
        );
      } else {
        elements.push(
          <span key={`${key}-text-${index}`} style={{ color: '#d4d4d4' }}>
            {word}
          </span>
        );
      }
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
  level?: number;
  topic?: string;
  language?: string;
  // 블록코딩 관련 필드
  blankedCode?: string;
  blocks?: Array<{
    id: number;
    text: string;
    type: 'answer' | 'distractor';
  }>;
  blankCount?: number;
};

// 채점 결과 타입
type GradingResult = {
  isCorrect: boolean;
  score: number;
  totalBlanks: number;
  correctBlanks: number;
  details: Array<{
    blankId: number;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
};

export default function SolvedPage() {
  const [uiLevel, setUiLevel] = useState<number>(2); // 0-5
  const [language, setLanguage] = useState<string>("javascript");
  const [loading, setLoading] = useState<boolean>(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [err, setErr] = useState<string>("");
  
  // 모달 관련 상태
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);

  // 문제 생성 함수 - 모든 레벨에서 드래그 앤 드롭 방식 사용
  const handleGenerateProblem = async () => {
    try {
      setLoading(true);
      setErr("");
      const topics = ["graph", "dp", "greedy", "tree", "string", "math"];
      const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

      // UI Level을 기준으로 문제 생성 (사용자 레벨 대신 UI Level 사용)
      const targetLevel = uiLevel;

      const params = {
        level: targetLevel,
        topic: pick(topics),
        language: language,
      };

      // 모든 레벨에서 블록코딩 API 사용 (드래그 앤 드롭)
      const apiEndpoint = "/api/block-coding/generate";
      
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      const response = await res.json();
      // 블록코딩 API 응답 구조: { success: true, data: problem }
      const problemData: Problem = response.data;
      
      setProblem(problemData);
      setUserAnswers({});
      
    } catch (error: any) {
      setErr(String(error?.message || error));
      console.error("문제 생성 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  // 드래그 앤 드롭 핸들러
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

  // 제출하기 - 모든 레벨에서 블록코딩 제출 로직 사용
  const handleSubmit = async () => {
    if (!problem) return;
    
    const blankCount = problem.blankCount || 1;
    const userAnswersArray = [];
    
    for (let i = 1; i <= blankCount; i++) {
      userAnswersArray.push(userAnswers[i] || "");
    }
    
    if (
      userAnswersArray.some((answer) => !answer) &&
      !confirm("빈칸이 비어 있습니다. 제출할까요?")
    ) {
      return;
    }
    
    const body = {
      problem,
      userAnswers: userAnswersArray
    };
    
    try {
      const r = await fetch("/api/block-coding/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text());
      
      // TODO: API 연결 시 실제 채점 결과 사용
      // const result = await r.json();
      // const apiResult = result.data;
      // setGradingResult(apiResult);
      
      // 현재는 임시로 프론트엔드에서 채점 (나중에 제거)
      const mockGradingResult = generateMockGrading(problem, userAnswers);
      setGradingResult(mockGradingResult);
      setShowResultModal(true);
      
    } catch (error: any) {
      // API가 없을 때를 대비한 임시 채점
      console.warn("API 호출 실패, 임시 채점 사용:", error);
      const mockGradingResult = generateMockGrading(problem, userAnswers);
      setGradingResult(mockGradingResult);
      setShowResultModal(true);
    }
  };
  
  // 임시 채점 함수 (나중에 API로 대체)
  const generateMockGrading = (prob: Problem, answers: Record<number, string>): GradingResult => {
    const blankCount = prob.blankCount || 1;
    const correctAnswers = prob.blocks?.filter(b => b.type === 'answer').map(b => b.text) || [];
    
    const details = [];
    let correctCount = 0;
    
    for (let i = 1; i <= blankCount; i++) {
      const userAns = answers[i] || "";
      const correctAns = correctAnswers[i - 1] || "정답 없음";
      const isCorrect = userAns === correctAns;
      
      if (isCorrect) correctCount++;
      
      details.push({
        blankId: i,
        userAnswer: userAns,
        correctAnswer: correctAns,
        isCorrect
      });
    }
    
    const score = Math.round((correctCount / blankCount) * 100);
    
    return {
      isCorrect: correctCount === blankCount,
      score,
      totalBlanks: blankCount,
      correctBlanks: correctCount,
      details
    };
  };
  
  // 다시 풀기
  const handleRetry = () => {
    setUserAnswers({});
    setShowResultModal(false);
    setGradingResult(null);
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
                      모든 레벨에서 드래그 앤 드롭으로 블록을 채워주세요
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
                    <h3 className="text-dark mb-3 fw-bold">문제 전문</h3>
                    <div className="bg-white rounded p-3" style={{ borderRadius: "15px" }}>
                      <h5 className="fw-bold mb-2 text-dark">[{problem.title}]</h5>
                      <p className="text-dark mb-2">
                        {problem.description || problem.statement || "문제 설명이 없습니다."}
                      </p>
                      {problem.instruction && (
                        <p className="text-muted mb-0"><strong>지시사항:</strong> {problem.instruction}</p>
                      )}
                      <div className="mt-2">
                        <span className="badge bg-danger me-2">레벨 {problem.level || uiLevel}</span>
                        <span className="badge bg-primary">언어: {problem.language || language}</span>
                      </div>
                    </div>
                  </div>

                  {/* 1) 코드에 빈칸 채우기 */}
                  <div className="p-4 bg-white">
                    <h4 className="text-dark mb-3 fw-bold">1) 코드에 빈칸 채우기</h4>
                    <div className="bg-dark rounded p-3" style={{ borderRadius: "15px", fontFamily: "monospace" }}>
                      <pre className="text-light mb-0" style={{ fontSize: "14px", lineHeight: "1.5" }}>
                        <code>
                          {(problem.blankedCode || problem.code || "").split(/(BLANK_\d+)/).map((part, index) => {
                            if (part.startsWith('BLANK_')) {
                              const blankId = parseInt(part.replace('BLANK_', ''));
                              return (
                                <span
                                  key={index}
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
                            return <SyntaxHighlight key={index} code={part} />;
                          })}
                        </code>
                      </pre>
                    </div>
                  </div>

                  {/* 2) 드래그할 블록들 */}
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
                              background: block.type === 'answer' 
                                ? "linear-gradient(180deg, #EEF2FF 0%, #E0E7FF 100%)"
                                : "linear-gradient(180deg, #FFF1F1 0%, #FFE5E5 100%)",
                              border: block.type === 'answer' ? "2px solid #7C83FF" : "2px solid #FF6B6B",
                              borderRadius: "12px",
                              color: block.type === 'answer' ? "#1e1b4b" : "#7F1D1D",
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

                  {/* 3) 제출하기 */}
                  <div className="p-4 bg-light" style={{ borderTop: "1px solid #e9ecef" }}>
                    <h4 className="text-dark mb-3 fw-bold">3) 제출하기</h4>
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
