class MyRPGLifeApp {
  constructor() {
    this.data = this.loadData();
    this.timer = null;
    this.timerState = {
      isRunning: false,
      isPaused: false,
      duration: 25 * 60, // 25 minutes en secondes
      remaining: 25 * 60,
      currentProject: null
    };
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateUI();
    this.startAutoSave();
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
      resetBtn.addEventListener('click', () => this.resetTimer());
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
        if (e.target === modalOverlay) {
          this.closeModal();
        }
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
    this.timerState.isPaused = false;
    
    const startPauseBtn = document.getElementById('startPauseBtn');
    const startPauseText = document.getElementById('startPauseText');
    
    if (startPauseBtn && startPauseText) {
      startPauseBtn.classList.add('running');
      startPauseText.textContent = 'Pause';
    }
    
    this.timer = setInterval(() => {
      this.timerState.remaining--;
      this.updateTimerDisplay();
      
      if (this.timerState.remaining <= 0) {
        this.completeTimer();
      }
    }, 1000);
  }

  pauseTimer() {
    this.timerState.isRunning = false;
    this.timerState.isPaused = true;
    
    const startPauseBtn = document.getElementById('startPauseBtn');
    const startPauseText = document.getElementById('startPauseText');
    
    if (startPauseBtn && startPauseText) {
      startPauseBtn.classList.remove('running');
      startPauseText.textContent = 'Reprendre';
    }
    
    clearInterval(this.timer);
  }

  resetTimer() {
    this.timerState.isRunning = false;
    this.timerState.isPaused = false;
    this.timerState.remaining = this.timerState.duration;
    
    const startPauseBtn = document.getElementById('startPauseBtn');
    const startPauseText = document.getElementById('startPauseText');
    
    if (startPauseBtn && startPauseText) {
      startPauseBtn.classList.remove('running');
      startPauseText.textContent = 'Commencer Focus';
    }
    
    clearInterval(this.timer);
    this.updateTimerDisplay();
  }

  completeTimer() {
    clearInterval(this.timer);
    
    const minutes = this.timerState.duration / 60;
    const xpGained = this.calculateFocusXP(minutes);
    
    this.addXP(xpGained, `Session Focus ${minutes}min`);
    this.recordFocusSession(minutes);
    
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

  // Utility functions
  calculateFocusXP(minutes) {
    const baseXP = Math.floor(minutes / 18);
    const mandatorySessions = this.getMandatorySessionsToday();
    return mandatorySessions >= 2 ? baseXP * 2 : baseXP;
  }

  getMandatorySessionsToday() {
    const today = new Date().toDateString();
    return this.data.focusSessions.filter(session => 
      new Date(session.date).toDateString() === today && session.duration >= 90
    ).length;
  }

  recordFocusSession(minutes) {
    const projectSelect = document.getElementById('projectSelect');
    const selectedProject = projectSelect ? projectSelect.value : null;
    
    this.data.focusSessions.push({
      date: new Date().toISOString(),
      duration: minutes,
      project: selectedProject || null
    });
    
    // Update project total time
    if (selectedProject) {
      const project = this.data.projects.find(p => p.id == selectedProject);
      if (project) {
        project.totalTime += minutes;
      }
    }
  }

  addXP(amount, reason) {
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
  showProjectForm() {
    this.showSection('projects');
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
      projectForm.style.display = 'block';
    }
  }

  saveProject() {
    const nameInput = document.getElementById('projectName');
    const descInput = document.getElementById('projectDescription');
    const timeGoalInput = document.getElementById('projectTimeGoal');
    
    if (nameInput && nameInput.value.trim()) {
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
      this.cancelProject();
      this.renderProjects();
    }
  }

  cancelProject() {
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
      projectForm.style.display = 'none';
    }
    
    const nameInput = document.getElementById('projectName');
    const descInput = document.getElementById('projectDescription');
    const timeGoalInput = document.getElementById('projectTimeGoal');
    
    if (nameInput) nameInput.value = '';
    if (descInput) descInput.value = '';
    if (timeGoalInput) timeGoalInput.value = '';
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

  // Modal functions
  showModal(content) {
    const modal = document.getElementById('modal');
    const modalOverlay = document.getElementById('modalOverlay');
    
    if (modal && modalOverlay) {
      modal.innerHTML = content;
      modalOverlay.style.display = 'flex';
    }
  }

  closeModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
      modalOverlay.style.display = 'none';
    }
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

