// frontend/src/components/ClozeTest/HintPanel.tsx
import React from 'react';
import { ClozeBlank, ClozeTestValidation } from './types';

interface HintPanelProps {
  blanks: ClozeBlank[];
  currentBlankIndex: number;
  userInputs: Record<string | number, string>;
  validationResults?: ClozeTestValidation | null;
}

export default function HintPanel({
  blanks,
  currentBlankIndex,
  userInputs,
  validationResults
}: HintPanelProps) {
  const currentBlank = blanks[currentBlankIndex];
  const filledBlanks = blanks.filter(blank => userInputs[blank.id]?.trim()).length;
  
  return (
    <div className="p-4 border-b">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        💡 힌트 패널
      </h3>
      
      {/* 현재 빈칸 힌트 */}
      {currentBlank && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-blue-800">
              현재 빈칸 {currentBlank.id}
            </span>
            <span className={`px-2 py-1 rounded text-xs ${
              userInputs[currentBlank.id]?.trim()
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {userInputs[currentBlank.id]?.trim() ? '작성됨' : '미작성'}
            </span>
          </div>
          
          {currentBlank.hint ? (
            <p className="text-blue-700 text-sm">
              {currentBlank.hint}
            </p>
          ) : (
            <p className="text-blue-600 text-sm">
              이 빈칸에 대한 힌트가 없습니다.
            </p>
          )}
          
          {/* 현재 빈칸 검증 결과 */}
          {validationResults && (
            (() => {
              const result = validationResults.blankResults.find(r => Number(r.id) === Number(currentBlank.id));
              if (result) {
                return (
                  <div className={`mt-2 p-2 rounded text-sm ${
                    result.isCorrect 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    <div className="flex items-center gap-1">
                      <span>{result.isCorrect ? '✓' : '✗'}</span>
                      <span className="font-medium">
                        {result.isCorrect ? '정답' : '오답'}
                      </span>
                    </div>
                    {result.feedback && (
                      <p className="mt-1">{result.feedback}</p>
                    )}
                  </div>
                );
              }
              return null;
            })()
          )}
        </div>
      )}

      {/* 전체 진행 상황 */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">진행 상황</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>작성된 빈칸:</span>
            <span className="font-medium">{filledBlanks} / {blanks.length}</span>
          </div>
          
          {validationResults && (
            <>
              <div className="flex justify-between text-sm">
                <span>정답률:</span>
                <span className="font-medium">
                  {validationResults.blankResults.filter(r => r.isCorrect).length} / {blanks.length}
                  ({Math.round((validationResults.blankResults.filter(r => r.isCorrect).length / blanks.length) * 100)}%)
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>점수:</span>
                <span className={`font-medium ${
                  validationResults.score >= 70 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {validationResults.score}/100
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 빈칸 목록 */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">빈칸 목록</h4>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {blanks.map((blank, index) => {
            const isActive = index === currentBlankIndex;
            const hasInput = userInputs[blank.id]?.trim();
            const validationResult = validationResults?.blankResults.find(r => Number(r.id) === Number(blank.id));
            
            return (
              <div
                key={blank.id}
                className={`p-2 rounded text-sm transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-100 border border-blue-300'
                    : validationResult?.isCorrect
                    ? 'bg-green-50 border border-green-200'
                    : validationResult?.isCorrect === false
                    ? 'bg-red-50 border border-red-200'
                    : hasInput
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">빈칸 {blank.id}</span>
                  <div className="flex items-center gap-1">
                    {validationResult && (
                      <span className={validationResult.isCorrect ? 'text-green-600' : 'text-red-600'}>
                        {validationResult.isCorrect ? '✓' : '✗'}
                      </span>
                    )}
                    <span className={`w-2 h-2 rounded-full ${
                      hasInput ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                  </div>
                </div>
                
                {blank.hint && (
                  <p className="text-gray-600 text-xs mt-1 truncate">
                    💡 {blank.hint}
                  </p>
                )}
                
                {hasInput && (
                  <p className="text-gray-700 text-xs mt-1 font-mono bg-white px-1 rounded">
                    입력: "{userInputs[blank.id]}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 일반적인 도움말 */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="font-medium mb-2 text-gray-800">💡 도움말</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>• Tab 키로 다음 빈칸으로 이동할 수 있습니다</p>
          <p>• Enter 키로 빈칸을 이동하고, Ctrl+Enter로 제출합니다</p>
          <p>• 빈칸에 마우스를 올리면 상세 힌트를 볼 수 있습니다</p>
          <p>• 대소문자와 공백에 주의하여 정확히 입력하세요</p>
        </div>
      </div>
    </div>
  );
}
