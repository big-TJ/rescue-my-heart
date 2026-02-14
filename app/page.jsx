'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const GAME_DURATION = 15;
const TARGET_SCORE = 14;
const HEART_EMOJIS = ['💗', '💖', '💘', '💕', '💓', '💞'];

function randomHeartEmoji() {
  return HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)];
}

export default function Page() {
  const canvasRef = useRef(null);
  const gameWrapRef = useRef(null);

  const [screen, setScreen] = useState('start');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameSeed, setGameSeed] = useState(0);

  const jumpRef = useRef(() => {});

  const confettiHearts = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.6 + Math.random() * 2,
        drift: (Math.random() - 0.5) * 160,
        emoji: randomHeartEmoji()
      })),
    [gameSeed]
  );

  useEffect(() => {
    if (screen !== 'game') {
      jumpRef.current = () => {};
      return;
    }

    const canvas = canvasRef.current;
    const wrap = gameWrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let rafId = 0;
    let lastTime = performance.now();
    let ended = false;

    const game = {
      width: 320,
      height: 500,
      elapsed: 0,
      score: 0,
      spawnTimer: 0,
      player: {
        x: 90,
        y: 0,
        w: 42,
        h: 54,
        vy: 0,
        onGround: true
      },
      hearts: []
    };

    function resizeCanvas() {
      const rect = wrap.getBoundingClientRect();
      game.width = Math.max(280, Math.floor(rect.width));
      game.height = Math.max(420, Math.floor(rect.height));
      canvas.width = game.width;
      canvas.height = game.height;
      game.player.x = Math.floor((game.width - game.player.w) / 2);
      const groundY = game.height - 86;
      if (game.player.onGround) {
        game.player.y = groundY - game.player.h;
      }
    }

    resizeCanvas();

    function jump() {
      if (ended) return;
      if (game.player.onGround) {
        game.player.vy = -560;
        game.player.onGround = false;
      }
    }

    jumpRef.current = jump;

    function drawRoundedRect(x, y, w, h, r) {
      const radius = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    function drawHeartPath(x, y, size, fill) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(size / 20, size / 20);
      ctx.beginPath();
      ctx.moveTo(0, -3);
      ctx.bezierCurveTo(0, -11, -12, -11, -12, -3);
      ctx.bezierCurveTo(-12, 4, -5, 9, 0, 13);
      ctx.bezierCurveTo(5, 9, 12, 4, 12, -3);
      ctx.bezierCurveTo(12, -11, 0, -11, 0, -3);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.restore();
    }

    function drawPlayer() {
      const p = game.player;
      const bounce = p.onGround ? Math.sin(game.elapsed * 16) * 1.2 : 0;
      const x = p.x;
      const y = p.y + bounce;

      ctx.save();

      ctx.fillStyle = '#2f69d8';
      drawRoundedRect(x + 7, y + 20, p.w - 14, 24, 10);
      ctx.fill();

      ctx.fillStyle = '#ffe2c4';
      ctx.beginPath();
      ctx.arc(x + p.w / 2, y + 13, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#2c1b26';
      ctx.beginPath();
      ctx.arc(x + p.w / 2, y + 6, 9, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = '#2c1b26';
      ctx.beginPath();
      ctx.arc(x + p.w / 2 - 4, y + 12, 1.2, 0, Math.PI * 2);
      ctx.arc(x + p.w / 2 + 4, y + 12, 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#d85f8e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + p.w / 2, y + 15, 2.6, 0.25, Math.PI - 0.25);
      ctx.stroke();

      ctx.strokeStyle = '#254ea7';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + 13, y + 44);
      ctx.lineTo(x + 13, y + 54);
      ctx.moveTo(x + p.w - 13, y + 44);
      ctx.lineTo(x + p.w - 13, y + 54);
      ctx.stroke();

      ctx.restore();
    }

    function spawnHeart() {
      const size = 18 + Math.random() * 12;
      game.hearts.push({
        x: 16 + Math.random() * (game.width - 32),
        y: -22,
        size,
        speed: 96 + Math.random() * 140,
        sway: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.9
      });
    }

    function update(dt) {
      if (ended) return;

      game.elapsed += dt;
      const tLeft = Math.max(0, GAME_DURATION - game.elapsed);
      setTimeLeft(tLeft);

      const p = game.player;
      const gravity = 1550;
      p.vy += gravity * dt;
      p.y += p.vy * dt;

      const groundY = game.height - 86;
      if (p.y >= groundY - p.h) {
        p.y = groundY - p.h;
        p.vy = 0;
        p.onGround = true;
      }

      game.spawnTimer += dt;
      const spawnEvery = 0.27;
      while (game.spawnTimer > spawnEvery) {
        spawnHeart();
        game.spawnTimer -= spawnEvery;
      }

      game.hearts = game.hearts.filter((heart) => {
        heart.y += heart.speed * dt;
        heart.x += Math.sin(game.elapsed * 3 + heart.sway) * heart.spin * 18;

        const px = p.x + p.w / 2;
        const py = p.y + p.h / 2;
        const dx = px - heart.x;
        const dy = py - heart.y;
        const pickupDist = p.w * 0.4 + heart.size * 0.45;
        const picked = dx * dx + dy * dy < pickupDist * pickupDist;

        if (picked) {
          game.score += 1;
          setScore(game.score);
          return false;
        }

        return heart.y < game.height + 40;
      });

      if (game.elapsed >= GAME_DURATION) {
        ended = true;
        setTimeLeft(0);
        setScreen(game.score >= TARGET_SCORE ? 'success' : 'fail');
      }
    }

    function draw() {
      const w = game.width;
      const h = game.height;

      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#fff5fb');
      sky.addColorStop(0.56, '#ffdce8');
      sky.addColorStop(1, '#ffc9db');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(w * 0.2, h * 0.18, 42, 0, Math.PI * 2);
      ctx.arc(w * 0.72, h * 0.16, 34, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffbdd6';
      ctx.fillRect(0, h - 86, w, 86);

      ctx.fillStyle = 'rgba(240, 72, 130, 0.18)';
      for (let i = 0; i < 8; i += 1) {
        const hx = (i * 90 + game.elapsed * 40) % (w + 90) - 45;
        drawHeartPath(hx, h - 56 + Math.sin(game.elapsed * 2 + i) * 4, 10, 'rgba(240,72,130,0.2)');
      }

      game.hearts.forEach((heart) => {
        drawHeartPath(heart.x, heart.y, heart.size, '#ff3f83');
        drawHeartPath(heart.x - 2, heart.y - 2, heart.size * 0.45, '#ffd0e2');
      });

      drawPlayer();
    }

    function frame(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;
      update(dt);
      draw();
      if (!ended) {
        rafId = requestAnimationFrame(frame);
      }
    }

    const onResize = () => resizeCanvas();
    window.addEventListener('resize', onResize);

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      jumpRef.current = () => {};
    };
  }, [screen]);

  function startGame() {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setGameSeed((n) => n + 1);
    setScreen('game');
  }

  function startGameFromEvent(event) {
    event.preventDefault();
    event.stopPropagation();
    startGame();
  }

  function jumpFromInput(event) {
    if (screen !== 'game') return;
    event.preventDefault();
    jumpRef.current();
  }

  return (
    <main className="valentine-root">
      <div className="emoji-cloud" aria-hidden="true">💖 💘 💕 💝 💗 💓</div>
      <div className="top-illustration" aria-hidden="true">
        <img src="/devil-girl-hearts.svg" alt="Cute devil girl throwing hearts" />
      </div>

      <section className={`panel panel-${screen}`}>
        {screen === 'start' && (
          <div className="screen-card intro fade-in-up">
            <p className="label">Valentine Jump Game</p>
            <h1>혜진의 하트를 시간내에 받아라!</h1>
            <p className="hint">탭하거나 클릭하면 점프합니다. 제한 시간은 15초예요.</p>
            <button
              className="cta"
              type="button"
              onClick={startGame}
              onPointerDown={startGameFromEvent}
              onTouchStart={startGameFromEvent}
            >
              Start Game 💞
            </button>
          </div>
        )}

        {screen === 'game' && (
          <div
            ref={gameWrapRef}
            className="game-wrap fade-in-up"
            onPointerDown={jumpFromInput}
            onTouchStart={jumpFromInput}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === ' ' || event.key === 'Enter') {
                jumpFromInput(event);
              }
            }}
            aria-label="Game canvas. Tap anywhere to jump"
          >
            <header className="hud">
              <div className="pill">Score: {score}</div>
              <div className="pill">Time: {Math.ceil(timeLeft)}s</div>
              <div className="pill goal">Goal: {TARGET_SCORE}</div>
            </header>
            <canvas ref={canvasRef} className="game-canvas" />
            <p className="tap-tip">Tap anywhere to jump</p>
          </div>
        )}

        {screen === 'success' && (
          <div className="screen-card success pop-in">
            <h1 className="exact-message">해피 발렌타인 데이 혜진</h1>
            <div className="success-photo">
              <img src="/hyejin-valentine.jpeg" alt="혜진과 함께한 발렌타인 사진" />
            </div>
            <button className="cta" type="button" onClick={startGame}>
              Play Again 💘
            </button>

            <div className="heart-confetti" aria-hidden="true">
              {confettiHearts.map((item) => (
                <span
                  key={item.id}
                  className="float-heart"
                  style={{
                    left: `${item.left}%`,
                    animationDelay: `${item.delay}s`,
                    animationDuration: `${item.duration}s`,
                    '--drift': `${item.drift}px`
                  }}
                >
                  {item.emoji}
                </span>
              ))}
            </div>
          </div>
        )}

        {screen === 'fail' && (
          <div className="screen-card fail pop-in">
            <h1>Almost there 💗</h1>
            <p className="hint">
              You got {score} hearts. Reach {TARGET_SCORE} hearts next round.
            </p>
            <button className="cta" type="button" onClick={startGame}>
              Try Again 💖
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
