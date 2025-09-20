// frontend/src/components/CodeEditor/SettingsPanel.tsx
import React from 'react';
import { CodeEditorSettings } from './types';

interface SettingsPanelProps {
  settings: CodeEditorSettings;
  onSettingsChange: (newSettings: Partial<CodeEditorSettings>) => void;
  onClose: () => void;
}

export default function SettingsPanel({
  settings,
  onSettingsChange,
  onClose
}: SettingsPanelProps) {
  const handleChange = (key: keyof CodeEditorSettings, value: any) => {
    onSettingsChange({ [key]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">에디터 설정</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* 테마 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              테마
            </label>
            <select
              value={settings.theme}
              onChange={(e) => handleChange('theme', e.target.value as 'light' | 'dark' | 'high-contrast')}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="light">밝은 테마</option>
              <option value="dark">어두운 테마</option>
              <option value="high-contrast">고대비 테마</option>
            </select>
          </div>

          {/* 폰트 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              폰트 크기
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="10"
                max="24"
                value={settings.fontSize}
                onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-8">{settings.fontSize}px</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              폰트 패밀리
            </label>
            <select
              value={settings.fontFamily}
              onChange={(e) => handleChange('fontFamily', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="Consolas, 'Courier New', monospace">Consolas</option>
              <option value="'Fira Code', monospace">Fira Code</option>
              <option value="'Source Code Pro', monospace">Source Code Pro</option>
              <option value="Monaco, monospace">Monaco</option>
              <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
            </select>
          </div>

          {/* 들여쓰기 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              탭 크기
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="2"
                max="8"
                value={settings.tabSize}
                onChange={(e) => handleChange('tabSize', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-8">{settings.tabSize}</span>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.insertSpaces}
                onChange={(e) => handleChange('insertSpaces', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                탭 대신 스페이스 사용
              </span>
            </label>
          </div>

          {/* 에디터 표시 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              줄 번호
            </label>
            <select
              value={settings.lineNumbers}
              onChange={(e) => handleChange('lineNumbers', e.target.value as 'on' | 'off' | 'relative' | 'interval')}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="on">켜기</option>
              <option value="off">끄기</option>
              <option value="relative">상대 번호</option>
              <option value="interval">간격 표시</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              줄 바꿈
            </label>
            <select
              value={settings.wordWrap}
              onChange={(e) => handleChange('wordWrap', e.target.value as 'on' | 'off' | 'wordWrapColumn' | 'bounded')}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="on">켜기</option>
              <option value="off">끄기</option>
              <option value="wordWrapColumn">컬럼 기준</option>
              <option value="bounded">경계 기준</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              공백 문자 표시
            </label>
            <select
              value={settings.renderWhitespace}
              onChange={(e) => handleChange('renderWhitespace', e.target.value as 'none' | 'boundary' | 'selection' | 'trailing' | 'all')}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="none">숨기기</option>
              <option value="boundary">경계만</option>
              <option value="selection">선택 영역</option>
              <option value="trailing">끝 공백</option>
              <option value="all">모두 표시</option>
            </select>
          </div>

          {/* 기능 설정 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">에디터 기능</h3>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.minimap}
                onChange={(e) => handleChange('minimap', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">미니맵 표시</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.autoComplete}
                onChange={(e) => handleChange('autoComplete', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">자동완성</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.bracketMatching}
                onChange={(e) => handleChange('bracketMatching', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">괄호 매칭</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.folding}
                onChange={(e) => handleChange('folding', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">코드 접기</span>
            </label>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={() => {
              // 기본값으로 리셋
              onSettingsChange({
                theme: 'dark',
                fontSize: 14,
                fontFamily: 'Consolas, "Courier New", monospace',
                tabSize: 4,
                insertSpaces: true,
                wordWrap: 'on',
                minimap: true,
                lineNumbers: 'on',
                autoComplete: true,
                bracketMatching: true,
                folding: true,
                renderWhitespace: 'boundary'
              });
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            기본값으로 리셋
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
}
