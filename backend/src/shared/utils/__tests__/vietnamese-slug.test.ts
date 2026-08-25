import { describe, it, expect } from 'vitest';
import { levenshtein, similarity, viNormalize, viSlug } from '../vietnamese-slug';

describe('viNormalize', () => {
  it('removes accents from Vietnamese text', () => {
    expect(viNormalize('paracetamol')).toBe('paracetamol');
    expect(viNormalize('thuốc')).toBe('thuoc');
    expect(viNormalize('ẮC')).toBe('ac');
  });

  it('handles empty string', () => {
    expect(viNormalize('')).toBe('');
  });

  it('trims whitespace', () => {
    expect(viNormalize('  amoxi  ')).toBe('amoxi');
  });
});

describe('viSlug', () => {
  it('converts to lowercase slug', () => {
    expect(viSlug('Paracetamol 500mg')).toBe('paracetamol-500mg');
    expect(viSlug('Omeprazole 20mg')).toBe('omeprazole-20mg');
  });

  it('removes special characters', () => {
    expect(viSlug('Thuốc đặc biệt!!!')).toBe('thuoc-dac-biet');
  });
});

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('abc', 'abc')).toBe(0);
  });

  it('returns length for empty first arg', () => {
    expect(levenshtein('', 'abc')).toBe(3);
  });

  it('returns length for empty second arg', () => {
    expect(levenshtein('abc', '')).toBe(3);
  });

  it('calculates correct distance', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('paracetamol', 'paracetamole')).toBe(1);
  });
});

describe('similarity', () => {
  it('returns 1 for identical strings', () => {
    expect(similarity('paracetamol', 'paracetamol')).toBe(1);
  });

  it('returns high score for close strings', () => {
    expect(similarity('paracetamol', 'paracetamole')).toBeGreaterThan(0.9);
    expect(similarity('amoxicillin', 'amoxycillin')).toBeGreaterThan(0.8);
  });

  it('handles accent normalization', () => {
    expect(similarity('thuoc', 'thuốc')).toBe(1);
    expect(similarity('omrazole', 'omeprazole')).toBeGreaterThanOrEqual(0.8);
  });

  it('returns lower score for very different strings', () => {
    expect(similarity('abc', 'xyz')).toBeLessThan(0.5);
  });
});
