# 커피 주문 앱

## 1. 프로젝트 개요

### 1.1 프로젝트명
커피 주문 앱

### 1.2 프로젝트 목적
사용자가 커피 메뉴를 주문하고, 관리자가 주문을 관리할 수 있는 간단한 풀스택 웹 앱

### 1.3 개발 범위
- **주문하기 화면**: 메뉴 선택 및 장바구니 기능
- **관리자 화면**: 재고 관리 및 주문 상태 관리
- **데이터 API**: 생성·조회·수정·삭제(CRUD) 기능

## 2. 기술 스택

| 구분 | 기술 |
|------|------|
| 프런트엔드 | HTML, CSS, React, JavaScript |
| 백엔드 | Node.js, Express |
| 데이터베이스 | PostgreSQL |

## 3. 기본 사항

- 프런트엔드와 백엔드를 **별도 프로젝트**로 개발
- 기본적인 웹 기술만 사용
- **학습 목적**이므로 사용자 인증·결제 기능은 제외
- 메뉴는 **커피 메뉴만** 제공

## 4. 화면별 요구사항

### 4.1 주문하기 (사용자)

| 기능 | 설명 |
|------|------|
| 메뉴 목록 | 커피 메뉴 이름, 가격, 설명(선택), 재고 여부 표시 |
| 옵션 | 샷 추가, 시럽, ICE/HOT 등 (메뉴별 정의 가능) |
| 장바구니 | 메뉴·수량·옵션 추가/삭제, 합계 금액 표시 |
| 주문하기 | 장바구니 내용으로 주문 생성 (결제 없음) |

### 4.2 관리자

| 기능 | 설명 |
|------|------|
| 재고 관리 | 메뉴별 재고 수량 조회·수정 |
| 주문 목록 | 접수된 주문 목록 조회 |
| 주문 상태 | 예: `주문 접수` → `제조 중` → `완료` 상태 변경 |

## 5. 백엔드 데이터 모델

PostgreSQL 기준 엔티티 정의. 프런트엔드의 `Menus`, `Options`, `Orders`와 1:1로 대응한다.

### 5.1 Menus (메뉴)

커피 메뉴 기본 정보.

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | SERIAL / UUID | PK |
| `name` | VARCHAR | 커피 이름 (예: 아메리카노(ICE)) |
| `description` | TEXT | 설명 |
| `price` | INTEGER | 기본 가격(원) |
| `image_url` | VARCHAR | 이미지 경로 또는 URL |
| `stock` | INTEGER | 재고 수량 (기본 0 이상) |
| `created_at` | TIMESTAMPTZ | 생성 일시 |
| `updated_at` | TIMESTAMPTZ | 수정 일시 |

**비고**
- 주문하기 화면: 이름·설명·가격·이미지·연결된 옵션을 표시한다.
- **재고 수량(`stock`)은 주문하기 화면에 노출하지 않고**, 관리자 화면(재고 현황)에서만 표시·수정한다.
- 품절 여부는 API에서 `stock > 0` 여부로 판단해 프런트에 전달할 수 있다.

### 5.2 Options (옵션)

메뉴에 붙일 수 있는 추가 옵션.

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | SERIAL / UUID | PK |
| `name` | VARCHAR | 옵션 이름 (예: 샷 추가, 시럽 추가) |
| `price` | INTEGER | 옵션 추가 가격(원) |
| `created_at` | TIMESTAMPTZ | 생성 일시 |

**메뉴 연결 (다대다)**

| 필드 | 타입 | 설명 |
|------|------|------|
| `menu_id` | FK → `menus.id` | 연결할 메뉴 |
| `option_id` | FK → `options.id` | 연결할 옵션 |

- 조인 테이블 예: `menu_options(menu_id, option_id)` PK 복합키
- 초기 시드 예: 모든 커피 메뉴에 「샷 추가 +500원」「시럽 추가 +0원」 연결

