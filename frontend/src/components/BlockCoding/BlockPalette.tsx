// frontend/src/components/BlockCoding/BlockPalette.tsx
import React from 'react';
import { BlockType } from './types.ts';

interface BlockPaletteProps {
  onBlockDrop: (blockType: BlockType, position: { x: number; y: number }) => void;
}

// 로블록스 스타일의 블록 카테고리
const ROBLOX_STYLE_BLOCKS = [
  {
    name: '제어문',
    color: 'from-orange-400 to-orange-600',
    textColor: 'text-white',
    blocks: [
      { 
        type: 'start' as BlockType, 
        label: '시작', 
        icon: '🚀', 
        color: 'bg-gradient-to-r from-green-400 to-green-600',
        description: '프로그램 시작점',
        shape: 'rounded-full'
      },
      { 
        type: 'for' as BlockType, 
        label: '반복하기', 
        icon: '🔄', 
        color: 'bg-gradient-to-r from-orange-400 to-orange-600',
        description: 'N번 반복 실행',
        shape: 'rounded-lg'
      }
    ]
  },
  {
    name: '동작',
    color: 'from-blue-400 to-blue-600',
    textColor: 'text-white',
    blocks: [
      { 
        type: 'print' as BlockType, 
        label: '출력하기', 
        icon: '💬', 
        color: 'bg-gradient-to-r from-blue-400 to-blue-600',
        description: '텍스트 출력',
        shape: 'rounded-lg'
      },
      { 
        type: 'variable' as BlockType, 
        label: '변수 설정', 
        icon: '📦', 
        color: 'bg-gradient-to-r from-purple-400 to-purple-600',
        description: '변수에 값 저장',
        shape: 'rounded-lg'
      }
    ]
  },
  {
    name: '입력',
    color: 'from-teal-400 to-teal-600',
    textColor: 'text-white',
    blocks: [
      { 
        type: 'input' as BlockType, 
        label: '입력받기', 
        icon: '⌨️', 
        color: 'bg-gradient-to-r from-teal-400 to-teal-600',
        description: '사용자 입력',
        shape: 'rounded-lg'
      },
      { 
        type: 'number' as BlockType, 
        label: '숫자', 
        icon: '🔢', 
        color: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
        description: '숫자 값',
        shape: 'rounded-full'
      }
    ]
  }
];

export default function BlockPalette({ onBlockDrop }: BlockPaletteProps) {
  
  const handleBlockClick = (blockType: BlockType) => {
    // 블록 클릭시 캔버스 중앙 근처에 추가
    const position = {
      x: 50 + Math.random() * 200,
      y: 50 + Math.random() * 150
    };
    onBlockDrop(blockType, position);
  };

  return (
    <div className="block-palette h-full bg-gradient-to-b from-gray-800 to-gray-900 text-white p-4 overflow-y-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <h3 className="font-bold text-lg text-white mb-2">🧩 블록 도구상자</h3>
        <p className="text-xs text-gray-300">블록을 클릭해서 추가하세요</p>
      </div>
      
      {ROBLOX_STYLE_BLOCKS.map((category) => (
        <div key={category.name} className="mb-6">
          {/* 카테고리 헤더 */}
          <div className={`bg-gradient-to-r ${category.color} p-3 rounded-t-lg`}>
            <h4 className={`font-bold text-sm ${category.textColor}`}>
              {category.name}
            </h4>
          </div>
          
          {/* 블록들 */}
          <div className="bg-gray-700 p-3 rounded-b-lg space-y-3">
            {category.blocks.map((block) => (
              <div
                key={block.type}
                onClick={() => handleBlockClick(block.type)}
                className={`
                  block-item p-3 ${block.color} ${block.shape} 
                  hover:scale-105 cursor-pointer transition-all duration-200 
                  shadow-lg hover:shadow-xl active:scale-95
                  border-2 border-white/20
                `}
                title={block.description}
              >
                <div className="flex items-center text-white">
                  <span className="text-xl mr-3">{block.icon}</span>
                  <div>
                    <div className="font-bold text-sm">{block.label}</div>
                    <div className="text-xs opacity-80">{block.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* 도움말 */}
      <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
        <div className="text-xs text-gray-300">
          <div className="font-semibold text-white mb-2">💡 사용법</div>
          <div className="space-y-1">
            <div>1. 🚀 시작 블록으로 시작</div>
            <div>2. 🔄 반복 블록 안에</div>
            <div>3. 💬 출력 블록 넣기</div>
          </div>
        </div>
      </div>
    </div>
  );
}