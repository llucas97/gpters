// frontend/src/components/CodeEditor/LanguageSelector.tsx
import React from 'react';
import { LanguageConfig } from './types';

interface LanguageSelectorProps {
  languages: LanguageConfig[];
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

export default function LanguageSelector({
  languages,
  selectedLanguage,
  onLanguageChange
}: LanguageSelectorProps) {
  const selectedLangConfig = languages.find(lang => lang.id === selectedLanguage);

  return (
    <div className="relative">
      <select
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {languages.map((language) => (
          <option key={language.id} value={language.id}>
            {language.name}
          </option>
        ))}
      </select>
      
      {/* 커스텀 드롭다운 화살표 */}
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* 선택된 언어 정보 툴팁 */}
      {selectedLangConfig && (
        <div className="absolute top-full left-0 mt-1 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
          {selectedLangConfig.name} ({selectedLangConfig.extension})
        </div>
      )}
    </div>
  );
}