### 5.3 Orders (주문)

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | SERIAL / UUID | PK (주문 ID) |
| `ordered_at` | TIMESTAMPTZ | 주문 일시 |
| `status` | VARCHAR | `received` · `making` · `done` (화면: 주문 접수 · 제조 중 · 완료) |
| `total_price` | INTEGER | 주문 총액(원) |
| `created_at` | TIMESTAMPTZ | 레코드 생성 일시 |

### 5.4 OrderItems (주문 내용)

주문 한 건에 담긴 메뉴·수량·옵션·금액. Orders와 1:N.

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | SERIAL / UUID | PK |
| `order_id` | FK → `orders.id` | 주문 |
| `menu_id` | FK → `menus.id` | 메뉴 |
| `menu_name` | VARCHAR | 주문 시점 메뉴명 (스냅샷) |
| `quantity` | INTEGER | 수량 |
| `unit_price` | INTEGER | 단가(기본가 + 선택 옵션가) |
| `subtotal` | INTEGER | `unit_price × quantity` |
| `options_snapshot` | JSONB | 선택 옵션 목록 (이름·가격) |

**관계 요약**

```
menus ←── menu_options ──→ options
  ↑
  └── order_items ──→ orders
```

## 6. 데이터 스키마 사용자 흐름

| 단계 | 동작 | DB / API |
|------|------|----------|
| 1 | **주문하기** 화면 진입 시 Menus(및 연결 Options) 조회 후 카드 UI 표시. 재고는 사용자 화면에 숫자로 보이지 않음 | `GET /api/menus` |
| 2 | 사용자가 메뉴·옵션 선택 후 **담기** → 선택 정보는 **클라이언트 장바구니**에만 보관 (DB 미저장) | (프런트 로컬 상태) |
| 3 | 장바구니에서 **주문하기** 클릭 → Orders·OrderItems 저장, 메뉴별 재고 차감 | `POST /api/orders` |
| 4 | 관리자 **주문 현황**에 Orders 목록 표시. 기본 상태 **주문 접수**(`received`). 상태 버튼 클릭 시 **제조 중**(`making`) → **완료**(`done`) 순으로 변경 | `GET /api/orders`, `PATCH /api/orders/:id/status` |
| 5 | 관리자 **재고 현황**에서 Menus.stock 조회·수정 | `GET /api/menus`(관리용), `PATCH /api/menus/:id/stock` |

**주문 상태 전이**

```
주문 접수 (received) → 제조 중 (making) → 완료 (done)
```

## 7. API 설계

Base URL 예: `http://localhost:3000/api`  
응답 형식: JSON. CORS로 `ui`(Vite) Origin 허용.

### 7.1 메뉴 (Menus)

#### `GET /api/menus`

- **용도**: 주문하기 화면 — DB에서 커피 메뉴 목록 로드
- **응답**: 메뉴 배열 + 각 메뉴에 연결된 `options[]` (id, name, price)
- **주문 화면용 필드**: `id`, `name`, `description`, `price`, `image_url`, `options`, `is_available` (`stock > 0`)
- **관리자 재고 화면**: 동일 API 또는 `?include=stock` 로 `stock` 포함

#### `GET /api/menus/:id`

- **용도**: 메뉴 단건 조회

#### `PATCH /api/menus/:id/stock`

- **용도**: 관리자 재고 +/- 반영  
- **Body**: `{ "stock": 10 }` 또는 `{ "delta": 1 }`

### 7.2 주문 (Orders)

#### `POST /api/orders`

- **용도**: 사용자가 **주문하기** 클릭 시 주문 저장 + **재고 수정**
- **Body 예시**:
```json
{
  "items": [
    {
      "menu_id": 1,
      "quantity": 2,
      "option_ids": ["shot"]
    }
  ]
}
```
- **서버 처리**:
  1. 재고·가격·옵션 검증
  2. `orders` INSERT (`ordered_at`, `status: received`, `total_price`)
  3. `order_items` INSERT (메뉴, 수량, 옵션 스냅샷, 금액)
  4. 해당 `menus.stock` 차감 (트랜잭션)
- **응답**: 생성된 주문 ID 및 요약

#### `GET /api/orders`

