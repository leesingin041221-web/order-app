export const MENU_OPTIONS = [
  { id: 'shot', label: '샷 추가', price: 500 },
  { id: 'syrup', label: '시럽 추가', price: 0 },
];

/** 주문하기 화면용 커피 메뉴 (임의 데이터) */
export const INITIAL_MENUS = [
  {
    id: 1,
    name: '아메리카노(ICE)',
    price: 4000,
    description: '시원하고 깔끔한 아이스 아메리카노',
    stock: 10,
    image: '/images/americano.png',
  },
  {
    id: 2,
    name: '아메리카노(HOT)',
    price: 4000,
    description: '고소한 원두 향의 핫 아메리카노',
    stock: 10,
    image: '/images/americano-hot.png',
  },
  {
    id: 3,
    name: '카페라떼',
    price: 5000,
    description: '부드러운 우유와 에스프레소의 조화',
    stock: 10,
    image: '/images/cafe-latte.png',
  },
  {
    id: 4,
    name: '카푸치노',
    price: 5000,
    description: '풍성한 우유 거품이 올라간 카푸치노',
    stock: 10,
    image: '/images/cappuccino.png',
  },
  {
    id: 5,
    name: '바닐라라떼',
    price: 5500,
    description: '달콤한 바닐라 시럽이 들어간 라떼',
    stock: 10,
    image: '/images/vanilla-latte.png',
  },
  {
    id: 6,
    name: '콜드브루',
    price: 4500,
    description: '12시간 저온 추출한 진한 콜드브루',
    stock: 10,
    image: '/images/cold-brew.png',
  },
];

export const ORDER_STATUS = {
  received: { key: 'received', label: '주문 접수', next: 'making', action: '제조 중' },
  making: { key: 'making', label: '제조 중', next: 'done', action: '제조 완료' },
  done: { key: 'done', label: '제조 완료', next: null, action: null },
};