    // Setup sliders
    this.setupWeeklySliders();
  }

  renderAchievements() {
    const achievementsContent = document.getElementById('achievementsContent');
    if (!achievementsContent) return;

    const achievements = this.getAchievements();
    const unlockedCount = achievements.filter(a => a.unlocked).length;

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
      
      <div class="achievements-grid">
        ${achievements.map(achievement => `
          <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
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
    `;
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
      
      <div class="progression-charts">
        <div class="chart-container">
          <h4>📈 Évolution XP (7 derniers jours)</h4>
          <div class="xp-chart">
            ${this.renderXPChart()}
          </div>
        </div>
        
        <div class="chart-container">
          <h4>🎯 Sessions Focus par Jour</h4>
          <div class="focus-chart">
            ${this.renderFocusChart()}
          </div>
        </div>
      </div>
      
      <div class="progression-details">
        <div class="detail-section">
          <h4>🏆 Progression par Rang</h4>
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

  renderSettings() {
    const settingsContent = document.getElementById('settingsContent');
    if (!settingsContent) return;

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
                <label class="modern-toggle">
                  <input type="checkbox" id="soundNotifications" checked>
                  <span class="toggle-slider"></span>
                </label>
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
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? `${diffDays} jour(s)` : "maintenant";
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
    this.renderWeeklyReview();
  }

  renderWeeklyHistory() {
    if (this.data.weeklyReviews.length === 0) {
      return '<p class="no-reviews">Aucun bilan effectué pour le moment</p>';
    }
    
    return this.data.weeklyReviews.slice(-8).reverse().map(review => `
      <div class="review-card">
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
      </div>
    `).join('');
  }

  getAchievements() {
    const baseAchievements = [
      {
        id: 'first_session',
        name: 'Premier Pas',
        description: 'Complétez votre première session de focus',
        icon: '🎯',
        xp: 10,
        unlocked: this.data.focusSessions.length > 0,
        unlockedAt: this.data.focusSessions[0]?.date
      },
      {
        id: 'daily_quota',
        name: 'Quota Quotidien',
        description: 'Atteignez 15 XP en une journée',
        icon: '⚡',
        xp: 15,
        unlocked: this.data.dailyXP >= 15,
        progress: this.data.dailyXP,
        target: 15
      },
      {
        id: 'week_streak',
        name: 'Semaine Parfaite',
        description: '7 jours consécutifs à 15+ XP',
        icon: '🔥',
        xp: 25,
        unlocked: this.getStreak() >= 7,
        progress: this.getStreak(),
        target: 7
      },
      {
        id: 'focus_master',
        name: 'Maître du Focus',
        description: '50 sessions de focus terminées',
        icon: '🧘',
        xp: 30,
        unlocked: this.data.focusSessions.length >= 50,
        progress: this.data.focusSessions.length,
        target: 50
      },
      {
        id: 'rank_expert',
        name: 'Expert Confirmé',
        description: 'Atteignez le rang Expert (A)',
        icon: '💎',
        xp: 50,
        unlocked: this.data.totalXP >= 1000,
        progress: this.data.totalXP,
        target: 1000
      }
    ];
    
    return baseAchievements;
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

  renderXPChart() {
    const last7Days = this.getLast7DaysXP();
    const maxXP = Math.max(...last7Days.map(d => d.xp), 15);
    
    return `
      <div class="chart-bars">
        ${last7Days.map(day => `
          <div class="chart-bar">
            <div class="bar-fill" style="height: ${(day.xp / maxXP) * 100}%"></div>
            <div class="bar-label">${day.day}</div>
            <div class="bar-value">${day.xp}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderFocusChart() {
    const last7Days = this.getLast7DaysFocus();
    const maxSessions = Math.max(...last7Days.map(d => d.sessions), 3);
    
    return `
      <div class="chart-bars">
        ${last7Days.map(day => `
          <div class="chart-bar">
            <div class="bar-fill focus" style="height: ${(day.sessions / maxSessions) * 100}%"></div>
            <div class="bar-label">${day.day}</div>
            <div class="bar-value">${day.sessions}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  getLast7DaysXP() {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
      
      // Calculate XP for this day (simplified)
      const dayXP = i === 0 ? this.data.dailyXP : Math.floor(Math.random() * 20);
      
      days.push({
        day: dayName,
        xp: dayXP
      });
    }
    
    return days;
  }

  getLast7DaysFocus() {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
      
      // Calculate sessions for this day
      const todaySessions = this.data.focusSessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate.toDateString() === date.toDateString();
      }).length;
      
      days.push({
        day: dayName,
        sessions: i === 0 ? todaySessions : Math.floor(Math.random() * 4)
      });
    }
    
    return days;
  }

  renderRanksProgression() {
    const ranks = [
      { name: 'Paumé', xp: 0, badge: 'E', avatar: '😵' },
      { name: 'Apprenti', xp: 100, badge: 'D', avatar: '🎯' },
      { name: 'Disciple', xp: 300, badge: 'C', avatar: '⚡' },
      { name: 'Adepte', xp: 600, badge: 'B', avatar: '🔥' },
      { name: 'Expert', xp: 1000, badge: 'A', avatar: '💎' },
      { name: 'Virtuose', xp: 1500, badge: 'S', avatar: '👑' },
      { name: 'Légende', xp: 2200, badge: 'SS', avatar: '🌟' },
      { name: 'Élu du Destin', xp: 3000, badge: 'SSS', avatar: '🌙' }
    ];
    
    return ranks.map(rank => {
      const isUnlocked = this.data.totalXP >= rank.xp;
      const isCurrent = this.getCurrentRank().name === rank.name;
      
      return `
        <div class="rank-item ${isUnlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}">
          <div class="rank-avatar">${rank.avatar}</div>
          <div class="rank-info">
            <div class="rank-name">${rank.name}</div>
            <div class="rank-requirement">${rank.xp} XP</div>
          </div>
          <div class="rank-badge">${rank.badge}</div>
        </div>
      `;
    }).join('');
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
      { name: 'Paumé', xp: 0, badge: 'E', avatar: '😵' },
      { name: 'Apprenti', xp: 100, badge: 'D', avatar: '🎯' },
      { name: 'Disciple', xp: 300, badge: 'C', avatar: '⚡' },
      { name: 'Adepte', xp: 600, badge: 'B', avatar: '🔥' },
      { name: 'Expert', xp: 1000, badge: 'A', avatar: '💎' },
      { name: 'Virtuose', xp: 1500, badge: 'S', avatar: '👑' },
      { name: 'Légende', xp: 2200, badge: 'SS', avatar: '🌟' },
      { name: 'Élu du Destin', xp: 3000, badge: 'SSS', avatar: '🌙' }
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
    
    // Other settings listeners can be added here
  }

  changeTheme(theme) {
    document.body.className = `theme-${theme}`;
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
            this.data = { ...this.data, ...importedData };
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
    if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes vos données ? Cette action est irréversible.')) {
      localStorage.removeItem('myRPGLifeData');
      location.reload();
    }
  }

  // UI Updates
  updateUI() {
    this.updateDashboard();
    this.updateTimerDisplay();
  }

  updateDashboard() {
    // Update XP display
    const currentXPEl = document.getElementById('currentXP');
    const dailyXPEl = document.getElementById('dailyXP');
    
    if (currentXPEl) currentXPEl.textContent = this.data.totalXP;
    if (dailyXPEl) dailyXPEl.textContent = this.data.dailyXP;
    
    // Update challenge progress
    const challengeFill = document.getElementById('challengeFill');
    const challengeStatus = document.getElementById('challengeStatus');
    
    if (challengeFill && challengeStatus) {
      const progress = Math.min(100, (this.data.dailyXP / 15) * 100);
      challengeFill.style.width = `${progress}%`;
      challengeStatus.textContent = `${this.data.dailyXP}/15 XP`;
    }
    
    // Update rank info
    this.updateRankDisplay();
  }

  updateRankDisplay() {
    const ranks = [
      { name: 'Paumé', xp: 0, badge: 'E', avatar: '😵' },
      { name: 'Apprenti', xp: 100, badge: 'D', avatar: '🎯' },
      { name: 'Disciple', xp: 300, badge: 'C', avatar: '⚡' },
      { name: 'Adepte', xp: 600, badge: 'B', avatar: '🔥' },
      { name: 'Expert', xp: 1000, badge: 'A', avatar: '💎' },
      { name: 'Virtuose', xp: 1500, badge: 'S', avatar: '👑' },
      { name: 'Légende', xp: 2200, badge: 'SS', avatar: '🌟' },
      { name: 'Élu du Destin', xp: 3000, badge: 'SSS', avatar: '🌙' }
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
    
    if (rankName) rankName.textContent = currentRank.name;
    if (rankBadge) rankBadge.textContent = currentRank.badge;
    if (userAvatar) userAvatar.textContent = currentRank.avatar;
  }

  // Data management
  loadData() {
    const defaultData = {
      totalXP: 0,
      dailyXP: 0,
      projects: [],
      focusSessions: [],
      dailyActions: {},
      xpHistory: [],
      achievements: [],
      weeklyReviews: []
    };
    
    try {
      const saved = localStorage.getItem('myRPGLifeData');
      return saved ? { ...defaultData, ...JSON.parse(saved) } : defaultData;
    } catch (error) {
      console.error('Error loading data:', error);
      return defaultData;
    }
  }

  saveData() {
    try {
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

  // Double or Nothing functions
  chooseSafeReward() {
    this.addXP(5, 'Coffre Mystique - Récompense Sûre');
    this.showNotification('✨ +5 XP de récompense sûre !', 'success');
    this.hideDoubleOrNothingChest();
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