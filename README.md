# 제프리 - 로컬 문서 기반 AI 메신저

로컬 폴더의 문서들을 학습하여 질문에 답변하는 AI 메신저

## 기술 스택

- **백엔드**: Node.js + Express + LangChain.js
- **LLM**: 로컬 Ollama (모델 변경 가능)
- **벡터 DB**: ChromaDB
- **프론트엸드**: React + TypeScript + Tailwind CSS + Framer Motion

## 설치

### 백엔드
```bash
cd backend
npm install
npm run dev
```

### 프론트엔드
```bash
cd frontend
npm install
npm run dev
```

## 설정

`config.json` 파일에서 다음을 설정할 수 있습니다:
- LLM 모델 및 공급자
- 대상 폴더 경로
- 청킹 설정
- 파일 Watcher 설정

## 사용법

1. Ollama가 실행 중인지 확인합니다 (`ollama serve`)
2. 백엔드 서버를 시작합니다 (`cd backend && npm run dev`)
3. 프론트엔드를 시작합니다 (`cd frontend && npm run dev`)
4. http://localhost:3000 에 접속합니다.
