/* ============================================
   ELIXIR FACTION — script.js
   ============================================ */

'use strict';

/* ---- HEADER SCROLL ---- */
(function initHeader() {
  const header = document.getElementById('header');
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', window.scrollY > 30);
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ---- MOBILE NAV ---- */
(function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => links.classList.toggle('open'));
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  document.addEventListener('click', e => {
    if (!toggle.contains(e.target) && !links.contains(e.target)) links.classList.remove('open');
  });
})();

/* ---- TABS (FACTIONS ENNEMIES) ---- */
(function initTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  const panels  = document.querySelectorAll('.tab-panel');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      buttons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const panel = document.getElementById('tab-' + target);
      if (panel) {
        panel.classList.add('active');
        const fill = panel.querySelector('.threat-fill');
        if (fill) { fill.style.animation = 'none'; fill.offsetHeight; fill.style.animation = ''; }
      }
    });
  });
})();

/* ---- INTERSECTION OBSERVER ---- */
(function initObserver() {
  const elements = document.querySelectorAll('.lore-card, .member-badge, .weakness-item');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'none';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  elements.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = `opacity 0.5s ${i * 0.04}s ease, transform 0.5s ${i * 0.04}s ease`;
    observer.observe(el);
  });
})();

/* ============================================
   MINI-JEU : BEAM CORE SURVIVOR
   ============================================ */
