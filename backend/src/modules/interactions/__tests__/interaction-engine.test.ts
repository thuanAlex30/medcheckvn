import { describe, it, expect } from 'vitest';
import {
  buildUniquePairs,
  buildRxCuiToDrugIds,
  buildBidirectionalQuery,
  buildInteractionPairs,
  buildPersonalizedWarnings,
  sortBySeverityDesc,
} from '../interaction-engine.service';
import type { DrugShape, InteractionShape } from '../interaction-engine.service';

const drugId = (s: string) => ({ toString: () => s });

describe('buildUniquePairs', () => {
  it('returns empty for < 2 items', () => {
    expect(buildUniquePairs([])).toEqual([]);
    expect(buildUniquePairs(['a'])).toEqual([]);
  });

  it('returns n*(n-1)/2 pairs for n items', () => {
    const pairs = buildUniquePairs(['a', 'b', 'c']);
    expect(pairs).toHaveLength(3);
    expect(pairs).toEqual([['a', 'b'], ['a', 'c'], ['b', 'c']]);
  });

  it('handles 10 items without duplicates', () => {
    const items = Array.from({ length: 10 }, (_, i) => `rx${i}`);
    const pairs = buildUniquePairs(items);
    expect(pairs).toHaveLength((10 * 9) / 2);
    const set = new Set(pairs.map((p) => p.join('|')));
    expect(set.size).toBe(pairs.length);
  });
});

describe('buildRxCuiToDrugIds', () => {
  it('groups multiple drugs under same rxCUI', () => {
    const drugs: DrugShape[] = [
      { _id: drugId('d1'), brandNameVi: 'A', activeIngredients: [{ name: 'P', rxCUI: '161' }] },
      { _id: drugId('d2'), brandNameVi: 'B', activeIngredients: [{ name: 'P', rxCUI: '161' }] },
      { _id: drugId('d3'), brandNameVi: 'C', activeIngredients: [{ name: 'X', rxCUI: '999' }] },
    ];
    const map = buildRxCuiToDrugIds(drugs);
    expect(map.get('161')?.sort()).toEqual(['d1', 'd2']);
    expect(map.get('999')).toEqual(['d3']);
  });

  it('skips ingredients without rxCUI', () => {
    const drugs: DrugShape[] = [
      { _id: drugId('d1'), brandNameVi: 'A', activeIngredients: [{ name: 'X' }] },
    ];
    expect(buildRxCuiToDrugIds(drugs).size).toBe(0);
  });

  it('accepts string _id', () => {
    const drugs: DrugShape[] = [
      { _id: 'abc' as unknown as DrugShape['_id'], brandNameVi: 'A', activeIngredients: [{ name: 'P', rxCUI: '1' }] },
    ];
    expect(buildRxCuiToDrugIds(drugs).get('1')).toEqual(['abc']);
  });
});

describe('buildBidirectionalQuery', () => {
  it('generates 2 conditions per pair (A→B and B→A)', () => {
    const conds = buildBidirectionalQuery([['161', '1191']]);
    expect(conds).toEqual([
      { ingredientARxCUI: '161', ingredientBRxCUI: '1191' },
      { ingredientARxCUI: '1191', ingredientBRxCUI: '161' },
    ]);
  });

  it('deduplicates when same pair appears reversed', () => {
    const conds = buildBidirectionalQuery([['161', '1191'], ['1191', '161']]);
    expect(conds).toHaveLength(2);
  });

  it('skips A===B pairs', () => {
    expect(buildBidirectionalQuery([['161', '161']])).toEqual([]);
  });

  it('handles multiple pairs', () => {
    const conds = buildBidirectionalQuery([['a', 'b'], ['c', 'd']]);
    expect(conds).toHaveLength(4);
  });
});

