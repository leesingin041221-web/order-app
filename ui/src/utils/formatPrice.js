export function formatPrice(n) {
  const value = Number(n);
  return `${(Number.isFinite(value) ? value : 0).toLocaleString('ko-KR')}원`;
}

export function formatOptionPrice(n) {
  return n === 0 ? '+0원' : `+${formatPrice(n)}`;
}
