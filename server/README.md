# COZY — 백엔드 (`server/`)

Express.js 기반 REST API 서버입니다. 프런트엔드(`ui/`)와 분리해 개발합니다.

## 기술 스택

| 항목 | 기술 |
|------|------|
| 런타임 | Node.js (ES Modules) |
| 프레임워크 | Express.js |
| DB (예정) | PostgreSQL (`pg`) |
| 환경 변수 | `dotenv` |

## 폴더 구조

```
server/
├── .env.example
├── package.json
├── README.md
└── src/
    ├── index.js       # 서버 진입점
    ├── app.js         # Express 앱·미들웨어
    ├── routes/        # API 라우트
    │   └── index.js
    └── db/
        ├── pool.js    # PostgreSQL 연결 풀
        ├── schema.sql # (추가 예정)
        └── seed.sql   # (추가 예정)
```

## 시작하기

### 1. 의존성 설치

```bash
cd server
npm install
```

### 2. 환경 변수

서버 루트의 **`.env`** 파일을 사용합니다. (예전 `configure.env` 이름은 사용하지 않습니다.)

처음 설정 시:

```bash
copy .env.example .env
```

이미 `configure.env`에 값을 적어 두었다면, 내용을 **`.env`**로 옮긴 뒤 `configure.env`는 삭제하세요.

| 변수 | 설명 | 기본 예 |
|------|------|---------|
| `PORT` | API 포트 | `3000` |
| `CORS_ORIGIN` | 프런트 주소 | `http://localhost:5173` |
| `DATABASE_URL` | PostgreSQL URL | DB 연동 시 설정 |

### 3. 개발 서버 실행

```bash
npm run dev
```

- API: http://localhost:3000
- 헬스 체크: http://localhost:3000/api/health

코드 수정 시 `--watch`로 자동 재시작됩니다.

### 4. 프런트와 함께 실행

터미널 1 — API:

```bash
cd server
npm run dev
```

터미널 2 — UI:

```bash
cd ui
npm run dev
```

## npm 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 (파일 변경 시 재시작) |
| `npm start` | 프로덕션 모드 실행 |

## PostgreSQL 연결

### 1. `.env` 설정

```env
DATABASE_URL=postgresql://postgres:본인비밀번호@localhost:5432/cozy
```

### 2. 데이터베이스 생성 (최초 1회)

pgAdmin 또는 `psql`에서:

```sql
CREATE DATABASE cozy;
```

### 3. 스키마·시드 적용

```bash
npm run db:init
```

### 4. 연결 확인

```bash
npm run dev
```

브라우저: http://localhost:3000/api/health  
`database`와 `menus: 6`이 보이면 연결 성공입니다.

## API (PRD §7)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/health` | 서버·DB 상태 |
| GET | `/api/menus?include=stock` | 메뉴·옵션 목록 |
| PATCH | `/api/menus/:id/stock` | 재고 수정 `{ delta: 1 }` |
| POST | `/api/orders` | 주문 생성 |
| GET | `/api/orders` | 주문 목록·대시보드 |
| PATCH | `/api/orders/:id/status` | 주문 상태 변경 |
