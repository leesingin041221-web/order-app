-- 옵션
INSERT INTO options (id, name, price) VALUES
  ('shot', '샷 추가', 500),
  ('syrup', '시럽 추가', 0)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price;

-- 메뉴
INSERT INTO menus (id, name, description, price, image_url, stock) VALUES
  (1, '아메리카노(ICE)', '시원하고 깔끔한 아이스 아메리카노', 4000, '/images/americano.png', 10),
  (2, '아메리카노(HOT)', '고소한 원두 향의 핫 아메리카노', 4000, '/images/americano-hot.png', 10),
  (3, '카페라떼', '부드러운 우유와 에스프레소의 조화', 5000, '/images/cafe-latte.png', 10),
  (4, '카푸치노', '풍성한 우유 거품이 올라간 카푸치노', 5000, '/images/cappuccino.png', 10),
  (5, '바닐라라떼', '달콤한 바닐라 시럽이 들어간 라떼', 5500, '/images/vanilla-latte.png', 10),
  (6, '콜드브루', '12시간 저온 추출한 진한 콜드브루', 4500, '/images/cold-brew.png', 10)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  stock = EXCLUDED.stock,
  updated_at = NOW();

-- 모든 메뉴에 옵션 연결
INSERT INTO menu_options (menu_id, option_id)
SELECT m.id, o.id
FROM menus m
CROSS JOIN options o
ON CONFLICT DO NOTHING;
