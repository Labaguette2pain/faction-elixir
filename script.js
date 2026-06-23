/* ============================================
   ELIXIR FACTION — script.js
   ============================================
   Pour un leaderboard global partagé, remplacer les appels
   localStorage par des requêtes fetch vers votre API :
     GET  /api/highscore         → { score: number }
     POST /api/highscore         → body: { score: number }
   ============================================ */

'use strict';

/* =========================================
   ROSTER — génération + easter egg SANS
   ========================================= */
(function initRoster() {
  const members = [
    'ADONAI Brandon', 'Alexis Saunier', 'Amenziz Celya', 'Andy Reybillet',
    'ASSOUAN Jérémy', 'BENKHALED Ismaïl', 'BHIHI Saphir', 'Chekib CHAABI',
    'CHIKHI Amine', 'Corentin Piriou', 'David Ducrocq', 'Delfavero Maxime',
    'DIAS PINTO Thomas', 'Dubrulle Océane', 'DURA Mathys', 'Elliott Bougherba',
    'Erwan LE TENSORER', 'Ethan BRAVET', 'Ezio Lejet', 'Félix Bringer',
    'Feraut-Louis Ismael', 'Gabriel Fabre', 'Ginter Alexandre', 'Groult Noe',
    'Guillaume Le Logeais', 'Hamza MIRINII', 'Ishutinova Aleksandra', 'Kenzo Ferrero',
    'Kerian Kennadi Pradier', 'Lahlou Simo', 'Leo Mereuze', 'Léo Dobos',
    'Léo Nellis', 'Lisa Durand', 'Livian Saas', 'Lopez Coute Tom',
    'Louise Nosbé', 'Maël Le Galliot', 'Malo Guiochet', 'Martin Amaury',
    'Meriem Marchoud', 'Nassyr Mohamed-Amine', 'Nolan Courtin', 'Ortega Noa',
    'Pezet Léon', 'Pichard Corentin', 'PISSARRA Léandro', 'Pons Arthur',
    'Raphael ARFIRE', 'Robin BARBION', 'SANS Julien', 'Silberbusch Solal',
    'THABET Chahine'
  ];

  const grid = document.getElementById('rosterGrid');
  if (!grid) return;

  members.forEach((name, i) => {
    const badge = document.createElement('div');
    badge.className = 'member-badge';

    const glow  = document.createElement('div');
    glow.className = 'badge-glow';
    glow.setAttribute('aria-hidden', 'true');

    const idx   = document.createElement('span');
    idx.className = 'badge-index mono';
    idx.textContent = String(i + 1).padStart(2, '0');

    const label = document.createElement('span');
    label.className = 'badge-name';
    label.textContent = name;

    badge.appendChild(glow);
    badge.appendChild(idx);
    badge.appendChild(label);

    // 🥚 EASTER EGG — SANS Julien → Wikipedia Undertale
    if (name === 'SANS Julien') {
      badge.classList.add('easter-egg');
      badge.setAttribute('role', 'link');
      badge.setAttribute('tabindex', '0');
      badge.title = '* tu as l\'air d\'une personne déterminée.';
      const open = () => window.open('https://fr.wikipedia.org/wiki/Sans_(Undertale)', '_blank', 'noopener,noreferrer');
      badge.addEventListener('click', open);
      badge.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); });
    }

    grid.appendChild(badge);
  });

  // Animation d'apparition au scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'none';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  grid.querySelectorAll('.member-badge').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    el.style.transition = `opacity 0.4s ${i * 0.025}s ease, transform 0.4s ${i * 0.025}s ease`;
    observer.observe(el);
  });
})();

/* =========================================
   HEADER SCROLL
   ========================================= */
(function initHeader() {
  const header = document.getElementById('header');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', window.scrollY > 30);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

/* =========================================
   MOBILE NAV
   ========================================= */
(function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const links  = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => links.classList.toggle('open'));
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  document.addEventListener('click', e => {
    if (!toggle.contains(e.target) && !links.contains(e.target)) links.classList.remove('open');
  });
})();

/* =========================================
   TABS
   ========================================= */
(function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active'); btn.setAttribute('aria-selected','true');
      const panel = document.getElementById('tab-' + btn.dataset.tab);
      if (panel) {
        panel.classList.add('active');
        const fill = panel.querySelector('.threat-fill');
        if (fill) { fill.style.animation='none'; fill.offsetHeight; fill.style.animation=''; }
      }
    });
  });
})();

