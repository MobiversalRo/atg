import { expect, test } from 'vitest';
import { computeSiloBoard } from '@/lib/domain/siloboard';

const facilities = [
  { id: 'f1', name: 'Siloz 1', max_capacity_ton: 5000, current_load_ton: 3000 },
  { id: 'f2', name: 'Magazia A', max_capacity_ton: 2000, current_load_ton: 0 },
];
const txns = [
  { facility_id: 'f1', crop_id: 'wheat', txn_type: 'in' as const, quantity_ton: 3250 },
  { facility_id: 'f1', crop_id: 'wheat', txn_type: 'out' as const, quantity_ton: 250 },
];

test('fill % reflects current load over capacity', () => {
  const board = computeSiloBoard(facilities, txns);
  expect(board[0].fillPct).toBeCloseTo(60);
  expect(board[1].fillPct).toBe(0);
});

test('per-crop segments net in/out and span their share of capacity', () => {
  const board = computeSiloBoard(facilities, txns);
  expect(board[0].segments).toEqual([
    { cropId: 'wheat', tons: 3000, startPct: 0, endPct: 60 },
  ]);
});

test('empty facility has no segments', () => {
  expect(computeSiloBoard(facilities, txns)[1].segments).toEqual([]);
});
