// frontend/src/components/ClozeTest/BlankInput.tsx
import React from 'react';

interface BlankInputProps {
  blank: {
    id: number;
    hint?: string;
    answer?: string;
  };
  value: string;
  onChange: (value: string) => void;
  isSubmitted: boolean;
  correctAnswer?: string;
  index: number;
}

export default function BlankInput({
  blank,
  value,
  onChange,
  isSubmitted,
  correctAnswer,
  index
}: BlankInputProps) {
  return (
    <div className="blank-input p-4 border rounded-lg bg-white">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-700">
          빈칸 {index + 1}
        </span>
        {blank.hint && (
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
            💡 {blank.hint}
          </span>
        )}
      </div>
      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`빈칸 ${index + 1}에 답을 입력하세요`}
        disabled={isSubmitted}
        className={`w-full px-3 py-2 border rounded-md text-sm transition-colors ${
          isSubmitted
            ? value === correctAnswer
              ? 'border-green-500 bg-green-50 text-green-800'
              : 'border-red-500 bg-red-50 text-red-800'
            : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
        }`}
      />
      
      {isSubmitted && (
        <div className="mt-2 text-xs">
          {value === correctAnswer ? (
            <span className="text-green-600 font-medium">✅ 정답입니다!</span>
          ) : (
            <div className="text-red-600">
              <span className="font-medium">❌ 틀렸습니다</span>
              {correctAnswer && (
                <div className="mt-1">
                  정답: <span className="font-mono bg-gray-100 px-1 rounded">{correctAnswer}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}