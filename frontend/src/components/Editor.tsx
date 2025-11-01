import React from 'react';
import Editor, { OnMount } from '@monaco-editor/react';

interface CodeEditorProps {
  initialCode: string;
  onMount?: OnMount; // 에디터 인스턴스에 접근하기 위한 prop
}

const CodeEditor: React.FC<CodeEditorProps> = ({ initialCode, onMount }) => {
  return (
    <Editor
      height="400px"
      language="javascript"
      theme="vs-dark"
      value={initialCode}
      onMount={onMount}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
      }}
    />
  );
};

export default CodeEditor;
