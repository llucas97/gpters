-- 잘못된 topic 값을 정리하는 스크립트
-- 'array', 'function' 같은 JavaScript 타입 이름이나 잘못된 값을 'programming'으로 수정

-- 현재 잘못된 topic 값 확인
SELECT topic, COUNT(*) as count 
FROM study_sessions 
WHERE topic NOT IN ('graph', 'dp', 'greedy', 'tree', 'string', 'math', 'sort', 'search', 'stack', 'queue', 'hash', 'heap', 'programming')
GROUP BY topic
ORDER BY count DESC;

-- 잘못된 topic 값을 'programming'으로 수정
UPDATE study_sessions 
SET topic = 'programming' 
WHERE topic NOT IN ('graph', 'dp', 'greedy', 'tree', 'string', 'math', 'sort', 'search', 'stack', 'queue', 'hash', 'heap', 'programming');

-- 수정 결과 확인
SELECT COUNT(*) as total_sessions, 
       SUM(CASE WHEN topic = 'programming' THEN 1 ELSE 0 END) as programming_count,
       SUM(CASE WHEN topic IN ('graph', 'dp', 'greedy', 'tree', 'string', 'math') THEN 1 ELSE 0 END) as valid_topics_count
FROM study_sessions;

