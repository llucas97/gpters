// frontend/src/components/CodeEditor/languageConfig.ts
import { LanguageConfig } from './types';

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    id: 'python',
    name: 'Python',
    extension: '.py',
    monacoLanguage: 'python',
    defaultCode: `# Python 코드를 여기에 작성하세요
def solution():
    # 여기에 코드를 작성하세요
    pass

if __name__ == "__main__":
    solution()
`,
    keywords: [
      'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
      'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import',
      'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while',
      'with', 'yield'
    ],
    builtins: [
      'abs', 'all', 'any', 'bin', 'bool', 'chr', 'dict', 'dir', 'enumerate', 'filter', 'float',
      'int', 'len', 'list', 'map', 'max', 'min', 'print', 'range', 'reversed', 'set', 'sorted',
      'str', 'sum', 'tuple', 'type', 'zip'
    ],
    executionCommand: 'python3'
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    extension: '.js',
    monacoLanguage: 'javascript',
    defaultCode: `// JavaScript 코드를 여기에 작성하세요
function solution() {
    // 여기에 코드를 작성하세요
}

// 테스트 실행
solution();
`,
    keywords: [
      'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete',
      'do', 'else', 'export', 'extends', 'finally', 'for', 'function', 'if', 'import', 'in',
      'instanceof', 'let', 'new', 'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof',
      'var', 'void', 'while', 'with', 'yield'
    ],
    builtins: [
      'Array', 'Boolean', 'Date', 'Error', 'Function', 'JSON', 'Math', 'Number', 'Object',
      'RegExp', 'String', 'console', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'
    ],
    executionCommand: 'node'
  },
  {
    id: 'java',
    name: 'Java',
    extension: '.java',
    monacoLanguage: 'java',
    defaultCode: `// Java 코드를 여기에 작성하세요
import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // 여기에 코드를 작성하세요
    }
}
`,
    keywords: [
      'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const',
      'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float',
      'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native',
      'new', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp',
      'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void',
      'volatile', 'while'
    ],
    builtins: [
      'String', 'System', 'Math', 'ArrayList', 'HashMap', 'HashSet', 'Scanner', 'Collections',
      'Arrays', 'Integer', 'Double', 'Boolean', 'Character'
    ],
    compileCommand: 'javac',
    executionCommand: 'java'
  },
  {
    id: 'cpp',
    name: 'C++',
    extension: '.cpp',
    monacoLanguage: 'cpp',
    defaultCode: `// C++ 코드를 여기에 작성하세요
#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
using namespace std;

int main() {
    // 여기에 코드를 작성하세요
    return 0;
}
`,
    keywords: [
      'alignas', 'alignof', 'and', 'and_eq', 'asm', 'atomic_cancel', 'atomic_commit', 'atomic_noexcept',
      'auto', 'bitand', 'bitor', 'bool', 'break', 'case', 'catch', 'char', 'char8_t', 'char16_t',
      'char32_t', 'class', 'compl', 'concept', 'const', 'consteval', 'constexpr', 'constinit',
      'const_cast', 'continue', 'co_await', 'co_return', 'co_yield', 'decltype', 'default', 'delete',
      'do', 'double', 'dynamic_cast', 'else', 'enum', 'explicit', 'export', 'extern', 'false',
      'float', 'for', 'friend', 'goto', 'if', 'inline', 'int', 'long', 'mutable', 'namespace',
      'new', 'noexcept', 'not', 'not_eq', 'nullptr', 'operator', 'or', 'or_eq', 'private',
      'protected', 'public', 'reflexpr', 'register', 'reinterpret_cast', 'requires', 'return',
      'short', 'signed', 'sizeof', 'static', 'static_assert', 'static_cast', 'struct', 'switch',
      'synchronized', 'template', 'this', 'thread_local', 'throw', 'true', 'try', 'typedef',
      'typeid', 'typename', 'union', 'unsigned', 'using', 'virtual', 'void', 'volatile', 'wchar_t',
      'while', 'xor', 'xor_eq'
    ],
    builtins: [
      'std', 'cout', 'cin', 'endl', 'vector', 'string', 'map', 'set', 'queue', 'stack',
      'priority_queue', 'sort', 'find', 'max', 'min', 'swap'
    ],
    compileCommand: 'g++',
    executionCommand: './a.out'
  }
];

export const DEFAULT_EDITOR_SETTINGS = {
  theme: 'dark' as const,
  fontSize: 14,
  fontFamily: 'Consolas, "Courier New", monospace',
  tabSize: 4,
  insertSpaces: true,
  wordWrap: 'on' as const,
  minimap: true,
  lineNumbers: 'on' as const,
  autoComplete: true,
  bracketMatching: true,
  folding: true,
  renderWhitespace: 'boundary' as const
};

export const EDITOR_THEMES = [
  { id: 'vs', name: '밝은 테마', base: 'vs' },
  { id: 'vs-dark', name: '어두운 테마', base: 'vs-dark' },
  { id: 'hc-black', name: '고대비 테마', base: 'hc-black' }
];

export function getLanguageById(id: string): LanguageConfig | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.id === id);
}

export function getLanguageByExtension(extension: string): LanguageConfig | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.extension === extension);
}

export function getDefaultCodeForLanguage(languageId: string): string {
  const language = getLanguageById(languageId);
  return language?.defaultCode || '// 코드를 작성하세요';
}
