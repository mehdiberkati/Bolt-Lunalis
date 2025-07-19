import { MyRPGLifeApp } from './script.js';

class TestApp extends MyRPGLifeApp {
  loadData() {
    return {
      totalXP: 0,
      dailyXP: 0,
      lastDailyReset: new Date().toDateString(),
      projects: [],
      focusSessions: [],
      dailyActions: {},
      xpHistory: [],
      achievements: [],
      weeklyReviews: [],
      settings: { theme: 'default', soundNotifications: true, chartRange: 7 },
    };
  }
  init() {}
  updateUI() {}
  saveData() {}
}

test('resetDailyStats resets dailyXP to zero', () => {
  const app = new TestApp();
  app.data.dailyXP = 42;
  app.resetDailyStats();
  expect(app.data.dailyXP).toBe(0);
});
