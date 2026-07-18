/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { SoundEngine } from '../sound';

interface GameCanvasProps {
  isPlaying: boolean;
  isPaused: boolean;
  selectedCharacter: string;
  onGameOver: (time: number, coins: number) => void;
  onCoinCollected: () => void;
  vibrationEnabled: boolean;
}

// Fixed design resolution for standard 9:16 portrait
const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const GROUND_Y = 500;

interface Obstacle {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'rock' | 'bush' | 'stump' | 'log' | 'hole' | 'bird';
  passed: boolean;
  speedMultiplier: number;
  flapFrame?: number;
}

interface Coin {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  sinOffset: number;
  collected: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

interface ScrollLayer {
  x: number;
  speed: number;
  items: Array<{ x: number; y: number; size: number; variant?: number }>;
}

export default function GameCanvas({
  isPlaying,
  isPaused,
  selectedCharacter,
  onGameOver,
  onCoinCollected,
  vibrationEnabled
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Gameplay state refs to avoid state re-render latency
  const stateRef = useRef({
    isPlaying,
    isPaused,
    selectedCharacter,
    player: {
      x: 60,
      y: GROUND_Y - 44,
      w: 40,
      h: 44,
      vy: 0,
      jumpCount: 0,
      isSliding: false,
      slideTimer: 0,
      rotation: 0,
      runFrame: 0,
      bounceTime: 0,
      isFalling: false,
    },
    obstacles: [] as Obstacle[],
    coins: [] as Coin[],
    particles: [] as Particle[],
    scrollLayers: {
      clouds: { x: 0, speed: 0.1, items: [] },
      mountains: { x: 0, speed: 0.3, items: [] },
      trees: { x: 0, speed: 0.8, items: [] },
      grass: { x: 0, speed: 2.0, items: [] }
    } as Record<string, ScrollLayer>,
    gameSpeed: 5.0,
    startTime: 0,
    survivalTime: 0,
    coinsCollectedInRun: 0,
    nextSpawnDistance: 300,
    gameFrame: 0,
    lastTime: 0
  });

  // Track finger swipe
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

  // Handle Resize and Scaling
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Fit the 9:16 game ratio within the container limits
      let scale = Math.min(containerWidth / GAME_WIDTH, containerHeight / GAME_HEIGHT);
      
      canvas.style.width = `${GAME_WIDTH * scale}px`;
      canvas.style.height = `${GAME_HEIGHT * scale}px`;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Synchronize dynamic config variables to ref
  useEffect(() => {
    stateRef.current.isPlaying = isPlaying;
    stateRef.current.isPaused = isPaused;
    stateRef.current.selectedCharacter = selectedCharacter;

    if (isPlaying && !isPaused) {
      if (stateRef.current.startTime === 0) {
        stateRef.current.startTime = Date.now();
        stateRef.current.lastTime = Date.now();
        stateRef.current.survivalTime = 0;
        stateRef.current.coinsCollectedInRun = 0;
        stateRef.current.gameSpeed = 5.0;
        stateRef.current.player.y = GROUND_Y - 44;
        stateRef.current.player.vy = 0;
        stateRef.current.player.jumpCount = 0;
        stateRef.current.player.isSliding = false;
        stateRef.current.player.isFalling = false;
        stateRef.current.player.rotation = 0;
        stateRef.current.obstacles = [];
        stateRef.current.coins = [];
        stateRef.current.particles = [];
        // Generate initial scenery offset
        initScenery();
      }
    } else if (!isPlaying) {
      stateRef.current.startTime = 0;
    }
  }, [isPlaying, isPaused, selectedCharacter]);

  // Generate background parallax entities
  const initScenery = () => {
    const s = stateRef.current.scrollLayers;
    
    // Clouds
    s.clouds.items = Array.from({ length: 6 }, (_, i) => ({
      x: i * 120 + Math.random() * 50,
      y: 40 + Math.random() * 100,
      size: 30 + Math.random() * 30
    }));

    // Mountains
    s.mountains.items = Array.from({ length: 4 }, (_, i) => ({
      x: i * 180,
      y: GROUND_Y - 60 - Math.random() * 60,
      size: 100 + Math.random() * 80
    }));

    // Mid-ground trees
    s.trees.items = Array.from({ length: 8 }, (_, i) => ({
      x: i * 80 + Math.random() * 30,
      y: GROUND_Y,
      size: 40 + Math.random() * 30,
      variant: Math.floor(Math.random() * 2) // 0: pine, 1: deciduous
    }));

    // Grass tufts
    s.grass.items = Array.from({ length: 12 }, (_, i) => ({
      x: i * 40 + Math.random() * 15,
      y: GROUND_Y + 10 + Math.random() * 60,
      size: 5 + Math.random() * 8
    }));
  };

  // Input Handlers
  const handleJump = () => {
    const state = stateRef.current;
    if (!state.isPlaying || state.isPaused || state.player.isFalling) return;

    if (state.player.isSliding) {
      // Cancel slide instantly to jump
      state.player.isSliding = false;
      state.player.h = 44;
    }

    if (state.player.jumpCount < 2) {
      if (state.player.jumpCount === 0) {
        state.player.vy = -10.0;
        SoundEngine.playSFX('jump');
      } else {
        state.player.vy = -8.5;
        state.player.rotation = -Math.PI * 2; // Jump flip animation
        SoundEngine.playSFX('double_jump');
        // Double jump particle burst
        spawnJumpParticles(state.player.x + 20, state.player.y + 40);
      }
      state.player.jumpCount++;
    }
  };

  const handleSlide = () => {
    const state = stateRef.current;
    if (!state.isPlaying || state.isPaused || state.player.isFalling) return;

    if (state.player.jumpCount > 0) {
      // Dive down quickly if in mid-air
      state.player.vy = 12.0;
      SoundEngine.playSFX('slide');
    } else if (!state.player.isSliding) {
      state.player.isSliding = true;
      // Extra long slide for Fox
      state.player.slideTimer = state.selectedCharacter === 'fox' ? 45 : 30;
      state.player.h = 24; // Halve player height
      SoundEngine.playSFX('slide');
      spawnSlideParticles(state.player.x, state.player.y + 40);
    }
  };

  const spawnJumpParticles = (x: number, y: number) => {
    const particles = stateRef.current.particles;
    for (let i = 0; i < 8; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 2 + 1,
        color: '#D8DEE9',
        size: 3 + Math.random() * 4,
        alpha: 0.8,
        decay: 0.03
      });
    }
  };

