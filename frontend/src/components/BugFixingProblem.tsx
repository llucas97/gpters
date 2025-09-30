import React, { useRef } from 'react';
import CodeEditor from './Editor';
import type { editor } from 'monaco-editor';

// CSS 파일에 아래 스타일을 추가해주세요.
// .bug-hint-line { background-color: rgba(255, 200, 0, 0.1); }
// .bug-hint-line::before { content: '🐞'; margin-right: 5px; }

const BugFixingProblem = ({ problemData }) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorMount = (editorInstance: editor.IStandaloneCodeEditor, monaco: any) => {
    editorRef.current = editorInstance;
    const model = editorInstance.getModel();
    if (!model) return;

    // 1. 버그가 있는 라인에 시각적 힌트(Decoration) 추가
    editorInstance.createDecorationsCollection([
      {
        range: new monaco.Range(problemData.buggyLineNumber, 1, problemData.buggyLineNumber, 1),
        options: {
          isWholeLine: true,
          className: 'bug-hint-line', // CSS 클래스를 이용해 스타일링
        },
      },
    ]);
  };
  
  const handleSubmit = () => {
    if (editorRef.current) {
      // 수정된 전체 코드를 문자열로 가져옵니다.
      const modifiedCode = editorRef.current.getValue();
      console.log('제출할 코드:', modifiedCode);
      // 이 modifiedCode를 서버로 보내 테스트 케이스 기반으로 검증합니다.
    }
  };

  return (
    <div>
      <p>💡 코드의 버그를 찾아 직접 수정해주세요.</p>
      <CodeEditor initialCode={problemData.buggyCode} onMount={handleEditorMount} />
      <button onClick={handleSubmit}>제출</button>
    </div>
  );
};

export default BugFixingProblem;
