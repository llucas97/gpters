import React, { useRef } from 'react';
import CodeEditor from './Editor';
import type { editor } from 'monaco-editor';

const CodeOrderingProblem = ({ problemData }) => {
  // 에디터 인스턴스를 저장하기 위한 ref
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // onMount 핸들러: 에디터가 마운트될 때 호출됩니다.
  const handleEditorMount = (editorInstance: editor.IStandaloneCodeEditor, monaco: any) => {
    editorRef.current = editorInstance;

    // 1. 에디터를 읽기 전용으로 설정
    editorInstance.updateOptions({ readOnly: true });

    // 2. Alt + 방향키로 라인을 옮기는 액션 추가
    editorInstance.addAction({
      id: 'move-line',
      label: 'Move Line Up/Down',
      keybindings: [
        monaco.KeyMod.Alt | monaco.KeyCode.UpArrow,
        monaco.KeyMod.Alt | monaco.KeyCode.DownArrow,
      ],
      run: (ed, ...args) => {
        const isUp = args[0]?.action?.id.includes('Up');
        const position = ed.getPosition();
        if (!position) return;

        const model = ed.getModel();
        if (!model) return;

        const currentLine = position.lineNumber;
        const targetLine = isUp ? currentLine - 1 : currentLine + 1;

        if (targetLine < 1 || targetLine > model.getLineCount()) {
          return;
        }

        const currentLineContent = model.getLineContent(currentLine);
        const targetLineContent = model.getLineContent(targetLine);

        // 두 라인의 내용을 바꾸는 '수정(edit)' 작업을 실행합니다.
        ed.executeEdits('line-swapper', [
          {
            range: new monaco.Range(currentLine, 1, currentLine, model.getLineMaxColumn(currentLine)),
            text: targetLineContent,
          },
          {
            range: new monaco.Range(targetLine, 1, targetLine, model.getLineMaxColumn(targetLine)),
            text: currentLineContent,
          },
        ]);

        // 커서를 옮겨진 라인으로 이동
        ed.setPosition({ lineNumber: targetLine, column: position.column });
      },
    });
  };

  const handleSubmit = () => {
    if (editorRef.current) {
      // 현재 에디터의 코드를 라인별 배열로 가져옵니다.
      const answerLines = editorRef.current.getModel().getLinesContent();
      console.log('제출할 답안:', answerLines);
      // 이 answerLines를 서버로 보내 검증합니다.
    }
  };
  
  // 백엔드에서 미리 섞어서 보내준 코드 라인들을 줄바꿈 문자로 합쳐서 초기 코드로 사용
  const initialShuffledCode = problemData.shuffledLines.join('\n');

  return (
    <div>
      <p>💡 Alt + ↑/↓ 키를 사용해 코드의 순서를 맞춰주세요.</p>
      <CodeEditor initialCode={initialShuffledCode} onMount={handleEditorMount} />
      <button onClick={handleSubmit}>제출</button>
    </div>
  );
};

export default CodeOrderingProblem;
