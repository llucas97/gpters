// frontend/src/components/CodeEditor/ResultPanel.tsx
import React from 'react';
import { CodeExecutionResult, CodeSubmissionResult } from './types';

interface ResultPanelProps {
  results: CodeExecutionResult | null;
  submissions: CodeSubmissionResult[];
}

export default function ResultPanel({ results, submissions }: ResultPanelProps) {
  if (!results && submissions.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-400 text-lg mb-2">📊</div>
        <p className="text-gray-500">코드를 실행하거나 제출하면 결과가 여기에 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 최신 실행 결과 */}
      {results && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">최신 실행 결과</h2>
          
          {/* 전체 결과 요약 */}
          <div className={`p-4 rounded-lg border-2 mb-4 ${
            results.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-2xl ${results.success ? 'text-green-600' : 'text-red-600'}`}>
                {results.success ? '✅' : '❌'}
              </span>
              <div>
                <h3 className={`font-bold ${results.success ? 'text-green-800' : 'text-red-800'}`}>
                  {results.success ? '실행 성공' : '실행 실패'}
                </h3>
                {results.testResults && (
                  <p className={`text-sm ${results.success ? 'text-green-700' : 'text-red-700'}`}>
                    {results.passedTests || 0} / {results.totalTests || 0} 테스트 통과
                    {results.score !== undefined && ` (점수: ${results.score}/100)`}
                  </p>
                )}
              </div>
            </div>

            {/* 실행 시간 및 메모리 */}
            {(results.executionTime || results.memoryUsage) && (
              <div className="flex gap-4 text-sm text-gray-600 mt-3">
                {results.executionTime && (
                  <span>⏱️ 실행시간: {results.executionTime}ms</span>
                )}
                {results.memoryUsage && (
                  <span>💾 메모리: {(results.memoryUsage / 1024 / 1024).toFixed(2)}MB</span>
                )}
              </div>
            )}
          </div>

          {/* 에러 메시지 */}
          {results.error && (
            <div className="mb-4">
              <h3 className="font-medium text-red-700 mb-2">❌ 오류 메시지</h3>
              <pre className="bg-red-50 border border-red-200 rounded p-3 text-sm font-mono text-red-800 whitespace-pre-wrap overflow-x-auto">
                {results.error}
              </pre>
            </div>
          )}

          {/* 출력 결과 */}
          {results.output && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">📤 출력 결과</h3>
              <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                {results.output}
              </pre>
            </div>
          )}

          {/* 테스트 케이스별 결과 */}
          {results.testResults && results.testResults.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-3">🧪 테스트 케이스 결과</h3>
              <div className="space-y-3">
                {results.testResults.map((testResult, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-lg overflow-hidden ${
                      testResult.passed ? 'border-green-200' : 'border-red-200'
                    }`}
                  >
                    <div className={`px-4 py-2 flex items-center justify-between ${
                      testResult.passed ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <span className={`font-medium ${
                        testResult.passed ? 'text-green-800' : 'text-red-800'
                      }`}>
                        테스트 케이스 {index + 1} {testResult.passed ? '✅' : '❌'}
                      </span>
                      {testResult.executionTime && (
                        <span className="text-sm text-gray-600">
                          {testResult.executionTime}ms
                        </span>
                      )}
                    </div>
                    
                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">입력</h4>
                        <pre className="bg-gray-50 p-2 rounded text-xs font-mono whitespace-pre-wrap">
                          {testResult.input}
                        </pre>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">기대 출력</h4>
                          <pre className="bg-gray-50 p-2 rounded text-xs font-mono whitespace-pre-wrap">
                            {testResult.expectedOutput}
                          </pre>
                        </div>
                        <div>
                          <h4 className={`text-sm font-medium mb-1 ${
                            testResult.passed ? 'text-green-700' : 'text-red-700'
                          }`}>
                            실제 출력
                          </h4>
                          <pre className={`p-2 rounded text-xs font-mono whitespace-pre-wrap ${
                            testResult.passed ? 'bg-green-50' : 'bg-red-50'
                          }`}>
                            {testResult.actualOutput}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 제출 기록 */}
      {submissions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">제출 기록</h2>
          <div className="space-y-3">
            {submissions.map((submission, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      submission.verdict === 'Accepted' ? 'bg-green-100 text-green-700' :
                      submission.verdict === 'Wrong Answer' ? 'bg-red-100 text-red-700' :
                      submission.verdict === 'Time Limit Exceeded' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {submission.verdict}
                    </span>
                    <span className="text-sm text-gray-600">
                      점수: {submission.score}/100
                    </span>
                    <span className="text-sm text-gray-600">
                      언어: {submission.language}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(submission.submittedAt).toLocaleString()}
                  </span>
                </div>
                
                {submission.result.testResults && (
                  <div className="text-sm text-gray-600">
                    테스트 통과: {submission.result.passedTests}/{submission.result.totalTests}
                    {submission.result.executionTime && ` • 실행시간: ${submission.result.executionTime}ms`}
                  </div>
                )}

                {submission.result.error && (
                  <div className="mt-2">
                    <details className="cursor-pointer">
                      <summary className="text-sm text-red-600 font-medium">오류 메시지 보기</summary>
                      <pre className="mt-2 bg-red-50 border border-red-200 rounded p-2 text-xs font-mono text-red-800 whitespace-pre-wrap">
                        {submission.result.error}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 통계 요약 */}
      {submissions.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-2">📈 통계</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">총 제출</span>
              <div className="font-bold text-lg">{submissions.length}</div>
            </div>
            <div>
              <span className="text-gray-600">정답</span>
              <div className="font-bold text-lg text-green-600">
                {submissions.filter(s => s.verdict === 'Accepted').length}
              </div>
            </div>
            <div>
              <span className="text-gray-600">최고 점수</span>
              <div className="font-bold text-lg text-blue-600">
                {Math.max(...submissions.map(s => s.score), 0)}
              </div>
            </div>
            <div>
              <span className="text-gray-600">성공률</span>
              <div className="font-bold text-lg">
                {submissions.length > 0 
                  ? Math.round((submissions.filter(s => s.verdict === 'Accepted').length / submissions.length) * 100)
                  : 0}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
