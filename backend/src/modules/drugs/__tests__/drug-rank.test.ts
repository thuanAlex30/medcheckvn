import { describe, it, expect } from 'vitest';
import { rankScore, parseStrengthMg, escapeRegexPattern } from '../drug.helpers';

describe('rankScore', () => {
  it('exact brand match returns 100', () => {
    expect(rankScore('paracetamol', 'paracetamol', [])).toBe(100);
  });

  it('brand startsWith query returns 80', () => {
    expect(rankScore('paracetamol extra', 'paracetamol', [])).toBe(80);
  });

  it('ingredient exact returns 70', () => {
    expect(rankScore('panadol', 'paracetamol', ['paracetamol'])).toBe(70);
  });

  it('ingredient startsWith returns 60 (khi brand KHÔNG match)', () => {
    // 'xyz drug' bắt đầu bằng 'xyz' nhưng query là 'amox' — brand không match
    expect(rankScore('xyz drug', 'amox', ['amoxicillin'])).toBe(60);
  });

  it('fuzzy brand returns 50..60', () => {
    const score = rankScore('paracetamol', 'paracetamole', []);
    expect(score).toBeGreaterThanOrEqual(50);
    expect(score).toBeLessThan(60);
  });

  it('fuzzy ingredient returns 40..50', () => {
    const score = rankScore('augmentin', 'amoxycillin', ['amoxicillin']);
    expect(score).toBeGreaterThanOrEqual(40);
    expect(score).toBeLessThan(50);
  });

  it('brand.contains returns 30', () => {
    expect(rankScore('augmentin amoxicillin', 'amox', [])).toBe(30);
  });

  it('ingredient.contains returns 20 (khi brand hoàn toàn khác và query ở giữa ingredient)', () => {
    expect(rankScore('paracetamol', 'ycod', ['oxycodone'])).toBe(20);
  });

  it('below threshold returns 0', () => {
    expect(rankScore('abc', 'xyz', ['def'])).toBe(0);
  });
});

describe('parseStrengthMg', () => {
  it('mg as-is', () => {
    expect(parseStrengthMg('500mg')).toBe(500);
    expect(parseStrengthMg('500 mg')).toBe(500);
  });
  it('g to mg', () => {
    expect(parseStrengthMg('1g')).toBe(1000);
    expect(parseStrengthMg('0.5 g')).toBe(500);
  });
  it('mcg to mg', () => {
    expect(parseStrengthMg('100mcg')).toBeCloseTo(0.1);
  });
  it('comma decimal', () => {
    expect(parseStrengthMg('0,5mg')).toBe(0.5);
  });
  it('returns null when no number+unit', () => {
    expect(parseStrengthMg('paracetamol')).toBeNull();
    expect(parseStrengthMg('')).toBeNull();
  });
  it('ml/IU treated as opaque', () => {
    expect(parseStrengthMg('5ml')).toBe(5);
    expect(parseStrengthMg('1000 IU')).toBe(1000);
  });
});

describe('escapeRegexPattern', () => {
  it('escapes metacharacters', () => {
    expect(escapeRegexPattern('a.b*c')).toBe('a\\.b\\*c');
    expect(escapeRegexPattern('(par)+')).toBe('\\(par\\)\\+');
  });
  it('passes plain text unchanged', () => {
    expect(escapeRegexPattern('paracetamol')).toBe('paracetamol');
  });
});
