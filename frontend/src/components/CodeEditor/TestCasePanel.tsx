// frontend/src/components/CodeEditor/TestCasePanel.tsx
import React, { useState } from 'react';
import { CodeEditorProblem } from './types';

interface TestCasePanelProps {
  problem: CodeEditorProblem;
}

export default function TestCasePanel({ problem }: TestCasePanelProps) {
  const [activeTestCase, setActiveTestCase] = useState(0);

  if (!problem.examples || problem.examples.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-400 text-lg mb-2">🧪</div>
        <p className="text-gray-500">테스트 케이스가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">테스트 케이스</h2>
        <span className="text-sm text-gray-500">
          {problem.examples.length}개의 예제
        </span>
      </div>

      {/* 테스트 케이스 탭 */}
      <div className="flex space-x-1 mb-4 border-b">
        {problem.examples.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveTestCase(index)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTestCase === index
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            예제 {index + 1}
          </button>
        ))}
      </div>

      {/* 활성 테스트 케이스 내용 */}
      {problem.examples[activeTestCase] && (
        <div className="space-y-4">
          {/* 입력 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-700">입력</h3>
              <button
                onClick={() => navigator.clipboard.writeText(problem.examples[activeTestCase].input)}
                className="text-xs text-blue-600 hover:text-blue-800"
                title="클립보드에 복사"
              >
                📋 복사
              </button>
            </div>
            <div className="bg-gray-50 border rounded-lg p-4">
              <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                {problem.examples[activeTestCase].input}
              </pre>
            </div>
          </div>

          {/* 출력 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-700">기대 출력</h3>
              <button
                onClick={() => navigator.clipboard.writeText(problem.examples[activeTestCase].output)}
                className="text-xs text-blue-600 hover:text-blue-800"
                title="클립보드에 복사"
              >
                📋 복사
              </button>
            </div>
            <div className="bg-gray-50 border rounded-lg p-4">
              <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                {problem.examples[activeTestCase].output}
              </pre>
            </div>
          </div>

          {/* 설명 */}
          {problem.examples[activeTestCase].explanation && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">설명</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  {problem.examples[activeTestCase].explanation}
                </p>
              </div>
            </div>
          )}

          {/* 테스트 실행 버튼 */}
          <div className="pt-4 border-t">
            <button className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
              이 테스트 케이스로 실행해보기
            </button>
          </div>
        </div>
      )}

      {/* 테스트 케이스 요약 */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-800 mb-3">📊 테스트 케이스 요약</h3>
        <div className="grid grid-cols-1 gap-3">
          {problem.examples.map((example, index) => (
            <div
              key={index}
              className={`p-3 border rounded cursor-pointer transition-colors ${
                activeTestCase === index
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setActiveTestCase(index)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">예제 {index + 1}</span>
                <span className="text-xs text-gray-500">
                  입력 {example.input.split('\n').length}줄, 
                  출력 {example.output.split('\n').length}줄
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-600 truncate">
                입력: {example.input.replace(/\n/g, ' ').substring(0, 50)}
                {example.input.length > 50 ? '...' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 도움말 */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-yellow-600 text-lg">💡</span>
          <div>
            <h3 className="font-medium text-yellow-800 mb-1">테스트 케이스 활용 팁</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 코드를 작성하기 전에 예제를 통해 문제를 정확히 이해하세요</li>
              <li>• 각 테스트 케이스가 어떤 경우를 테스트하는지 파악하세요</li>
              <li>• 예제 입력을 직접 복사해서 테스트해보세요</li>
              <li>• 경계 조건(최소값, 최대값)을 고려하여 추가 테스트를 생각해보세요</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
