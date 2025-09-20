// frontend/src/components/BlockCoding/BlockCodingInterface.tsx
import { useState, useEffect } from 'react';
import { BlockType } from './types.ts';

interface BlockCodingInterfaceProps {
  problem: {
    id: string;
    title: string;
    statement: string;
    examples?: Array<{ input: string; output: string; explanation?: string }>;
    level?: number;
    topic?: string;
  };
  onSubmit: (result: any) => void;
}

// 알고리즘 블록 정의 (Hello 3번 출력 문제용)
const ALGORITHM_BLOCKS = [
  {
    id: 'block1',
    type: 'step' as BlockType,
    content: '1. 변수 count = 3으로 초기화',
    code: 'count = 3',
    order: 1
  },
  {
    id: 'block2', 
    type: 'step' as BlockType,
    content: '2. count만큼 반복 시작',
    code: 'for i in range(count):',
    order: 2
  },
  {
    id: 'block3',
    type: 'step' as BlockType, 
    content: '3. "Hello" 출력',
    code: '    print("Hello")',
    order: 3
  },
  {
    id: 'block4',
    type: 'step' as BlockType,
    content: '4. 반복 종료',
    code: '# 반복 완료',
    order: 4
  }
];

// 올바른 순서
const CORRECT_ORDER = [1, 2, 3, 4];

