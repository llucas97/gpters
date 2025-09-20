// frontend/src/components/BlockCoding/CodePreview.tsx
import React, { useMemo, useState } from 'react';
import { Block } from './types';

interface CodePreviewProps {
  generatedCode: string;
  blocks: Block[];
  problem: {
    title: string;
    statement: string;
    examples?: Array<{ input: string; output: string; explanation?: string }>;
  };
}

export default function CodePreview({ generatedCode, blocks, problem }: CodePreviewProps) {
  const [activeTab, setActiveTab] = useState<'code' | 'problem' | 'structure'>('code');

  // 블록 구조 분석
  const blockStructure = useMemo(() => {
    const rootBlocks = blocks.filter(block => !block.connections.previous);
    
    const analyzeStructure = (block: Block, level = 0): any => {
      const children = block.connections.children.map(childId => {
        const childBlock = blocks.find(b => b.id === childId);
        return childBlock ? analyzeStructure(childBlock, level + 1) : null;
      }).filter(Boolean);

      let next = null;
      if (block.connections.next) {
        const nextBlock = blocks.find(b => b.id === block.connections.next);
        if (nextBlock) {
          next = analyzeStructure(nextBlock, level);
        }
      }

      return {
        id: block.id,
        type: block.type,
        level,
        data: block.data,
        children,
        next
      };
    };

    return rootBlocks.map(block => analyzeStructure(block));
  }, [blocks]);

  // 코드 통계
  const codeStats = useMemo(() => {
    const lines = generatedCode.split('\n').filter(line => line.trim());
    const blockCounts = blocks.reduce((acc, block) => {
      acc[block.type] = (acc[block.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalLines: lines.length,
      totalBlocks: blocks.length,
      blockCounts
    };
  }, [generatedCode, blocks]);

  // 구조 트리 렌더링
  const renderStructureTree = (structure: any[], level = 0) => {
    return (
      <div className={`${level > 0 ? 'ml-4 border-l border-gray-300 pl-4' : ''}`}>
        {structure.map((item, index) => (
          <div key={item.id || index} className="mb-2">
            <div className="flex items-center gap-2 text-sm">
              <span className={`w-3 h-3 rounded ${getBlockColorClass(item.type)}`} />
              <span className="font-medium">{item.type}</span>
              {item.data && Object.keys(item.data).length > 0 && (
                <span className="text-xs text-gray-500">
                  {Object.entries(item.data)
                    .filter(([_, value]) => value && String(value).trim())
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ')
                    .substring(0, 30)}
                  {Object.entries(item.data).filter(([_, value]) => value && String(value).trim()).join(', ').length > 30 ? '...' : ''}
                </span>
              )}
            </div>
            
            {item.children && item.children.length > 0 && (
              <div className="mt-1">
                {renderStructureTree(item.children, level + 1)}
              </div>
            )}
            
            {item.next && (
              <div className="mt-1">
                {renderStructureTree([item.next], level)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 탭 헤더 */}
      <div className="border-b">
        <div className="flex">
          {[
            { id: 'code', label: '코드', icon: '💻' },
            { id: 'problem', label: '문제', icon: '📋' },
            { id: 'structure', label: '구조', icon: '🏗️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 탭 내용 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'code' && (
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2">생성된 코드</h3>
              <div className="text-sm text-gray-600 mb-3">
                {codeStats.totalLines}줄, {codeStats.totalBlocks}개 블록
              </div>
            </div>

            {generatedCode ? (
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm leading-relaxed">
                  <code>{generatedCode}</code>
                </pre>
                
                {/* 복사 버튼 */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCode);
                  }}
                  className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
                  title="코드 복사"
                >
                  📋
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">⚡</div>
                <div className="text-sm">블록을 배치하고 '코드 생성'을 클릭하세요</div>
              </div>
            )}

            {/* 블록 통계 */}
            {Object.keys(codeStats.blockCounts).length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">사용된 블록</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(codeStats.blockCounts).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded ${getBlockColorClass(type)}`} />
                        {type}
                      </span>
                      <span className="text-gray-600">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'problem' && (
          <div className="p-4">
            <h3 className="text-lg font-bold mb-4">{problem.title}</h3>
            
            <div className="prose prose-sm max-w-none">
              <div className="mb-4">
                <h4 className="font-medium mb-2">문제 설명</h4>
                <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                  {problem.statement}
                </div>
              </div>

              {problem.examples && problem.examples.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">예제</h4>
                  <div className="space-y-3">
                    {problem.examples.map((example, index) => (
                      <div key={index} className="border rounded p-3 bg-gray-50">
                        <div className="grid grid-cols-1 gap-2">
                          <div>
                            <span className="font-medium text-sm">입력:</span>
                            <pre className="text-sm mt-1 bg-white p-2 rounded border">
                              {example.input}
                            </pre>
                          </div>
                          <div>
                            <span className="font-medium text-sm">출력:</span>
                            <pre className="text-sm mt-1 bg-white p-2 rounded border">
                              {example.output}
                            </pre>
                          </div>
                          {example.explanation && (
                            <div>
                              <span className="font-medium text-sm">설명:</span>
                              <div className="text-sm mt-1 text-gray-600">
                                {example.explanation}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'structure' && (
          <div className="p-4">
            <h3 className="text-lg font-bold mb-4">블록 구조</h3>
            
            {blocks.length > 0 ? (
              <div>
                <div className="mb-4 text-sm text-gray-600">
                  실행 순서대로 표시됩니다
                </div>
                {renderStructureTree(blockStructure)}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">🏗️</div>
                <div className="text-sm">블록을 추가하면 구조가 표시됩니다</div>
              </div>
            )}

            {/* 구조 정보 */}
            {blocks.length > 0 && (
              <div className="mt-6 p-3 bg-blue-50 rounded">
                <h4 className="font-medium text-blue-800 mb-2">구조 정보</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>• 전체 블록: {blocks.length}개</div>
                  <div>• 시작점: {blockStructure.length}개</div>
                  <div>• 연결된 블록: {blocks.filter(b => b.connections.next || b.connections.previous).length}개</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 블록 타입별 색상 클래스 반환
function getBlockColorClass(blockType: string): string {
  const colorMap: Record<string, string> = {
    input: 'bg-blue-500',
    output: 'bg-blue-600',
    variable: 'bg-green-500',
    if: 'bg-yellow-500',
    for: 'bg-purple-500',
    while: 'bg-purple-600',
    function: 'bg-indigo-500',
    operation: 'bg-red-500',
    comparison: 'bg-orange-500',
    logic: 'bg-pink-500',
    list: 'bg-teal-500',
    listAccess: 'bg-teal-600',
    listAppend: 'bg-teal-700',
    comment: 'bg-gray-500',
    break: 'bg-red-600',
    continue: 'bg-red-700',
    return: 'bg-indigo-600'
  };
  
  return colorMap[blockType] || 'bg-gray-500';
}
