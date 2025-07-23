function validateData(data) {
  if (!data || typeof data !== 'object') return false;
  const arrayFields = [
    'projects',
    'focusSessions',
    'xpHistory',
    'seasonHistory',
    'weeklyReviews',
    'achievements'
  ];
  if (arrayFields.some((field) => !Array.isArray(data[field]))) {
    return false;
  }
  if (typeof data.totalXP !== 'number') return false;
  if (data.version !== undefined && typeof data.version !== 'number') return false;
  return true;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { validateData };
} else {
  window.validateData = validateData;
}
