// frontend/src/components/CodeEditor/ProblemPanel.tsx
import React from 'react';
import { CodeEditorProblem } from './types';

interface ProblemPanelProps {
  problem: CodeEditorProblem;
}

export default function ProblemPanel({ problem }: ProblemPanelProps) {
  return (
    <div className="p-6">
      {/* 문제 제목 및 메타데이터 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{problem.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className={`px-2 py-1 rounded ${
            problem.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
            problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {problem.difficulty}
          </span>
          <span>Level {problem.level}</span>
          {problem.topic && <span>주제: {problem.topic}</span>}
          {problem.timeLimit && <span>시간 제한: {problem.timeLimit}ms</span>}
          {problem.memoryLimit && <span>메모리 제한: {problem.memoryLimit}MB</span>}
        </div>
      </div>

      {/* 문제 설명 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">문제 설명</h2>
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {problem.statement}
          </p>
        </div>
      </div>

      {/* 제약사항 */}
      {problem.constraints && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">제약사항</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 text-sm whitespace-pre-wrap">
              {problem.constraints}
            </p>
          </div>
        </div>
      )}

      {/* 예제 */}
      {problem.examples && problem.examples.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">예제</h2>
          <div className="space-y-4">
            {problem.examples.map((example, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b">
                  <span className="font-medium text-gray-700">예제 {index + 1}</span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">입력</h4>
                      <pre className="bg-gray-50 p-3 rounded text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                        {example.input}
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">출력</h4>
                      <pre className="bg-gray-50 p-3 rounded text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                        {example.output}
                      </pre>
                    </div>
                  </div>
                  {example.explanation && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700 mb-2">설명</h4>
                      <p className="text-gray-600 text-sm">
                        {example.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 힌트 */}
      {problem.hints && problem.hints.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">💡 힌트</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <ul className="space-y-2">
              {problem.hints.map((hint, index) => (
                <li key={index} className="flex items-start gap-2 text-blue-800">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm">{hint}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 태그 */}
      {problem.tags && problem.tags.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">태그</h2>
          <div className="flex flex-wrap gap-2">
            {problem.tags.map((tag, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 추가 정보 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-yellow-600 text-lg">💡</span>
          <div>
            <h3 className="font-medium text-yellow-800 mb-1">도움말</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• <kbd className="px-1 bg-yellow-100 rounded">Ctrl+Enter</kbd>로 코드를 실행할 수 있습니다</li>
              <li>• <kbd className="px-1 bg-yellow-100 rounded">Ctrl+Shift+Enter</kbd>로 솔루션을 제출할 수 있습니다</li>
              <li>• 예제 테스트케이스로 먼저 검증해보세요</li>
              <li>• 시간 복잡도와 공간 복잡도를 고려하여 최적화하세요</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
