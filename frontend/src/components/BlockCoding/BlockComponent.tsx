// frontend/src/components/BlockCoding/BlockComponent.tsx
import React from 'react';
import { Block } from './types.ts';

interface BlockComponentProps {
  block: Block;
  onRemove: () => void;
  onDataChange: (field: string, value: any) => void;
  isDragging: boolean;
}

export default function BlockComponent({
  block,
  onRemove,
  onDataChange,
  isDragging
}: BlockComponentProps) {

  const getBlockStyle = (type: string) => {
    switch (type) {
      case 'start':
        return {
          color: 'bg-gradient-to-r from-green-400 to-green-600',
          shape: 'rounded-full',
          icon: '🚀',
          label: '시작'
        };
      case 'for':
        return {
          color: 'bg-gradient-to-r from-orange-400 to-orange-600',
          shape: 'rounded-lg',
          icon: '🔄',
          label: '반복하기'
        };
      case 'print':
        return {
          color: 'bg-gradient-to-r from-blue-400 to-blue-600',
          shape: 'rounded-lg',
          icon: '💬',
          label: '출력하기'
        };
      case 'variable':
        return {
          color: 'bg-gradient-to-r from-purple-400 to-purple-600',
          shape: 'rounded-lg',
          icon: '📦',
          label: '변수'
        };
      case 'input':
        return {
          color: 'bg-gradient-to-r from-teal-400 to-teal-600',
          shape: 'rounded-lg',
          icon: '⌨️',
          label: '입력받기'
        };
      case 'number':
        return {
          color: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
          shape: 'rounded-full',
          icon: '🔢',
          label: '숫자'
        };
      default:
        return {
          color: 'bg-gradient-to-r from-gray-400 to-gray-600',
          shape: 'rounded-lg',
          icon: '🧩',
          label: type
        };
    }
  };

  const blockStyle = getBlockStyle(block.type);

  const renderBlockContent = () => {
    switch (block.type) {
      case 'start':
        return (
          <div className="text-center">
            <div className="text-lg font-bold">프로그램 시작</div>
          </div>
        );

      case 'for':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">반복:</span>
              <input
                type="number"
                value={block.data.count || 3}
                onChange={(e) => onDataChange('count', parseInt(e.target.value) || 1)}
                min="1"
                max="100"
                className="w-16 px-2 py-1 text-black rounded border text-center font-bold"
              />
              <span>번</span>
            </div>
            <div className="text-xs opacity-80">아래 블록들을 반복 실행</div>
          </div>
        );

      case 'print':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">출력:</span>
              <input
                type="text"
                value={block.data.text || 'Hello'}
                onChange={(e) => onDataChange('text', e.target.value)}
                placeholder="출력할 내용"
                className="flex-1 px-2 py-1 text-black rounded border"
              />
            </div>
            <div className="text-xs opacity-80">화면에 텍스트 출력</div>
          </div>
        );

      case 'variable':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={block.data.name || 'count'}
                onChange={(e) => onDataChange('name', e.target.value)}
                placeholder="변수명"
                className="w-20 px-2 py-1 text-black rounded border font-mono"
              />
              <span>=</span>
              <input
                type="text"
                value={block.data.value || '0'}
                onChange={(e) => onDataChange('value', e.target.value)}
                placeholder="값"
                className="w-20 px-2 py-1 text-black rounded border"
              />
            </div>
            <div className="text-xs opacity-80">변수에 값 저장</div>
          </div>
        );

      case 'input':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">입력:</span>
              <input
                type="text"
                value={block.data.variable || 'number'}
                onChange={(e) => onDataChange('variable', e.target.value)}
                placeholder="변수명"
                className="flex-1 px-2 py-1 text-black rounded border font-mono"
              />
            </div>
            <div className="text-xs opacity-80">사용자에게 입력 받기</div>
          </div>
        );

      case 'number':
        return (
          <div className="text-center">
            <input
              type="number"
              value={block.data.value || 0}
              onChange={(e) => onDataChange('value', parseInt(e.target.value) || 0)}
              className="w-20 px-2 py-1 text-black rounded border text-center font-bold text-lg"
            />
          </div>
        );

      default:
        return <span className="text-sm font-medium">{blockStyle.label}</span>;
    }
  };

  // 연결 소켓 (위, 아래)
  const hasTopSocket = !['start'].includes(block.type);
  const hasBottomSocket = !['number'].includes(block.type);

  return (
    <div className="relative">
      {/* 상단 연결 소켓 */}
      {hasTopSocket && (
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
          <div className="w-4 h-4 bg-white rounded-full border-2 border-gray-300 shadow-sm"></div>
        </div>
      )}

      {/* 메인 블록 */}
      <div
        className={`
          relative min-w-48 p-4 text-white font-medium shadow-lg
          ${blockStyle.color} ${blockStyle.shape}
          ${isDragging ? 'opacity-70 scale-95' : 'hover:scale-105'} 
          cursor-move transition-all duration-200 select-none
          border-2 border-white/30
        `}
      >
        {/* 삭제 버튼 */}
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold shadow-md transition-colors"
          title="블록 삭제"
        >
          ×
        </button>

        {/* 블록 헤더 */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{blockStyle.icon}</span>
          <span className="font-bold">{blockStyle.label}</span>
        </div>

        {/* 블록 내용 */}
        <div>
          {renderBlockContent()}
        </div>

        {/* 내부 연결 영역 (for, if 등) */}
        {['for', 'if'].includes(block.type) && (
          <div className="mt-3 p-2 bg-black/20 rounded border-dashed border-2 border-white/30 min-h-12">
            <div className="text-xs text-center text-white/70">
              여기에 블록을 넣으세요
            </div>
          </div>
        )}
      </div>

      {/* 하단 연결 소켓 */}
      {hasBottomSocket && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="w-4 h-4 bg-white rounded-full border-2 border-gray-300 shadow-sm"></div>
        </div>
      )}
    </div>
  );
}