- **용도**: 관리자 주문 현황·대시보드 집계
- **Query(선택)**: `status=received`

#### `GET /api/orders/:id`

- **용도**: **주문 ID**로 해당 주문 상세 조회 (주문 일시, 주문 내용: 메뉴·수량·옵션·금액)

#### `PATCH /api/orders/:id/status`

- **용도**: 주문 상태 변경 (`received` → `making` → `done`)
- **Body**: `{ "status": "making" }`

### 7.3 API 요약표

| 메서드 | 경로 | 용도 |
|--------|------|------|
| GET | `/api/menus` | 메뉴·옵션 목록 (주문 화면) |
| GET | `/api/menus/:id` | 메뉴 단건 |
| PATCH | `/api/menus/:id/stock` | 재고 수정 (관리자) |
| POST | `/api/orders` | 주문 생성 + 재고 차감 |
| GET | `/api/orders` | 주문 목록 (관리자) |
| GET | `/api/orders/:id` | 주문 ID로 상세 조회 |
| PATCH | `/api/orders/:id/status` | 주문 상태 변경 |

### 7.4 에러·검증 (공통)

| 상황 | HTTP | 메시지 예 |
|------|------|-----------|
| 재고 부족 | 400 | 재고가 부족합니다 |
| 없는 메뉴/주문 | 404 | 리소스를 찾을 수 없습니다 |
| 잘못된 상태 전이 | 400 | 변경할 수 없는 상태입니다 |

## 8. 프로젝트 구조 (권장)

```
앱 만들기/
├── docs/
│   └── PRD.md
├── ui/                    # React 프런트엔드 (Vite)
└── server/                # Express + PostgreSQL 백엔드
    ├── src/
    │   ├── routes/        # menus, orders 라우트
    │   ├── db/            # pool, schema.sql, seed.sql
    │   └── index.js
    └── package.json
```

## 9. 비기능 요구사항

- 로컬 개발: 프런트 `ui` (Vite, 예: `:5173`) · API `server` (예: `:3000`) 분리 실행
- CORS 설정으로 프런트·백 분리 개발 지원
- PostgreSQL 스키마·시드(Menus, Options, menu_options)로 초기 커피 메뉴 제공
- 주문 생성·재고 차감은 **DB 트랜잭션**으로 처리
- 프런트 연동 시 `localStorage` 대신 §7 API 호출로 전환

## 10. UI 와이어프레임 (COZY)

브랜드명: **COZY**. 공통 헤더: 좌측 로고 `COZY`, 우측 `주문하기`·`관리자` 네비게이션.

### 10.1 주문하기 화면

| 영역 | 구성 |
|------|------|
| 메뉴 카드 (그리드) | 이미지 placeholder, 메뉴명, 가격, `간단한 설명...`, 옵션 체크박스, **담기** 버튼 |
| 초기 메뉴 | 아메리카노(ICE) 4,000원 · 아메리카노(HOT) 4,000원 · 카페라떼 5,000원 |
| 옵션 | 샷 추가 (+500원), 시럽 추가 (+0원) |
| 장바구니 | 항목명(옵션 표기) × 수량, 줄별 금액, **총 금액**, **주문하기** 버튼 |

**동작**: 담기 시 선택 옵션 반영 후 장바구니에 추가. 동일 메뉴+옵션은 수량 합산. 주문하기 시 주문 생성.

### 10.2 관리자 화면

| 영역 | 구성 |
|------|------|
| 관리자 대시보드 | 총 주문 · 주문 접수 · 제조 중 · 제조 완료 건수 |
| 재고 현황 | 메뉴별 `N개` 표시, **+** / **-** 로 재고 조정 |
| 주문 현황 | 일시, 주문 항목·수량, 금액, 상태 변경 버튼 |

**주문 상태 흐름**: `주문 접수` → `제조 중` → `제조 완료` (버튼 클릭 시 다음 단계로 전환)

## 11. 제외 범위

- 회원가입·로그인·권한 관리
- 결제·영수증·배달 연동
- 비커피 메뉴(음료·디저트 등)
