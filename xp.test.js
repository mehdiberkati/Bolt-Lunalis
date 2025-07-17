import { calculateFocusXP, calculateIntensityRate } from './xp.js';

test('calculateFocusXP returns bonus XP after mandatory sessions', () => {
  expect(calculateFocusXP(36, 2)).toBe(4); // 36 min -> baseXP=2, double=4
});

test('calculateIntensityRate averages last four weeks', () => {
  const scores = [
    { percentage: 50 },
    { percentage: 70 },
    { percentage: 80 },
    { percentage: 60 },
    { percentage: 90 },
  ];
  expect(calculateIntensityRate(scores)).toBe(75);
});