describe('buildInteractionPairs', () => {
  const drugMap = new Map<string, DrugShape>([
    ['d1', { _id: drugId('d1'), brandNameVi: 'Paracetamol', activeIngredients: [] }],
    ['d2', { _id: drugId('d2'), brandNameVi: 'Warfarin', activeIngredients: [] }],
  ]);
  const rxMap = new Map([['161', ['d1']], ['11289', ['d2']]]);

  it('expands interaction to drug pairs', () => {
    const interactions: InteractionShape[] = [
      {
        ingredientARxCUI: '161',
        ingredientBRxCUI: '11289',
        severity: 'nặng',
        descriptionVi: 'Tăng chảy máu',
        recommendationVi: 'Theo dõi INR',
      },
    ];
    const pairs = buildInteractionPairs(interactions, drugMap, rxMap);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toMatchObject({
      drugAId: 'd1',
      drugBId: 'd2',
      drugAName: 'Paracetamol',
      drugBName: 'Warfarin',
      severity: 'nặng',
    });
  });

  it('expands 1-to-many and many-to-many', () => {
    const drugMapLocal = new Map<string, DrugShape>([
      ['d1', { _id: drugId('d1'), brandNameVi: 'A1', activeIngredients: [] }],
      ['d2', { _id: drugId('d2'), brandNameVi: 'A2', activeIngredients: [] }],
      ['d3', { _id: drugId('d3'), brandNameVi: 'B1', activeIngredients: [] }],
    ]);
    const rxLocal = new Map<string, string[]>([
      ['rxA', ['d1', 'd2']],
      ['rxB', ['d3']],
    ]);
    const interactions: InteractionShape[] = [
      {
        ingredientARxCUI: 'rxA',
        ingredientBRxCUI: 'rxB',
        severity: 'trung bình',
        descriptionVi: 'X',
      },
    ];
    const pairs = buildInteractionPairs(interactions, drugMapLocal, rxLocal);
    expect(pairs.map((p) => `${p.drugAId}-${p.drugBId}`).sort()).toEqual(['d1-d3', 'd2-d3']);
  });

  it('skips when drugA === drugB', () => {
    const interactions: InteractionShape[] = [
      { ingredientARxCUI: 'rxX', ingredientBRxCUI: 'rxX', severity: 'nhẹ', descriptionVi: 'self' },
    ];
    expect(buildInteractionPairs(interactions, drugMap, rxMap)).toEqual([]);
  });

  it('omits mechanism/recommendation when undefined', () => {
    const interactions: InteractionShape[] = [
      { ingredientARxCUI: '161', ingredientBRxCUI: '11289', severity: 'nhẹ', descriptionVi: 'X' },
    ];
    const pairs = buildInteractionPairs(interactions, drugMap, rxMap);
    expect(pairs[0]!.mechanismVi).toBeUndefined();
    expect(pairs[0]!.recommendationVi).toBeUndefined();
  });
});

describe('buildPersonalizedWarnings', () => {
  const drugs: DrugShape[] = [
    {
      _id: drugId('d1'),
      brandNameVi: 'Warfarin',
      activeIngredients: [],
      warningsForConditions: [
        { condition: 'suy gan', warningVi: 'Cẩn thận', severity: 'nặng' },
        { condition: 'mang thai', warningVi: 'Không dùng', severity: 'nặng' },
      ],
    },
    {
      _id: drugId('d2'),
      brandNameVi: 'Metformin',
      activeIngredients: [],
      warningsForConditions: [
        { condition: 'suy thận', warningVi: 'Giảm liều', severity: 'trung bình' },
      ],
    },
  ];

  it('returns empty when user has no conditions', () => {
    expect(buildPersonalizedWarnings(drugs)).toEqual([]);
    expect(buildPersonalizedWarnings(drugs, [])).toEqual([]);
  });

  it('matches case-insensitive', () => {
    const out = buildPersonalizedWarnings(drugs, ['SUY GAN']);
    expect(out).toHaveLength(1);
    expect(out[0]!.drugName).toBe('Warfarin');
    expect(out[0]!.condition).toBe('suy gan');
  });

  it('uses substring match (warn.condition.includes(userCondition))', () => {
    const out = buildPersonalizedWarnings(drugs, ['suy']);
    expect(out.map((w) => w.drugName).sort()).toEqual(['Metformin', 'Warfarin']);
  });

  it('does not match unrelated conditions', () => {
    const out = buildPersonalizedWarnings(drugs, ['hen suyễn']);
    expect(out).toEqual([]);
  });
});

describe('sortBySeverityDesc', () => {
  it('orders nặng → trung bình → nhẹ', () => {
    const items = [
      { id: 1, severity: 'nhẹ' as const },
      { id: 2, severity: 'nặng' as const },
      { id: 3, severity: 'trung bình' as const },
    ];
    const sorted = sortBySeverityDesc(items);
    expect(sorted.map((i) => i.id)).toEqual([2, 3, 1]);
  });

  it('does not mutate input', () => {
    const items = [{ severity: 'nhẹ' as const }, { severity: 'nặng' as const }];
    const sorted = sortBySeverityDesc(items);
    expect(items[0]!.severity).toBe('nhẹ');
    expect(sorted[0]!.severity).toBe('nặng');
  });

  it('returns empty for empty input', () => {
    expect(sortBySeverityDesc([])).toEqual([]);
  });
});
