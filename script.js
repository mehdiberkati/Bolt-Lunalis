const CURRENT_DATA_VERSION = 1;

// Intensity levels used to display the progress bar and labels
const INTENSITY_LEVELS = [
  {
    min: 0,
    max: 39,
    emoji: '👤',
    title: 'Errant du Néant',
    role: 'Déserteur',
    description:
      "Tu n\u2019es pas encore dans le Game. Tu fuis tes missions, tu manques de régularité et d\u2019effort soutenu. Rien n\u2019est encore vraiment enclenché.",
    color: 'linear-gradient(#666,#000)',
    glow: '#888888'
  },
  {
    min: 40,
    max: 59,
    emoji: '⚖️',
    title: 'Survivant',
    role: 'Inconstant',
    description:
      "Tu fais le strict minimum. Tu es plus dans la réaction que dans l\u2019action. Tu avances à petits pas, mais sans vraie direction ou maîtrise.",
    color: '#16a34a'
  },
  {
    min: 60,
    max: 74,
    emoji: '🔥',
    title: 'Forgeron de Volonté',
    role: 'Bâtisseur Stable',
    description:
      "Tu commences à structurer, à créer une base solide. Tu avances, tu construis, mais tu t\u2019arrêtes parfois en chemin. Il manque encore de la régularité.",
    color: '#f97316'
  },
  {
    min: 75,
    max: 84,
    emoji: '💎',
    title: 'Artisan du Focus',
    role: 'Fort & cohérent',
    description:
      "Tu produis régulièrement, tu tiens tes engagements. Tu gagnes du terrain, tu consolides ton système. La constance commence à porter ses fruits.",
    color: 'linear-gradient(#0911b0,#7408c7)'
  },
  {
    min: 85,
    max: 94,
    emoji: '⚔️',
    title: 'Champion du Flow',
    role: 'Leader Ultra discipliné',
    description:
      "Tu incarnes la discipline et la constance. Tu avances avec puissance, tu es fiable et tu inspires ceux qui t\u2019observent. Ton momentum est fort.",
    color: '#dc2626'
  },
  {
    min: 95,
    max: 100,
    emoji: '🌌',
    title: 'Transcendant',
    role: 'Maître',
    description:
      "Tu exploses tous tes objectifs. Tu es en pleine fusion avec ta mission. Rien ne peut t\u2019arrêter : tu es aligné, focus, inarrêtable.",
    color: 'linear-gradient(45deg,#2c1b7e,#601ebd,#007acc,#39b54a)',
    glow: '#9b5de5'
  }
];

