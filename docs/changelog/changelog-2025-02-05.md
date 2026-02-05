# 제프리 - 로컬 문서 기반 AI 메신저 변경사항

## 2025-02-05

### 구현 완료 사항

#### 백엔드
- LLM 추상화 계층 구현 (Ollama 서비스)
- RAG 파이프라인 구현 (문서 인덱싱, 검색, 답변 생성)
- 문서 처리 파서 구현 (PDF, DOCX, Excel, PowerPoint, TXT, MD, JSON, XML)
- 명령어 처리 시스템 구현 (/재학습, /폴더추가, /폴더제거, /파일목록, /상태, /도움말)
- 파일 Watcher 구현 (chokidar를 통한 실시간 파일 변경 감지)
- ChromaDB 벡터 저장소 연동
- WebSocket 실시간 통신 구현
- API 엔드포인트 구현 (채팅, 문서, 설정)

#### 프론트엔드
- 레이아웃 컴포넌트 구현 (AppLayout, Sidebar, MainChat, RightPanel)
- 채팅 컴포넌트 구현 (ChatMessage, ChatInput, CommandInput, TypingIndicator)
- 문서 컴포넌트 구현 (FileTree, FileReferenceCard, LearningStatus)
- 설정 컴포넌트 구현 (SettingsModal, LLMSettings, FolderSettings)
- 상태 관리 구현 (Zustand 기반 chat-store, indexing-store, settings-store)
- WebSocket 훅 구현 (useWebSocket)
- API 서비스 구현 (axios 기반)

#### 추가 컴포넌트
- FileTree.tsx - 폴더 구조 트리뷰
- LearningStatus.tsx - 인덱싱 상태 표시
- CommandInput.tsx - 명령어 자동완성
- TypingIndicator.tsx - 로딩 표시

### 빌드 검증
- 백엔드 빌드 성공 (`npm run build`)
- 프론트엔드 빌드 성공 (`npm run build`)
- ESLint 검사 통과

### 실행 방법

#### 백엔드 실행
```bash
cd backend
npm install
npm run dev
```

#### 프론트엔드 실행
```bash
cd frontend
npm install
npm run dev
```

#### 앱 접속
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:3001
- WebSocket: ws://localhost:3001/ws

### 사용자 검증 필요 사항

1. **Ollama 설치 확인**
   - Ollama가 설치되어 있어야 합니다 (https://ollama.ai)
   - `ollama serve`로 Ollama 서버 실행
   - `ollama pull llama3.2:latest`로 모델 다운로드
   - `ollama pull nomic-embed-text`로 임베딩 모델 다운로드

2. **config.json 폴더 경로 확인**
   - 설정된 폴더 경로가 실제로 존재하는지 확인
   - 경로에 한글이 포함된 경우 정상 동작 확인

3. **기능 테스트**
   - 앱 접속 후 초기 인덱싱 진행률 확인
   - 질문 입력 후 답변 확인
   - 참조 문서 클릭 시 파일 열기 확인
   - `/재학습` 명령어 테스트
   - 설정 페이지에서 LLM 모델 변경 테스트
   - 파일 Watcher 테스트 (대상 폴더에 새 파일 추가 후 자동 인덱싱 확인)

### 알려진 제한사항
- 대화 기록 저장 기능은 구현되지 않음 (TODO로 표시됨)
- 파일 검색 기능은 구현되지 않음 (TODO로 표시됨)
- config.json 실시간 업데이트 기능은 구현되지 않음 (TODO로 표시됨)
