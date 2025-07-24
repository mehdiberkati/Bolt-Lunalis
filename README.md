# Lunalis 🌙

## Description

Application immersive de gamification pour booster la productivité et la discipline. Transformez vos objectifs en aventure RPG avec un système XP avancé, des avatars évolutifs et une progression saisonnière.

## 🎯 Objectifs Principaux

- Business freelance
- Développement d'applications
- Sport et bien-être
- Études et apprentissage

## ⚡ Fonctionnalités Clés

### 🕐 Timer Focus Interactif

- Sessions de focus personnalisables (15-120 min)
- Calcul XP en temps réel (18 min = 1 XP)
- Pauses automatiques optionnelles (5 min toutes les 25 min)
- Attribution de projets aux sessions
- Intégration Spotify (simulation)

### 📊 Système XP & Progression

- **Blocs obligatoires**: 2 sessions/jour (1h30 chacune = 5 XP)
- **Blocs bonus**: Débloqués après les obligatoires (double XP)
- **Sport**: ≥50 min = +3 XP
- **Sommeil**: >7h avant 22h = +2 XP, avant minuit = +1 XP
- **Punitions**: Instagram +1h = -3 XP, Musique +1h30 = -5 XP
- **Quota minimum**: 15 XP/jour
- Graphiques basés sur l'historique réel des sessions
- Sélecteur 7/30 jours ou personnalisé
- Barre de progression vers le prochain rang
- Statistiques quotidiennes réinitialisées à minuit

### 🏆 Système de Rangs

- **8 rangs**: E (Paumé improductif) → SSS (Élu du Destin)
- Avatars et interface évolutifs
- Badges et titres personnalisés
- Couleurs thématiques par rang

### 🎮 Gamification Avancée

- **Saisons**: 2 saisons de 6 semaines
- **Achievements**: 13 succès de difficulté croissante
- **Quêtes surprises**: Apparaissent après 7 jours consécutifs à 15+ XP
- **Taux d'intensité**: Basé sur les bilans hebdomadaires

### 📝 Bilan Hebdomadaire

- 5 questions notées sur 10
- Score maximum: 50 points
- Calcul automatique du taux d'intensité
- Progression saisonnière

### 📋 Gestion de Projets

- Création de projets par catégorie
- Tracking du temps par projet
- Statistiques détaillées
- Objectifs personnalisables

## 🎨 Design

- Interface futuriste et moderne
- Couleurs sombres (bleu, violet, cyan)
- Animations fluides et immersives
- Feedback visuel instantané

## 🧠 Principes Scientifiques Intégrés

1. **Feedback immédiat**: XP et animations instantanées
2. **Micro-récompenses**: Achievements et notifications
3. **Punitions légères**: Pertes XP modérées
4. **Progression claire**: Barres, rangs, statistiques
5. **Personnalisation**: Avatars et projets personnalisés
6. **Motivation intrinsèque**: Connexion aux objectifs personnels
7. **Récompenses variables**: Quêtes surprises et achievements

## 🚀 Utilisation

### Démarrage Rapide

1. Ouvrir `index.html` dans un navigateur
2. Choisir un objectif de saison pour débloquer le bouton **Commencer l'aventure**
3. Créer vos premiers projets
4. Lancer une session de focus
5. Suivre votre progression quotidienne

### Navigation

- **Dashboard**: Vue d'ensemble et actions rapides
- **Focus**: Timer interactif et gestion de sessions
- **Projets**: Création et suivi des projets
- **Succès**: Déblocage d'achievements
- **Progression**: Statistiques et rangs
- **Bilan**: Évaluation hebdomadaire
- **Paramètres**: Configuration de l'application

### Actions Quotidiennes

- ✅ Compléter 2 blocs focus obligatoires
- 🏃 Enregistrer l'activité sportive
- 😴 Logger les heures de sommeil
- 📱 Déclarer les distractions (optionnel)

## 📈 Système de Progression

### Rangs et XP Requis