function extractBaseColor(color) {
  if (color.startsWith('linear-gradient')) {
    const match = color.match(/#(?:[0-9a-fA-F]{3,6})/);
    return match ? match[0] : '#ffffff';
  }
  return color;
}

function lightenColor(hex, percent) {
  let num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const r = (num >> 16) + amt;
  const g = ((num >> 8) & 0x00ff) + amt;
  const b = (num & 0x00ff) + amt;
  const clamp = v => Math.max(0, Math.min(255, v));
  return (
    '#' + ((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b)).toString(16).slice(1)
  );
}

function hexToRgba(hex, alpha = 1) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

const INTENSITY_VALUE_GLOW_OPACITY = 0.4;

class MyRPGLifeApp {
    constructor() {
    this.data = this.loadData();
    this.timer = null;
    this.weeklyCountdownInterval = null;
    this.endSound = null;
    this.chartRange = this.data.settings?.chartRange || 7;
    this.timerState = {
      isRunning: false,
      isPaused: false,
      duration: 25 * 60, // 25 minutes en secondes
      remaining: 25 * 60,
      currentProject: null,
      startTimestamp: null,
      isBreak: false,
      breakRemaining: 0,
      breakCount: 0,
      totalBreaks: 0,
      autoBreaks: false,
      spotifyModeActive: false
    };

    // Project editing state
    this.editingProjectId = null;

    this.init();

    if (!this.data.started) {
      this.showStartOverlay();
    }
  }

  init() {
    this.setupEventListeners();
    this.checkDailyReset();
    this.checkSeasonReset();
    this.updateUI();
    this.updateFocusStats();
    this.startWeeklyCountdown();
    this.startAutoSave();
    this.scheduleDailyReset();
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const section = e.currentTarget.dataset.section;
        this.showSection(section);
      });
    });

    // Boutons d'action du dashboard
    const sportBtn = document.getElementById('sportBtn');
    if (sportBtn) {
      sportBtn.addEventListener('click', () => this.logSport());
    }

    const sleepBtn = document.getElementById('sleepBtn');
    if (sleepBtn) {
      sleepBtn.addEventListener('click', () => this.showSleepModal());
    }

    const rankCard = document.getElementById('rankCard');
    if (rankCard) {
      rankCard.addEventListener('click', () => this.showRanksModal());
    }

    const intensityCard = document.querySelector('.intensity-card');
    if (intensityCard) {
      intensityCard.addEventListener('click', () => this.showIntensityModal());
    }

    // Bouton focus principal
    const focusStartBtn = document.getElementById('focusStartBtn');
    if (focusStartBtn) {
      focusStartBtn.addEventListener('click', () => this.showSection('focus'));
    }

    // Timer controls
    const startPauseBtn = document.getElementById('startPauseBtn');
    if (startPauseBtn) {
      startPauseBtn.addEventListener('click', () => this.toggleTimer());
    }

    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.cancelTimer());
    }

    // Duration controls
    const decreaseBtn = document.getElementById('decreaseDurationBtn');
    const increaseBtn = document.getElementById('increaseDurationBtn');
    
    if (decreaseBtn) {
      decreaseBtn.addEventListener('click', () => this.adjustDuration(-5));
    }
    
    if (increaseBtn) {
      increaseBtn.addEventListener('click', () => this.adjustDuration(5));
    }

    const autoBreaksToggle = document.getElementById('autoBreaks');
    if (autoBreaksToggle) {
      autoBreaksToggle.addEventListener('change', () => this.updateBreakInfo());
    }

    // Project management
    const createProjectBtn = document.getElementById('createProjectBtn');
    if (createProjectBtn) {
      createProjectBtn.addEventListener('click', () => this.showProjectForm());
    }

    // Weekly review
    const weeklyReviewBtn = document.getElementById('weeklyReviewBtn');
    if (weeklyReviewBtn) {
      weeklyReviewBtn.addEventListener('click', () => this.goToWeeklyReview());
    }

    // Modal overlay
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay && !this.timerState.isBreak) {
          this.closeModal();
        }
      });
    }

    const startAdventureBtn = document.getElementById('startAdventureBtn');
    if (startAdventureBtn) {
      startAdventureBtn.addEventListener('click', () => this.startApp());
    }

    const seasonGoalSelect = document.getElementById('seasonGoalSelect');
    if (seasonGoalSelect) {
      seasonGoalSelect.addEventListener('change', (e) => {
        this.data.seasonGoalXP = parseInt(e.target.value, 10);
        startAdventureBtn.disabled = !this.data.seasonGoalXP;
        this.saveData();
        this.updateDashboard();
      });
    }
  }

  showSection(sectionName) {
    // Masquer toutes les sections
    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.remove('active');
    });

    // Désactiver tous les boutons de navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    // Afficher la section demandée
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    // Activer le bouton de navigation correspondant
    const targetBtn = document.querySelector(`[data-section="${sectionName}"]`);
    if (targetBtn) {
      targetBtn.classList.add('active');
    }

    // Actions spécifiques selon la section
    switch (sectionName) {
      case 'projects':
        this.renderProjects();
        break;
      case 'achievements':
        this.resetAchievementsAnimation();
        this.renderAchievements();
        break;
      case 'progression':
        this.renderProgression();
        break;
      case 'weekly':
        this.renderWeeklyReview();
        break;
      case 'settings':
        this.renderSettings();
        break;
    }
  }

  // Actions du dashboard
  logSport() {
    const today = new Date().toDateString();
    if (!this.data.dailyActions[today]) {
      this.data.dailyActions[today] = {};
    }
    
    if (!this.data.dailyActions[today].sport) {
      this.data.dailyActions[today].sport = true;
      this.addXP(3, 'Sport (50min)');
      this.showNotification('💪 +3 XP pour le sport !', 'success');
      this.updateUI();
    } else {
      this.showNotification('Sport déjà enregistré aujourd\'hui', 'info');
    }
    this.saveData();
  }

  showSleepModal() {
    const modalContent = `
      <div class="modal-header">
        <h3>😴 Enregistrer le Sommeil</h3>
        <button class="modal-close" onclick="app.closeModal()">×</button>
      </div>
      <div class="modal-body">
        <div class="sleep-options">
          <button class="sleep-btn good" onclick="app.logSleep('good')">
            <span class="sleep-icon">🌙</span>
            <div class="sleep-info">
              <strong>Bon sommeil</strong>
              <small>>7h avant 22h</small>
            </div>
            <span class="sleep-xp">+2 XP</span>
          </button>
          
          <button class="sleep-btn average" onclick="app.logSleep('average')">
            <span class="sleep-icon">😴</span>
            <div class="sleep-info">
              <strong>Sommeil correct</strong>
              <small>>7h avant minuit</small>
            </div>
            <span class="sleep-xp">+1 XP</span>
          </button>
          
          <button class="sleep-btn bad" onclick="app.logSleep('bad')">
            <span class="sleep-icon">😵</span>
            <div class="sleep-info">
              <strong>Mauvais sommeil</strong>
              <small><7h ou après minuit</small>
            </div>
            <span class="sleep-xp">0 XP</span>
          </button>
        </div>
      </div>
    `;
    
    this.showModal(modalContent);
  }

  logSleep(quality) {
    const today = new Date().toDateString();
    if (!this.data.dailyActions[today]) {
      this.data.dailyActions[today] = {};
    }
    
    if (!this.data.dailyActions[today].sleep) {
      this.data.dailyActions[today].sleep = quality;
      
      let xp = 0;
      let message = '';
      
      switch (quality) {
        case 'good':
          xp = 2;
          message = '🌙 +2 XP pour un excellent sommeil !';
          break;
        case 'average':
          xp = 1;
          message = '😴 +1 XP pour un sommeil correct';
          break;
        case 'bad':
          xp = 0;
          message = '😵 Aucun XP - Essayez de mieux dormir demain';
          break;
      }
      
      if (xp > 0) {
        this.addXP(xp, `Sommeil ${quality}`);
      }
      
      this.showNotification(message, xp > 0 ? 'success' : 'warning');
      this.closeModal();
      this.updateUI();
    } else {
      this.showNotification('Sommeil déjà enregistré aujourd\'hui', 'info');
      this.closeModal();
    }
    this.saveData();
  }

  showDistractionModal() {
    const modalContent = `
      <div class="modal-header">
        <h3>📱 Déclarer des Distractions</h3>
        <button class="modal-close" onclick="app.closeModal()">×</button>
      </div>
      <div class="modal-body">
        <div class="distraction-options">
          <button class="distraction-btn instagram" onclick="app.logDistraction('instagram')">
            <span class="distraction-icon">📸</span>
            <div class="distraction-info">
              <strong>Instagram +1h</strong>
              <small>Perte de temps sur les réseaux</small>
            </div>
            <span class="distraction-penalty">-3 XP</span>
          </button>
          
          <button class="distraction-btn music" onclick="app.logDistraction('music')">
            <span class="distraction-icon">🎵</span>
            <div class="distraction-info">
              <strong>Musique +1h30</strong>
              <small>Écoute excessive de musique</small>
            </div>
            <span class="distraction-penalty">-5 XP</span>
          </button>
        </div>
      </div>
    `;
    
    this.showModal(modalContent);
  }

  logDistraction(type) {
    const today = new Date().toDateString();
    if (!this.data.dailyActions[today]) {
      this.data.dailyActions[today] = {};
    }
    
    if (!this.data.dailyActions[today].distractions) {
      this.data.dailyActions[today].distractions = [];
    }
    
    let penalty = 0;
    let message = '';
    
    switch (type) {
      case 'instagram':
        penalty = 3;
        message = '📸 -3 XP pour Instagram';
        break;
      case 'music':
        penalty = 5;
        message = '🎵 -5 XP pour musique excessive';
        break;
    }
    
    this.data.dailyActions[today].distractions.push(type);
    this.addXP(-penalty, `Distraction ${type}`);
    this.showNotification(message, 'error');
    this.closeModal();
    this.updateUI();
    this.saveData();
  }

  // Timer functions
  toggleTimer() {
    if (!this.timerState.isRunning) {
      this.startTimer();
    } else {
      this.pauseTimer();
    }
  }

  startTimer() {
    this.timerState.isRunning = true;
    this.endSound = new Audio('assets/sounds/session-end.mp3');
    this.timerState.isPaused = false;

    const autoToggle = document.getElementById('autoBreaks');
    this.timerState.autoBreaks = autoToggle ? autoToggle.checked : false;
    this.timerState.totalBreaks = Math.floor(this.timerState.duration / (25 * 60));
    this.timerState.breakCount = this.timerState.breakCount || 0;

    this.updateBreakInfo();

    this.timerState.startTimestamp = Date.now() -
      (this.timerState.duration - this.timerState.remaining) * 1000;

    this.enterFocusMode();
    this.disableTimerOptions();

    const spotifyBox = document.getElementById('spotifyMode');
    this.timerState.spotifyModeActive = !!spotifyBox?.checked;
    if (this.timerState.spotifyModeActive && window.electronAPI) {
      if (window.electronAPI.launchSpotifyApp) {
        window.electronAPI.launchSpotifyApp();
      }
      if (window.electronAPI.playSpotify) {
        window.electronAPI.playSpotify();
      }
    }
    
    const startPauseBtn = document.getElementById('startPauseBtn');
    const startPauseText = document.getElementById('startPauseText');
    
    if (startPauseBtn && startPauseText) {
      startPauseBtn.classList.add('running');
      startPauseText.textContent = 'Pause';
    }
    
    this.timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.timerState.startTimestamp) / 1000);
      this.timerState.remaining = Math.max(this.timerState.duration - elapsed, 0);
      this.updateTimerDisplay();

      if (this.timerState.remaining <= 0) {
        this.completeTimer();
      }

      if (
        this.timerState.autoBreaks &&
        this.timerState.breakCount < this.timerState.totalBreaks &&
        this.timerState.duration - this.timerState.remaining >=
          (this.timerState.breakCount + 1) * 25 * 60
      ) {
        this.startBreak();
      }
    }, 1000);
  }

  pauseTimer() {
    this.timerState.isRunning = false;
    this.timerState.isPaused = true;

    const elapsed = Math.floor((Date.now() - this.timerState.startTimestamp) / 1000);
    this.timerState.remaining = Math.max(this.timerState.duration - elapsed, 0);

    this.exitFocusMode();
    this.enableTimerOptions();
    
    const startPauseBtn = document.getElementById('startPauseBtn');
    const startPauseText = document.getElementById('startPauseText');
    
    if (startPauseBtn && startPauseText) {
      startPauseBtn.classList.remove('running');
      startPauseText.textContent = 'Reprendre';
    }
    
    clearInterval(this.timer);
  }

  cancelTimer() {
    if (this.timerState.startTimestamp) {
      const elapsed = Math.floor((Date.now() - this.timerState.startTimestamp) / 1000 / 60);
      if (elapsed >= 15) {
        const xpGained = this.calculateFocusXP(elapsed);
        const isBonus = this.getMandatorySessionsToday() >= 2;
        this.addXP(xpGained, `Session Annulée ${elapsed}min`);
        this.recordFocusSession(elapsed, this.timerState.duration / 60, xpGained, isBonus ? 'bonus' : 'normal');
        this.updateFocusStats();
        this.updateDashboard();
      }
    }
    if (this.timerState.spotifyModeActive && window.electronAPI?.pauseSpotify) {
      window.electronAPI.pauseSpotify();
    }
    this.resetTimer();
  }

  resetTimer() {
    this.timerState.isRunning = false;
    this.timerState.isPaused = false;
    this.timerState.remaining = this.timerState.duration;
    this.timerState.startTimestamp = null;
    this.timerState.isBreak = false;
    this.timerState.breakRemaining = 0;
    this.timerState.breakCount = 0;
    this.timerState.spotifyModeActive = false;

    this.exitFocusMode();
    this.enableTimerOptions();
    
    const startPauseBtn = document.getElementById('startPauseBtn');
    const startPauseText = document.getElementById('startPauseText');
    
    if (startPauseBtn && startPauseText) {
      startPauseBtn.classList.remove('running');
      startPauseText.textContent = 'Commencer Focus';
    }
    
    clearInterval(this.timer);
    this.updateTimerDisplay();
    this.updateBreakInfo();
  }

  completeTimer() {
    clearInterval(this.timer);

    this.exitFocusMode();
    this.enableTimerOptions();
    if (this.data.settings?.soundNotifications && this.endSound) {
      this.endSound.play();
    }
    
    const minutes = this.timerState.duration / 60;
    const xpGained = this.calculateFocusXP(minutes);
    const isBonus = this.getMandatorySessionsToday() >= 2;

    this.addXP(xpGained, `Session Focus ${minutes}min`);
    if (xpGained > 1) {
      this.showXPPop(xpGained);
    }
    this.recordFocusSession(minutes, minutes, xpGained, isBonus ? 'bonus' : 'normal');

    this.updateFocusStats();
    this.updateDashboard();

    if (this.timerState.spotifyModeActive && window.electronAPI?.pauseSpotify) {
      window.electronAPI.pauseSpotify();
    }

    this.showNotification(`🎯 Session terminée ! +${xpGained} XP`, 'success');
    this.resetTimer();
  }

  adjustDuration(minutes) {
    if (!this.timerState.isRunning) {
      const newDuration = Math.max(15, Math.min(120, (this.timerState.duration / 60) + minutes)) * 60;
      this.timerState.duration = newDuration;
      this.timerState.remaining = newDuration;
      
      const durationDisplay = document.getElementById('durationDisplay');
      if (durationDisplay) {
        durationDisplay.textContent = `${newDuration / 60} min`;
      }
      
      this.updateTimerDisplay();
      this.updateBreakInfo();
    }
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.timerState.remaining / 60);
    const seconds = this.timerState.remaining % 60;
    
    const timerTime = document.getElementById('timerTime');
    if (timerTime) {
      timerTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    const timerXPPreview = document.getElementById('timerXPPreview');
    if (timerXPPreview) {
      const totalMinutes = this.timerState.duration / 60;
      const xp = this.calculateFocusXP(totalMinutes);
      timerXPPreview.textContent = `+${xp} XP`;
    }
    
    // Update progress circle
    const progress = ((this.timerState.duration - this.timerState.remaining) / this.timerState.duration) * 100;
    const timerProgress = document.getElementById('timerProgress');
    if (timerProgress) {
      const circumference = 2 * Math.PI * 90;
      const offset = circumference - (progress / 100) * circumference;
      timerProgress.style.strokeDasharray = circumference;
      timerProgress.style.strokeDashoffset = offset;
    }
  }

  updateBreakInfo() {
    const info = document.getElementById('breakInfo');
    const autoBreaksToggle = document.getElementById('autoBreaks');
    if (!info || !autoBreaksToggle) return;
    if (autoBreaksToggle.checked) {
      const total = Math.floor(this.timerState.duration / (25 * 60));
      const remaining = total - this.timerState.breakCount;
      const label = this.timerState.isRunning || this.timerState.breakCount > 0
        ? `${remaining} pause${remaining > 1 ? 's' : ''} restantes pour la session`
        : `${total} pause${total > 1 ? 's' : ''} prévues`;
      info.innerHTML = `<span class="remaining">${label}</span>`;
    } else {
      info.textContent = '';
    }
  }

  showBreakModal() {
    const modalContent = `
      <div class="modal-header">
        <h3>⏸ Pause</h3>
      </div>
      <div class="modal-body break-body">
        <div class="break-timer" id="breakTimer">05:00</div>
      </div>`;
    this.showModal(modalContent);
  }

  updateBreakDisplay() {
    const timerEl = document.getElementById('breakTimer');
    if (timerEl) {
      const m = Math.floor(this.timerState.breakRemaining / 60)
        .toString()
        .padStart(2, '0');
      const s = (this.timerState.breakRemaining % 60).toString().padStart(2, '0');
      timerEl.textContent = `${m}:${s}`;
    }
  }

  startBreak() {
    this.pauseTimer();
    this.timerState.isBreak = true;
    this.timerState.breakRemaining = 5 * 60;
    this.showBreakModal();
    this.timer = setInterval(() => {
      this.timerState.breakRemaining -= 1;
      this.updateBreakDisplay();
      if (this.timerState.breakRemaining <= 0) {
        this.endBreak();
      }
    }, 1000);
  }

  endBreak() {
    clearInterval(this.timer);
    this.endSound = new Audio('assets/sounds/session-end.mp3');
    this.timerState.isBreak = false;
    this.timerState.breakCount += 1;
    if (this.data.settings?.soundNotifications) {
      this.endSound.play();
    }
    this.closeModal();
    this.startTimer();
  }

  enterFocusMode() {
    const container = document.querySelector('.app-container');
    if (container) {
      container.classList.add('focus-mode');
    }
  }

  exitFocusMode() {
    const container = document.querySelector('.app-container');
    if (container) {
      container.classList.remove('focus-mode');
    }
  }

  disableTimerOptions() {
    const autoBreaks = document.getElementById('autoBreaks');
    const spotifyMode = document.getElementById('spotifyMode');
    if (autoBreaks) autoBreaks.disabled = true;
    if (spotifyMode) spotifyMode.disabled = true;
  }

  enableTimerOptions() {
    const autoBreaks = document.getElementById('autoBreaks');
    const spotifyMode = document.getElementById('spotifyMode');
    if (autoBreaks) autoBreaks.disabled = false;
    if (spotifyMode) spotifyMode.disabled = false;
  }

  // Utility functions
  calculateFocusXP(minutes) {
    const baseXP = Math.floor(minutes / 18);
    const mandatorySessions = this.getMandatorySessionsToday();
    return mandatorySessions >= 2 ? baseXP * 2 : baseXP;
  }

  getMandatorySessionsToday() {
    const today = new Date().toDateString();
    const dailyMinutes = this.data.focusSessions
      .filter(session => new Date(session.date).toDateString() === today)
      .reduce((sum, session) => sum + session.duration, 0);
    return Math.min(2, Math.floor(dailyMinutes / 90));
  }

  recordFocusSession(minutes, scheduledMinutes = minutes, xp = 0, type = 'normal') {
    const projectSelect = document.getElementById('projectSelect');
    const selectedProject = projectSelect ? projectSelect.value : null;

    const session = {
      date: new Date().toISOString(),
      duration: minutes,
      scheduled: scheduledMinutes,
      project: selectedProject || null,
      xp,
      type
    };

    this.data.focusSessions.push(session);

    // Update project total time
    if (selectedProject) {
      const project = this.data.projects.find(p => p.id == selectedProject);
      if (project) {
        project.totalTime += minutes;
      }
    }

    if (window.electronAPI && minutes >= 15) {
      const start = new Date(Date.now() - minutes * 60000).toISOString();
      const description = scheduledMinutes > minutes ? `session de ${scheduledMinutes} min stoppée à ${minutes} min` : '';
      window.electronAPI.logFocusSession({
        start,
        duration: minutes,
        project: session.project,
        xp,
        type,
        description
      });
    }
  }

  addXP(amount, reason) {
    this.checkDailyReset();
    this.data.totalXP += amount;
    this.data.dailyXP += amount;
    
    // Log XP change
    this.data.xpHistory.push({
      date: new Date().toISOString(),
      amount: amount,
      reason: reason,
      total: this.data.totalXP
    });
  }

  // Project management
  showProjectForm(id = null) {
    this.showSection('projects');
    const projectForm = document.getElementById('projectForm');
    const saveBtn = projectForm?.querySelector('.btn-project.primary');

    this.editingProjectId = id;

    if (projectForm) {
      projectForm.style.display = 'block';
    }

    if (saveBtn) {
      saveBtn.textContent = id ? 'Mettre à jour' : 'Créer le Projet';
    }

    const nameInput = document.getElementById('projectName');
    const descInput = document.getElementById('projectDescription');
    const timeGoalInput = document.getElementById('projectTimeGoal');

    if (id) {
      const project = this.data.projects.find(p => p.id === id);
      if (project) {
        if (nameInput) nameInput.value = project.name;
        if (descInput) descInput.value = project.description;
        if (timeGoalInput) timeGoalInput.value = project.timeGoal;
      }
    }
  }

  saveProject() {
    const nameInput = document.getElementById('projectName');
    const descInput = document.getElementById('projectDescription');
    const timeGoalInput = document.getElementById('projectTimeGoal');

    if (!nameInput || !nameInput.value.trim()) return;

    if (this.editingProjectId) {
      const project = this.data.projects.find(p => p.id === this.editingProjectId);
      if (project) {
        project.name = nameInput.value.trim();
        project.description = descInput ? descInput.value.trim() : '';
        project.timeGoal = timeGoalInput ? parseInt(timeGoalInput.value) || 0 : 0;
        this.showNotification('Projet mis à jour !', 'success');
      }
    } else {
      const project = {
        id: Date.now(),
        name: nameInput.value.trim(),
        description: descInput ? descInput.value.trim() : '',
        timeGoal: timeGoalInput ? parseInt(timeGoalInput.value) || 0 : 0,
        createdAt: new Date().toISOString(),
        totalTime: 0
      };
      this.data.projects.push(project);
      this.showNotification('Projet créé avec succès !', 'success');
    }

    this.cancelProject();
    this.renderProjects();
    this.saveData();
  }

  cancelProject() {
    const projectForm = document.getElementById('projectForm');
    const saveBtn = projectForm?.querySelector('.btn-project.primary');

    if (projectForm) {
      projectForm.style.display = 'none';
    }

    const nameInput = document.getElementById('projectName');
    const descInput = document.getElementById('projectDescription');
    const timeGoalInput = document.getElementById('projectTimeGoal');

    if (nameInput) nameInput.value = '';
    if (descInput) descInput.value = '';
    if (timeGoalInput) timeGoalInput.value = '';

    if (saveBtn) saveBtn.textContent = 'Créer le Projet';

    this.editingProjectId = null;
  }

  renderProjects() {
    const projectsGrid = document.getElementById('projectsGrid');
    if (!projectsGrid) return;
    
    if (this.data.projects.length === 0) {
      projectsGrid.innerHTML = `
        <div class="no-projects">
          <div class="no-projects-icon">📋</div>
          <p>Aucun projet créé pour le moment.</p>
          <p>Créez votre premier projet pour commencer à tracker votre temps !</p>
        </div>
      `;
      return;
    }
    
    projectsGrid.innerHTML = this.data.projects.map(project => `
      <div class="project-card">
        <div class="project-header">
          <h3>${project.name}</h3>
          <div class="project-header-right">
            <div class="project-progress-ring">
              <svg class="progress-ring" width="60" height="60">
                <circle cx="30" cy="30" r="25" class="progress-ring-bg"></circle>
                <circle cx="30" cy="30" r="25" class="progress-ring-fill"
                  style="stroke-dasharray: ${2 * Math.PI * 25};
                         stroke-dashoffset: ${2 * Math.PI * 25 * (1 - Math.min(project.totalTime / 60 / (project.timeGoal || 1), 1))}"></circle>
              </svg>
              <div class="progress-percentage">
                ${project.timeGoal > 0 ? Math.round((project.totalTime / 60) / project.timeGoal * 100) : 0}%
              </div>
            </div>
            <div class="project-controls">
              <button class="project-edit" onclick="app.editProject(${project.id})" aria-label="Modifier">✏️</button>
              <button class="project-delete" onclick="app.deleteProject(${project.id})" aria-label="Supprimer">🗑️</button>
            </div>
          </div>
        </div>
        
        <p class="project-description">${project.description || 'Aucune description'}</p>
        
        <div class="project-stats">
          <div class="stat-item">
            <span class="stat-icon">⏱️</span>
            <div class="stat-content">
              <div class="stat-value">${Math.floor(project.totalTime / 60)}h ${project.totalTime % 60}min</div>
              <div class="stat-label">Temps total</div>
            </div>
          </div>
          
          ${project.timeGoal > 0 ? `
            <div class="stat-item">
              <span class="stat-icon">🎯</span>
              <div class="stat-content">
                <div class="stat-value">${project.timeGoal}h</div>
                <div class="stat-label">Objectif</div>
              </div>
            </div>
            
            <div class="stat-item">
              <span class="stat-icon">📈</span>
              <div class="stat-content">
                <div class="stat-value">${Math.max(0, project.timeGoal - Math.floor(project.totalTime / 60))}h</div>
                <div class="stat-label">Restant</div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
    
    // Update project selector in focus timer
    this.updateProjectSelector();
  }
  
  updateProjectSelector() {
    const projectSelect = document.getElementById('projectSelect');
    if (!projectSelect) return;

    projectSelect.innerHTML = '<option value="">Sélectionner un projet</option>' +
      this.data.projects.map(project =>
        `<option value="${project.id}">${project.name}</option>`
      ).join('');
  }

  editProject(id) {
    this.showProjectForm(id);
  }

  deleteProject(id) {
    const confirmed = confirm('Supprimer ce projet ?');
    if (!confirmed) return;

    this.data.projects = this.data.projects.filter(p => p.id !== id);
    this.showNotification('Projet supprimé', 'info');
    this.renderProjects();
    this.saveData();
  }

  // Modal functions
  showModal(content, fullscreen = false) {
    const modal = document.getElementById('modal');
    const modalOverlay = document.getElementById('modalOverlay');

    if (modal && modalOverlay) {
      modal.innerHTML = content;
      if (fullscreen) {
        modal.classList.add('fullscreen');
      } else {
        modal.classList.remove('fullscreen');
      }
      modalOverlay.style.display = 'flex';
      requestAnimationFrame(() => modalOverlay.classList.add('show'));
    }
  }

  closeModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('modal');
    if (modalOverlay) {
      modalOverlay.classList.remove('show');
      setTimeout(() => {
        modalOverlay.style.display = 'none';
      }, 300);
    }
    if (modal) {
      modal.classList.remove('fullscreen');
    }
  }

  flashElement(el) {
    if (!el) return;
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 600);
  }

  // Notification system
  showNotification(message, type = 'info') {
    const container = document.getElementById('notifications');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        container.removeChild(notification);
      }, 300);
    }, 3000);
  }

  showXPPop(amount) {
    const zone = document.getElementById('xpPopContainer');
    if (!zone) return;
    const el = document.createElement('div');
    el.className = 'xp-popup';
    el.textContent = `+${amount} XP`;
    zone.appendChild(el);
    setTimeout(() => {
      zone.removeChild(el);
    }, 1000);
  }

  // Weekly review
  goToWeeklyReview() {
    this.showSection('weekly');
  }

  renderWeeklyReview() {
    const weeklyContent = document.getElementById('weeklyContent');
    if (!weeklyContent) return;

    const currentWeek = this.getCurrentWeekNumber();
    const lastReview = this.getLastWeeklyReview();
    const canDoReview = this.canDoWeeklyReview();

    weeklyContent.innerHTML = `
      <div class="weekly-status">
        <div class="week-info">
          <h3>Semaine ${currentWeek} - Saison ${this.data.currentSeason || 1}</h3>
          <p class="week-dates">${this.getWeekDates()}</p>
        </div>
        
        ${canDoReview ? `
          <div class="weekly-form-container">
            <h4>📝 Évaluez votre semaine (sur 10)</h4>
            <div class="weekly-questions">
              <div class="question-item">
                <label>🎯 Productivité et focus</label>
                <div class="rating-slider">
                  <input type="range" id="productivity" min="1" max="10" value="5" class="slider">
                  <span class="rating-value">5/10</span>
                </div>
              </div>
              
              <div class="question-item">
                <label>💪 Santé et bien-être</label>
                <div class="rating-slider">
                  <input type="range" id="health" min="1" max="10" value="5" class="slider">
                  <span class="rating-value">5/10</span>
                </div>
              </div>
              
              <div class="question-item">
                <label>🎨 Créativité et apprentissage</label>
                <div class="rating-slider">
                  <input type="range" id="creativity" min="1" max="10" value="5" class="slider">
                  <span class="rating-value">5/10</span>
                </div>
              </div>
              
              <div class="question-item">
                <label>🤝 Relations sociales</label>
                <div class="rating-slider">
                  <input type="range" id="social" min="1" max="10" value="5" class="slider">
                  <span class="rating-value">5/10</span>
                </div>
              </div>
              
              <div class="question-item">
                <label>😊 Satisfaction générale</label>
                <div class="rating-slider">
                  <input type="range" id="satisfaction" min="1" max="10" value="5" class="slider">
                  <span class="rating-value">5/10</span>
                </div>
              </div>
            </div>
            
            <div class="weekly-summary">
              <h5>💭 Réflexion de la semaine</h5>
              <textarea id="weeklyReflection" placeholder="Qu'avez-vous appris cette semaine ? Quels sont vos objectifs pour la semaine prochaine ?"></textarea>
            </div>
            
            <button class="submit-review-btn" onclick="app.submitWeeklyReview()">
              ✨ Valider le Bilan (+5 XP)
            </button>
          </div>
        ` : `
          <div class="review-completed">
            <div class="completed-icon">✅</div>
            <h4>Bilan de la semaine terminé !</h4>
            <p>Prochain bilan disponible dans ${this.getTimeUntilNextReview()}</p>
          </div>
        `}
      </div>
      
      <div class="weekly-history">
        <h4>📈 Historique des Bilans</h4>
        <div class="reviews-grid">
          ${this.renderWeeklyHistory()}
        </div>
      </div>
    `;

    // Setup sliders and history events
    this.setupWeeklySliders();
    this.setupWeeklyHistoryEvents();
  }

  renderAchievements() {
    const achievementsContent = document.getElementById('achievementsContent');
    if (!achievementsContent) return;

    const achievements = this.getAchievements();
    const unlockedCount = achievements.filter(a => a.unlocked).length;

    const tiers = {
      'tier-easy': 'Facile',
      'tier-medium': 'Moyen',
      'tier-epic': 'Épique',
      'tier-legendary': 'Légendaire'
    };

    const grouped = Object.keys(tiers).reduce((acc, key) => {
      acc[key] = achievements.filter(a => a.tier === key);
      return acc;
    }, {});

    achievementsContent.innerHTML = `
      <div class="achievements-header">
        <div class="achievements-stats">
          <div class="achievement-counter">
            <span class="counter-number">${unlockedCount}</span>
            <span class="counter-total">/ ${achievements.length}</span>
            <span class="counter-label">Succès débloqués</span>
          </div>
          <div class="achievement-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${(unlockedCount / achievements.length) * 100}%"></div>
            </div>
          </div>
        </div>
      </div>
      ${Object.keys(tiers).map(tier => `
        <h3 class="achievement-group-title">${tiers[tier]}</h3>
        <div class="achievements-grid">
          ${grouped[tier].map(achievement => `
            <div class="achievement-card ${tier} ${achievement.unlocked ? 'unlocked' : 'locked'}">
              <div class="achievement-icon">${achievement.icon}</div>
              <div class="achievement-info">
                <h4>${achievement.name}</h4>
                <p>${achievement.description}</p>
                <div class="achievement-reward">+${achievement.xp} XP</div>
                ${achievement.unlocked ?
                  `<div class="achievement-date">Débloqué le ${new Date(achievement.unlockedAt).toLocaleDateString()}</div>` :
                  `<div class="achievement-progress-text">${achievement.progress || '0'}/${achievement.target || '?'}</div>`
                }
              </div>
              ${achievement.unlocked ? '<div class="achievement-badge">✓</div>' : ''}
            </div>
          `).join('')}
        </div>
      `).join('')}
    `;
  }

  resetAchievementsAnimation() {
    const container = document.querySelector('#achievements .achievements-container');
    if (container) {
      container.classList.remove('fade-in-up');
      void container.offsetWidth;
      container.classList.add('fade-in-up');
    }
  }

  renderProgression() {
    const progressionContent = document.getElementById('progressionContent');
    if (!progressionContent) return;

    const stats = this.getProgressionStats();

    progressionContent.innerHTML = `
      <div class="progression-overview">
        <div class="stats-cards">
          <div class="stat-card-large primary">
            <div class="stat-icon">⚡</div>
            <div class="stat-content">
              <div class="stat-number">${this.data.totalXP}</div>
              <div class="stat-label">XP Total</div>
            </div>
          </div>
          
          <div class="stat-card-large secondary">
            <div class="stat-icon">🎯</div>
            <div class="stat-content">
              <div class="stat-number">${stats.totalFocusTime}h</div>
              <div class="stat-label">Temps Focus</div>
            </div>
          </div>
          
          <div class="stat-card-large accent">
            <div class="stat-icon">🔥</div>
            <div class="stat-content">
              <div class="stat-number">${stats.currentStreak}</div>
              <div class="stat-label">Streak Actuel</div>
            </div>
          </div>
          
          <div class="stat-card-large success">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-number">${stats.intensityRate}%</div>
              <div class="stat-label">Taux d'Intensité</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="chart-range-select">
        <label for="chartRange">Période :</label>
        <select id="chartRange">
          <option value="7">7 jours</option>
          <option value="30">30 jours</option>
          <option value="custom">Personnalisé</option>
        </select>
        <input type="number" id="customRange" min="1" max="365" style="display:none" />
      </div>

      <div class="progression-charts">
        <div class="chart-container">
          <h4>📈 Évolution XP (${this.chartRange} derniers jours)</h4>
          <div class="xp-chart">
            ${this.renderXPChart(this.chartRange)}
          </div>
        </div>

        <div class="chart-container">
          <h4>🎯 Sessions Focus par Jour</h4>
          <div class="focus-chart">
            ${this.renderFocusChart(this.chartRange)}
          </div>
        </div>
      </div>
      
      <div class="progression-details">
        <div class="detail-section">
          <h4>🏆 Progression par Rang</h4>
          ${this.renderRankProgressBar()}
          <div class="ranks-progression">
            ${this.renderRanksProgression()}
          </div>
        </div>
        
        <div class="detail-section">
          <h4>📋 Temps Focus par Projet</h4>
          <div class="projects-focus-stats">
            ${this.renderProjectsFocusStats()}
          </div>
        </div>
      </div>
      
      <div class="progression-details">
        <div class="detail-section full-width">
          <h4>📋 Projets les Plus Actifs</h4>
          <div class="projects-stats">
            ${this.renderProjectsStats()}
          </div>
        </div>
      </div>
    `;

    const rangeSelect = document.getElementById('chartRange');
    const customInput = document.getElementById('customRange');
    if (rangeSelect) {
      rangeSelect.value = this.chartRange > 30 ? 'custom' : this.chartRange.toString();
      rangeSelect.addEventListener('change', () => {
        if (rangeSelect.value === 'custom') {
          customInput.style.display = 'inline-block';
        } else {
          customInput.style.display = 'none';
          this.chartRange = parseInt(rangeSelect.value, 10);
          this.data.settings.chartRange = this.chartRange;
          this.renderProgression();
        }
      });
    }
    if (customInput) {
      if (this.chartRange > 30) customInput.value = this.chartRange;
      customInput.addEventListener('change', () => {
        this.chartRange = parseInt(customInput.value, 10) || 7;
        this.data.settings.chartRange = this.chartRange;
        this.renderProgression();
      });
    }

    const xpChart = document.querySelector('.xp-chart');
    if (xpChart) {
      xpChart.addEventListener('click', () => {
        this.flashElement(xpChart);
        this.showXPDetails();
      });
    }

    const focusChart = document.querySelector('.focus-chart');
    if (focusChart) {
      focusChart.addEventListener('click', () => {
        this.flashElement(focusChart);
        this.showFocusDetails();
      });
    }
  }

  renderProjectsFocusStats() {
    const projectStats = this.getProjectsFocusStats();
    
    if (projectStats.length === 0) {
      return '<p class="no-projects-stats">Aucune session de focus enregistrée</p>';
    }
    
    return projectStats.map(stat => `
      <div class="project-focus-stat">
        <div class="project-focus-info">
          <div class="project-focus-name">${stat.name}</div>
          <div class="project-focus-sessions">${stat.sessions} session${stat.sessions > 1 ? 's' : ''}</div>
        </div>
        <div class="project-focus-time">
          <div class="focus-time-value">${Math.floor(stat.totalTime / 60)}h ${stat.totalTime % 60}min</div>
          <div class="focus-time-bar">
            <div class="focus-time-fill" style="width: ${(stat.totalTime / Math.max(...projectStats.map(s => s.totalTime))) * 100}%"></div>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  getProjectsFocusStats() {
    const stats = new Map();
    
    // Initialize with "Général" for sessions without project
    stats.set(null, {
      name: 'Général',
      totalTime: 0,
      sessions: 0
    });
    
    // Initialize with all projects
    this.data.projects.forEach(project => {
      stats.set(project.id, {
        name: project.name,
        totalTime: 0,
        sessions: 0
      });
    });
    
    // Calculate stats from focus sessions
    this.data.focusSessions.forEach(session => {
      const projectId = session.project;
      if (stats.has(projectId)) {
        stats.get(projectId).totalTime += session.duration;
        stats.get(projectId).sessions += 1;
      }
    });
    
    // Convert to array and filter out empty stats
    return Array.from(stats.values())
      .filter(stat => stat.sessions > 0)
      .sort((a, b) => b.totalTime - a.totalTime);
  }

  async renderSettings() {
    const settingsContent = document.getElementById('settingsContent');
    if (!settingsContent) return;

    const googleConnected = window.electronAPI?.isGoogleConnected
      ? await window.electronAPI.isGoogleConnected()
      : false;
    const spotifyConnected = window.electronAPI?.isSpotifyConnected
      ? await window.electronAPI.isSpotifyConnected()
      : false;

    settingsContent.innerHTML = `
      <div class="settings-grid">
        <!-- Paramètres de Focus -->
        <div class="settings-card focus-settings">
          <div class="settings-header">
            <div class="settings-icon">🎯</div>
            <h3>Paramètres de Focus</h3>
          </div>
          
          <div class="settings-content">
            <div class="setting-group">
              <label class="setting-label">
                <span class="label-icon">⏱️</span>
                Durée par défaut des sessions
              </label>
              <div class="select-wrapper">
                <select id="defaultFocusDuration" class="modern-select">
                  <option value="15">15 minutes</option>
                  <option value="25" selected>25 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
              </div>
            </div>
            
            <div class="setting-group">
              <div class="toggle-setting">
                <div class="toggle-info">
                  <span class="toggle-icon">⏸️</span>
                  <div class="toggle-text">
                    <div class="toggle-title">Pauses automatiques</div>
                    <div class="toggle-subtitle">5 min toutes les 25 min</div>
                  </div>
                </div>
                <label class="modern-toggle">
                  <input type="checkbox" id="autoBreaksEnabled" checked>
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
            
            <div class="setting-group">
              <div class="toggle-setting">
                <div class="toggle-info">
                  <span class="toggle-icon">🔊</span>
                  <div class="toggle-text">
                    <div class="toggle-title">Notifications sonores</div>
                    <div class="toggle-subtitle">Sons de fin de session</div>
                  </div>
                </div>
                <label class="modern-toggle">␊
                  <input type="checkbox" id="soundNotifications" ${this.data.settings?.soundNotifications ? 'checked' : ''}>
                  <span class="toggle-slider"></span>␊
                </label>␊
              </div>
            </div>
          </div>
        </div>
        
        <!-- Apparence -->
        <div class="settings-card appearance-settings">
          <div class="settings-header">
            <div class="settings-icon">🎨</div>
            <h3>Apparence</h3>
          </div>
          
          <div class="settings-content">
            <div class="setting-group">
              <label class="setting-label">
                <span class="label-icon">🌈</span>
                Thème de couleur
              </label>
              <div class="theme-selector">
                <div class="theme-option" data-theme="default">
                  <div class="theme-preview lunalis"></div>
                  <span class="theme-name">Lunalis</span>
                  <span class="theme-subtitle">Bleu/Violet</span>
                </div>
                <div class="theme-option" data-theme="fire">
                  <div class="theme-preview solaris"></div>
                  <span class="theme-name">Solaris</span>
                  <span class="theme-subtitle">Rouge/Orange</span>
                </div>
                <div class="theme-option" data-theme="nature">
                  <div class="theme-preview verdalis"></div>
                  <span class="theme-name">Verdalis</span>
                  <span class="theme-subtitle">Vert/Nature</span>
                </div>
                <div class="theme-option" data-theme="cosmic">
                  <div class="theme-preview cosmalis"></div>
                  <span class="theme-name">Cosmalis</span>
                  <span class="theme-subtitle">Violet/Rose</span>
                </div>
              </div>
            </div>
            
            <div class="setting-group">
              <div class="toggle-setting">
                <div class="toggle-info">
                  <span class="toggle-icon">✨</span>
                  <div class="toggle-text">
                    <div class="toggle-title">Animations</div>
                    <div class="toggle-subtitle">Effets visuels et transitions</div>
                  </div>
                </div>
                <label class="modern-toggle">
                  <input type="checkbox" id="animationsEnabled" checked>
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Gestion des Données -->
        <div class="settings-card data-settings">
          <div class="settings-header">
            <div class="settings-icon">💾</div>
            <h3>Gestion des Données</h3>
          </div>
          
          <div class="settings-content">
            <div class="data-actions">
              <button class="data-btn export-btn" onclick="app.exportData()">
                <span class="btn-icon">📤</span>
                <div class="btn-content">
                  <div class="btn-title">Exporter</div>
                  <div class="btn-subtitle">Sauvegarder mes données</div>
                </div>
              </button>
              
              <button class="data-btn import-btn" onclick="app.importData()">
                <span class="btn-icon">📥</span>
                <div class="btn-content">
                  <div class="btn-title">Importer</div>
                  <div class="btn-subtitle">Restaurer des données</div>
                </div>
              </button>
              
              <button class="data-btn reset-btn" onclick="app.resetAllData()">
                <span class="btn-icon">🗑️</span>
                <div class="btn-content">
                  <div class="btn-title">Réinitialiser</div>
                  <div class="btn-subtitle">Effacer toutes les données</div>
                </div>
              </button>
            </div>
          </div>
        </div>
        <!-- Synchronisation -->
        <div class="settings-card sync-settings">
          <div class="settings-header">
            <div class="settings-icon">📅</div>
            <h3>Google Calendar</h3>
          </div>
          <div class="settings-content">
            ${googleConnected
              ? `<div class="connected-status"><span class="status-icon">🟢</span> Compte Google Connecté</div>
                 <div class="gc-actions">
                   <button id="openGoogleCalendarBtn" class="data-btn open-btn">Ouvrir Google Calendar</button>
                   <button id="disconnectGoogleCalendarBtn" class="data-btn disconnect-btn">Se déconnecter</button>
                 </div>`
              : `<button id="connectGoogleCalendarBtn" class="data-btn connect-btn">Se connecter à Google Calendar</button>`}
          </div>
        </div>
        <div class="settings-card spotify-settings">
          <div class="settings-header">
            <div class="settings-icon">🎵</div>
            <h3>Spotify</h3>
          </div>
          <div class="settings-content">
            ${spotifyConnected
              ? `<div class="connected-status"><span class="status-icon">🟢</span> Compte Spotify connecté</div>
                 <div class="gc-actions">
                   <button id="disconnectSpotifyBtn" class="data-btn disconnect-btn">Se déconnecter</button>
                 </div>`
              : `<button id="connectSpotifyBtn" class="data-btn connect-btn">Se connecter à Spotify</button>`}
          </div>
        </div>

        <!-- Informations -->
        <div class="settings-card info-settings">
          <div class="settings-header">
            <div class="settings-icon">ℹ️</div>
            <h3>Informations</h3>
          </div>
          
          <div class="settings-content">
            <div class="info-grid">
              <div class="info-item">
                <div class="info-icon">🚀</div>
                <div class="info-content">
                  <div class="info-value">3.0.0 - Lunalis</div>
                  <div class="info-label">Version</div>
                </div>
              </div>
              
              <div class="info-item">
                <div class="info-icon">💾</div>
                <div class="info-content">
                  <div class="info-value">${new Date(this.data.lastSaved || Date.now()).toLocaleDateString()}</div>
                  <div class="info-label">Dernière sauvegarde</div>
                </div>
              </div>
              
              <div class="info-item">
                <div class="info-icon">🎯</div>
                <div class="info-content">
                  <div class="info-value">${this.data.focusSessions.length}</div>
                  <div class="info-label">Sessions totales</div>
                </div>
              </div>
              
              <div class="info-item">
                <div class="info-icon">📋</div>
                <div class="info-content">
                  <div class="info-value">${this.data.projects.length}</div>
                  <div class="info-label">Projets créés</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupSettingsListeners();
  }

  // Helper methods for new sections
  getCurrentWeekNumber() {
    const startDate = new Date(this.data.seasonStartDate || Date.now());
    const now = new Date();
    const diffTime = Math.abs(now - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  }

  getWeekDates() {
    const now = new Date();
    const monday = new Date(now.setDate(now.getDate() - now.getDay() + 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return `${monday.toLocaleDateString()} - ${sunday.toLocaleDateString()}`;
  }

  getLastWeeklyReview() {
    return this.data.weeklyReviews[this.data.weeklyReviews.length - 1] || null;
  }

  canDoWeeklyReview() {
    const lastReview = this.data.weeklyReviews[this.data.weeklyReviews.length - 1];
    if (!lastReview) return true;
    
    const lastReviewDate = new Date(lastReview.date);
    const now = new Date();
    const daysSinceLastReview = (now - lastReviewDate) / (1000 * 60 * 60 * 24);
    
    return daysSinceLastReview >= 7;
  }

  getTimeUntilNextReview() {
    const lastReview = this.data.weeklyReviews[this.data.weeklyReviews.length - 1];
    if (!lastReview) return "maintenant";

    const nextReviewDate = new Date(lastReview.date);
    nextReviewDate.setDate(nextReviewDate.getDate() + 7);

    const now = new Date();
    const diffTime = nextReviewDate - now;
    if (diffTime <= 0) return "maintenant";

    const totalSeconds = Math.floor(diffTime / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    return `${days}j ${hours}h ${minutes}m`;
  }

  updateWeeklyCountdown() {
    const countdownEl = document.getElementById('weeklyCountdown');
    if (countdownEl) {
      countdownEl.textContent = this.getTimeUntilNextReview();
    }
  }

  startWeeklyCountdown() {
    if (this.weeklyCountdownInterval) {
      clearInterval(this.weeklyCountdownInterval);
    }
    this.updateWeeklyCountdown();
    this.weeklyCountdownInterval = setInterval(() => {
      this.updateWeeklyCountdown();
    }, 60000);
  }

  setupWeeklySliders() {
    const sliders = document.querySelectorAll('.slider');
    sliders.forEach(slider => {
      const valueSpan = slider.parentElement.querySelector('.rating-value');
      
      slider.addEventListener('input', (e) => {
        valueSpan.textContent = `${e.target.value}/10`;
      });
    });
  }

  submitWeeklyReview() {
    const productivity = document.getElementById('productivity').value;
    const health = document.getElementById('health').value;
    const creativity = document.getElementById('creativity').value;
    const social = document.getElementById('social').value;
    const satisfaction = document.getElementById('satisfaction').value;
    const reflection = document.getElementById('weeklyReflection').value;
    
    const totalScore = parseInt(productivity) + parseInt(health) + parseInt(creativity) + parseInt(social) + parseInt(satisfaction);
    const percentage = (totalScore / 50) * 100;
    
    const review = {
      date: new Date().toISOString(),
      week: this.getCurrentWeekNumber(),
      scores: {
        productivity: parseInt(productivity),
        health: parseInt(health),
        creativity: parseInt(creativity),
        social: parseInt(social),
        satisfaction: parseInt(satisfaction)
      },
      totalScore,
      percentage,
      reflection
    };
    
    this.data.weeklyReviews.push(review);
    this.addXP(5, 'Bilan Hebdomadaire');
    this.showNotification('✨ Bilan hebdomadaire terminé ! +5 XP', 'success');
    this.updateUI();
    this.saveData();
    this.startWeeklyCountdown();
    this.renderWeeklyReview();
  }

  renderWeeklyHistory() {
    if (this.data.weeklyReviews.length === 0) {
      return '<p class="no-reviews">Aucun bilan effectué pour le moment</p>';
    }

    return this.data.weeklyReviews
      .slice(-8)
      .reverse()
      .map(review => {
        const index = this.data.weeklyReviews.indexOf(review);
        return `
      <div class="review-card" data-index="${index}">
        <div class="review-header">
          <span class="review-week">Semaine ${review.week}</span>
          <span class="review-score">${review.totalScore}/50</span>
        </div>
        <div class="review-percentage">
          <div class="percentage-bar">
            <div class="percentage-fill" style="width: ${review.percentage}%"></div>
          </div>
          <span>${Math.round(review.percentage)}%</span>
        </div>
      </div>`;
      })
      .join('');
  }

  setupWeeklyHistoryEvents() {
    const cards = document.querySelectorAll('.review-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const index = parseInt(card.dataset.index, 10);
        const review = this.data.weeklyReviews[index];
        if (review) {
          this.showWeeklyReviewDetails(review);
        }
      });
    });
  }

  showWeeklyReviewDetails(review) {
    const scores = review.scores;
    const rows = [
      ['🎯 Productivité et focus', scores.productivity],
      ['💪 Santé et bien-être', scores.health],
      ['🎨 Créativité et apprentissage', scores.creativity],
      ['🤝 Relations sociales', scores.social],
      ['😊 Satisfaction générale', scores.satisfaction]
    ]
      .map(
        r => `<tr><td>${r[0]}</td><td>${r[1]}/10</td></tr>`
      )
      .join('');
    const modalContent = `
      <div class="modal-header">
        <h3>Détails Bilan - Semaine ${review.week}</h3>
        <button class="modal-close" onclick="app.closeModal()">×</button>
      </div>
      <div class="modal-body">
        <table class="detail-table">
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div class="reflection-text">
          <h4>Réflexion</h4>
          <p>${review.reflection ? review.reflection.replace(/\n/g, '<br>') : 'Aucune réflexion enregistrée.'}</p>
        </div>
      </div>`;
    this.showModal(modalContent, true);
  }

  getAchievements() {
    const achievements = [
      {
        id: 'first_session',
        name: 'Premier Pas',
        description: 'Complétez votre première session de focus',
        icon: '🎯',
        xp: 10,
        tier: 'tier-easy',
        unlocked: this.data.focusSessions.length > 0,
        unlockedAt: this.data.focusSessions[0]?.date
      },
      {
        id: 'daily_quota',
        name: 'Quota Quotidien',
        description: 'Atteignez 15 XP en une journée',
        icon: '⚡',
        xp: 15,
        tier: 'tier-easy',
        unlocked: this.data.dailyXP >= 15,
        progress: this.data.dailyXP,
        target: 15
      },
      {
        id: 'focus_hunter',
        name: 'Chasseur de Focus',
        description: '10 sessions de focus',
        icon: '🏹',
        xp: 25,
        tier: 'tier-medium',
        unlocked: this.data.focusSessions.length >= 10,
        progress: this.data.focusSessions.length,
        target: 10
      },
      {
        id: 'weekly_warrior',
        name: 'Guerrier Hebdomadaire',
        description: '7 jours consécutifs à 15+ XP',
        icon: '⚔️',
        xp: 50,
        tier: 'tier-medium',
        unlocked: this.calculateStreak() >= 7,
        progress: this.calculateStreak(),
        target: 7
      },
      {
        id: 'sport_master',
        name: 'Maître du Sport',
        description: '7 jours consécutifs de sport',
        icon: '🏃',
        xp: 30,
        tier: 'tier-medium',
        unlocked: this.getSportStreak() >= 7,
        progress: this.getSportStreak(),
        target: 7
      },
      {
        id: 'discipline_forge',
        name: 'Forgeur de Discipline',
        description: "Réaliser 3 jours d\u2019affilée avec les 2 blocs obligatoires",
        icon: '🛡️',
        xp: 25,
        tier: 'tier-medium',
        unlocked: this.getBlocksStreak() >= 3,
        progress: this.getBlocksStreak(),
        target: 3
      },
      {
        id: 'focus_master',
        name: 'Maître du Focus',
        description: '50 sessions de focus',
        icon: '🧘',
        xp: 100,
        tier: 'tier-epic',
        unlocked: this.data.focusSessions.length >= 50,
        progress: this.data.focusSessions.length,
        target: 50
      },
      {
        id: 'xp_collector',
        name: 'Collectionneur XP',
        description: 'Atteindre 1000 XP total',
        icon: '💠',
        xp: 150,
        tier: 'tier-legendary',
        unlocked: this.data.totalXP >= 1000,
        progress: this.data.totalXP,
        target: 1000
      },
      {
        id: 'marathoner',
        name: 'Marathonien',
        description: '4h de focus en une journée',
        icon: '🏅',
        xp: 200,
        tier: 'tier-epic',
        unlocked: this.getMaxDailyFocus() >= 240,
        progress: this.getMaxDailyFocus(),
        target: 240
      },
      {
        id: 'rank_sentinel',
        name: 'Sentinelle Accomplie',
        description: "Atteignez le rang S",
        icon: '👑',
        xp: 50,
        tier: 'tier-epic',
        unlocked: this.data.totalXP >= 600,
        progress: this.data.totalXP,
        target: 600
      },
      {
        id: 'living_legend',
        name: 'Légende Vivante',
        description: '100 sessions de focus',
        icon: '🌠',
        xp: 300,
        tier: 'tier-legendary',
        unlocked: this.data.focusSessions.length >= 100,
        progress: this.data.focusSessions.length,
        target: 100
      },
      {
        id: 'chosen_one',
        name: "L'Élu",
        description: 'Finir la saison avec le rang SSS',
        icon: '🏆',
        xp: 1000,
        tier: 'tier-legendary',
        unlocked: this.hasSeasonRankSSS(),
        progress: this.data.totalXP,
        target: null
      }
    ];

    return achievements;
  }

  getProgressionStats() {
    const totalFocusMinutes = this.data.focusSessions.reduce((sum, session) => sum + session.duration, 0);
    
    return {
      totalFocusTime: Math.round(totalFocusMinutes / 60),
      currentStreak: this.getStreak(),
      intensityRate: this.calculateIntensityRate(),
      averageSessionLength: this.data.focusSessions.length > 0 ? Math.round(totalFocusMinutes / this.data.focusSessions.length) : 0
    };
  }

  getStreak() {
    // Simple streak calculation - can be improved
    return this.data.currentStreak || 0;
  }

  calculateIntensityRate() {
    if (this.data.weeklyReviews.length === 0) return 0;
    const recent = this.data.weeklyReviews.slice(-4);
    const average = recent.reduce((sum, review) => sum + review.percentage, 0) / recent.length;
    return Math.round(average);
  }

  renderXPChart(days = this.chartRange) {
    const data = this.getLastDaysXP(days);
    const maxXP = Math.max(...data.map(d => d.xp), 15);
    
    return `
      <div class="chart-bars">
        ${data.map(day => `
          <div class="chart-bar">
            <div class="bar-fill" style="height: ${(day.xp / maxXP) * 100}%"></div>
            <div class="bar-label">${day.day}</div>
            <div class="bar-value">${day.xp}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderFocusChart(days = this.chartRange) {
    const data = this.getLastDaysFocus(days);
    const maxSessions = Math.max(...data.map(d => d.sessions), 3);
    
    return `
      <div class="chart-bars">
        ${data.map(day => `
          <div class="chart-bar">
            <div class="bar-fill focus" style="height: ${(day.sessions / maxSessions) * 100}%"></div>
            <div class="bar-label">${day.day}</div>
            <div class="bar-value">${day.sessions}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  getLastDaysXP(daysCount) {
    const days = [];
    const today = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });

      const dayXP = this.data.xpHistory
        .filter(e => new Date(e.date).toDateString() === date.toDateString())
        .reduce((sum, e) => sum + e.amount, 0);

      days.push({
        day: dayName,
        xp: dayXP,
        date: date.toLocaleDateString('fr-FR')
      });
    }

    return days;
  }

  getLastDaysFocus(daysCount) {
    const days = [];
    const today = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });

      const todaySessions = this.data.focusSessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate.toDateString() === date.toDateString();
      }).length;

      days.push({
        day: dayName,
        sessions: todaySessions,
        date: date.toLocaleDateString('fr-FR')
      });
    }

    return days;
  }

  showXPDetails() {
    const data = this.getLastDaysXP(this.chartRange);
    const rows = data
      .map((d, i) => {
        let level = 'low';
        if (d.xp >= 11) {
          level = 'high';
        } else if (d.xp >= 3) {
          level = 'medium';
        }
        return `<tr class="fade-in-up ${level}" style="animation-delay:${i * 0.05}s"><td>${d.date}</td><td>${d.xp}</td></tr>`;
      })
      .join('');
    const modalContent = `
      <div class="modal-header">
        <h3>Détails XP (${this.chartRange} jours)</h3>
        <button class="modal-close" onclick="app.closeModal()">×</button>
      </div>
      <div class="modal-body">
        <table class="detail-table">
          <thead><tr><th>Date</th><th>XP</th></tr></thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
    this.showModal(modalContent, true);
  }

  showFocusDetails() {
    const data = this.getLastDaysFocus(this.chartRange);
    const rows = data
      .map((d, i) => {
        let level = 'focus-zero';
        if (d.sessions >= 3) {
          level = 'focus-many';
        } else if (d.sessions === 2) {
          level = 'focus-two';
        } else if (d.sessions === 1) {
          level = 'focus-one';
        }
        return `<tr class="fade-in-up ${level}" style="animation-delay:${i * 0.05}s"><td>${d.date}</td><td>${d.sessions}</td></tr>`;
      })
      .join('');
    const modalContent = `
      <div class="modal-header">
        <h3>Détails Focus (${this.chartRange} jours)</h3>
        <button class="modal-close" onclick="app.closeModal()">×</button>
      </div>
      <div class="modal-body">
        <table class="detail-table">
          <thead><tr><th>Date</th><th>Sessions</th></tr></thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
    this.showModal(modalContent, true);
  }

  renderRanksProgression() {
    const ranks = [
      { name: 'Paumé improductif', xp: 0, badge: 'E', avatar: '😵' },
      { name: 'Le Spectateur de Sa Vie', xp: 200, badge: 'D', avatar: '🎯' },
      { name: 'L\u2019Errant du Crépuscule', xp: 300, badge: 'C', avatar: '⚡' },
      { name: 'Le Stratège Naissant', xp: 400, badge: 'B', avatar: '🔥' },
      { name: 'Le Vétéran', xp: 500, badge: 'A', avatar: '💎' },
      { name: 'Sentinelle de l\u2019Ascension', xp: 600, badge: 'S', avatar: '👑' },
      { name: 'Le Paragon du Zénith', xp: 700, badge: 'SS', avatar: '🌟' },
      { name: 'Élu du Destin', xp: 750, badge: 'SSS', avatar: '🌙' }
    ];
    
    return ranks
      .map(rank => {
        const isUnlocked = this.data.totalXP >= rank.xp;
        const isCurrent = this.getCurrentRank().name === rank.name;
        const badgeClass = `rank-${rank.badge.toLowerCase()}`;

        return `
          <div class="rank-item ${badgeClass} ${isUnlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}">
            <div class="rank-avatar">${rank.avatar}</div>
            <div class="rank-info">
              <div class="rank-name">${rank.name} <span class="rank-class">${rank.badge}</span></div>
              <div class="rank-requirement">${rank.xp} XP</div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  showRanksModal() {
    const modalContent = `
      <div class="modal-header">
        <h3>Rangs disponibles</h3>
        <button class="modal-close" onclick="app.closeModal()">×</button>
      </div>
      <div class="modal-body ranks-modal">
        ${this.renderRanksProgression()}
      </div>
    `;
    this.showModal(modalContent, true);
  }

  showIntensityModal() {
    const levelsHtml = INTENSITY_LEVELS.map(l => {
      const base = extractBaseColor(l.color);
      const glow = l.glow || lightenColor(base, 60);
      return `
        <div class="intensity-level" style="--level-color:${base};--level-glow:${glow}">
          <div class="level-icon">${l.emoji}</div>
          <div class="level-info">
            <div class="level-title">${l.title} (${l.min}-${l.max}%)</div>
            <div class="level-role">${l.role}</div>
            <div class="level-desc">${l.description}</div>
          </div>
        </div>
      `;
    }).join('');

    const modalContent = `
      <div class="modal-header">
        <h3>Niveaux d'Intensité</h3>
        <button class="modal-close" onclick="app.closeModal()">×</button>
      </div>
      <div class="modal-body intensity-modal">
        ${levelsHtml}
      </div>
    `;
    this.showModal(modalContent, true);
  }

  renderRankProgressBar() {
    const ranks = [
      { name: 'Paumé improductif', xp: 0 },
      { name: 'Le Spectateur de Sa Vie', xp: 200 },
      { name: 'L\u2019Errant du Crépuscule', xp: 300 },
      { name: 'Le Stratège Naissant', xp: 400 },
      { name: 'Le Vétéran', xp: 500 },
      { name: 'Sentinelle de l\u2019Ascension', xp: 600 },
      { name: 'Le Paragon du Zénith', xp: 700 },
      { name: 'Élu du Destin', xp: 750 }
    ];

    const current = this.getCurrentRank();
    const currentIndex = ranks.findIndex(r => r.name === current.name);
    const next = ranks[Math.min(currentIndex + 1, ranks.length - 1)];

    if (next.xp === current.xp) {
      return '<p class="next-rank-info">Rang maximum atteint</p>';
    }

    const percent = Math.min(
      100,
      Math.round(
        ((this.data.totalXP - current.xp) / (next.xp - current.xp)) * 100
      )
    );

    return `
      <div class="next-rank-bar">
        <div class="next-rank-info">Prochain rang : ${next.name} (${next.xp} XP)</div>
        <div class="next-rank-progress">
          <div class="next-rank-fill" style="width: ${percent}%"></div>
        </div>
      </div>
    `;
  }

  renderProjectsStats() {
    if (this.data.projects.length === 0) {
      return '<p class="no-projects-stats">Aucun projet créé</p>';
    }
    
    return this.data.projects.slice(0, 5).map(project => `
      <div class="project-stat-item">
        <div class="project-name">${project.name}</div>
        <div class="project-time">${Math.floor(project.totalTime / 60)}h ${project.totalTime % 60}min</div>
      </div>
    `).join('');
  }

  getCurrentRank() {
    const ranks = [
      { name: 'Paumé improductif', xp: 0, badge: 'E', avatar: '😵' },
      { name: 'Le Spectateur de Sa Vie', xp: 200, badge: 'D', avatar: '🎯' },
      { name: 'L\u2019Errant du Crépuscule', xp: 300, badge: 'C', avatar: '⚡' },
      { name: 'Le Stratège Naissant', xp: 400, badge: 'B', avatar: '🔥' },
      { name: 'Le Vétéran', xp: 500, badge: 'A', avatar: '💎' },
      { name: 'Sentinelle de l\u2019Ascension', xp: 600, badge: 'S', avatar: '👑' },
      { name: 'Le Paragon du Zénith', xp: 700, badge: 'SS', avatar: '🌟' },
      { name: 'Élu du Destin', xp: 750, badge: 'SSS', avatar: '🌙' }
    ];
    
    let currentRank = ranks[0];
    for (let i = ranks.length - 1; i >= 0; i--) {
      if (this.data.totalXP >= ranks[i].xp) {
        currentRank = ranks[i];
        break;
      }
    }
    
    return currentRank;
  }

  setupSettingsListeners() {
    // Theme selection
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Remove active class from all options
        themeOptions.forEach(opt => opt.classList.remove('active'));
        // Add active class to clicked option
        option.classList.add('active');
        // Change theme
        this.changeTheme(option.dataset.theme);
      });
    });
    
    // Set current theme as active
    const currentTheme = this.data.settings?.theme || 'default';
    const currentThemeOption = document.querySelector(`[data-theme="${currentTheme}"]`);
    if (currentThemeOption) {
      currentThemeOption.classList.add('active');
    }

    const soundToggle = document.getElementById('soundNotifications');
    if (soundToggle) {
      soundToggle.addEventListener('change', () => {
        this.data.settings = this.data.settings || {};
        this.data.settings.soundNotifications = soundToggle.checked;
      });
    }

    const connectBtn = document.getElementById('connectGoogleCalendarBtn');
    if (connectBtn && window.electronAPI) {
      connectBtn.addEventListener('click', async () => {
        const ok = await window.electronAPI.connectGoogleCalendar();
        if (ok) {
          this.showNotification('Google Calendar connecté', 'success');
          this.renderSettings();
        } else {
          this.showNotification('Erreur de connexion Google', 'error');
        }
      });
    }

    const openBtn = document.getElementById('openGoogleCalendarBtn');
    if (openBtn && window.electronAPI) {
      openBtn.addEventListener('click', () => {
        window.electronAPI.openExternal(
          'https://calendar.google.com/calendar/u/0/r'
        );
      });
    }

    const disconnectBtn = document.getElementById('disconnectGoogleCalendarBtn');
    if (disconnectBtn && window.electronAPI) {
      disconnectBtn.addEventListener('click', async () => {
        const ok = await window.electronAPI.disconnectGoogleCalendar();
        if (ok) {
          this.showNotification('Google Calendar déconnecté', 'success');
          this.renderSettings();
        } else {
          this.showNotification('Erreur de déconnexion Google', 'error');
        }
      });
    }

    const connectSpotifyBtn = document.getElementById('connectSpotifyBtn');
    if (connectSpotifyBtn && window.electronAPI) {
      connectSpotifyBtn.addEventListener('click', async () => {
        const ok = await window.electronAPI.connectSpotify();
        if (ok) {
          this.showNotification('Spotify connecté', 'success');
          this.renderSettings();
        } else {
          this.showNotification('Erreur de connexion Spotify', 'error');
        }
      });
    }

    const disconnectSpotifyBtn = document.getElementById('disconnectSpotifyBtn');
    if (disconnectSpotifyBtn && window.electronAPI) {
      disconnectSpotifyBtn.addEventListener('click', async () => {
        const ok = await window.electronAPI.disconnectSpotify();
        if (ok) {
          this.showNotification('Spotify déconnecté', 'success');
          this.renderSettings();
        }
      });
    }

    // Other settings listeners can be added here
  }

  changeTheme(theme) {
    document.body.className = `theme-${theme}`;
    const nameMap = {
      default: 'Lunalis',
      fire: 'Solaris',
      nature: 'Verdalis',
      cosmic: 'Cosmalis'
    };
    const logoTitle = document.getElementById('logoTitle');
    const brandName = document.getElementById('brandName');
    if (logoTitle) {
      logoTitle.innerHTML = `${nameMap[theme] || 'Lunalis'} <span class="logo-icon">✨</span>`;
    }
    if (brandName) {
      const symbols = { default: '🌙', fire: '☀️', nature: '🌿', cosmic: '✨' };
      brandName.textContent = `${nameMap[theme] || 'Lunalis'} ${symbols[theme] || '🌙'}`;
    }
    this.data.settings = this.data.settings || {};
    this.data.settings.theme = theme;
    this.showNotification('Thème changé avec succès !', 'success');
  }

  exportData() {
    const dataStr = JSON.stringify(this.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `myRPGLife-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    this.showNotification('Données exportées avec succès !', 'success');
  }

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedData = JSON.parse(e.target.result);
            if (!validateData(importedData)) {
              throw new Error('Invalid data format');
            }

            this.data = { ...this.data, ...importedData };
            this.saveData();
            this.updateUI();
            this.showNotification('Données importées avec succès !', 'success');
          } catch (error) {
            this.showNotification('Erreur lors de l\'importation', 'error');
          }
        };
        reader.readAsText(file);
      }
    };
    
    input.click();
  }

  resetAllData() {
    if (confirm("Êtes-vous sûr de vouloir réinitialiser toutes vos données ? Cette action est irréversible.")) {
      const achievements = this.data.achievements;
      const settings = this.data.settings;
      this.data = this.getDefaultData();
      this.data.achievements = achievements;
      this.data.settings = settings;
      this.saveData();
      this.showStartOverlay();
      this.updateUI();
    }
  }

  // UI Updates
  updateUI() {
    this.checkSeasonReset();
    this.updateDashboard();
    this.updateTimerDisplay();
    this.updateBreakInfo();
    this.updateFocusStats();
  }

  updateDashboard() {
    // Update XP display
    const currentXPEl = document.getElementById('currentXP');
    const nextRankXPEl = document.getElementById('nextRankXP');
    const xpFill = document.getElementById('xpFill');
    const dailyXPEl = document.getElementById('dailyXP');

    if (currentXPEl) currentXPEl.textContent = this.data.totalXP;
    if (dailyXPEl) dailyXPEl.textContent = this.data.dailyXP;

    if (xpFill && nextRankXPEl) {
      const ranks = [
        { xp: 0 },
        { xp: 200 },
        { xp: 300 },
        { xp: 400 },
        { xp: 500 },
        { xp: 600 },
        { xp: 700 },
        { xp: 750 }
      ];

      const current = this.getCurrentRank();
      const currentIndex = ranks.findIndex(r => r.xp === current.xp);
      const next = ranks[Math.min(currentIndex + 1, ranks.length - 1)];

      const percent =
        current.xp === next.xp
          ? 100
          : Math.min(
              100,
              ((this.data.totalXP - current.xp) / (next.xp - current.xp)) * 100
            );

      xpFill.style.width = `${percent}%`;
      nextRankXPEl.textContent = next.xp;
    }
    
    // Update challenge progress
    const challengeFill = document.getElementById('challengeFill');
    const challengeStatus = document.getElementById('challengeStatus');
    const challengeBar = document.getElementById('challengeBar');
    
    if (challengeFill && challengeStatus) {
      const progress = Math.min(100, (this.data.dailyXP / 15) * 100);
      challengeFill.style.width = `${progress}%`;
      challengeStatus.textContent = `${this.data.dailyXP}/15 XP`;
      if (challengeBar) {
        challengeBar.style.setProperty('--progress', `${progress}%`);
      }
    }

    // Update season goal progress
    const seasonFill = document.getElementById('seasonGoalFill');
    const seasonText = document.getElementById('seasonGoalText');
    const seasonLabel = document.getElementById('seasonGoalLabel');
    const seasonBlock = document.getElementById('seasonGoalBlock');
    if (seasonFill && seasonText) {
      const target = this.data.seasonGoalXP || 600;
      const percent = Math.min(100, (this.data.totalXP / target) * 100);
      seasonFill.style.width = `${percent}%`;
      seasonText.textContent = `${this.data.totalXP} / ${target} XP`;
      if (seasonBlock) {
        if (this.data.totalXP >= target) {
          seasonBlock.classList.add('goal-achieved');
        } else {
          seasonBlock.classList.remove('goal-achieved');
        }
      }
    }

    if (seasonLabel) {
      const ranks = {
        500: "Le Vétéran (A)",
        600: "Sentinelle de l'Ascension (S)",
        700: "Le Paragon du Zénith (SS)",
        750: "Élu du Destin (SSS)"
      };
      const label = ranks[this.data.seasonGoalXP || 600] || "Sentinelle de l'Ascension (S)";
      seasonLabel.innerHTML = `Atteindre le rang <strong>${label}</strong>`;
    }

    this.updateIntensityDisplay();

    this.updateSeasonDisplay();
    this.updateLastSeasonDisplay();

    // Update rank info
    this.updateRankDisplay();
  }

  updateRankDisplay() {
    const ranks = [
      { name: 'Paumé improductif', xp: 0, badge: 'E', avatar: '😵' },
      { name: 'Le Spectateur de Sa Vie', xp: 200, badge: 'D', avatar: '🎯' },
      { name: 'L\u2019Errant du Crépuscule', xp: 300, badge: 'C', avatar: '⚡' },
      { name: 'Le Stratège Naissant', xp: 400, badge: 'B', avatar: '🔥' },
      { name: 'Le Vétéran', xp: 500, badge: 'A', avatar: '💎' },
      { name: 'Sentinelle de l\u2019Ascension', xp: 600, badge: 'S', avatar: '👑' },
      { name: 'Le Paragon du Zénith', xp: 700, badge: 'SS', avatar: '🌟' },
      { name: 'Élu du Destin', xp: 750, badge: 'SSS', avatar: '🌙' }
    ];
    
    let currentRank = ranks[0];
    for (let i = ranks.length - 1; i >= 0; i--) {
      if (this.data.totalXP >= ranks[i].xp) {
        currentRank = ranks[i];
        break;
      }
    }
    
    const rankName = document.getElementById('rankName');
    const rankBadge = document.getElementById('rankBadge');
    const userAvatar = document.getElementById('userAvatar');
    const rankCard = document.getElementById('rankCard');

    if (rankCard) {
      ['e','d','c','b','a','s','ss','sss'].forEach(b => rankCard.classList.remove(`rank-${b}`));
      rankCard.classList.add(`rank-${currentRank.badge.toLowerCase()}`);
    }
    
    if (rankName) rankName.textContent = currentRank.name;
    if (rankBadge) rankBadge.textContent = currentRank.badge;
    if (userAvatar) userAvatar.textContent = currentRank.avatar;
  }

  updateFocusStats() {
    const todayStr = new Date().toDateString();

    const todaySessions = this.data.focusSessions.filter(
      s => new Date(s.date).toDateString() === todayStr
    );

    const dailySessions = todaySessions.length;
    const dailyMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    const seasonMinutes = this.data.focusSessions.reduce((sum, s) => sum + s.duration, 0);
    const mandatoryBlocks = Math.min(2, Math.floor(dailyMinutes / 90));

    const dailyFocusXP = this.data.xpHistory
      .filter(e => new Date(e.date).toDateString() === todayStr && e.reason.startsWith('Session Focus'))
      .reduce((sum, e) => sum + e.amount, 0);

    const streak = this.calculateStreak();

    const dailySessionsEl = document.getElementById('dailySessions');
    if (dailySessionsEl) dailySessionsEl.textContent = dailySessions;

    const dailyFocusTimeEl = document.getElementById('dailyFocusTime');
    if (dailyFocusTimeEl) dailyFocusTimeEl.textContent = `${dailyMinutes}min`;

    const seasonFocusTimeEl = document.getElementById('seasonFocusTime');
    if (seasonFocusTimeEl) seasonFocusTimeEl.textContent = `${Math.floor(seasonMinutes / 60)}h`;

    const mandatoryBlocksEl = document.getElementById('mandatoryBlocks');
    if (mandatoryBlocksEl) mandatoryBlocksEl.textContent = `${mandatoryBlocks}/2`;

    const dailyFocusXPEl = document.getElementById('dailyFocusXP');
    if (dailyFocusXPEl) dailyFocusXPEl.textContent = dailyFocusXP;

    const focusStreakEl = document.getElementById('focusStreak');
    if (focusStreakEl) focusStreakEl.textContent = streak;

    const progressFill = document.getElementById('dailyProgressFill');
    if (progressFill) {
      progressFill.style.width = `${Math.min(100, (dailySessions / 3) * 100)}%`;
    }

    const block1 = document.getElementById('block1');
    const block2 = document.getElementById('block2');
    const block3 = document.getElementById('block3');

    if (block1) block1.classList.toggle('completed', dailyMinutes >= 90);
    if (block2) block2.classList.toggle('completed', dailyMinutes >= 180);
    if (block3) {
      block3.classList.toggle('locked', dailyMinutes < 180);
      block3.classList.toggle('completed', dailyMinutes >= 270);
    }
  }

  calculateStreak() {
    const xpByDay = new Map();
    this.data.xpHistory.forEach(entry => {
      const day = new Date(entry.date).toDateString();
      xpByDay.set(day, (xpByDay.get(day) || 0) + entry.amount);
    });

    let streak = 0;
    const today = new Date();
    while (true) {
      const date = new Date(today);
      date.setDate(today.getDate() - streak);
      const dayStr = date.toDateString();
      const xp = xpByDay.get(dayStr) || 0;
      if (xp >= 15) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  getSportStreak() {
    let streak = 0;
    const today = new Date();
    while (true) {
      const dateStr = new Date(today.getFullYear(), today.getMonth(), today.getDate() - streak).toDateString();
      if (this.data.dailyActions[dateStr]?.sport) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  getBlocksStreak() {
    let streak = 0;
    const today = new Date();
    while (true) {
      const date = new Date(today);
      date.setDate(today.getDate() - streak);
      const dayStr = date.toDateString();
      const dailyMinutes = this.data.focusSessions
        .filter(s => new Date(s.date).toDateString() === dayStr)
        .reduce((sum, s) => sum + s.duration, 0);
      if (dailyMinutes >= 180) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  getMaxDailyFocus() {
    const minutesByDay = {};
    this.data.focusSessions.forEach(s => {
      const day = new Date(s.date).toDateString();
      minutesByDay[day] = (minutesByDay[day] || 0) + s.duration;
    });
    const values = Object.values(minutesByDay);
    return values.length ? Math.max(...values) : 0;
  }

  hasSeasonRankSSS() {
    return this.data.totalXP >= 750;
  }

  // Data management
  getDefaultData() {
    return {
      version: CURRENT_DATA_VERSION,
      started: false,
      seasonNumber: 1,
      seasonStartDate: null,
      seasonHistory: [],
      totalXP: 0,
      dailyXP: 0,
      lastDailyReset: new Date().toDateString(),
      projects: [],
      focusSessions: [],
      dailyActions: {},
      xpHistory: [],
      achievements: [],
      weeklyReviews: [],
      seasonGoalXP: null,
      settings: {
        theme: 'default',
        soundNotifications: true,
        chartRange: 7
      }
    };
  }

  migrateData(data, fromVersion) {
    switch (fromVersion) {
      case 0:
        // Version 0 had no version field
        data.version = 1;
        break;
      default:
        break;
    }
    return data;
  }


  loadData() {
    const defaultData = this.getDefaultData();

    try {
      const saved = localStorage.getItem('myRPGLifeData');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (validateData(parsed)) {
          let data = {
            ...defaultData,
            ...parsed,
            settings: { ...defaultData.settings, ...(parsed.settings || {}) },
            lastDailyReset: parsed.lastDailyReset || defaultData.lastDailyReset
          };

          let dataVersion = parsed.version ?? 0;
          while (dataVersion < CURRENT_DATA_VERSION) {
            data = this.migrateData(data, dataVersion);
            dataVersion = data.version ?? dataVersion + 1;
          }
          data.version = CURRENT_DATA_VERSION;

          if (parsed.started === undefined) {
            data.started = (parsed.totalXP > 0) || (parsed.seasonHistory && parsed.seasonHistory.length > 0);
          }
          return data;
        }
        console.warn('Invalid saved data format, using defaults.');
      }
      return defaultData;
    } catch (error) {
      console.error('Error loading data:', error);
      return defaultData;
    }
  }

  saveData() {
    try {
      this.data.version = CURRENT_DATA_VERSION;
      localStorage.setItem('myRPGLifeData', JSON.stringify(this.data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  startAutoSave() {
    setInterval(() => {
      this.saveData();
    }, 30000); // Save every 30 seconds
  }

  scheduleDailyReset() {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = next - now;
    setTimeout(() => {
      this.resetDailyStats();
      this.scheduleDailyReset();
    }, msUntilMidnight);
  }

  checkDailyReset() {
    const today = new Date().toDateString();
    if (this.data.lastDailyReset !== today) {
      this.resetDailyStats();
    }
  }

  resetDailyStats() {
    this.data.dailyXP = 0;
    this.data.lastDailyReset = new Date().toDateString();
    this.updateUI();
    this.saveData();
  }

  // Double or Nothing functions
  chooseSafeReward() {
    this.addXP(5, 'Coffre Mystique - Récompense Sûre');
    this.showNotification('✨ +5 XP de récompense sûre !', 'success');
    this.hideDoubleOrNothingChest();
    this.saveData();
  }

  chooseDoubleOrNothing() {
    // Show challenge details
    const challengeDetails = document.getElementById('challengeDetails');
    if (challengeDetails) {
      challengeDetails.style.display = 'block';
    }
    
    // Set up tomorrow's challenge
    this.data.doubleOrNothingActive = true;
    this.showNotification('🔥 Défi accepté ! Bonne chance demain !', 'warning');
    this.saveData();
  }

  showStartOverlay() {
    const overlay = document.getElementById('startOverlay');
    const startBtn = document.getElementById('startAdventureBtn');
    const select = document.getElementById('seasonGoalSelect');
    if (select) {
      select.value = this.data.seasonGoalXP || '';
    }
    if (startBtn) {
      startBtn.disabled = !this.data.seasonGoalXP;
    }
    if (overlay) overlay.style.display = 'flex';
  }

  hideStartOverlay() {
    const overlay = document.getElementById('startOverlay');
    if (overlay) overlay.classList.add('fade-out');
    setTimeout(() => {
      if (overlay) overlay.style.display = 'none';
      if (overlay) overlay.classList.remove('fade-out');
    }, 500);
  }

  startApp() {
    if (!this.data.seasonGoalXP) {
      this.showNotification('Veuillez choisir un objectif de saison.', 'error');
      return;
    }
    this.data.started = true;
    this.data.seasonNumber = this.data.seasonHistory.length + 1;
    this.data.seasonStartDate = new Date().toISOString();
    this.saveData();
    this.hideStartOverlay();
    this.updateUI();
  }

  checkSeasonReset() {
    if (!this.data.seasonStartDate) return;
    const start = new Date(this.data.seasonStartDate);
    const diffDays = Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24));
    if (diffDays >= 42) {
      this.startNewSeason();
    }
  }

  startNewSeason() {
    const currentRank = this.getCurrentRank();
    this.data.seasonHistory.push({
      season: this.data.seasonNumber,
      totalXP: this.data.totalXP,
      rank: currentRank.name,
      badge: currentRank.badge,
    });

    const achievements = this.data.achievements;
    const settings = this.data.settings;
    const seasonHistory = this.data.seasonHistory;

    this.data = this.getDefaultData();
    this.data.started = true;
    this.data.seasonNumber = seasonHistory.length + 1;
    this.data.seasonStartDate = new Date().toISOString();
    this.data.achievements = achievements;
    this.data.settings = settings;
    this.data.seasonHistory = seasonHistory;
    this.saveData();
    this.updateUI();
  }

  updateSeasonDisplay() {
    const seasonEl = document.getElementById('currentSeason');
    const weekEl = document.getElementById('currentWeek');
    const daysEl = document.getElementById('daysRemaining');
    const seasonFill = document.getElementById('seasonFill');

    if (!this.data.seasonStartDate) return;
    const start = new Date(this.data.seasonStartDate);
    const diffDays = Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24));
    const week = Math.floor(diffDays / 7) + 1;
    const remaining = Math.max(0, 42 - diffDays);

    if (seasonEl) seasonEl.textContent = this.data.seasonNumber;
    if (weekEl) weekEl.textContent = Math.min(6, week);
    if (daysEl) daysEl.textContent = remaining;
    if (seasonFill) {
      const percent = Math.min(100, (diffDays / 42) * 100);
      seasonFill.style.width = `${percent}%`;
      seasonFill.classList.toggle('ending', remaining <= 7);
    }
  }

  updateIntensityDisplay() {
    const rate = this.calculateIntensityRate();
    const valueEl = document.getElementById('intensityValue');
    const labelEl = document.getElementById('intensityLabel');
    const progressEl = document.getElementById('intensityProgress');
    const circleEl = document.getElementById('intensityCircle');

    if (!valueEl || !labelEl || !progressEl) return;

    const level = INTENSITY_LEVELS.find(l => rate >= l.min && rate <= l.max) || INTENSITY_LEVELS[0];
    const card = document.getElementById('intensityCard');

    valueEl.textContent = `${rate}%`;
    labelEl.textContent = `${level.emoji} ${level.title}`;

    const radius = 75;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(rate, 100) / 100) * circumference;
    progressEl.style.strokeDasharray = circumference;
    const prev = parseFloat(progressEl.dataset.prevOffset) || circumference;
    progressEl.dataset.prevOffset = offset;
    progressEl.animate(
      [{ strokeDashoffset: prev }, { strokeDashoffset: offset }],
      { duration: 800, easing: 'ease-out', fill: 'forwards' }
    );
    progressEl.style.stroke = level.color;

    const base = extractBaseColor(level.color);
    const glow = lightenColor(base, 40);
    const text = lightenColor(base, 60);
    card.style.setProperty('--intensity-color', base);
    card.style.setProperty('--intensity-light', glow);
    progressEl.style.filter = `drop-shadow(0 0 8px ${glow})`;
    circleEl.style.boxShadow = `0 0 12px ${glow}`;
    card.style.boxShadow = `0 0 20px ${glow}`;
    valueEl.style.color = text;
    valueEl.style.textShadow = `0 0 8px ${hexToRgba(glow, INTENSITY_VALUE_GLOW_OPACITY)}`;
    labelEl.style.color = text;

    if (rate >= 85) {
      valueEl.classList.add('intensity-glow');
    } else {
      valueEl.classList.remove('intensity-glow');
    }
  }

  updateLastSeasonDisplay() {
    const card = document.getElementById('lastSeasonCard');
    const rankEl = document.getElementById('lastSeasonRank');
    if (!card || !rankEl) return;
    if (this.data.seasonHistory.length > 0) {
      const last = this.data.seasonHistory[this.data.seasonHistory.length - 1];
      card.style.display = 'block';
      rankEl.textContent = `${last.badge} - ${last.rank}`;
    } else {
      card.style.display = 'none';
    }
  }

  hideDoubleOrNothingChest() {
    const chest = document.getElementById('doubleOrNothingChest');
    if (chest) {
      chest.style.display = 'none';
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new MyRPGLifeApp();
});
