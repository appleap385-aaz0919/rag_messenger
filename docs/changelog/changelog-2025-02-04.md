# 제프리 - 변경 로그

## 2025-02-04

### 프로젝트 초기 구현

#### 백엔드
- **프로젝트 구조**: Node.js + Express + TypeScript 기반 백엔드 구조 생성
- **LLM 서비스**: Ollama 기반 LLM 추상화 계층 구현
  - `base.interface.ts`: LLM 공통 인터페이스
  - `ollama.service.ts`: Ollama 구현체
  - `llm.factory.ts`: LLM 팩토리 패턴
- **임베딩 서비스**: Ollama nomic-embed-text 기반 임베딩 구현
- **벡터 DB**: ChromaDB 연동 서비스 구현
- **문서 처리**: 다양한 파일 형식 파서 구현
  - PDF (pdf-parse)
  - DOCX/DOC (mammoth)
  - Excel/XLS/CSV (xlsx)
  - PowerPoint PPTX/PPT (jszip)
  - TXT/MD/XML (텍스트 파서)
  - JSON (JSON 파서)
- **청킹 서비스**: 1000 토큰, 200 오버랩 기반 문서 분할
- **RAG 파이프라인**: 검색 증강 생성 서비스 구현
- **인덱싱 서비스**: 문서 수집, 처리, 저장 관리
- **명령어 처리**: `/재학습`, `/폴더추가`, `/폴더제거`, `/파일목록`, `/상태`, `/도움말` 명령어 구현
- **파일 Watcher**: chokidar 기반 파일 변경 감지 및 자동 재인덱싱
- **WebSocket**: 실시간 이벤트 브로드캐스트 (인덱싱 진행률, 파일 변경 등)
- **API 엔드포인트**:
  - `/api/chat/message`: 메시지 처리 및 AI 응답
  - `/api/chat/history`: 대화 기록 조회
  - `/api/documents/index`: 재인덱싱
  - `/api/documents/status`: 인덱싱 상태
  - `/api/documents/files`: 파일 목록
  - `/api/settings/folders`: 폴더 관리
  - `/api/settings/llm`: LLM 설정

#### 프론트엔드
- **프로젝트 구조**: React + TypeScript + Vite 기반 프론트엔드 구조 생성
- **스타일링**: Tailwind CSS + Framer Motion 애니메이션
- **상태 관리**: Zustand 기반 스토어 (채팅, 인덱싱, 설정)
- **레이아웃 컴포넌트**:
  - `AppLayout`: 메인 레이아웃
  - `Sidebar`: 왼쪽 사이드바 (240px)
  - `MainChat`: 메인 채팅 영역
  - `RightPanel`: 우측 패널 (토글)
- **채팅 컴포넌트**:
  - `ChatMessage`: 메시지 표시 (제프리/사용자)
  - `ChatInput`: 입력창
  - `TypingIndicator`: 로딩 표시
- **문서 컴포넌트**:
  - `FileReferenceCard`: 참조 문서 카드
- **설정 컴포넌트**:
  - `SettingsModal`: 설정 모달
  - `LLMSettings`: LLM 설정 (모델 선택, API 키)
  - `FolderSettings`: 폴더 관리
- **WebSocket**: 실시간 연결 및 이벤트 수신
- **API 서비스**: axios 기반 HTTP 클라이언트

#### 설정
- `config.json`: 전체 설정 파일 (LLM, 벡터 DB, 폴더, 청킹 등)

#### 지원 파일 형식
- .pdf, .docx, .doc, .xlsx, .xls, .csv, .pptx, .ppt, .txt, .md, .json, .xml

---

## 사용 방법

### 설치
```bash
# 백엔드
cd backend
npm install

# 프론트엔드
cd frontend
npm install
```

### 실행
```bash
# Ollama 실행 (필수)
ollama serve

# 백엔드 실행
cd backend
npm run dev

# 프론트엔드 실행
cd frontend
npm run dev
```

### 접속
http://localhost:3000

---

## 검증 방법

### 1. Ollama 설치 확인
```bash
ollama list
ollama pull llama3.2
ollama pull nomic-embed-text
```

### 2. 백엔드 빌드 확인
```bash
cd backend
npm run type-check
npm run build
```

### 3. 프론트엔드 빌드 확인
```bash
cd frontend
npm run type-check
npm run build
```

### 4. 기능 테스트
1. 앱 접속 후 초기 인덱싱 진행률 확인
2. 질문 입력 후 답변 확인
3. 참조 문서 클릭 시 파일 열기 확인
4. `/재학습` 명령어 테스트
5. 설정 페이지에서 LLM 모델 변경 테스트

---

## 검증이 필요한 사항

1. **백엔드**
   - [ ] `npm install` 실행 시 의존성 설치 확인
   - [ ] `npm run type-check` 실행 시 타입 오류 없는지 확인
   - [ ] `npm run build` 실행 시 빌드 성공 확인
   - [ ] `npm run dev` 실행 시 서버 시작 확인

2. **프론트엔드**
   - [ ] `npm install` 실행 시 의존성 설치 확인
   - [ ] `npm run type-check` 실행 시 타입 오류 없는지 확인
   - [ ] `npm run build` 실행 시 빌드 성공 확인
   - [ ] `npm run dev` 실행 시 개발 서버 시작 확인

3. **통합 테스트**
   - [ ] Ollama 연결 확인
   - [ ] ChromaDB 초기화 확인
   - [ ] 문서 인덱싱 진행 확인
   - [ ] 질문-답변 기능 확인
   - [ ] WebSocket 연결 확인
