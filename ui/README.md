# COZY — 프런트엔드 (`ui/`)

커피 주문 앱의 React 프런트엔드입니다. **Create React App(CRA) 대신 Vite**를 사용하며, **바닐라 JavaScript**(`.js` / `.jsx`, TypeScript 없음)로 작성합니다.

## 기술 스택

| 항목 | 선택 |
|------|------|
| 빌드·개발 서버 | [Vite](https://vite.dev/) |
| UI | React 19 |
| 언어 | JavaScript (JSX) |
| 라우팅 | react-router-dom |
| 스타일 | CSS |

## 폴더 구조

```
ui/
├── index.html          # Vite 진입 HTML
├── vite.config.js      # Vite 설정
├── package.json
├── public/
└── src/
    ├── main.jsx        # React 마운트
    ├── App.jsx
    ├── App.css
    ├── index.css
    ├── components/     # 공통 UI 컴포넌트
    ├── pages/          # 화면(라우트) 단위
    ├── context/        # 전역 상태
    └── data/           # 상수·초기 데이터
```

## 시작하기

프로젝트 루트에서 `ui` 폴더로 이동한 뒤 의존성을 설치하고 개발 서버를 실행합니다.

```bash
cd ui
npm install
npm run dev
```

브라우저: **http://localhost:5173**

## npm 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 (HMR) |
| `npm run build` | 프로덕션 빌드 → `dist/` |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | ESLint 검사 |

## 화면 (라우트)

| 경로 | 화면 |
|------|------|
| `/` | 주문하기 |
| `/admin` | 관리자 |

백엔드(`server/`) API 연동은 이후 단계에서 `src`에 API 호출을 추가하면 됩니다.
