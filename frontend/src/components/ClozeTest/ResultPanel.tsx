// frontend/src/components/ClozeTest/ResultPanel.tsx
import React from 'react';
import { ClozeTestValidation } from './types';

interface ResultPanelProps {
  validation: ClozeTestValidation;
  isSubmitted: boolean;
  onRetry: () => void;
}

export default function ResultPanel({
  validation,
  isSubmitted,
  onRetry
}: ResultPanelProps) {
  const correctCount = validation.blankResults.filter(r => r.isCorrect).length;
  const totalCount = validation.blankResults.length;
  const percentage = Math.round((correctCount / totalCount) * 100);

  return (
    <div className="p-4 border-t">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        📊 결과
      </h3>

      {/* 점수 요약 */}
      <div className="mb-4 p-4 rounded-lg border">
        <div className="text-center mb-3">
          <div className={`text-3xl font-bold ${
            validation.score >= 70 ? 'text-green-600' : 'text-red-600'
          }`}>
            {validation.score}점
          </div>
          <div className="text-sm text-gray-600">
            {correctCount} / {totalCount} 정답 ({percentage}%)
          </div>
        </div>
        
        <div className={`text-center p-3 rounded ${
          validation.isValid 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-700'
        }`}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-lg">
              {validation.isValid ? '🎉' : '💪'}
            </span>
            <span className="font-medium">
              {validation.isValid ? '통과!' : '재도전!'}
            </span>
          </div>
          <p className="text-sm">{validation.feedback}</p>
        </div>
      </div>

      {/* 빈칸별 결과 */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">빈칸별 결과</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {validation.blankResults.map((result) => (
            <div
              key={result.id}
              className={`p-2 rounded text-sm ${
                result.isCorrect
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">빈칸 {result.id}</span>
                <span className={`text-sm ${
                  result.isCorrect ? 'text-green-600' : 'text-red-600'
                }`}>
                  {result.isCorrect ? '✓ 정답' : '✗ 오답'}
                </span>
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">입력:</span>
                  <code className="bg-white px-1 rounded font-mono">
                    {result.userInput || '(비어있음)'}
                  </code>
                </div>
                
                {!result.isCorrect && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">정답:</span>
                    <code className="bg-white px-1 rounded font-mono text-green-700">
                      {result.correctAnswer}
                    </code>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 제안사항 */}
      {validation.suggestions && validation.suggestions.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">💡 개선 제안</h4>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <ul className="text-sm text-yellow-800 space-y-1">
              {validation.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span>•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 추가 힌트 */}
      {validation.hints && validation.hints.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">🔍 추가 힌트</h4>
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <ul className="text-sm text-blue-800 space-y-1">
              {validation.hints.map((hint, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span>•</span>
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 액션 버튼들 */}
      <div className="space-y-2">
        {!isSubmitted && (
          <button
            onClick={onRetry}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            다시 시도하기
          </button>
        )}
        
        {isSubmitted && validation.isValid && (
          <div className="text-center">
            <div className="text-green-600 font-medium mb-2">
              🎉 문제를 성공적으로 완료했습니다!
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              새 문제 도전하기
            </button>
          </div>
        )}
        
        {isSubmitted && !validation.isValid && (
          <div className="text-center">
            <div className="text-red-600 font-medium mb-2">
              아직 목표에 도달하지 못했습니다.
            </div>
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
            >
              다시 도전하기
            </button>
          </div>
        )}
      </div>

      {/* 통계 정보 */}
      <div className="mt-4 pt-4 border-t">
        <h4 className="font-medium mb-2">📈 상세 통계</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-600">정답률</div>
            <div className="font-medium">{percentage}%</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-600">완성도</div>
            <div className="font-medium">
              {validation.blankResults.filter(r => r.userInput.trim()).length} / {totalCount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