  const spawnSlideParticles = (x: number, y: number) => {
    const particles = stateRef.current.particles;
    for (let i = 0; i < 6; i++) {
      particles.push({
        x,
        y,
        vx: -Math.random() * 3 - 2,
        vy: -Math.random() * 1.5,
        color: '#E5E7EB',
        size: 2 + Math.random() * 3,
        alpha: 0.7,
        decay: 0.04
      });
    }
  };

  // Keyboard controls (Desktop/Testing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        handleSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Touch controls (Mobile First)
  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const duration = Date.now() - touchStartRef.current.time;

    // Detect swipe down
    if (dy > 40 && Math.abs(dy) > Math.abs(dx) && duration < 300) {
      handleSlide();
    } else if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
      // Simple tap -> Jump
      handleJump();
    }
  };

  // Mouse fallback (Touch simulation for testing)
  const onMouseDown = (e: React.MouseEvent) => {
    touchStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
  };

  const onMouseUp = (e: React.MouseEvent) => {
    const dx = e.clientX - touchStartRef.current.x;
    const dy = e.clientY - touchStartRef.current.y;
    const duration = Date.now() - touchStartRef.current.time;

    if (dy > 40 && Math.abs(dy) > Math.abs(dx) && duration < 300) {
      handleSlide();
    } else if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
      handleJump();
    }
  };

  // Main Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      const state = stateRef.current;
      const now = Date.now();
      const dt = Math.min((now - state.lastTime) / 1000, 0.1); // cap dt to prevent tunneling
      state.lastTime = now;

      if (state.isPlaying && !state.isPaused) {
        state.gameFrame++;
        state.survivalTime += dt;

        // Accelerate game speed naturally
        state.gameSpeed = 5.0 + Math.floor(state.survivalTime / 5) * 0.15;

        updatePhysics(dt);
        spawnManager();
        updateParallax(dt);
        checkCollisions();
      }

      renderGame(ctx);

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const updatePhysics = (dt: number) => {
    const state = stateRef.current;
    const p = state.player;

    // Running frame cycle
    p.runFrame += state.gameSpeed * dt * 3.5;
    p.bounceTime += dt * 4;

    // Slide state timer
    if (p.isSliding) {
      p.slideTimer--;
      if (p.slideTimer <= 0) {
        p.isSliding = false;
        p.h = 44; // Restore height
      }
    }

    // Gravity & Ground interaction
    if (p.isFalling) {
      // Dead animation fall
      p.vy += 0.4;
      p.y += p.vy;
      p.rotation += 0.05;
      return;
    }

    p.y += p.vy;
    p.vy += 0.45; // gravity constant

    // Check if player falls in a Hole
    let isOnHole = false;
    state.obstacles.forEach(o => {
      if (o.type === 'hole') {
        const leftBound = o.x - 10;
        const rightBound = o.x + o.w + 10;
        // If player is directly above the hole gap on the ground
        if (p.x + p.w * 0.5 > leftBound && p.x + p.w * 0.5 < rightBound && p.y >= GROUND_Y - 45) {
          isOnHole = true;
        }
      }
    });

    if (isOnHole && p.y >= GROUND_Y - 45) {
      p.isFalling = true;
      p.vy = 2.0; // Fall speed
      SoundEngine.playSFX('hit');
      triggerGameOver();
      return;
    }

    // Normal ground contact
    if (p.y >= GROUND_Y - p.h && !p.isFalling) {
      p.y = GROUND_Y - p.h;
      p.vy = 0;
      p.jumpCount = 0;
      
      // Decay jump rotation back to 0
      if (p.rotation !== 0) {
        p.rotation = 0;
      }

      // Spawn puff particles when running
      if (state.gameFrame % 6 === 0 && !p.isSliding) {
        state.particles.push({
          x: p.x,
          y: GROUND_Y,
          vx: -state.gameSpeed * 0.4,
          vy: -Math.random() * 2,
          color: '#D8DEE9',
          size: 2 + Math.random() * 3,
          alpha: 0.6,
          decay: 0.05
        });
      }
    }
  };

  const updateParallax = (dt: number) => {
    const state = stateRef.current;
    const speed = state.gameSpeed * 60 * dt; // Match frame-based speed

    Object.keys(state.scrollLayers).forEach(key => {
      const layer = state.scrollLayers[key];
      layer.x -= layer.speed * speed * 0.2;

      // Wrap scenery items to loop continuously
      layer.items.forEach(item => {
        item.x -= layer.speed * speed * 0.2;
        if (item.x < -120) {
          item.x += GAME_WIDTH + 140;
        }
      });
    });

    // Handle obstacles
    state.obstacles.forEach(o => {
      o.x -= state.gameSpeed * speed * 0.2;
      if (o.type === 'bird') {
        o.flapFrame = (o.flapFrame || 0) + 1;
      }
    });
    // Filter off-screen obstacles
    state.obstacles = state.obstacles.filter(o => o.x > -100);

    // Handle coins
    state.coins.forEach(c => {
      c.x -= state.gameSpeed * speed * 0.2;
    });
    state.coins = state.coins.filter(c => c.x > -50 && !c.collected);

    // Handle particles
    state.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
    });
    state.particles = state.particles.filter(p => p.alpha > 0);
  };

  // Procedural Spawner
  const spawnManager = () => {
    const state = stateRef.current;
    
    state.nextSpawnDistance -= state.gameSpeed * 0.15;

    if (state.nextSpawnDistance <= 0) {
      // Pick random obstacle
      const obstacleTypes: Array<Obstacle['type']> = ['rock', 'bush', 'stump', 'log', 'hole', 'bird'];
      
      // Limit high obstacles / holes early on to keep the tutorial curve gentle
      let selection = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
      if (state.survivalTime < 10) {
        // Simple rocks or bushes only in first 10s
        selection = Math.random() > 0.5 ? 'rock' : 'bush';
      } else if (state.survivalTime < 25) {
        // No holes in the first 25s
        if (selection === 'hole') selection = 'stump';
      }

      let h = 30;
      let w = 30;
      let y = GROUND_Y - h;

      if (selection === 'rock') {
        w = 26 + Math.random() * 8;
        h = 32 + Math.random() * 8;
        y = GROUND_Y - h;
      } else if (selection === 'bush') {
        w = 34 + Math.random() * 10;
        h = 28 + Math.random() * 8;
        y = GROUND_Y - h;
      } else if (selection === 'stump') {
        w = 20;
        h = 24;
        y = GROUND_Y - h;
      } else if (selection === 'log') {
        w = 40;
        h = 18;
        y = GROUND_Y - h;
      } else if (selection === 'hole') {
        w = 50 + Math.random() * 20;
        h = 140; // deep gap
        y = GROUND_Y;
      } else if (selection === 'bird') {
        w = 28;
        h = 20;
        // Birds can fly at high (slide under) or low (jump over) heights
        y = GROUND_Y - 65 - Math.random() * 45;
      }

      state.obstacles.push({
        id: state.gameFrame,
        x: GAME_WIDTH + 50,
        y,
        w,
        h,
        type: selection,
        passed: false,
        speedMultiplier: selection === 'bird' ? 1.25 : 1.0,
        flapFrame: 0
      });

      // Spawn coins surrounding the obstacles in neat geometric arrays!
      spawnCoinsAroundObstacle(GAME_WIDTH + 50, y, selection);

      // Randomize distance to next obstacle based on speed
      state.nextSpawnDistance = 200 + Math.random() * 180 + (10 - state.gameSpeed) * 10;
    }
  };

  const spawnCoinsAroundObstacle = (spawnX: number, obstacleY: number, type: Obstacle['type']) => {
    const state = stateRef.current;
    
    // Only spawn group of coins sometimes to feel premium
    if (Math.random() > 0.45) return;

    if (type === 'hole') {
      // Spawn coins in an arch over the hole to guide the jump!
      for (let i = 0; i < 4; i++) {
        state.coins.push({
          id: state.gameFrame + i * 100,
          x: spawnX + i * 25 - 10,
          y: GROUND_Y - 70 - Math.sin((i / 3) * Math.PI) * 40,
          w: 12,
          h: 12,
          sinOffset: Math.random() * 10,
          collected: false
        });
      }
    } else if (type === 'bird') {
      // Spawn low coins underneath a high flying bird
      if (obstacleY < GROUND_Y - 80) {
        for (let i = 0; i < 3; i++) {
          state.coins.push({
            id: state.gameFrame + i * 100,
            x: spawnX + i * 30 - 15,
            y: GROUND_Y - 15,
            w: 12,
            h: 12,
            sinOffset: Math.random() * 10,
            collected: false
          });
        }
      }
    } else {
      // Spawn beautiful floating line of coins above general obstacles
      for (let i = 0; i < 3; i++) {
        state.coins.push({
          id: state.gameFrame + i * 100,
          x: spawnX + i * 28 - 20,
          y: obstacleY - 35 - Math.sin((i / 2) * Math.PI) * 20,
          w: 12,
          h: 12,
          sinOffset: Math.random() * 10,
          collected: false
        });
      }
    }
  };

  // Simple Box Colliders
  const checkCollisions = () => {
    const state = stateRef.current;
    const p = state.player;

    // Double magnetic coin range for Panda
    const coinAttractRadius = state.selectedCharacter === 'panda' ? 65 : 30;

    // Check coin collection & attraction (magnetic effect)
    state.coins.forEach(c => {
      if (c.collected) return;

      const dx = c.x - (p.x + p.w * 0.5);
      const dy = c.y - (p.y + p.h * 0.5);
      const dist = Math.hypot(dx, dy);

      // Magnet draw effect
      if (dist < coinAttractRadius) {
        c.x -= (dx / dist) * 4.5;
        c.y -= (dy / dist) * 4.5;
      }

      // Check precise overlap
      if (
        p.x < c.x + c.w &&
        p.x + p.w > c.x &&
        p.y < c.y + c.h &&
        p.y + p.h > c.y
      ) {
        c.collected = true;
        state.coinsCollectedInRun++;
        onCoinCollected();
        SoundEngine.playSFX('coin');

        // Sparkle particles
        for (let i = 0; i < 5; i++) {
          state.particles.push({
            x: c.x,
            y: c.y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            color: '#EBCB8B',
            size: 2 + Math.random() * 2,
            alpha: 1.0,
            decay: 0.05
          });
        }
      }
    });

    // Check Obstacle Collisions
    state.obstacles.forEach(o => {
      if (o.passed || p.isFalling) return;

      // Adjust collision box for Dino's trait
      let playerHitboxWidth = p.w - 4;
      let playerHitboxHeight = p.h - 4;
      if (state.selectedCharacter === 'dino') {
        playerHitboxWidth -= 4; // Extra small Dino head hitbox
      }

      const playerLeft = p.x + 2;
      const playerRight = p.x + playerHitboxWidth;
      const playerTop = p.y + 2;
      const playerBottom = p.y + playerHitboxHeight;

      // Deep ground gap checking is handled in updatePhysics, skip hole standard boxes
      if (o.type === 'hole') return;

      if (
        playerLeft < o.x + o.w &&
        playerRight > o.x &&
        playerTop < o.y + o.h &&
        playerBottom > o.y
      ) {
        // CRASH!
        SoundEngine.playSFX('hit');
        p.isFalling = true;
        p.vy = -6.0; // Knockback arc
        triggerGameOver();

        // Explosion puff particles
        for (let i = 0; i < 15; i++) {
          state.particles.push({
            x: p.x + 20,
            y: p.y + 20,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            color: '#BF616A',
            size: 4 + Math.random() * 6,
            alpha: 1.0,
            decay: 0.03
          });
        }
      }
    });
  };

  const triggerGameOver = () => {
    const state = stateRef.current;
    if (vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate([150, 100, 150]);
    }
    setTimeout(() => {
      onGameOver(state.survivalTime, state.coinsCollectedInRun);
    }, 1000);
  };

  // Canvas Vector Renderers
  const renderGame = (ctx: CanvasRenderingContext2D) => {
    const state = stateRef.current;

    // Clear Screen (Soft off-white)
    ctx.fillStyle = '#F7F8FA';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 1. Draw Clouds
    ctx.fillStyle = '#FFFFFF';
    state.scrollLayers.clouds.items.forEach(cloud => {
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.size * 0.4, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.size * 0.3, cloud.y - cloud.size * 0.1, cloud.size * 0.35, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.size * 0.6, cloud.y, cloud.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Draw Mountains (Far Parallax)
    ctx.fillStyle = '#ECEFF4'; // Soft grey
    state.scrollLayers.mountains.items.forEach(m => {
      ctx.beginPath();
      ctx.moveTo(m.x - m.size, GROUND_Y);
      ctx.lineTo(m.x, m.y);
      ctx.lineTo(m.x + m.size, GROUND_Y);
      ctx.fill();
    });

    // 3. Draw Mid-ground Trees (Medium Parallax)
    state.scrollLayers.trees.items.forEach(tree => {
      ctx.fillStyle = '#D8DEE9'; // Medium forest tint
      if (tree.variant === 0) {
        // Pine Tree
        ctx.beginPath();
        ctx.moveTo(tree.x, GROUND_Y);
        ctx.lineTo(tree.x - tree.size * 0.4, GROUND_Y);
        ctx.lineTo(tree.x, GROUND_Y - tree.size);
        ctx.lineTo(tree.x + tree.size * 0.4, GROUND_Y);
        ctx.closePath();
        ctx.fill();
      } else {
        // Deciduous Round Tree
        ctx.beginPath();
        ctx.arc(tree.x, GROUND_Y - tree.size * 0.7, tree.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(tree.x - 3, GROUND_Y - tree.size * 0.4, 6, tree.size * 0.4);
      }
    });

    // 4. Draw Ground & Holes
    ctx.fillStyle = '#D8DEE9';
    
    // Draw ground base line, leaving gaps for Holes
    let startSegment = 0;
    // Sort obstacles to iterate holes sequentially
    const holes = state.obstacles
      .filter(o => o.type === 'hole')
      .sort((a, b) => a.x - b.x);

    holes.forEach(hole => {
      if (hole.x > startSegment) {
        ctx.fillRect(startSegment, GROUND_Y, hole.x - startSegment, GAME_HEIGHT - GROUND_Y);
      }
      startSegment = hole.x + hole.w;
    });

    if (startSegment < GAME_WIDTH) {
      ctx.fillRect(startSegment, GROUND_Y, GAME_WIDTH - startSegment, GAME_HEIGHT - GROUND_Y);
    }

    // 5. Draw Grass Tufts on Ground (Fast Parallax)
    ctx.fillStyle = '#4C566A'; // Darker grey-green accent
    state.scrollLayers.grass.items.forEach(grass => {
      // Don't render grass floating above a hole
      let isOverHole = false;
      holes.forEach(hole => {
        if (grass.x > hole.x && grass.x < hole.x + hole.w) {
          isOverHole = true;
        }
      });

      if (!isOverHole) {
        ctx.fillRect(grass.x, grass.y, 2, grass.size);
        ctx.fillRect(grass.x + 3, grass.y + 2, 2, grass.size * 0.7);
      }
    });

    // 6. Draw Coins
    state.coins.forEach(coin => {
      if (coin.collected) return;
      const spin = Math.sin(state.gameFrame * 0.15 + coin.sinOffset);
      const bob = Math.sin(state.gameFrame * 0.05 + coin.id) * 4;

      ctx.save();
      ctx.translate(coin.x + coin.w * 0.5, coin.y + coin.h * 0.5 + bob);
      ctx.scale(Math.abs(spin) < 0.1 ? 0.1 : spin, 1.0);

      // Outer gold circle
      ctx.fillStyle = '#EBCB8B';
      ctx.beginPath();
      ctx.arc(0, 0, coin.w * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Inner coin shine rim
      ctx.strokeStyle = '#D08770';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Center square detail
      ctx.fillStyle = '#D08770';
      ctx.fillRect(-2, -2, 4, 4);

      ctx.restore();
    });

    // 7. Draw Obstacles
    state.obstacles.forEach(o => {
      ctx.save();
      ctx.translate(o.x, o.y);

      switch (o.type) {
        case 'rock':
          ctx.fillStyle = '#4C566A'; // Dark slate grey rock
          ctx.beginPath();
          ctx.moveTo(0, o.h);
          ctx.lineTo(o.w * 0.1, o.h * 0.5);
          ctx.lineTo(o.w * 0.4, o.h * 0.1);
          ctx.lineTo(o.w * 0.8, 0);
          ctx.lineTo(o.w, o.h * 0.7);
          ctx.lineTo(o.w, o.h);
          ctx.closePath();
          ctx.fill();
          
          // Crack highlight
          ctx.strokeStyle = '#3B4252';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(o.w * 0.4, o.h * 0.1);
          ctx.lineTo(o.w * 0.5, o.h * 0.6);
          ctx.stroke();
          break;

        case 'bush':
          ctx.fillStyle = '#8FBCBB'; // Cute teal-mint bush
          ctx.beginPath();
          const r = o.h * 0.4;
          ctx.arc(r, o.h - r, r, 0, Math.PI * 2);
          ctx.arc(o.w * 0.5, r, r, 0, Math.PI * 2);
          ctx.arc(o.w - r, o.h - r, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(r, o.h - r * 1.5, o.w - r * 2, r * 1.5);
          break;

        case 'stump':
          ctx.fillStyle = '#BF616A'; // Reddish-brown stump
          ctx.fillRect(o.w * 0.2, o.h * 0.2, o.w * 0.6, o.h * 0.8);
          // Roots
          ctx.beginPath();
          ctx.moveTo(0, o.h);
          ctx.lineTo(o.w * 0.3, o.h * 0.6);
          ctx.lineTo(o.w * 0.7, o.h * 0.6);
          ctx.lineTo(o.w, o.h);
          ctx.closePath();
          ctx.fill();
          // Rings
          ctx.fillStyle = '#E5E9F0';
          ctx.ellipse(o.w * 0.5, o.h * 0.2, o.w * 0.3, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'log':
          ctx.fillStyle = '#D08770'; // Warm light brown log
          ctx.fillRect(0, o.h * 0.1, o.w, o.h * 0.8);
          // Concentric circles on the side face
          ctx.fillStyle = '#BF616A';
          ctx.fillRect(0, o.h * 0.1, 4, o.h * 0.8);
          ctx.fillStyle = '#E5E9F0';
          ctx.beginPath();
          ctx.ellipse(o.w - 2, o.h * 0.5, 3, o.h * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'bird':
          // Flapping wing cycle
          const flap = Math.floor((o.flapFrame || 0) / 8) % 2 === 0;
          
          ctx.fillStyle = '#BF616A'; // Vibrant red bird body
          ctx.beginPath();
          ctx.arc(o.w * 0.5, o.h * 0.5, o.h * 0.4, 0, Math.PI * 2);
          ctx.fill();

          // Beak
          ctx.fillStyle = '#EBCB8B';
          ctx.beginPath();
          ctx.moveTo(0, o.h * 0.5);
          ctx.lineTo(o.w * 0.25, o.h * 0.3);
          ctx.lineTo(o.w * 0.25, o.h * 0.7);
          ctx.closePath();
          ctx.fill();

          // Wing
          ctx.fillStyle = '#81A1C1';
          ctx.beginPath();
          if (flap) {
            // Wing Up
            ctx.moveTo(o.w * 0.5, o.h * 0.45);
            ctx.lineTo(o.w * 0.6, o.h * 0.1);
            ctx.lineTo(o.w * 0.75, o.h * 0.45);
          } else {
            // Wing Down
            ctx.moveTo(o.w * 0.5, o.h * 0.55);
            ctx.lineTo(o.w * 0.6, o.h * 0.9);
            ctx.lineTo(o.w * 0.75, o.h * 0.55);
          }
          ctx.closePath();
          ctx.fill();
          
          // Eye
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(o.w * 0.35, o.h * 0.4, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(o.w * 0.32, o.h * 0.4, 1.5, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
      ctx.restore();
    });

    // 8. Draw Particles
    state.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 9. Draw Player Character (Beautiful procedural cartoon style)
    ctx.save();
    ctx.translate(state.player.x + state.player.w * 0.5, state.player.y + state.player.h * 0.5);
    ctx.rotate(state.player.rotation);

    const animState = state.player.isFalling ? 'dead' : (state.player.jumpCount > 0 ? 'jump' : (state.player.isSliding ? 'slide' : 'run'));
    const frame = state.player.runFrame;
    const size = 38;

    switch (state.selectedCharacter) {
      case 'rabbit':
        drawRabbit(ctx, animState, frame, size);
        break;
      case 'dino':
        drawDino(ctx, animState, frame, size);
        break;
      case 'fox':
        drawFox(ctx, animState, frame, size);
        break;
      case 'panda':
        drawPanda(ctx, animState, frame, size);
        break;
      case 'penguin':
        drawPenguin(ctx, animState, frame, size);
        break;
    }

    ctx.restore();
  };

  // ---------------- CHARACTER RENDERERS ----------------

  const drawRabbit = (ctx: CanvasRenderingContext2D, state: string, frame: number, s: number) => {
    // Soft fluffy white/slate rabbit
    const legCycle = Math.sin(frame) * 8;
    const bodyBob = state === 'run' ? Math.abs(Math.sin(frame * 2)) * 3 : 0;
    const runTilt = state === 'run' ? 0.08 : 0;

    ctx.rotate(runTilt);

    // Rabbit Tail
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-s * 0.45, s * 0.15 + bodyBob, s * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Feet/Legs
    ctx.fillStyle = '#D8DEE9';
    if (state === 'run') {
      ctx.fillRect(-s * 0.3 + legCycle, s * 0.3, s * 0.15, s * 0.18);
      ctx.fillRect(s * 0.1 - legCycle, s * 0.3, s * 0.15, s * 0.18);
    } else if (state === 'jump') {
      ctx.fillRect(-s * 0.2, s * 0.3, s * 0.15, s * 0.2);
      ctx.fillRect(s * 0.05, s * 0.3, s * 0.2, s * 0.15);
    } else if (state === 'slide') {
      ctx.fillRect(-s * 0.3, s * 0.2, s * 0.25, s * 0.1);
      ctx.fillRect(s * 0.05, s * 0.2, s * 0.25, s * 0.1);
    } else {
      ctx.fillRect(-s * 0.2, s * 0.3, s * 0.15, s * 0.15);
      ctx.fillRect(s * 0.05, s * 0.3, s * 0.15, s * 0.15);
    }

    // Chubby Body
    ctx.fillStyle = '#E5E9F0';
    if (state === 'slide') {
      ctx.beginPath();
      ctx.ellipse(0, s * 0.1, s * 0.5, s * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, bodyBob, s * 0.38, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cute Cheeks & Inner Muzzle
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(s * 0.12, bodyBob + s * 0.1, s * 0.12, 0, Math.PI * 2);
    ctx.arc(s * 0.24, bodyBob + s * 0.1, s * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Pink Nose
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.arc(s * 0.18, bodyBob + s * 0.05, 3, 0, Math.PI * 2);
    ctx.fill();

    // Black eyes
    ctx.fillStyle = '#2E3440';
    ctx.beginPath();
    ctx.arc(s * 0.12, bodyBob - s * 0.1, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Cute Eye gleam
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(s * 0.14, bodyBob - s * 0.12, 1, 0, Math.PI * 2);
    ctx.fill();

    // Fluffy Ears
    ctx.save();
    ctx.translate(s * 0.05, bodyBob - s * 0.3);
    if (state === 'run') {
      ctx.rotate(-0.3); // ears windblown
    } else if (state === 'jump') {
      ctx.rotate(0.2); // ears dynamic
    }
    // Left ear
    ctx.fillStyle = '#E5E9F0';
    ctx.fillRect(-s * 0.15, -s * 0.3, s * 0.12, s * 0.35);
    ctx.fillStyle = '#FFC0CB'; // Pink inner ear
    ctx.fillRect(-s * 0.11, -s * 0.26, s * 0.04, s * 0.28);

    // Right ear
    ctx.fillStyle = '#E5E9F0';
    ctx.fillRect(s * 0.03, -s * 0.3, s * 0.12, s * 0.35);
    ctx.fillStyle = '#FFC0CB';
    ctx.fillRect(s * 0.07, -s * 0.26, s * 0.04, s * 0.28);
    ctx.restore();
  };

  const drawDino = (ctx: CanvasRenderingContext2D, state: string, frame: number, s: number) => {
    const legCycle = Math.sin(frame) * 8;
    const bodyBob = state === 'run' ? Math.abs(Math.sin(frame * 2)) * 3 : 0;
    const runTilt = state === 'run' ? 0.05 : 0;

    ctx.rotate(runTilt);

    // Orange Spikes on spine
    ctx.fillStyle = '#D08770'; // Pastel orange spikes
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.45 + i * 8, bodyBob - s * 0.2);
      ctx.lineTo(-s * 0.45 + i * 8 + 4, bodyBob - s * 0.38);
      ctx.lineTo(-s * 0.45 + i * 8 + 8, bodyBob - s * 0.2);
      ctx.closePath();
      ctx.fill();
    }

    // Dino Tail
    ctx.fillStyle = '#A3BE8C'; // Dino green
    ctx.beginPath();
    ctx.moveTo(-s * 0.35, s * 0.1 + bodyBob);
    ctx.quadraticCurveTo(-s * 0.7, s * 0.2 + bodyBob, -s * 0.6, s * 0.35 + bodyBob);
    ctx.quadraticCurveTo(-s * 0.35, s * 0.35 + bodyBob, -s * 0.2, s * 0.2 + bodyBob);
    ctx.closePath();
    ctx.fill();

    // Dino Legs
    ctx.fillStyle = '#4C566A';
    if (state === 'run') {
      ctx.fillRect(-s * 0.2 + legCycle, s * 0.3, s * 0.14, s * 0.18);
      ctx.fillRect(s * 0.05 - legCycle, s * 0.3, s * 0.14, s * 0.18);
    } else {
      ctx.fillRect(-s * 0.15, s * 0.3, s * 0.14, s * 0.15);
      ctx.fillRect(s * 0.05, s * 0.3, s * 0.14, s * 0.15);
    }

    // Body & Head (Cute blocky dinosaur snout)
    ctx.fillStyle = '#A3BE8C';
    if (state === 'slide') {
      ctx.fillRect(-s * 0.4, s * 0.05, s * 0.8, s * 0.3);
      // Snout
      ctx.fillRect(s * 0.1, -s * 0.05, s * 0.35, s * 0.2);
    } else {
      // Rounded main body
      ctx.beginPath();
      ctx.arc(0, bodyBob + s * 0.05, s * 0.36, 0, Math.PI * 2);
      ctx.fill();

      // Rounded Snout / Face
      ctx.beginPath();
      ctx.arc(s * 0.18, bodyBob - s * 0.1, s * 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(0, bodyBob - s * 0.34, s * 0.35, s * 0.42);
    }

    // Snout blush
    ctx.fillStyle = '#EBCB8B';
    ctx.beginPath();
    ctx.arc(s * 0.3, bodyBob - s * 0.05, 3, 0, Math.PI * 2);
    ctx.fill();

    // Cute Eye
    ctx.fillStyle = '#2E3440';
    ctx.beginPath();
    ctx.arc(s * 0.14, bodyBob - s * 0.18, 3, 0, Math.PI * 2);
    ctx.fill();

    // Dino tiny arm
    ctx.fillStyle = '#8FBCBB';
    ctx.fillRect(s * 0.12, bodyBob + s * 0.1, s * 0.15, 6);
  };

  const drawFox = (ctx: CanvasRenderingContext2D, state: string, frame: number, s: number) => {
    // Beautiful swift coral-orange Fox
    const legCycle = Math.sin(frame) * 9;
    const bodyBob = state === 'run' ? Math.abs(Math.sin(frame * 2)) * 3 : 0;
    const runTilt = state === 'run' ? 0.1 : 0;

    ctx.rotate(runTilt);

    // Fluffy Orange/White Fox Tail
    ctx.save();
    ctx.translate(-s * 0.4, bodyBob + s * 0.05);
    if (state === 'run') {
      ctx.rotate(Math.sin(frame * 0.5) * 0.3);
    }
    // Tail base orange
    ctx.fillStyle = '#D08770';
    ctx.beginPath();
    ctx.ellipse(-s * 0.2, -s * 0.05, s * 0.28, s * 0.14, 0.4, 0, Math.PI * 2);
    ctx.fill();
    // Tail tip white
    ctx.fillStyle = '#ECEFF4';
    ctx.beginPath();
    ctx.ellipse(-s * 0.4, -s * 0.13, s * 0.1, s * 0.07, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Swift legs
    ctx.fillStyle = '#2E3440'; // Black boots for fox!
    if (state === 'run') {
      ctx.fillRect(-s * 0.25 + legCycle, s * 0.3, s * 0.12, s * 0.18);
      ctx.fillRect(s * 0.05 - legCycle, s * 0.3, s * 0.12, s * 0.18);
    } else {
      ctx.fillRect(-s * 0.18, s * 0.3, s * 0.12, s * 0.15);
      ctx.fillRect(s * 0.05, s * 0.3, s * 0.12, s * 0.15);
    }

    // Fox main body orange
    ctx.fillStyle = '#D08770';
    if (state === 'slide') {
      ctx.beginPath();
      ctx.ellipse(0, s * 0.08, s * 0.5, s * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, bodyBob + s * 0.05, s * 0.34, 0, Math.PI * 2);
      ctx.fill();
    }

    // White fur chest
    ctx.fillStyle = '#ECEFF4';
    ctx.beginPath();
    ctx.arc(s * 0.15, bodyBob + s * 0.15, s * 0.16, 0, Math.PI * 2);
    ctx.fill();

    // Fox pointed snout
    ctx.fillStyle = '#D08770';
    ctx.beginPath();
    ctx.moveTo(0, bodyBob - s * 0.15);
    ctx.lineTo(s * 0.45, bodyBob - s * 0.02);
    ctx.lineTo(s * 0.1, bodyBob + s * 0.2);
    ctx.closePath();
    ctx.fill();

    // White snout bottom cheeks
    ctx.fillStyle = '#ECEFF4';
    ctx.beginPath();
    ctx.moveTo(s * 0.1, bodyBob);
    ctx.lineTo(s * 0.4, bodyBob - s * 0.02);
    ctx.lineTo(s * 0.1, bodyBob + s * 0.14);
    ctx.closePath();
    ctx.fill();

    // Black nose tip
    ctx.fillStyle = '#2E3440';
    ctx.beginPath();
    ctx.arc(s * 0.44, bodyBob - s * 0.02, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Clever Eyes
    ctx.fillStyle = '#2E3440';
    ctx.beginPath();
    ctx.arc(s * 0.16, bodyBob - s * 0.08, 3, 0, Math.PI * 2);
    ctx.fill();

    // Pointed Ears
    ctx.fillStyle = '#D08770';
    ctx.beginPath();
    ctx.moveTo(0, bodyBob - s * 0.3);
    ctx.lineTo(s * 0.12, bodyBob - s * 0.52);
    ctx.lineTo(s * 0.18, bodyBob - s * 0.26);
    ctx.closePath();
    ctx.fill();

    // Black tip of ear
    ctx.fillStyle = '#2E3440';
    ctx.beginPath();
    ctx.moveTo(s * 0.06, bodyBob - s * 0.43);
    ctx.lineTo(s * 0.12, bodyBob - s * 0.52);
    ctx.lineTo(s * 0.15, bodyBob - s * 0.38);
    ctx.closePath();
    ctx.fill();
  };

  const drawPanda = (ctx: CanvasRenderingContext2D, state: string, frame: number, s: number) => {
    // Chubby cuddly Black & White Panda
    const legCycle = Math.sin(frame) * 6; // slow rhythm
    const bodyBob = state === 'run' ? Math.abs(Math.sin(frame * 2)) * 2 : 0;

    // Panda stout limbs
    ctx.fillStyle = '#2E3440'; // Black legs
    if (state === 'run') {
      ctx.fillRect(-s * 0.22 + legCycle, s * 0.3, s * 0.16, s * 0.18);
      ctx.fillRect(s * 0.04 - legCycle, s * 0.3, s * 0.16, s * 0.18);
    } else {
      ctx.fillRect(-s * 0.15, s * 0.3, s * 0.16, s * 0.15);
      ctx.fillRect(s * 0.05, s * 0.3, s * 0.16, s * 0.15);
    }

    // Chubby round body
    ctx.fillStyle = '#ECEFF4'; // White fluffy head/belly
    ctx.beginPath();
    ctx.arc(0, bodyBob + s * 0.06, s * 0.42, 0, Math.PI * 2);
    ctx.fill();

    // Panda Black shoulders / scarf band
    ctx.fillStyle = '#2E3440';
    ctx.beginPath();
    ctx.arc(-s * 0.2, bodyBob + s * 0.12, s * 0.22, 0, Math.PI * 2);
    ctx.arc(s * 0.08, bodyBob + s * 0.16, s * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Panda black ears
    ctx.fillStyle = '#2E3440';
    ctx.beginPath();
    ctx.arc(-s * 0.24, bodyBob - s * 0.28, s * 0.14, 0, Math.PI * 2);
    ctx.arc(s * 0.12, bodyBob - s * 0.28, s * 0.14, 0, Math.PI * 2);
    ctx.fill();

    // White head center
    ctx.fillStyle = '#ECEFF4';
    ctx.beginPath();
    ctx.arc(-s * 0.04, bodyBob - s * 0.04, s * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Giant black eye patches
    ctx.fillStyle = '#2E3440';
    ctx.beginPath();
    ctx.ellipse(s * 0.08, bodyBob - s * 0.04, 7, 10, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // White eye dot inside patch
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(s * 0.08, bodyBob - s * 0.06, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(s * 0.07, bodyBob - s * 0.06, 1, 0, Math.PI * 2);
    ctx.fill();

    // Chubby snout & nose
    ctx.fillStyle = '#2E3440';
    ctx.beginPath();
    ctx.arc(s * 0.18, bodyBob + s * 0.08, 3, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawPenguin = (ctx: CanvasRenderingContext2D, state: string, frame: number, s: number) => {
    // Chubby dynamic Emperor Penguin
    const legCycle = Math.sin(frame) * 7;
    const bodyBob = state === 'run' ? Math.abs(Math.sin(frame * 2)) * 3 : 0;
    const flipperAngle = Math.sin(frame * 1.5) * 0.4;

    // Webbed little orange feet
    ctx.fillStyle = '#D08770'; // Pastel orange
    if (state === 'run') {
      ctx.fillRect(-s * 0.2 + legCycle, s * 0.3, s * 0.16, s * 0.16);
      ctx.fillRect(s * 0.04 - legCycle, s * 0.3, s * 0.16, s * 0.16);
    } else {
      ctx.fillRect(-s * 0.15, s * 0.3, s * 0.16, s * 0.15);
      ctx.fillRect(s * 0.05, s * 0.3, s * 0.16, s * 0.15);
    }

    // Black body coat
    ctx.fillStyle = '#2E3440'; // Deep dark slate
    ctx.beginPath();
    ctx.arc(0, bodyBob + s * 0.05, s * 0.38, 0, Math.PI * 2);
    ctx.fill();

    // Emperor yellow side cheek patches
    ctx.fillStyle = '#EBCB8B'; // Gold yellow
    ctx.beginPath();
    ctx.arc(s * 0.15, bodyBob - s * 0.1, s * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // White belly
    ctx.fillStyle = '#ECEFF4';
    ctx.beginPath();
    ctx.arc(s * 0.06, bodyBob + s * 0.1, s * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // Head top black cap
    ctx.fillStyle = '#2E3440';
    ctx.beginPath();
    ctx.arc(0, bodyBob - s * 0.12, s * 0.26, 0, Math.PI * 2);
    ctx.fill();

    // Bright orange beak
    ctx.fillStyle = '#D08770';
    ctx.beginPath();
    ctx.moveTo(s * 0.18, bodyBob - s * 0.12);
    ctx.lineTo(s * 0.42, bodyBob - s * 0.08);
    ctx.lineTo(s * 0.18, bodyBob - s * 0.02);
    ctx.closePath();
    ctx.fill();

    // Cute Penguin Eye
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(s * 0.08, bodyBob - s * 0.14, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(s * 0.07, bodyBob - s * 0.14, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Side Flippers flapping
    ctx.save();
    ctx.translate(-s * 0.15, bodyBob + s * 0.05);
    ctx.rotate(-0.3 + flipperAngle);
    ctx.fillStyle = '#2E3440';
    ctx.fillRect(-s * 0.05, 0, s * 0.12, s * 0.3);
    ctx.restore();
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center select-none outline-none relative"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    >
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="rounded-[24px] shadow-lg max-w-full max-h-full object-contain pointer-events-none bg-white"
        id="game-canvas"
      />
    </div>
  );
}
