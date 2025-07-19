import { calculateFocusXP, calculateIntensityRate, getIntensityLabel } from './xp.js';

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

test('getIntensityLabel returns correct label based on rate', () => {
  const intensityLevels = [
    { min: 0, max: 20, label: 'Errant du Néant' },
    { min: 21, max: 40, label: 'Apprenti Perdu' },
    { min: 41, max: 60, label: 'Disciple Motivé' },
    { min: 61, max: 75, label: 'Adepte Déterminé' },
    { min: 76, max: 85, label: 'Expert Focalisé' },
    { min: 86, max: 95, label: 'Maître Discipliné' },
    { min: 96, max: 99, label: 'Légende Vivante' },
    { min: 100, max: 100, label: 'Transcendant' },
  ];

  expect(getIntensityLabel(10, intensityLevels)).toBe('Errant du Néant');
  expect(getIntensityLabel(55, intensityLevels)).toBe('Disciple Motivé');
  expect(getIntensityLabel(80, intensityLevels)).toBe('Expert Focalisé');
  expect(getIntensityLabel(100, intensityLevels)).toBe('Transcendant');
});
