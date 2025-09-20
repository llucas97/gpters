// frontend/src/components/ClozeTest/CodeDisplay.tsx
import React from 'react';

interface CodeDisplayProps {
  code: string;
  blanks: Array<{
    id: number;
    hint?: string;
    answer?: string;
  }>;
  userAnswers: { [key: number]: string };
  onAnswerChange: (blankId: number, answer: string) => void;
  isSubmitted: boolean;
}

export default function CodeDisplay({ 
  code, 
  blanks, 
  userAnswers, 
  onAnswerChange, 
  isSubmitted 
}: CodeDisplayProps) {
  // 코드에서 빈칸을 실제 입력 필드로 치환
  const renderCodeWithBlanks = () => {
    let processedCode = code;
    
    // 각 빈칸을 입력 필드로 치환
    blanks.forEach((blank, index) => {
      const placeholder = `[빈칸${index + 1}]`;
      const userAnswer = userAnswers[blank.id] || '';
      
      processedCode = processedCode.replace(
        placeholder,
        `<input 
          type="text" 
          value="${userAnswer}" 
          placeholder="${blank.hint || `빈칸 ${index + 1}`}"
          data-blank-id="${blank.id}"
          class="inline-input"
        />`
      );
    });
    
    return processedCode;
  };

  // 빈칸 입력 필드의 onChange 이벤트 처리
  const handleInputChange = (blankId: number, value: string) => {
    onAnswerChange(blankId, value);
  };

  // 빈칸이 포함된 코드 렌더링
  const renderCode = () => {
    const processedCode = renderCodeWithBlanks();
    
    return (
      <div className="relative">
        <pre className="bg-gray-100 p-4 rounded font-mono text-sm whitespace-pre-wrap">
          <code 
            dangerouslySetInnerHTML={{ 
              __html: processedCode.replace(/\n/g, '<br/>')
            }}
          />
        </pre>
        
        {/* 실제 입력 필드들을 숨겨진 상태로 렌더링하여 이벤트 처리 */}
        <div className="hidden">
          {blanks.map((blank, index) => (
            <input
              key={blank.id}
              type="text"
              value={userAnswers[blank.id] || ''}
              onChange={(e) => handleInputChange(blank.id, e.target.value)}
              placeholder={blank.hint || `빈칸 ${index + 1}`}
              data-blank-index={index}
              className="blank-input"
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="code-display">
      <h4 className="font-semibold mb-2">코드 빈칸 채우기:</h4>
      {renderCode()}
      
      {/* 빈칸 입력 필드들 */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {blanks.map((blank, index) => (
          <div key={blank.id} className="flex items-center gap-2">
            <span className="text-sm font-medium">빈칸 {index + 1}:</span>
            <input
              type="text"
              value={userAnswers[blank.id] || ''}
              onChange={(e) => handleInputChange(blank.id, e.target.value)}
              placeholder={blank.hint || `빈칸 ${index + 1} 답`}
              className={`flex-1 px-3 py-2 border rounded text-sm ${
                isSubmitted 
                  ? (userAnswers[blank.id] === blank.answer 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-red-500 bg-red-50')
                  : 'border-gray-300'
              }`}
              disabled={isSubmitted}
            />
            {isSubmitted && blank.answer && (
              <span className="text-xs text-gray-500">
                정답: {blank.answer}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}