// frontend/src/components/CodeEditor/CodeEditorInterface.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { CodeEditorProblem } from './types';
import { SUPPORTED_LANGUAGES, DEFAULT_EDITOR_SETTINGS, getLanguageById } from './languageConfig';

interface CodeEditorInterfaceProps {
  problem: CodeEditorProblem;
  onSubmit: (result: any) => void;
  onRun?: (result: any) => void;
  initialCode?: string;
  language?: string;
  userSettings?: any;
}

export default function CodeEditorInterface({
  problem,
  onSubmit,
  onRun,
  initialCode = '',
  language = 'python',
  userSettings = {}
}: CodeEditorInterfaceProps) {
  const [code, setCode] = useState(initialCode);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [settings] = useState({ ...DEFAULT_EDITOR_SETTINGS, ...userSettings });
  const editorRef = useRef<any>(null);

  // 언어 변경시 기본 코드 설정
  useEffect(() => {
    const selectedLang = getLanguageById(selectedLanguage);
    if (selectedLang && !initialCode) {
      setCode(selectedLang.defaultCode);
    } else if (initialCode) {
      setCode(initialCode);
    }
  }, [selectedLanguage, initialCode]);

  // 에디터 마운트
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // 언어별 설정
    const langConfig = getLanguageById(selectedLanguage);
    if (langConfig) {
      monaco.languages.setLanguageConfiguration(selectedLanguage, langConfig.configuration);
    }
  };

  // 코드 실행
  const handleRun = useCallback(async () => {
    if (!code.trim()) return;

    setIsRunning(true);
    try {
      const response = await fetch('/api/code-editor/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: selectedLanguage,
          testCases: problem.testCases || []
        })
      });

      const result = await response.json();
      setResults(result);
      
      if (onRun) {
        onRun(result);
      }
    } catch (error) {
      console.error('코드 실행 오류:', error);
      setResults({
        success: false,
        error: '코드 실행 중 오류가 발생했습니다.'
      });
    } finally {
      setIsRunning(false);
    }
  }, [code, selectedLanguage, problem.testCases, onRun]);

  // 제출
  const handleSubmit = useCallback(async () => {
    if (!code.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/code-editor/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: selectedLanguage,
          problemId: problem.id
        })
      });

      const result = await response.json();
      
      const submitResult = {
        code,
        language: selectedLanguage,
        result,
        timestamp: new Date().toISOString()
      };

      onSubmit(submitResult);
    } catch (error) {
      console.error('제출 오류:', error);
      onSubmit({
        code,
        language: selectedLanguage,
        result: { success: false, error: '제출 중 오류가 발생했습니다.' },
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [code, selectedLanguage, problem.id, onSubmit]);

  return (
    <div className="code-editor-interface h-screen flex flex-col bg-gray-50">
      {/* 1. 문제 전문 */}
      <div className="problem-section bg-white p-6 border-b">
        <h2 className="text-xl font-bold mb-4">{problem.title}</h2>
        <div className="text-gray-700 whitespace-pre-wrap">{problem.statement}</div>
        {problem.examples && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">예시:</h3>
            {problem.examples.map((example, index) => (
              <div key={index} className="mb-2 p-3 bg-gray-100 rounded">
                <div><strong>입력:</strong> {example.input}</div>
                <div><strong>출력:</strong> {example.output}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. 알고리즘 (빈칸 없음) */}
      <div className="algorithm-section bg-blue-50 p-4 border-b">
        <h3 className="font-semibold mb-2">알고리즘</h3>
        <div className="bg-white p-4 rounded border font-mono text-sm">
          <div className="mb-2">1. 입력값 받기</div>
          <div className="mb-2">2. 조건 확인</div>
          <div className="mb-2">3. 연산 수행</div>
          <div className="mb-2">4. 결과 출력</div>
        </div>
      </div>

      {/* 3. 텍스트 에디터 */}
      <div className="flex-1 flex flex-col">
        {/* 언어 선택 및 실행 버튼 */}
        <div className="bg-white border-b p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleRun}
            disabled={!code.trim() || isRunning}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
          >
            {isRunning ? '실행 중...' : '실행'}
          </button>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1">
          <Editor
            height="100%"
            language={selectedLanguage}
            value={code}
            onChange={(value) => setCode(value || '')}
            onMount={handleEditorDidMount}
            options={{
              fontSize: settings.fontSize,
              tabSize: settings.tabSize,
              wordWrap: settings.wordWrap ? 'on' : 'off',
              minimap: { enabled: settings.showMinimap },
              lineNumbers: settings.showLineNumbers ? 'on' : 'off',
              automaticLayout: true,
              theme: settings.theme || 'vs-light'
            }}
          />
        </div>

        {/* 실행 결과 */}
        {results && (
          <div className="bg-white border-t p-4 max-h-48 overflow-y-auto">
            <h4 className="font-semibold mb-2">실행 결과:</h4>
            <pre className="text-sm bg-gray-100 p-3 rounded">
              {results.success ? results.output : results.error}
            </pre>
          </div>
        )}
      </div>

      {/* 4. 제출 버튼 */}
      <div className="submit-section bg-white p-4 border-t">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            언어: {getLanguageById(selectedLanguage)?.name}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!code.trim() || isSubmitting}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '제출 중...' : '제출'}
          </button>
        </div>
      </div>
    </div>
  );
}