- **E - Paumé improductif**: < 200 XP
- **D - Le Spectateur de Sa Vie**: 200 XP
- **C - L’Errant du Crépuscule**: 300 XP
- **B - Le Stratège Naissant**: 400 XP
- **A - Le Vétéran**: 500 XP
- **S - Sentinelle de l'Ascension**: 600 XP
- **SS - Le Paragon du Zénith**: 700 XP
- **SSS - Élu du Destin**: ≥ 750 XP

### Taux d'Intensité

- **0-20%**: Errant du Néant
- **21-40%**: Apprenti Perdu
- **41-60%**: Disciple Motivé
- **61-75%**: Adepte Déterminé
- **76-85%**: Expert Focalisé
- **86-95%**: Maître Discipliné
- **96-99%**: Légende Vivante
- **100%**: Transcendant

## 💾 Sauvegarde

- Données sauvegardées automatiquement dans le navigateur
- Export/import des données disponible
- Sauvegarde toutes les 30 secondes
- Synchronisation multi-appareils via IndexedDB ou backend (à venir)
- Tokens OAuth sauvegardés chiffrés dans le dossier utilisateur

## 🔧 Configuration Technique

- **Technologies**: HTML5, CSS3, JavaScript ES6+
- **Stockage**: LocalStorage
- **Compatibilité**: Navigateurs modernes
- **Responsive**: Optimisé pour PC
- **Sécurité**: Tokens chiffrés avec une clé dérivée de l'utilisateur

### Lancer l'application Electron

1. Installez Node.js et npm.
2. Dans ce dossier exécutez `npm install` pour récupérer les dépendances.
3. Démarrez l'application avec `npm start`.
4. Ouvrez ensuite l'onglet **Paramètres** et cliquez sur **Connecter Google Calendar** pour lier votre compte.

### Changer l'icône de la fenêtre

1. Placez votre icône (format `.png`) dans `assets/icon.png`.
2. Dans `main.js`, ajoutez ou modifiez l'option `icon` lors de la création de `BrowserWindow` :
   ```js
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  ```

### Ajuster l'opacité du halo d'intensité

Le pourcentage du taux d'intensité possède un halo lumineux. Pour réduire ce
glow, modifiez la constante `INTENSITY_VALUE_GLOW_OPACITY` dans `script.js` :

```js
const INTENSITY_VALUE_GLOW_OPACITY = 0.4; // 0.5 pour un halo plus discret
```

### Créer l'exécutable Windows

1. Assurez-vous d'avoir installé les dépendances avec `npm install`.
2. Générez l'application avec `npm run package-win`.
3. L'exécutable se trouve dans `release/Lunalis-win32-x64/Lunalis.exe`.
   Vous pouvez le lancer directement sans passer par `npm start`.

### Tester les styles de rang

Pour visualiser les différents designs de rang sur le dashboard, vous pouvez modifier temporairement votre total d'XP directement depuis la console du navigateur :

1. Ouvrez l'application et appuyez sur `F12` pour ouvrir les outils de développement.
2. Dans l'onglet **Console**, entrez par exemple :
   ```js
   app.data.totalXP = 600; // applique le rang S
   app.updateUI();
   app.saveData();
   ```
3. Recommencez avec d'autres valeurs (0, 200, 300, … 750) pour tester chaque rang et découvrir leur style.

### Tester la validation de l'objectif de saison

Vous pouvez aussi modifier l'objectif ou le remplir manuellement :

1. Dans la console :
   ```js
   app.data.seasonGoalXP = 500; // objectif rang A
   app.data.totalXP = 500; // valider l'objectif
   app.updateUI();
   app.saveData();
   ```
2. Le bloc **Objectif de Saison** passe alors en vert.

## 🎯 Objectifs de Performance

- Score ≥ 750 XP par saison
- Taux d'intensité ≥ 85%
- Consistance quotidienne (15+ XP/jour)
- Progression continue et motivation durable

---

**Version**: 3.0.0 - Lunalis  
**Créé pour**: Maximiser la discipline et la productivité  
**Philosophie**: "Discipline fun, addiction saine, progression constante"
