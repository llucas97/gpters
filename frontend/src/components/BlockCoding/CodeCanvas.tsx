// frontend/src/components/BlockCoding/CodeCanvas.tsx
import React from 'react';
import { Block } from './types.ts';
import BlockComponent from './BlockComponent.tsx';

interface CodeCanvasProps {
  blocks: Block[];
  onBlockMove: (blockId: string, newPosition: { x: number; y: number }) => void;
  onBlockConnect: (parentId: string, childId: string, connectionType: 'next' | 'child') => void;
  onBlockRemove: (blockId: string) => void;
  onBlockDataUpdate: (blockId: string, newData: any) => void;
}

export default function CodeCanvas({ 
  blocks, 
  onBlockMove, 
  onBlockConnect, 
  onBlockRemove, 
  onBlockDataUpdate 
}: CodeCanvasProps) {

  const handleBlockDrag = (blockId: string, e: React.MouseEvent) => {
    e.preventDefault();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const block = blocks.find(b => b.id === blockId);
    
    if (!block) return;
    
    const startPosX = block.position.x;
    const startPosY = block.position.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      onBlockMove(blockId, {
        x: Math.max(0, startPosX + deltaX),
        y: Math.max(0, startPosY + deltaY)
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 시작 블록이 있는지 확인
  const hasStartBlock = blocks.some(block => block.type === 'start');

  return (
    <div className="code-canvas relative h-full bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
      {/* 로블록스 스타일 격자 배경 */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #64748b 1px, transparent 1px),
            linear-gradient(to bottom, #64748b 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px'
        }}
      />
      
      {/* 중앙 시작 영역 표시 */}
      <div className="absolute top-10 left-1/2 transform -translate-x-1/2">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border-2 border-dashed border-green-400 shadow-lg">
          <div className="text-center">
            <div className="text-2xl mb-2">🚀</div>
            <div className="font-bold text-gray-700">시작 영역</div>
            <div className="text-sm text-gray-500">여기서 프로그램을 시작하세요</div>
          </div>
        </div>
      </div>

      {/* 안내 메시지 */}
      {blocks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl max-w-md">
            <div className="text-6xl mb-4">🧩</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">블록으로 코딩해보세요!</h2>
            <p className="text-gray-600 mb-4">왼쪽 도구상자에서 블록을 클릭하여 추가하세요</p>
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
              <div className="font-semibold mb-1">💡 이 문제의 해답:</div>
              <div>1. 🚀 시작 → 2. 🔄 3번 반복 → 3. 💬 "Hello" 출력</div>
            </div>
          </div>
        </div>
      )}

      {/* 시작 블록이 없을 때 안내 */}
      {blocks.length > 0 && !hasStartBlock && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <span>⚠️</span>
              <span className="font-semibold">시작 블록을 추가하세요!</span>
            </div>
          </div>
        </div>
      )}

      {/* 블록들 렌더링 */}
      {blocks.map((block) => (
        <div
          key={block.id}
          className="absolute"
          style={{
            left: block.position.x,
            top: block.position.y,
            zIndex: block.type === 'start' ? 20 : 10
          }}
          onMouseDown={(e) => handleBlockDrag(block.id, e)}
        >
          <BlockComponent
            block={block}
            onRemove={() => onBlockRemove(block.id)}
            onDataChange={(field, value) => {
              onBlockDataUpdate(block.id, { [field]: value });
            }}
            isDragging={false}
          />
        </div>
      ))}
      
      {/* 상태 표시 패널 */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 min-w-48">
        <h4 className="font-bold text-gray-800 mb-2">📊 프로그램 상태</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">블록 개수:</span>
            <span className="font-bold text-blue-600">{blocks.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">시작 블록:</span>
            <span className={`font-bold ${hasStartBlock ? 'text-green-600' : 'text-red-600'}`}>
              {hasStartBlock ? '✅ 있음' : '❌ 없음'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">실행 가능:</span>
            <span className={`font-bold ${hasStartBlock && blocks.length > 1 ? 'text-green-600' : 'text-orange-600'}`}>
              {hasStartBlock && blocks.length > 1 ? '✅ 가능' : '⚠️ 블록 부족'}
            </span>
          </div>
        </div>
      </div>

      {/* 미니맵 (선택사항) */}
      <div className="absolute top-4 right-4 w-32 h-24 bg-white/70 backdrop-blur-sm rounded-lg border border-gray-300 p-2">
        <div className="text-xs font-semibold text-gray-600 mb-1">미니맵</div>
        <div className="relative w-full h-full bg-gray-100 rounded">
          {blocks.map((block) => (
            <div
              key={block.id}
              className={`absolute w-2 h-2 rounded-sm ${
                block.type === 'start' ? 'bg-green-500' :
                block.type === 'for' ? 'bg-orange-500' :
                block.type === 'print' ? 'bg-blue-500' : 'bg-gray-500'
              }`}
              style={{
                left: `${(block.position.x / 800) * 100}%`,
                top: `${(block.position.y / 600) * 100}%`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}