/* =========================================
   LORE CARDS — scroll reveal
   ========================================= */
(function initLoreReveal() {
  const els = document.querySelectorAll('.lore-card, .weakness-item');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.style.opacity='1'; e.target.style.transform='none'; obs.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  els.forEach((el, i) => {
    el.style.opacity='0'; el.style.transform='translateY(16px)';
    el.style.transition=`opacity 0.5s ${i*0.06}s ease, transform 0.5s ${i*0.06}s ease`;
    obs.observe(el);
  });
})();

/* =========================================
   MINI-JEU : BEAM CORE SURVIVOR
   =========================================
   Architecture :
   - Contrôles hybrides : clavier (WASD/ZQSD/Flèches) ou souris (lerp)
   - Bonus LUA  : orbes offensifs en orbite (max 6), + vitesse
   - Bonus RUBY : bouclier physique (rayon croissant), alerte < 3s
   - Bonus C++  : rare, redonne 1 vie
   - Wave 10    : Boss CLAUDE (hexagone, dash + rafale JS, barre HP)
   - localStorage pour le highscore
   ========================================= */
(function initGame() {

  /* --- DOM --- */
  const canvas         = document.getElementById('gameCanvas');
  if (!canvas) return;
  const ctx            = canvas.getContext('2d');
  const overlay        = document.getElementById('gameOverlay');
  const startBtn       = document.getElementById('startBtn');
  const overlayTitle   = document.getElementById('overlayTitle');
  const overlaySub     = document.getElementById('overlaySub');
  const scoreEl        = document.getElementById('scoreDisplay');
  const highscoreEl    = document.getElementById('highscoreDisplay');
  const waveEl         = document.getElementById('waveDisplay');
  const buffLuaEl      = document.getElementById('buffLua');
  const luaCountEl     = document.getElementById('luaCount');
  const buffRubyEl     = document.getElementById('buffRuby');
  const rubyCountEl    = document.getElementById('rubyCount');
  const healthDots     = document.querySelectorAll('.health-dot');
  const bossHud        = document.getElementById('bossHud');
  const bossHealthFill = document.getElementById('bossHealthFill');
  const bossHpText     = document.getElementById('bossHpText');

  /* --- Constantes --- */
  const W = canvas.width;
  const H = canvas.height;

  const BASE_SPEED       = 5.0;
  const LUA_SPEED_BONUS  = 0.6;
  const RUBY_BASE_RADIUS = 28;      // rayon du bouclier au 1er stack
  const RUBY_STACK_ADD   = 10;      // rayon supplémentaire par stack Ruby
  const RUBY_DURATION    = 7000;    // ms par stack
  const ORBIT_RADIUS     = 44;      // rayon orbital des orbes Lua
  const ORBIT_SPEED      = 2.2;     // rad/s
  const ORBE_DMG_RADIUS  = 9;
  const MAX_ORBS         = 6;
  const BULLET_SPEED     = 9;
  const BULLET_R         = 5;
  const MAX_HEALTH       = 3;
  const PLAYER_R         = 14;
  const ENEMY_R          = 9;
  const BONUS_R          = 11;
  const BOSS_WAVE        = 10;
  const BOSS_MAX_HP      = 600;
  const BOSS_R           = 28;
  const LERP_FACTOR      = 0.10;    // lissage souris

  const LS_KEY = 'elixir_highscore';

  /* --- État --- */
  let state     = 'idle';   // idle | playing | gameover
  let lastTime  = 0;
  let score     = 0;
  let highscore = parseInt(localStorage.getItem(LS_KEY) || '0', 10);
  let health    = MAX_HEALTH;
  let wave      = 1;

  let luaStacks  = 0;
  let rubyStacks = 0;
  let rubyTimer  = 0;
  let orbs       = [];   // orbes en orbite
  let orbitAngle = 0;

  let invTimer   = 0;    // invincibilité flash après coup
  let spawnTimer = 0;
  let bonusTimer = 0;
  let waveTimer  = 0;
  let shootTimer = 0;    // cooldown tir des orbes

  let enemies   = [];
  let bullets   = [];
  let bonuses   = [];
  let particles = [];
  let boss      = null;
  let bossSpawned = false;

  const player  = { x: W/2, y: H/2, r: PLAYER_R };
  const mouse   = { x: W/2, y: H/2 };
  const keys    = {};

  /* --- Touches bloquées pendant le jeu --- */
  const BLOCKED = new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ']);

  document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (state === 'playing' && BLOCKED.has(e.key)) e.preventDefault();
  });
  document.addEventListener('keyup', e => { keys[e.key] = false; });

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * (W / rect.width);
    mouse.y = (e.clientY - rect.top)  * (H / rect.height);
  });

  /* --- Helpers --- */
  const rand  = (a, b) => Math.random() * (b - a) + a;
  const dist  = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function lerp(a, b, t) { return a + (b - a) * t; }

  /* --- Highscore --- */
  function saveHighscore() {
    if (score > highscore) {
      highscore = score;
      localStorage.setItem(LS_KEY, highscore);
      // TODO: POST /api/highscore avec { score: highscore } pour le leaderboard global
    }
    highscoreEl.textContent = highscore;
  }

  /* --- HUD --- */
  function updateHUD() {
    scoreEl.textContent    = score;
    waveEl.textContent     = wave;
    highscoreEl.textContent = highscore;
    healthDots.forEach((d, i) => d.classList.toggle('active', i < health));

    if (luaStacks > 0) { buffLuaEl.style.display='inline-flex'; luaCountEl.textContent=luaStacks; }
    else                  buffLuaEl.style.display='none';

    if (rubyStacks > 0) { buffRubyEl.style.display='inline-flex'; rubyCountEl.textContent=rubyStacks; }
    else                   buffRubyEl.style.display='none';
  }

  /* --- Reset --- */
  function resetGame() {
    score=0; health=MAX_HEALTH; wave=1;
    luaStacks=0; rubyStacks=0; rubyTimer=0; orbs=[];
    invTimer=0; spawnTimer=0; bonusTimer=0; waveTimer=0; shootTimer=0; orbitAngle=0;
    enemies=[]; bullets=[]; bonuses=[]; particles=[];
    boss=null; bossSpawned=false;
    player.x=W/2; player.y=H/2;
    mouse.x=W/2;  mouse.y=H/2;
    bossHud.style.display='none';
    updateHUD();
  }

  /* --- Particles --- */
  function spawnParticles(x, y, color, n=10) {
    for (let i=0; i<n; i++) {
      const a = rand(0, Math.PI*2), s = rand(2,6);
      particles.push({ x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, color, life:1, decay:rand(0.02,0.05), size:rand(2,5) });
    }
  }

  /* --- Spawn ennemi --- */
  function spawnEnemy() {
    const side = Math.floor(rand(0,4));
    let x, y;
    const m = -(ENEMY_R+4);
    if (side===0)      { x=rand(0,W); y=m; }
    else if (side===1) { x=W-m;        y=rand(0,H); }
    else if (side===2) { x=rand(0,W); y=H-m; }
    else               { x=m;          y=rand(0,H); }

    const type   = Math.random()<0.55 ? 'js' : 'rust';
    const speed  = (1.8 + wave*0.22) * (type==='rust' ? 0.72 : 1.08);
    const radius = type==='rust' ? ENEMY_R+3 : ENEMY_R;
    const hp     = type==='rust' ? 2 : 1;
    enemies.push({ x, y, r:radius, type, speed, hp });
  }

  /* --- Spawn bonus --- */
  function spawnBonus() {
    const m = BONUS_R+24;
    const roll = Math.random();
    let type;
    // C++ : rare (8%), Ruby : 28%, Lua : 64%
    if (roll < 0.08)        type = 'cpp';
    else if (roll < 0.36)   type = 'ruby';
    else                    type = 'lua';

    bonuses.push({ x:rand(m,W-m), y:rand(m,H-m), r:BONUS_R, type, age:0, lifetime:9000 });
  }

  /* --- Boss CLAUDE --- */
  function spawnBoss() {
    bossSpawned = true;
    boss = {
      x: W/2, y: -BOSS_R-10,
      r: BOSS_R, hp: BOSS_MAX_HP, maxHp: BOSS_MAX_HP,
      angle: 0,
      dashCooldown: 3000, dashTimer: 0,
      burstCooldown: 2200, burstTimer: 0,
      phase: 'enter'   // enter → idle → fight
    };
    bossHud.style.display='flex';
  }

  function updateBoss(dt) {
    if (!boss) return;

    boss.angle += dt * 0.002;

    // Phase entrée — descend vers le haut du canvas
    if (boss.phase === 'enter') {
      boss.y += 1.8;
      if (boss.y >= 80) boss.phase = 'idle';
      return;
    }

    boss.dashTimer  -= dt;
    boss.burstTimer -= dt;

    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const d  = Math.hypot(dx, dy) || 1;

    // Déplacement de base lent vers le joueur
    boss.x += (dx/d) * 0.9;
    boss.y += (dy/d) * 0.9;

    // Dash : si loin du joueur
    if (boss.dashTimer <= 0 && d > 160) {
      boss.dashTimer = rand(3200,4500);
      // Dash brutal
      const dashFrames = 18;
      let frame = 0;
      const dashStep = () => {
        if (!boss || frame >= dashFrames) return;
        const d2 = Math.hypot(player.x-boss.x, player.y-boss.y)||1;
        boss.x += ((player.x-boss.x)/d2)*9;
        boss.y += ((player.y-boss.y)/d2)*9;
        frame++;
        if (state==='playing') requestAnimationFrame(dashStep);
      };
      dashStep();
    }

    // Rafale JS : 3 projectiles rapides
    if (boss.burstTimer <= 0) {
      boss.burstTimer = rand(2000,3000);
      for (let i=0; i<3; i++) {
        setTimeout(() => {
          if (!boss || state!=='playing') return;
          const a = Math.atan2(player.y-boss.y, player.x-boss.x) + rand(-0.2,0.2);
          bullets.push({
            x: boss.x, y: boss.y,
            vx: Math.cos(a)*7.5, vy: Math.sin(a)*7.5,
            r: BULLET_R, isBoss: true, life:1
          });
        }, i*180);
      }
    }

    // Collision boss → joueur
    if (invTimer<=0 && dist(boss,player) < boss.r+player.r) {
      const shieldR = rubyStacks>0 ? RUBY_BASE_RADIUS+rubyStacks*RUBY_STACK_ADD : 0;
      if (rubyStacks>0 && dist(boss,player) > player.r+shieldR-4) {
        // bouclier absorbe le contact boss
        spawnParticles(player.x,player.y,'#EF4444',14);
      } else {
        health--; invTimer=1500;
        spawnParticles(player.x,player.y,'#9B30FF',12);
        updateHUD();
        if (health<=0) { gameOver(); return; }
      }
    }
  }

  /* --- Update principal --- */
  function update(dt) {

    /* Mouvement joueur — clavier ou souris (lerp) */
    let mvX=0, mvY=0;
    let usingKeys = false;
    if (keys['ArrowLeft']||keys['a']||keys['q']) { mvX-=1; usingKeys=true; }
    if (keys['ArrowRight']||keys['d'])             { mvX+=1; usingKeys=true; }
    if (keys['ArrowUp']||keys['w']||keys['z'])     { mvY-=1; usingKeys=true; }
    if (keys['ArrowDown']||keys['s'])              { mvY+=1; usingKeys=true; }

    if (usingKeys) {
      // ✅ Normalisation diagonale
      const mag = Math.hypot(mvX,mvY) || 1;
      const spd = BASE_SPEED + luaStacks*LUA_SPEED_BONUS;
      player.x += (mvX/mag)*spd;
      player.y += (mvY/mag)*spd;
    } else {
      // Suivi souris lissé (lerp)
      player.x = lerp(player.x, mouse.x, LERP_FACTOR);
      player.y = lerp(player.y, mouse.y, LERP_FACTOR);
    }

    player.x = Math.max(player.r, Math.min(W-player.r, player.x));
    player.y = Math.max(player.r, Math.min(H-player.r, player.y));

    /* Timers */
    spawnTimer+=dt; bonusTimer+=dt; waveTimer+=dt; shootTimer+=dt;
    if (invTimer>0) invTimer-=dt;
    if (rubyStacks>0) {
      rubyTimer-=dt;
      if (rubyTimer<=0) { rubyStacks=0; updateHUD(); }
    }

    /* Vagues */
    const waveInterval = Math.max(5000, 12000 - wave*600);
    if (waveTimer>=waveInterval) {
      wave++;
      waveTimer=0;
      score+=wave*50;
      updateHUD();
      if (wave===BOSS_WAVE && !bossSpawned) spawnBoss();
    }

    /* Spawn ennemis */
    const spawnInterval = Math.max(300, 1100 - wave*70);
    if (spawnTimer>=spawnInterval) {
      spawnEnemy();
      if (wave>3 && Math.random()<0.4) spawnEnemy();
      if (wave>6 && Math.random()<0.3) spawnEnemy();
      spawnTimer=0;
    }

    /* Spawn bonus */
    if (bonusTimer>=3500 && bonuses.length<4) { spawnBonus(); bonusTimer=0; }

    /* Score passif */
    score += Math.floor(dt*0.015*wave);

    /* Orbes Lua — orbite & tir automatique */
    if (luaStacks>0) {
      orbitAngle += ORBIT_SPEED*(dt/1000);
      // Positions des orbes
      orbs = [];
      const count = Math.min(luaStacks, MAX_ORBS);
      for (let i=0; i<count; i++) {
        const a = orbitAngle + (Math.PI*2/count)*i;
        orbs.push({
          x: player.x + Math.cos(a)*ORBIT_RADIUS,
          y: player.y + Math.sin(a)*ORBIT_RADIUS,
          r: ORBE_DMG_RADIUS
        });
      }

      // Tir des orbes vers l'ennemi le plus proche (auto toutes les 600ms / luaStacks)
      const cooldown = Math.max(180, 600 - (luaStacks-1)*80);
      if (shootTimer>=cooldown) {
        shootTimer=0;
        // Trouver la cible (boss prioritaire)
        let target = boss;
        if (!target) {
          let minD=Infinity;
          enemies.forEach(e => { const d=dist(player,e); if(d<minD){minD=d;target=e;} });
        }
        if (target) {
          orbs.forEach(orb => {
            const a = Math.atan2(target.y-orb.y, target.x-orb.x);
            bullets.push({ x:orb.x, y:orb.y, vx:Math.cos(a)*BULLET_SPEED, vy:Math.sin(a)*BULLET_SPEED, r:BULLET_R, isBoss:false, life:1 });
          });
        }
      }
    }

    /* Boss */
    updateBoss(dt);

    /* Déplacement ennemis */
    enemies.forEach(e => {
      const dx=player.x-e.x, dy=player.y-e.y, d=Math.hypot(dx,dy)||1;
      e.x+=(dx/d)*e.speed; e.y+=(dy/d)*e.speed;
    });

    /* Déplacement bullets */
    bullets.forEach(b => {
      b.x+=b.vx; b.y+=b.vy;
      if (b.x<-20||b.x>W+20||b.y<-20||b.y>H+20) b.life=0;
    });

    /* Collisions bullets → ennemis */
    for (let bi=bullets.length-1; bi>=0; bi--) {
      const b=bullets[bi];
      if (b.life<=0||b.isBoss) continue;
      // → Boss
      if (boss && dist(b,boss)<b.r+boss.r) {
        b.life=0; boss.hp--;
        spawnParticles(b.x,b.y,'#F5A623',6);
        const pct=boss.hp/boss.maxHp;
        bossHealthFill.style.width=(pct*100)+'%';
        bossHpText.textContent=boss.hp+'/'+boss.maxHp;
        if (boss.hp<=0) { killBoss(); }
        continue;
      }
      // → Ennemis
      for (let ei=enemies.length-1; ei>=0; ei--) {
        const e=enemies[ei];
        if (dist(b,e)<b.r+e.r) {
          b.life=0; e.hp--;
          spawnParticles(b.x,b.y,e.type==='js'?'#EAB308':'#F97316',6);
          if (e.hp<=0) { spawnParticles(e.x,e.y,e.type==='js'?'#EAB308':'#F97316',14); enemies.splice(ei,1); score+=e.type==='rust'?40:20; updateHUD(); }
          break;
        }
      }
    }
    bullets = bullets.filter(b=>b.life>0);

    /* Orbes offensifs — collision directe avec ennemis */
    orbs.forEach(orb => {
      for (let ei=enemies.length-1; ei>=0; ei--) {
        if (dist(orb,enemies[ei])<orb.r+enemies[ei].r) {
          enemies[ei].hp--;
          spawnParticles(orb.x,orb.y,enemies[ei].type==='js'?'#EAB308':'#F97316',5);
          if (enemies[ei].hp<=0) { enemies.splice(ei,1); score+=25; updateHUD(); }
        }
      }
    });

    /* Bonus vieillissement */
    bonuses.forEach(b=>{ b.age+=dt; });
    bonuses=bonuses.filter(b=>b.age<b.lifetime);

    /* Collision ennemis → joueur */
    if (invTimer<=0) {
      const shieldR = rubyStacks>0 ? RUBY_BASE_RADIUS+rubyStacks*RUBY_STACK_ADD : 0;
      for (let i=enemies.length-1; i>=0; i--) {
        const e=enemies[i];
        const d=dist(player,e);
        // Bouclier Ruby : collision avec le rayon du bouclier
        if (rubyStacks>0 && d<player.r+shieldR+e.r) {
          spawnParticles(e.x,e.y,'#EF4444',14);
          enemies.splice(i,1); score+=30; updateHUD();
        } else if (rubyStacks===0 && d<player.r+e.r) {
          health--; invTimer=1400;
          spawnParticles(player.x,player.y,'#9B30FF',12);
          enemies.splice(i,1); updateHUD();
          if (health<=0) { gameOver(); return; }
        }
      }
    }

    /* Collision bullets boss → joueur */
    for (let bi=bullets.length-1; bi>=0; bi--) {
      const b=bullets[bi];
      if (!b.isBoss||b.life<=0) continue;
      if (invTimer<=0 && dist(b,player)<b.r+player.r) {
        b.life=0;
        const shieldR=rubyStacks>0?RUBY_BASE_RADIUS+rubyStacks*RUBY_STACK_ADD:0;
        if (rubyStacks>0) { spawnParticles(b.x,b.y,'#EF4444',8); }
        else { health--; invTimer=1200; spawnParticles(player.x,player.y,'#9B30FF',10); updateHUD(); if(health<=0){gameOver();return;} }
      }
    }

    /* Collision joueur → bonus */
    for (let i=bonuses.length-1; i>=0; i--) {
      const b=bonuses[i];
      if (dist(player,b)<player.r+b.r) {
        if (b.type==='lua') {
          luaStacks=Math.min(luaStacks+1,MAX_ORBS);
          spawnParticles(b.x,b.y,'#06B6D4',12);
        } else if (b.type==='ruby') {
          rubyStacks++;
          rubyTimer=RUBY_DURATION;
          spawnParticles(b.x,b.y,'#EF4444',16);
        } else if (b.type==='cpp') {
          if (health<MAX_HEALTH) health++;
          spawnParticles(b.x,b.y,'#22C55E',20);
        }
        bonuses.splice(i,1); updateHUD();
      }
    }

    /* Particules */
    particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vx*=0.92; p.vy*=0.92; p.life-=p.decay; });
    particles=particles.filter(p=>p.life>0);
  }

  /* --- Mort du boss --- */
  function killBoss() {
    spawnParticles(boss.x,boss.y,'#F5A623',40);
    spawnParticles(boss.x,boss.y,'#fff',20);
    boss=null; bossHud.style.display='none';
    score+=1500; wave++; updateHUD();
    // Onde de choc dorée
    enemies.splice(0,enemies.length);
  }

  /* --- Game Over --- */
  function gameOver() {
    state='gameover';
    saveHighscore();
    overlayTitle.textContent='PROCESSUS TERMINÉ';
    overlaySub.innerHTML=`Score : <strong>${score}</strong> — Record : <strong>${highscore}</strong><br>Le Supervisor OTP redémarre…`;
    overlay.classList.remove('hidden');
    startBtn.style.display='none';
    setTimeout(()=>{
      overlayTitle.textContent='REDÉMARRAGE';
      overlaySub.innerHTML=`Record personnel : <strong>${highscore} pts</strong>`;
      startBtn.textContent='Relancer';
      startBtn.style.display='';
    },2000);
  }

  /* --- DRAW --- */
  function draw(now) {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#07070D'; ctx.fillRect(0,0,W,H);

    // Grille
    ctx.strokeStyle='rgba(155,48,255,0.045)'; ctx.lineWidth=0.5;
    for (let x=0;x<W;x+=42){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y=0;y<H;y+=42){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    /* Bullets */
    bullets.forEach(b=>{
      const color=b.isBoss?'#EAB308':'#06B6D4';
      const glow=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r*3.5);
      glow.addColorStop(0,color+'70'); glow.addColorStop(1,'transparent');
      ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(b.x,b.y,b.r*3.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=color; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(b.x,b.y,b.r*0.4,0,Math.PI*2); ctx.fill();
    });

    /* Bonus */
    bonuses.forEach(b=>{
      const color=b.type==='lua'?'#06B6D4':b.type==='ruby'?'#EF4444':'#22C55E';
      const pulse=0.65+0.35*Math.sin(now*0.003+b.age*0.001);
      const fade=b.age>b.lifetime-2500?(b.lifetime-b.age)/2500:1;
      ctx.save(); ctx.globalAlpha=fade;
      const glow=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r*3*pulse);
      glow.addColorStop(0,color+'55'); glow.addColorStop(1,'transparent');
      ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(b.x,b.y,b.r*3*pulse,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=color; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff'; ctx.font=`bold 7px 'JetBrains Mono',monospace`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(b.type.toUpperCase(),b.x,b.y);
      ctx.restore();
    });

    /* Ennemis */
    enemies.forEach(e=>{
      const color=e.type==='js'?'#EAB308':'#F97316';
      const glow=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,e.r*3.5);
      glow.addColorStop(0,color+'45'); glow.addColorStop(1,'transparent');
      ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(e.x,e.y,e.r*3.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=color; ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.fill();
      if (e.type==='rust'&&e.hp===1){ ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.arc(e.x,e.y,e.r*0.5,0,Math.PI*2); ctx.fill(); }
      ctx.fillStyle='#000'; ctx.font=`bold 6px 'JetBrains Mono',monospace`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(e.type==='js'?'JS':'RS',e.x,e.y);
    });

    /* Boss */
    if (boss) {
      const bp=boss.hp/boss.maxHp;
      const bcolor='#F5A623';

      // Lueur boss
      const bglow=ctx.createRadialGradient(boss.x,boss.y,0,boss.x,boss.y,boss.r*4);
      bglow.addColorStop(0,'rgba(245,166,35,0.35)'); bglow.addColorStop(1,'transparent');
      ctx.fillStyle=bglow; ctx.beginPath(); ctx.arc(boss.x,boss.y,boss.r*4,0,Math.PI*2); ctx.fill();

      // Hexagone Claude
      ctx.save(); ctx.translate(boss.x,boss.y); ctx.rotate(boss.angle);
      ctx.beginPath();
      for(let i=0;i<6;i++){
        const a=(Math.PI/3)*i-Math.PI/6;
        i===0?ctx.moveTo(Math.cos(a)*boss.r,Math.sin(a)*boss.r):ctx.lineTo(Math.cos(a)*boss.r,Math.sin(a)*boss.r);
      }
      ctx.closePath();
      ctx.fillStyle=`rgba(245,166,35,${0.15+bp*0.25})`; ctx.fill();
      ctx.strokeStyle=bcolor; ctx.lineWidth=2.5; ctx.stroke();

      // Hexagone interne
      ctx.beginPath();
      for(let i=0;i<6;i++){
        const a=(Math.PI/3)*i+Math.PI/6;
        i===0?ctx.moveTo(Math.cos(a)*boss.r*0.55,Math.sin(a)*boss.r*0.55):ctx.lineTo(Math.cos(a)*boss.r*0.55,Math.sin(a)*boss.r*0.55);
      }
      ctx.closePath();
      ctx.strokeStyle='rgba(245,166,35,0.6)'; ctx.lineWidth=1.5; ctx.stroke();
      ctx.restore();

      // Label
      ctx.fillStyle=bcolor; ctx.font=`bold 10px 'JetBrains Mono',monospace`;
      ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText('CLAUDE',boss.x,boss.y-boss.r-6);
    }

    /* Particules */
    particles.forEach(p=>{
      ctx.save(); ctx.globalAlpha=p.life;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2);
      ctx.fillStyle=p.color; ctx.fill(); ctx.restore();
    });

    /* Orbes Lua en orbite */
    orbs.forEach((orb,i)=>{
      const glow=ctx.createRadialGradient(orb.x,orb.y,0,orb.x,orb.y,orb.r*3);
      glow.addColorStop(0,'rgba(6,182,212,0.6)'); glow.addColorStop(1,'transparent');
      ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(orb.x,orb.y,orb.r*3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#06B6D4'; ctx.beginPath(); ctx.arc(orb.x,orb.y,orb.r,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(orb.x,orb.y,orb.r*0.4,0,Math.PI*2); ctx.fill();
    });

    /* Joueur */
    const blink=invTimer>0&&Math.floor(invTimer/100)%2===0;
    if (!blink) {
      // Bouclier Ruby
      if (rubyStacks>0) {
        const shieldR=RUBY_BASE_RADIUS+rubyStacks*RUBY_STACK_ADD;
        const alertBlink=rubyTimer<3000&&Math.floor(rubyTimer/200)%2===0;
        const shieldAlpha=alertBlink?0.35:0.65;
        const sp=0.8+0.2*Math.sin(now*0.006);

        ctx.save();
        ctx.globalAlpha=shieldAlpha*sp;
        ctx.beginPath(); ctx.arc(player.x,player.y,shieldR+player.r,0,Math.PI*2);
        ctx.strokeStyle='#EF4444'; ctx.lineWidth=alertBlink?3:2; ctx.stroke();

        const sg=ctx.createRadialGradient(player.x,player.y,player.r,player.x,player.y,player.r+shieldR+8);
        sg.addColorStop(0,'rgba(239,68,68,0.2)'); sg.addColorStop(1,'transparent');
        ctx.fillStyle=sg; ctx.beginPath(); ctx.arc(player.x,player.y,player.r+shieldR+8,0,Math.PI*2); ctx.fill();
        ctx.restore();

        // Anneau rotatif
        ctx.save(); ctx.translate(player.x,player.y); ctx.rotate(now*0.0018);
        ctx.globalAlpha=0.3*sp;
        ctx.beginPath(); ctx.arc(0,0,shieldR+player.r+6,0,Math.PI*1.6);
        ctx.strokeStyle='#EF4444'; ctx.lineWidth=1; ctx.stroke();
        ctx.restore();
      }

      // Lueur joueur
      const pg=ctx.createRadialGradient(player.x,player.y,0,player.x,player.y,player.r*3);
      pg.addColorStop(0,'rgba(155,48,255,0.65)'); pg.addColorStop(1,'transparent');
      ctx.fillStyle=pg; ctx.beginPath(); ctx.arc(player.x,player.y,player.r*3,0,Math.PI*2); ctx.fill();

      // Corps
      const pb=ctx.createRadialGradient(player.x-3,player.y-3,2,player.x,player.y,player.r);
      pb.addColorStop(0,'#C84BF5'); pb.addColorStop(1,'#6B10CC');
      ctx.fillStyle=pb; ctx.beginPath(); ctx.arc(player.x,player.y,player.r,0,Math.PI*2); ctx.fill();

      // Anneau
      ctx.beginPath(); ctx.arc(player.x,player.y,player.r,0,Math.PI*2);
      ctx.strokeStyle='#F0E6FF'; ctx.lineWidth=1.5; ctx.globalAlpha=0.5; ctx.stroke(); ctx.globalAlpha=1;

      // Hexagone intérieur
      ctx.beginPath();
      for(let i=0;i<6;i++){const a=(Math.PI/3)*i-Math.PI/6; i===0?ctx.moveTo(player.x+Math.cos(a)*6,player.y+Math.sin(a)*6):ctx.lineTo(player.x+Math.cos(a)*6,player.y+Math.sin(a)*6);}
      ctx.closePath(); ctx.strokeStyle='#F0E6FF'; ctx.lineWidth=1; ctx.globalAlpha=0.4; ctx.stroke(); ctx.globalAlpha=1;
    }

    /* HUD canvas */
    ctx.font=`600 11px 'JetBrains Mono',monospace`;
    ctx.textAlign='left'; ctx.textBaseline='top';
    ctx.fillStyle='rgba(155,48,255,0.5)';
    ctx.fillText(`SCORE: ${score}`,12,12);
    ctx.textAlign='center';
    ctx.fillStyle='rgba(155,48,255,0.35)';
    ctx.fillText(`VAGUE ${wave}`,W/2,12);
    ctx.textAlign='right';
    ctx.fillStyle='rgba(200,75,245,0.4)';
    ctx.fillText(`RECORD: ${highscore}`,W-12,12);

    // Alerte bouclier
    if (rubyStacks>0 && rubyTimer<3000 && Math.floor(rubyTimer/400)%2===0) {
      ctx.fillStyle='rgba(239,68,68,0.8)'; ctx.font=`bold 10px 'JetBrains Mono',monospace`;
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('⚠ BOUCLIER CRITIQUE',W/2,H-28);
    }
  }

  /* --- Loop --- */
  function loop(now) {
    const dt=Math.min(now-lastTime,50);
    lastTime=now;
    update(dt);
    draw(now);
    if (state==='playing') requestAnimationFrame(loop);
  }

  function startGame() {
    resetGame();
    state='playing';
    overlay.classList.add('hidden');
    canvas.focus();
    lastTime=performance.now();
    highscoreEl.textContent=highscore;
    requestAnimationFrame(loop);
  }

  startBtn.addEventListener('click',()=>{ if(state!=='playing') startGame(); });
  canvas.addEventListener('click',()=>{ if(state==='playing') canvas.focus(); });

  // Afficher le highscore initial
  highscoreEl.textContent=highscore;

})();