export default function BlockCodingInterface({ 
  problem, 
  onSubmit
}: BlockCodingInterfaceProps) {
  const [availableBlocks, setAvailableBlocks] = useState(ALGORITHM_BLOCKS);
  const [droppedBlocks, setDroppedBlocks] = useState<any[]>([]);
  const [draggedBlock, setDraggedBlock] = useState<any>(null);
  const [isComplete, setIsComplete] = useState(false);

  // 드래그 시작
  const handleDragStart = (e: React.DragEvent, block: any) => {
    setDraggedBlock(block);
    e.dataTransfer.effectAllowed = 'move';
  };

  // 드래그 오버 (드롭 영역에서)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // 드롭 (알고리즘 영역에)
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (!draggedBlock) return;

    // 이미 배치된 블록이 있으면 교체
    const newDroppedBlocks = [...droppedBlocks];
    const newAvailableBlocks = [...availableBlocks];

    // 기존에 그 자리에 있던 블록을 사용가능 블록으로 되돌림
    if (newDroppedBlocks[dropIndex]) {
      newAvailableBlocks.push(newDroppedBlocks[dropIndex]);
    }

    // 새 블록을 드롭 영역에 배치
    newDroppedBlocks[dropIndex] = draggedBlock;

    // 사용가능 블록에서 제거
    const draggedIndex = newAvailableBlocks.findIndex(b => b.id === draggedBlock.id);
    if (draggedIndex > -1) {
      newAvailableBlocks.splice(draggedIndex, 1);
    }

    setDroppedBlocks(newDroppedBlocks);
    setAvailableBlocks(newAvailableBlocks);
    setDraggedBlock(null);
  };

  // 블록을 사용가능 영역으로 되돌리기
  const handleRemoveBlock = (index: number) => {
    const blockToRemove = droppedBlocks[index];
    if (!blockToRemove) return;

    const newDroppedBlocks = [...droppedBlocks];
    const newAvailableBlocks = [...availableBlocks];

    newDroppedBlocks[index] = null;
    newAvailableBlocks.push(blockToRemove);

    setDroppedBlocks(newDroppedBlocks);
    setAvailableBlocks(newAvailableBlocks);
  };

  // 완성도 체크
  useEffect(() => {
    const placedOrder = droppedBlocks
      .filter(block => block !== null)
      .map(block => block?.order)
      .filter(order => order !== undefined);
    
    const isCorrect = placedOrder.length === 4 && 
      placedOrder.every((order, index) => order === CORRECT_ORDER[index]);
    
    setIsComplete(isCorrect);
  }, [droppedBlocks]);

  // 제출
  const handleSubmit = () => {
    const generatedCode = droppedBlocks
      .filter(block => block !== null)
      .map(block => block?.code)
      .join('\n');

    const result = {
      blocks: droppedBlocks.filter(block => block !== null),
      generatedCode,
      isComplete,
      isCorrect: isComplete,
      score: isComplete ? 100 : Math.round((droppedBlocks.filter(b => b !== null).length / 4) * 100)
    };
    
    onSubmit(result);
  };

  return (
    <div className="block-coding-interface h-screen flex flex-col bg-gray-50">
      {/* 1. 문제 전문 */}
      <div className="problem-section bg-white p-6 border-b shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-gray-800">{problem.title}</h2>
        <div className="text-gray-700 whitespace-pre-wrap mb-4">{problem.statement}</div>
        {problem.examples && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2 text-gray-800">예시:</h3>
            {problem.examples.map((example, index) => (
              <div key={index} className="mb-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div><strong className="text-blue-800">입력:</strong> <code className="bg-white px-2 py-1 rounded">{example.input}</code></div>
                <div className="mt-1"><strong className="text-blue-800">출력:</strong> <code className="bg-white px-2 py-1 rounded">{example.output}</code></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. 알고리즘 완성 영역 */}
      <div className="algorithm-section bg-gradient-to-r from-purple-50 to-blue-50 p-6 border-b">
        <h3 className="font-bold text-lg mb-4 text-gray-800">🧩 알고리즘 완성하기</h3>
        <p className="text-sm text-gray-600 mb-4">아래 블록들을 올바른 순서로 드래그해서 배치하세요</p>
        
        <div className="algorithm-slots grid grid-cols-1 gap-3 max-w-2xl">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`
                drop-zone min-h-16 p-4 border-2 border-dashed rounded-lg transition-all
                ${droppedBlocks[index] 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                }
              `}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              {droppedBlocks[index] ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{droppedBlocks[index].content}</div>
                      <div className="text-xs text-gray-500 font-mono">{droppedBlocks[index].code}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveBlock(index)}
                    className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs transition-colors"
                    title="블록 제거"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-gray-400">
                  <div className="w-8 h-8 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center text-sm">
                    {index + 1}
                  </div>
                  <div className="text-sm">여기에 블록을 드래그하세요</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 완성도 표시 */}
        <div className="mt-4 flex items-center gap-4">
          <div className="text-sm text-gray-600">
            완성도: <span className="font-bold">{droppedBlocks.filter(b => b !== null).length}/4</span>
          </div>
          {isComplete && (
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <span>✅</span>
              <span>알고리즘 완성!</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. 사용 가능한 블록들 */}
      <div className="flex-1 bg-white p-6">
        <h3 className="font-bold text-lg mb-4 text-gray-800">📦 사용 가능한 블록들</h3>
        <div className="blocks-container grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableBlocks.map((block) => (
            <div
              key={block.id}
              draggable
              onDragStart={(e) => handleDragStart(e, block)}
              className="algorithm-block p-4 bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 rounded-lg cursor-move hover:shadow-lg hover:scale-105 transition-all duration-200 active:scale-95 select-none"
              style={{
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {block.order}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{block.content}</div>
                  <div className="text-xs text-gray-500 font-mono mt-1">{block.code}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {availableBlocks.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <div className="text-4xl mb-2">🎉</div>
            <p>모든 블록이 배치되었습니다!</p>
          </div>
        )}
      </div>

      {/* 4. 제출 버튼 */}
      <div className="submit-section bg-white p-4 border-t shadow-sm">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            배치된 블록: {droppedBlocks.filter(b => b !== null).length}/4개
            {isComplete && (
              <span className="ml-2 text-green-600 font-medium">✅ 완성!</span>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={droppedBlocks.filter(b => b !== null).length === 0}
            className={`px-6 py-2 rounded transition-colors ${
              isComplete 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed'
            }`}
          >
            {isComplete ? '완성된 알고리즘 제출' : '제출'}
          </button>
        </div>
      </div>
    </div>
  );
}