(function initGame() {
  const canvas        = document.getElementById('gameCanvas');
  const ctx           = canvas.getContext('2d');
  const overlay       = document.getElementById('gameOverlay');
  const startBtn      = document.getElementById('startBtn');
  const overlayTitle  = document.getElementById('overlayTitle');
  const overlaySub    = document.getElementById('overlaySub');
  const scoreDisplay  = document.getElementById('scoreDisplay');
  const buffLua       = document.getElementById('buffLua');
  const buffRuby      = document.getElementById('buffRuby');
  const luaCount      = document.getElementById('luaCount');
  const healthDots    = document.querySelectorAll('.health-dot');

  if (!canvas || !ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  /* ---- TUNING ---- */
  const BASE_SPEED          = 5.0;   // toujours rapide dès le départ
  const LUA_SPEED_BONUS     = 0.8;   // gain de vitesse par stack Lua
  const LUA_SHOOT_COOLDOWN  = 320;   // ms entre chaque salve (réduit par stack)
  const BULLET_SPEED        = 9.0;
  const BULLET_RADIUS       = 5;
  const RUBY_SHIELD_DURATION = 5000;
  const MAX_HEALTH          = 3;
  const PLAYER_RADIUS       = 14;
  const ENEMY_RADIUS        = 9;
  const BONUS_RADIUS        = 11;
  const SPREAD_ANGLE        = 0.28; // écart angulaire entre les 3 balles (radians)

  /* ---- STATE ---- */
  let gameState      = 'idle';
  let lastTime       = 0;
  let score          = 0;
  let health         = MAX_HEALTH;
  let luaStacks      = 0;
  let rubyActive     = false;
  let rubyTimer      = 0;
  let invincibleTimer = 0;
  let spawnTimer     = 0;
  let bonusTimer     = 0;
  let diffTimer      = 0;
  let diffLevel      = 1;
  let shootCooldown  = 0;

  // Dernière direction de déplacement du joueur (normalisée)
  let lastDirX = 1;
  let lastDirY = 0;

  let enemies   = [];
  let bonuses   = [];
  let bullets   = [];
  let particles = [];

  const player = { x: W / 2, y: H / 2, radius: PLAYER_RADIUS };
  const keys   = {};

  /* ---- KEYBOARD ---- */
  const GAME_KEYS = new Set([
    'ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
    'z','s','q','d','Z','S','Q','D',' '
  ]);

  document.addEventListener('keydown', e => {
    if (gameState === 'playing' && GAME_KEYS.has(e.key)) e.preventDefault();
    keys[e.key] = true;
  }, { passive: false });

  document.addEventListener('keyup', e => {
    keys[e.key] = false;
  });

  window.addEventListener('keydown', e => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
      if (document.activeElement === canvas || gameState === 'playing') e.preventDefault();
    }
  }, { passive: false });

  /* ---- HELPERS ---- */
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
  function dist(a, b) { const dx = a.x-b.x, dy = a.y-b.y; return Math.sqrt(dx*dx+dy*dy); }

  /* ---- SPAWN ---- */
  function spawnEnemy() {
    const side = randInt(0, 3);
    let x, y;
    const m = -ENEMY_RADIUS - 4;
    if (side === 0)      { x = rand(0, W); y = m; }
    else if (side === 1) { x = W - m;      y = rand(0, H); }
    else if (side === 2) { x = rand(0, W); y = H - m; }
    else                 { x = m;          y = rand(0, H); }

    const type  = Math.random() < 0.55 ? 'js' : 'rust';
    // Rust est plus lent mais plus gros, JS est rapide et petit
    const speed = (2.0 + diffLevel * 0.28) * (type === 'rust' ? 0.75 : 1.1);
    const radius = type === 'rust' ? ENEMY_RADIUS + 3 : ENEMY_RADIUS;
    const hp     = type === 'rust' ? 2 : 1; // Rust encaisse 2 balles

    enemies.push({ x, y, radius, type, speed, hp });
  }

  function spawnBonus() {
    const m    = BONUS_RADIUS + 24;
    const type = Math.random() < 0.55 ? 'lua' : 'ruby';
    bonuses.push({
      x: rand(m, W - m),
      y: rand(m, H - m),
      radius: BONUS_RADIUS,
      type,
      age: 0,
      lifetime: 8000
    });
  }

  function fireBullets() {
    if (luaStacks === 0) return;
    const baseAngle = Math.atan2(lastDirY, lastDirX);

    // Nombre de balles = min(luaStacks+2, 5) → 3 au 1er stack, jusqu'à 5 à 3+ stacks
    const count = Math.min(luaStacks + 2, 5);
    // Répartition symétrique autour de baseAngle
    const half = (count - 1) / 2;

    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (i - half) * SPREAD_ANGLE;
      bullets.push({
        x:  player.x + Math.cos(angle) * (player.radius + BULLET_RADIUS + 2),
        y:  player.y + Math.sin(angle) * (player.radius + BULLET_RADIUS + 2),
        vx: Math.cos(angle) * BULLET_SPEED,
        vy: Math.sin(angle) * BULLET_SPEED,
        radius: BULLET_RADIUS,
        life: 1.0
      });
    }
  }

  /* ---- PARTICLES ---- */
  function spawnParticle(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(2, 6);
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1.0,
        decay: rand(0.02, 0.05),
        size: rand(2, 5)
      });
    }
  }

  /* ---- HUD ---- */
  function updateHUD() {
    scoreDisplay.textContent = score;
    healthDots.forEach((dot, i) => dot.classList.toggle('active', i < health));

    if (luaStacks > 0) {
      buffLua.style.display = 'inline-flex';
      luaCount.textContent  = luaStacks;
    } else {
      buffLua.style.display = 'none';
    }
    buffRuby.style.display = rubyActive ? 'inline-flex' : 'none';
  }

  /* ---- RESET ---- */
  function resetGame() {
    score = 0; health = MAX_HEALTH;
    luaStacks = 0; rubyActive = false; rubyTimer = 0;
    invincibleTimer = 0; spawnTimer = 0; bonusTimer = 0;
    diffTimer = 0; diffLevel = 1; shootCooldown = 0;
    lastDirX = 1; lastDirY = 0;
    enemies = []; bonuses = []; bullets = []; particles = [];
    player.x = W / 2; player.y = H / 2;
    updateHUD();
  }

  /* ---- GAME OVER ---- */
  function showGameOver() {
    gameState = 'gameover';
    overlayTitle.textContent = 'PROCESSUS TERMINÉ';
    overlaySub.innerHTML = `Score final : <strong>${score} pts</strong><br>Le Supervisor OTP relance...`;
    overlay.classList.remove('hidden');
    startBtn.style.display = 'none';
    setTimeout(() => {
      overlayTitle.textContent = 'REDÉMARRAGE';
      overlaySub.innerHTML = 'Cliquer pour relancer le processus BEAM';
      startBtn.style.display = '';
      startBtn.textContent = 'Relancer';
    }, 2200);
  }

  /* ---- UPDATE ---- */
  function update(dt) {
    /* Mouvement joueur */
    const speed = BASE_SPEED + luaStacks * LUA_SPEED_BONUS;
    let mvX = 0, mvY = 0;
    if (keys['ArrowLeft']  || keys['q']) mvX -= 1;
    if (keys['ArrowRight'] || keys['d']) mvX += 1;
    if (keys['ArrowUp']    || keys['z']) mvY -= 1;
    if (keys['ArrowDown']  || keys['s']) mvY += 1;

    // Normalise le vecteur diagonal pour éviter la vitesse x√2
    if (mvX !== 0 || mvY !== 0) {
      const mag = Math.sqrt(mvX*mvX + mvY*mvY);
      mvX /= mag; mvY /= mag;
      lastDirX = mvX; lastDirY = mvY;
    }

    player.x = Math.max(player.radius, Math.min(W - player.radius, player.x + mvX * speed));
    player.y = Math.max(player.radius, Math.min(H - player.radius, player.y + mvY * speed));

    /* Timers */
    spawnTimer  += dt;
    bonusTimer  += dt;
    diffTimer   += dt;
    shootCooldown = Math.max(0, shootCooldown - dt);
    if (invincibleTimer > 0) invincibleTimer -= dt;
    if (rubyActive) {
      rubyTimer -= dt;
      if (rubyTimer <= 0) { rubyActive = false; updateHUD(); }
    }

    /* Tir Lua — se déclenche si une touche de mouvement est enfoncée */
    if (luaStacks > 0 && shootCooldown <= 0 && (mvX !== 0 || mvY !== 0)) {
      fireBullets();
      // Plus on a de stacks, plus on tire vite (min 120ms)
      shootCooldown = Math.max(120, LUA_SHOOT_COOLDOWN - (luaStacks - 1) * 55);
    }

    /* Difficulté progressive */
    if (diffTimer >= 7000) {
      diffLevel = Math.min(diffLevel + 1, 10);
      diffTimer = 0;
      score += 100;
      updateHUD();
    }

    /* Spawn ennemis */
    const spawnInterval = Math.max(300, 1000 - diffLevel * 70);
    if (spawnTimer >= spawnInterval) {
      spawnEnemy();
      if (diffLevel > 2 && Math.random() < 0.4) spawnEnemy();
      if (diffLevel > 6 && Math.random() < 0.3) spawnEnemy();
      spawnTimer = 0;
    }

    /* Spawn bonus */
    if (bonusTimer >= 3800 && bonuses.length < 3) {
      spawnBonus();
      bonusTimer = 0;
    }

    /* Score passif */
    score += Math.floor(dt * 0.018 * diffLevel);

    /* Déplacement ennemis */
    enemies.forEach(e => {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const d  = Math.sqrt(dx*dx + dy*dy) || 1;
      e.x += (dx / d) * e.speed;
      e.y += (dy / d) * e.speed;
    });

    /* Déplacement balles */
    bullets.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
      // Sort du canvas → marquer pour suppression
      if (b.x < -20 || b.x > W+20 || b.y < -20 || b.y > H+20) b.life = 0;
    });

    /* Collision balles → ennemis */
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      if (b.life <= 0) continue;
      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        const e = enemies[ei];
        if (dist(b, e) < b.radius + e.radius) {
          b.life = 0; // consomme la balle
          e.hp--;
          spawnParticle(b.x, b.y, e.type === 'js' ? '#EAB308' : '#F97316', 6);
          if (e.hp <= 0) {
            spawnParticle(e.x, e.y, e.type === 'js' ? '#EAB308' : '#F97316', 14);
            enemies.splice(ei, 1);
            score += e.type === 'rust' ? 40 : 20;
            updateHUD();
          }
          break;
        }
      }
    }
    bullets = bullets.filter(b => b.life > 0);

    /* Vieillissement des bonus */
    bonuses.forEach(b => { b.age += dt; });
    bonuses = bonuses.filter(b => b.age < b.lifetime);

    /* Collision ennemis → joueur */
    if (invincibleTimer <= 0) {
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (dist(player, e) < player.radius + e.radius) {
          if (rubyActive) {
            // Onde de choc : détruit l'ennemi + bonus de score
            spawnParticle(e.x, e.y, '#EF4444', 16);
            enemies.splice(i, 1);
            score += 30;
            updateHUD();
          } else {
            health--;
            invincibleTimer = 1400;
            spawnParticle(player.x, player.y, '#9B30FF', 12);
            enemies.splice(i, 1);
            updateHUD();
            if (health <= 0) { showGameOver(); return; }
          }
        }
      }
    }

    /* Collision joueur → bonus */
    for (let i = bonuses.length - 1; i >= 0; i--) {
      const b = bonuses[i];
      if (dist(player, b) < player.radius + b.radius) {
        if (b.type === 'lua') {
          luaStacks++;
          spawnParticle(b.x, b.y, '#06B6D4', 12);
        } else {
          rubyActive = true;
          rubyTimer  = RUBY_SHIELD_DURATION;
          spawnParticle(b.x, b.y, '#EF4444', 18);
        }
        bonuses.splice(i, 1);
        updateHUD();
      }
    }

    /* Particules */
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.92; p.vy *= 0.92;
      p.life -= p.decay;
    });
    particles = particles.filter(p => p.life > 0);
  }

  /* ---- DRAW ---- */
  function draw(now) {
    ctx.clearRect(0, 0, W, H);

    // Fond
    ctx.fillStyle = '#07070D';
    ctx.fillRect(0, 0, W, H);

    // Grille
    ctx.strokeStyle = 'rgba(155,48,255,0.05)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    /* -- Balles -- */
    bullets.forEach(b => {
      // Traînée cyan
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius * 3);
      grad.addColorStop(0, 'rgba(6,182,212,0.7)');
      grad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 3, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#06B6D4';
      ctx.fill();

      // Petit noyau blanc
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    });

    /* -- Bonus -- */
    bonuses.forEach(b => {
      const color   = b.type === 'lua' ? '#06B6D4' : '#EF4444';
      const pulse   = 0.6 + 0.4 * Math.sin(now * 0.003 + b.age * 0.001);
      const fade    = b.age > b.lifetime - 2000 ? (b.lifetime - b.age) / 2000 : 1;
      ctx.save();
      ctx.globalAlpha = fade;
      const glow = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius * 3 * pulse);
      glow.addColorStop(0, color + '55');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * 3 * pulse, 0, Math.PI*2); ctx.fill();

      ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2);
      ctx.fillStyle = color; ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = `bold 7px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(b.type.toUpperCase(), b.x, b.y);
      ctx.restore();
    });

    /* -- Ennemis -- */
    enemies.forEach(e => {
      const color = e.type === 'js' ? '#EAB308' : '#F97316';
      const label = e.type === 'js' ? 'JS' : 'RS';

      const glow = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius * 3.5);
      glow.addColorStop(0, color + '45');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius * 3.5, 0, Math.PI*2); ctx.fill();

      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI*2);
      ctx.fillStyle = color; ctx.fill();

      // Barre de vie pour Rust (2 HP)
      if (e.type === 'rust' && e.hp === 1) {
        ctx.beginPath(); ctx.arc(e.x, e.y, e.radius * 0.55, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();
      }

      ctx.fillStyle = '#000';
      ctx.font = `bold 6px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, e.x, e.y);
    });

    /* -- Particules -- */
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI*2);
      ctx.fillStyle = p.color; ctx.fill();
      ctx.restore();
    });

    /* -- Joueur -- */
    const blink = invincibleTimer > 0 && Math.floor(invincibleTimer / 110) % 2 === 0;
    if (!blink) {

      // Bouclier Ruby
      if (rubyActive) {
        const sp = 0.75 + 0.25 * Math.sin(now * 0.007);
        ctx.save();
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius + 11 * sp, 0, Math.PI*2);
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.65 * sp;
        ctx.stroke();

        // Anneaux rotatifs
        ctx.globalAlpha = 0.3;
        for (let r = 0; r < 2; r++) {
          ctx.save();
          ctx.translate(player.x, player.y);
          ctx.rotate(now * 0.002 * (r % 2 === 0 ? 1 : -1));
          ctx.beginPath();
          ctx.arc(0, 0, player.radius + 18 + r * 5, 0, Math.PI * 1.5);
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }

      // Indicateur de direction de tir (si Lua actif)
      if (luaStacks > 0) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        // Les 3 rayons du triple tir
        const count = Math.min(luaStacks + 2, 5);
        const half  = (count - 1) / 2;
        const baseAngle = Math.atan2(lastDirY, lastDirX);
        for (let i = 0; i < count; i++) {
          const angle = baseAngle + (i - half) * SPREAD_ANGLE;
          const len   = 26 + luaStacks * 4;
          ctx.beginPath();
          ctx.moveTo(
            player.x + Math.cos(angle) * (player.radius + 3),
            player.y + Math.sin(angle) * (player.radius + 3)
          );
          ctx.lineTo(
            player.x + Math.cos(angle) * (player.radius + len),
            player.y + Math.sin(angle) * (player.radius + len)
          );
          ctx.strokeStyle = '#06B6D4';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Lueur joueur
      const playerGlow = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.radius * 3);
      playerGlow.addColorStop(0, 'rgba(155,48,255,0.65)');
      playerGlow.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(player.x, player.y, player.radius * 3, 0, Math.PI*2);
      ctx.fillStyle = playerGlow; ctx.fill();

      // Corps joueur
      const body = ctx.createRadialGradient(player.x - 3, player.y - 3, 2, player.x, player.y, player.radius);
      body.addColorStop(0, '#C84BF5');
      body.addColorStop(1, '#6B10CC');
      ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI*2);
      ctx.fillStyle = body; ctx.fill();

      // Anneau externe
      ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI*2);
      ctx.strokeStyle = '#F0E6FF'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;

      // Hexagone intérieur
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a  = (Math.PI / 3) * i - Math.PI / 6;
        const px = player.x + Math.cos(a) * 6;
        const py = player.y + Math.sin(a) * 6;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = '#F0E6FF'; ctx.lineWidth = 1; ctx.globalAlpha = 0.4; ctx.stroke(); ctx.globalAlpha = 1;
    }

    /* -- HUD dans le canvas -- */
    ctx.font = `600 11px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(155,48,255,0.55)';
    ctx.fillText(`SCORE: ${score}`, 12, 12);

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(155,48,255,0.35)';
    ctx.fillText(`LVL ${diffLevel}`, W - 12, 12);

    if (luaStacks > 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(6,182,212,0.5)';
      ctx.fillText(`LUA ×${luaStacks}  [ESPACE] pour tirer`, W / 2, H - 18);
    }
  }

  /* ---- LOOP ---- */
  function loop(now) {
    const dt = Math.min(now - lastTime, 50);
    lastTime = now;
    update(dt);
    draw(now);
    if (gameState === 'playing') requestAnimationFrame(loop);
  }

  function startGame() {
    resetGame();
    gameState = 'playing';
    overlay.classList.add('hidden');
    canvas.focus();
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  startBtn.addEventListener('click', () => { if (gameState !== 'playing') startGame(); });
  canvas.addEventListener('click', () => { if (gameState === 'playing') canvas.focus(); });

})();