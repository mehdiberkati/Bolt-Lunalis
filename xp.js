export function calculateFocusXP(minutes, mandatorySessions) {
  const baseXP = minutes / 18;
  const isBonus = mandatorySessions >= 2;
  return Math.round(baseXP * (isBonus ? 2 : 1));
}

export function calculateIntensityRate(weeklyScores) {
  if (!weeklyScores || weeklyScores.length === 0) return 0;
  const recent = weeklyScores.slice(-4);
  const average =
    recent.reduce((sum, score) => sum + score.percentage, 0) / recent.length;
  return Math.round(average);
}

export function getIntensityLabel(rate, intensityLevels) {
  const level = intensityLevels.find((l) => rate >= l.min && rate <= l.max);
  return level ? level.label : 'Errant du Néant';
}
