import { describe, it, expect } from 'vitest';

// Mirror implementations from drug.service.ts (private fns).
// Nếu file gốc đổi tên, cập nhật test theo.
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseStrengthMg(s: string): number | null {
  const m = s.match(/(\d+(?:[.,]\d+)?)\s*(mg|g|ml|mcg|iu)\b/i);
  if (!m) return null;
  const value = Number(m[1].replace(',', '.'));
  if (!Number.isFinite(value)) return null;
  const unit = m[2].toLowerCase();
  switch (unit) {
    case 'g': return value * 1000;
    case 'mcg': return value / 1000;
    case 'ml':
    case 'iu':
    default:
      return value;
  }
}

describe('escapeRegex', () => {
  it('escapes regex metacharacters', () => {
    expect(escapeRegex('a.b*c')).toBe('a\\.b\\*c');
    expect(escapeRegex('(par)+')).toBe('\\(par\\)\\+');
    expect(escapeRegex('[abc]')).toBe('\\[abc\\]');
    expect(escapeRegex('a\\b')).toBe('a\\\\b');
  });

  it('leaves plain text intact', () => {
    expect(escapeRegex('paracetamol')).toBe('paracetamol');
  });

  it('prevents ReDoS-style abuse', () => {
    // Sau escape, ký tự * trở thành literal, không còn ý nghĩa regex.
    const escaped = escapeRegex('.*');
    expect(escaped).toBe('\\.\\*');
  });
});

describe('parseStrengthMg', () => {
  it('parses mg as-is', () => {
    expect(parseStrengthMg('500mg')).toBe(500);
    expect(parseStrengthMg('500 mg')).toBe(500);
  });

  it('converts g to mg', () => {
    expect(parseStrengthMg('1g')).toBe(1000);
    expect(parseStrengthMg('0.5 g')).toBe(500);
  });

  it('converts mcg to mg', () => {
    expect(parseStrengthMg('100mcg')).toBeCloseTo(0.1);
    expect(parseStrengthMg('250 mcg')).toBeCloseTo(0.25);
  });

  it('handles decimal with comma (Vietnamese locale)', () => {
    expect(parseStrengthMg('0,5mg')).toBe(0.5);
  });

  it('returns null for unmatched input', () => {
    expect(parseStrengthMg('paracetamol')).toBeNull();
    expect(parseStrengthMg('5mg/ml extra')).toBe(5); // lấy match đầu
    expect(parseStrengthMg('')).toBeNull();
  });

  it('supports ml and IU as opaque units', () => {
    expect(parseStrengthMg('5ml')).toBe(5);
    expect(parseStrengthMg('1000 IU')).toBe(1000);
  });
});
