// Vietnamese slug + normalize helpers (Phần 6.1 — fuzzy search bỏ dấu).
// Tự triển khai NFD-based remove diacritics — không phụ thuộc thư viện ngoài.

// Bảng map các ký tự có dấu tiếng Việt → không dấu
// Sử dụng \uXXXX escapes để đảm bảo tệp là ASCII thuần — tránh lỗi parser
const VIETNAMESE_MAP: Record<string, string> = {
  // a (ă, â)
  '\u00e0': 'a', '\u00e1': 'a', '\u1ea3': 'a', '\u00e3': 'a', '\u1ea1': 'a',
  '\u0103': 'a', '\u1eb1': 'a', '\u1eaf': 'a', '\u1eb3': 'a', '\u1eb5': 'a', '\u1eb7': 'a',
  '\u00e2': 'a', '\u1ea7': 'a', '\u1ea5': 'a', '\u1ea9': 'a', '\u1eab': 'a', '\u1ead': 'a',
  // e (ê)
  '\u00e8': 'e', '\u00e9': 'e', '\u1ebb': 'e', '\u1ebd': 'e', '\u1eb9': 'e',
  '\u00ea': 'e', '\u1ec1': 'e', '\u1ebf': 'e', '\u1ec3': 'e', '\u1ec5': 'e', '\u1ec7': 'e',
  // i
  '\u00ec': 'i', '\u00ed': 'i', '\u1ec9': 'i', '\u0129': 'i', '\u1ecb': 'i',
  // o (ô, ơ)
  '\u00f2': 'o', '\u00f3': 'o', '\u1ecf': 'o', '\u00f5': 'o', '\u1ecd': 'o',
  '\u00f4': 'o', '\u1ed3': 'o', '\u1ed1': 'o', '\u1ed5': 'o', '\u1ed7': 'o', '\u1ed9': 'o',
  '\u01a1': 'o', '\u1edd': 'o', '\u1edb': 'o', '\u1edf': 'o', '\u1ee1': 'o', '\u1ee3': 'o',
  // u (ư)
  '\u00f9': 'u', '\u00fa': 'u', '\u1ee7': 'u', '\u0169': 'u', '\u1ee5': 'u',
  '\u01b0': 'u', '\u1eeb': 'u', '\u1ee9': 'u', '\u1eed': 'u', '\u1eef': 'u', '\u1ef1': 'u',
  // y
  '\u1ef3': 'y', '\u00fd': 'y', '\u1ef7': 'y', '\u1ef9': 'y', '\u1ef5': 'y',
  // d
  '\u0111': 'd',
};

function removeAccents(input: string): string {
  let result = '';
  for (const ch of input) {
    const lower = ch.toLowerCase();
    if (VIETNAMESE_MAP[lower]) {
      result += VIETNAMESE_MAP[lower];
    } else {
      result += ch;
    }
  }
  return result;
}

export function viSlug(input: string): string {
  return removeAccents(input)
    .toLowerCase()
    .replace(/\u0111/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function viNormalize(input: string): string {
  return removeAccents(input)
    .toLowerCase()
    .replace(/\u0111/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

// Levenshtein distance — dùng cho fuzzy match (Phần 6.3 step 4).
// Pure function, không phụ thuộc DB, dễ unit test.
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const prev: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr: number[] = new Array(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length] as number;
}

// Trả về similarity score [0,1] — 1 = identical
export function similarity(a: string, b: string): number {
  const na = viNormalize(a);
  const nb = viNormalize(b);
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(na, nb) / maxLen;
}
