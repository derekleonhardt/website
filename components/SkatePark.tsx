"use client";

import { useEffect, useRef } from "react";

const GRAVITY = 0.45;
const MOVE_ACCEL = 0.38;
const GND_FRICTION = 0.975;
const AIR_FRICTION = 0.994;
const JUMP_SPEED = 7.0;
const MAX_SPEED = 9;
const BOOST_MIN_SPD = 4.0;
const QP_RADIUS = 105;
const DECK_W = 24;
const VERT_H = 14;

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export default function SkatePark({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const keys: Record<string, boolean> = {};
    let raf = 0;

    let W = 0,
      H = 0;
    let groundY = 0;
    let qpR = 0,
      curveR = 0; // qpR = full height; curveR = qpR - VERT_H (actual arc radius)
    let lipY = 0; // y of deck / coping
    let vertEndY = 0; // y where vert section ends and curve begins
    let railX1 = 0,
      railX2 = 0,
      railY = 0;

    const sk = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      onGround: false,
      onRail: false,
      facing: 1 as 1 | -1,
      flipAngle: 0, // 0-360° rotation around longitudinal (nose-to-tail) axis
      flipSpeed: 13.5, // degrees per frame — recalculated at kickflip start
      kickflipping: false,
      sparks: [] as Spark[],
    };

    function surfaceY(x: number): number {
      if (x <= DECK_W) return lipY;
      if (x <= DECK_W + curveR) {
        const dx = x - (DECK_W + curveR);
        return vertEndY + Math.sqrt(Math.max(0, curveR * curveR - dx * dx));
      }
      if (x >= W - DECK_W - curveR && x <= W - DECK_W) {
        const dx = x - (W - DECK_W - curveR);
        return vertEndY + Math.sqrt(Math.max(0, curveR * curveR - dx * dx));
      }
      if (x >= W - DECK_W) return lipY;
      // Flat ground
      return groundY;
    }

    // Normal pointing from surface toward center of curvature (into open air)
    function surfaceNormal(x: number): [number, number] {
      if (x <= DECK_W) return [0, -1];
      if (x <= DECK_W + curveR) {
        const sy = surfaceY(x);
        return [(DECK_W + curveR - x) / curveR, (vertEndY - sy) / curveR];
      }
      if (x >= W - DECK_W - curveR && x <= W - DECK_W) {
        const sy = surfaceY(x);
        return [(W - DECK_W - curveR - x) / curveR, (vertEndY - sy) / curveR];
      }
      if (x >= W - DECK_W) return [0, -1];
      return [0, -1];
    }

    // ── Resize ────────────────────────────────────────────────────────────
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const { offsetWidth: w, offsetHeight: h } = container;
      W = w;
      H = h;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);

      groundY = H - 28;
      qpR = Math.max(VERT_H + 1, Math.min(QP_RADIUS, groundY - DECK_W - 4));
      curveR = Math.max(1, qpR - VERT_H);
      lipY = groundY - qpR;
      vertEndY = lipY + VERT_H;

      railX1 = W / 2 - 65;
      railX2 = W / 2 + 65;
      railY = groundY - 26;

      if (sk.x === 0) {
        sk.x = W / 2;
        sk.y = groundY;
      }
    };

    // ── Jump / kickflip ───────────────────────────────────────────────────
    function ollie() {
      if (sk.onGround) {
        const [nx, ny] = surfaceNormal(sk.x);
        // Add jump impulse along surface normal (preserves existing momentum)
        sk.vx += nx * JUMP_SPEED * 0.35;
        sk.vy = ny * JUMP_SPEED;
        sk.onGround = false;
      } else if (sk.onRail) {
        sk.vy = -JUMP_SPEED;
        sk.onRail = false;
      } else if (!sk.kickflipping) {
        // Calculate remaining air time (in frames) to set flip speed dynamically
        const sy = surfaceY(sk.x);
        const dy = sy - sk.y; // distance to ground (positive = below)
        const discriminant = sk.vy * sk.vy + 2 * GRAVITY * Math.max(0, dy);
        const tLand = (-sk.vy + Math.sqrt(discriminant)) / GRAVITY;
        sk.kickflipping = true;
        sk.flipAngle = 0;
        // Complete the flip in 75% of remaining air time — board caught before landing
        sk.flipSpeed = Math.min(40, Math.max(12, 360 / (tLand * 0.75)));
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        ["Space", "ArrowUp", "ArrowLeft", "ArrowRight", "ArrowDown"].includes(
          e.code,
        )
      )
        e.preventDefault();
      keys[e.code] = true;
      if (e.code === "Space" || e.code === "ArrowUp") ollie();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // ── Draw loop ─────────────────────────────────────────────────────────
    let lastTime = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;
      const t = dt / 16.67;

      const cs = getComputedStyle(document.body);
      const fg = cs.getPropertyValue("--fg").trim() || "#1c1916";
      const muted = cs.getPropertyValue("--muted").trim() || "#8a7a6e";
      const border = cs.getPropertyValue("--border").trim() || "#ddd5cc";
      const accent = cs.getPropertyValue("--accent").trim() || "#b05c3a";

      ctx.clearRect(0, 0, W, H);

      // ── Terrain fill ──────────────────────────────────────────────
      ctx.beginPath();
      ctx.moveTo(0, lipY);
      ctx.lineTo(DECK_W, lipY);
      ctx.lineTo(DECK_W, vertEndY);
      ctx.arc(DECK_W + curveR, vertEndY, curveR, Math.PI, Math.PI / 2, true);
      ctx.lineTo(W - DECK_W - curveR, groundY);
      ctx.arc(W - DECK_W - curveR, vertEndY, curveR, Math.PI / 2, 0, true);
      ctx.lineTo(W - DECK_W, vertEndY);
      ctx.lineTo(W - DECK_W, lipY);
      ctx.lineTo(W, lipY);
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fillStyle = fg;
      ctx.globalAlpha = 0.05;
      ctx.fill();
      ctx.globalAlpha = 1;

      // ── Left QP: vert wall + curve ────────────────────────────────
      ctx.beginPath();
      ctx.moveTo(DECK_W, lipY);
      ctx.lineTo(DECK_W, vertEndY);
      ctx.arc(DECK_W + curveR, vertEndY, curveR, Math.PI, Math.PI / 2, true);
      ctx.strokeStyle = fg;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // ── Right QP: curve + vert wall ───────────────────────────────
      ctx.beginPath();
      ctx.arc(W - DECK_W - curveR, vertEndY, curveR, Math.PI / 2, 0, true);
      ctx.lineTo(W - DECK_W, lipY);
      ctx.strokeStyle = fg;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // ── Deck surfaces ─────────────────────────────────────────────
      ctx.beginPath();
      ctx.moveTo(0, lipY);
      ctx.lineTo(DECK_W, lipY);
      ctx.moveTo(W - DECK_W, lipY);
      ctx.lineTo(W, lipY);
      ctx.strokeStyle = fg;
      ctx.lineWidth = 2;
      ctx.stroke();

      // ── Back walls ────────────────────────────────────────────────
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, lipY);
      ctx.moveTo(W, 0);
      ctx.lineTo(W, lipY);
      ctx.strokeStyle = fg;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.2;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // ── Flat ground line ──────────────────────────────────────────
      ctx.beginPath();
      ctx.moveTo(DECK_W + curveR, groundY);
      ctx.lineTo(W - DECK_W - curveR, groundY);
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.stroke();

      // ── Rail posts ────────────────────────────────────────────────
      ctx.beginPath();
      ctx.moveTo(railX1 + 18, railY);
      ctx.lineTo(railX1 + 18, groundY);
      ctx.moveTo(railX2 - 18, railY);
      ctx.lineTo(railX2 - 18, groundY);
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // ── Rail bar ──────────────────────────────────────────────────
      ctx.beginPath();
      ctx.moveTo(railX1, railY);
      ctx.lineTo(railX2, railY);
      ctx.strokeStyle = fg;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();

      // ── Physics ───────────────────────────────────────────────────
      if (keys["ArrowLeft"] || keys["KeyA"]) {
        sk.vx -= MOVE_ACCEL * t;
        sk.facing = -1;
      }
      if (keys["ArrowRight"] || keys["KeyD"]) {
        sk.vx += MOVE_ACCEL * t;
        sk.facing = 1;
      }
      sk.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, sk.vx));

      if (sk.onRail) {
        sk.vy = 0;
        sk.y = railY;
        sk.vx *= Math.pow(0.965, t);
        if (Math.random() < 0.35) {
          const a = -Math.PI * 0.6 + Math.random() * Math.PI * 0.4;
          sk.sparks.push({
            x: sk.x,
            y: railY,
            vx: Math.cos(a) * (1.5 + Math.random() * 2.5),
            vy: Math.sin(a) * 1.5 - 1,
            life: 1,
          });
        }
        if (sk.x < railX1 - 2 || sk.x > railX2 + 2) sk.onRail = false;
      } else if (sk.onGround) {
        sk.vy = 0;
        sk.vx *= Math.pow(GND_FRICTION, t);
      } else {
        sk.vy += GRAVITY * t;
        sk.vx *= Math.pow(AIR_FRICTION, t);
      }

      sk.x += sk.vx * t;
      sk.y += sk.vy * t;

      // Pin to surface when grounded — prevents ramp flickering
      if (sk.onGround && !sk.onRail) sk.y = surfaceY(sk.x);

      // Wall bounce at canvas edges
      if (sk.x < 1) {
        sk.x = 1;
        sk.vx = Math.abs(sk.vx) * 0.4;
      }
      if (sk.x > W - 1) {
        sk.x = W - 1;
        sk.vx = -Math.abs(sk.vx) * 0.4;
      }

      // Surface collision
      if (!sk.onRail) {
        const prevOnGround = sk.onGround;
        sk.onGround = false; // re-evaluated each frame
        const sy = surfaceY(sk.x);
        if (sk.y >= sy) {
          sk.y = sy;
          // Lip launch: reach the top of a QP with enough speed → fly off
          if (sk.x <= DECK_W && sk.vx < -BOOST_MIN_SPD) {
            sk.vy = -Math.min(Math.abs(sk.vx) * 0.7, JUMP_SPEED * 1.2);
            sk.vx *= 0.25;
            // onGround stays false — skater launches into the air
          } else if (sk.x >= W - DECK_W && sk.vx > BOOST_MIN_SPD) {
            sk.vy = -Math.min(Math.abs(sk.vx) * 0.7, JUMP_SPEED * 1.2);
            sk.vx *= 0.25;
          } else {
            const landed = !prevOnGround;
            sk.vy = 0;
            sk.onGround = true;
            if (landed) {
              sk.kickflipping = false;
              sk.flipAngle = 0;
            }
          }
        } else {
          // Rail landing
          if (
            sk.x > railX1 &&
            sk.x < railX2 &&
            sk.vy > 0 &&
            sk.y <= railY &&
            sk.y + sk.vy * t + GRAVITY * t * 2 >= railY
          ) {
            sk.onRail = true;
            sk.y = railY;
            sk.vy = 0;
            sk.kickflipping = false;
            sk.flipAngle = 0;
          }
        }
      }

      if (sk.kickflipping) {
        sk.flipAngle += sk.flipSpeed * t;
        if (sk.flipAngle >= 360) {
          sk.flipAngle = 0;
          sk.kickflipping = false;
        }
      }

      // ── Sparks ────────────────────────────────────────────────────
      sk.sparks = sk.sparks.filter((sp) => {
        sp.x += sp.vx * t;
        sp.y += sp.vy * t;
        sp.vy += 0.15 * t;
        sp.life -= 0.06 * t;
        if (sp.life <= 0) return false;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.globalAlpha = sp.life * 0.9;
        ctx.fill();
        ctx.globalAlpha = 1;
        return true;
      });

      // ── Skater ────────────────────────────────────────────────────
      const airborne = !sk.onGround && !sk.onRail;
      ctx.save();
      ctx.translate(sk.x, sk.y);

      // ── Board ──────────────────────────────────────────────────────
      ctx.save();
      if (sk.kickflipping) {
        const flipRad = (sk.flipAngle * Math.PI) / 180;
        // Pure longitudinal axis rotation — board stays fixed in place and
        // gets thin at 90°/270° (edge-on), inverts at 180°. No translation,
        // no looping — it just spins on its own axis under the skater.
        ctx.scale(1, Math.cos(flipRad));
      }
      // Board: thick rounded stroke with subtle nose/tail kicks
      // bh drives legBase = -bh/2 (top of stroke = foot contact)
      const bw = 32, // deck length
        bh = 4, // stroke thickness — thinner, legBase = -2
        wr = 3.5; // wheel radius
      const kickY = -4; // how much ends curve up from flat centre
      const wCy = bh / 2 + wr + 1; // wheel centre below deck
      const wIn = bw / 2 - 6; // truck x position

      // Path: kicked ends → flat middle → kicked ends
      // lineJoin:"round" naturally curves the kick-to-flat corners
      ctx.beginPath();
      ctx.moveTo(-bw / 2 - 2, kickY); // tail tip (up)
      ctx.lineTo(-bw / 2 + 5, 0); // into flat section
      ctx.lineTo(bw / 2 - 5, 0); // flat middle
      ctx.lineTo(bw / 2 + 2, kickY); // nose tip (up)
      ctx.strokeStyle = fg;
      ctx.lineWidth = bh;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = 0.9;
      ctx.stroke();
      ctx.lineWidth = 2; // reset

      [-wIn, wIn].forEach((wx) => {
        ctx.beginPath();
        ctx.arc(wx, wCy, wr, 0, Math.PI * 2);
        ctx.fillStyle = fg;
        ctx.globalAlpha = 0.85;
        ctx.fill();
      });
      ctx.restore();
      ctx.globalAlpha = 1;

      // ── Legs ──────────────────────────────────────────────────────
      const legBase = -bh * 0.5; // = dT = -2
      const onCurve =
        sk.onGround &&
        ((sk.x > DECK_W && sk.x <= DECK_W + curveR) ||
          (sk.x >= W - DECK_W - curveR && sk.x < W - DECK_W));
      const legLen = airborne ? 7 : onCurve ? 7 : 12;
      const bodyLen = 13,
        headR = 5.5;
      ctx.strokeStyle = fg;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (sk.kickflipping) {
        // Front foot flicks out heel-side (the kick), back foot stays tucked
        const flipRad = (sk.flipAngle * Math.PI) / 180;
        const frontExt = Math.max(0, Math.sin(flipRad)); // 0→1 during kick, 0 during catch
        const f = sk.facing;
        ctx.beginPath();
        // Front leg: extends in direction of travel (the flick)
        ctx.moveTo(f * 4, legBase);
        ctx.lineTo(f * (6 + frontExt * 8), legBase - legLen * 0.25);
        ctx.lineTo(f * (2 + frontExt * 4), legBase - legLen);
        // Back leg: stays tucked above board
        ctx.moveTo(-f * 4, legBase);
        ctx.lineTo(-f * 6, legBase - legLen * 0.5);
        ctx.lineTo(-f * 1, legBase - legLen);
        ctx.stroke();
      } else if (airborne) {
        // Normal ollie tuck pose
        ctx.beginPath();
        ctx.moveTo(-4, legBase);
        ctx.lineTo(-7, legBase - legLen * 0.5);
        ctx.lineTo(-1, legBase - legLen);
        ctx.moveTo(4, legBase);
        ctx.lineTo(7, legBase - legLen * 0.5);
        ctx.lineTo(1, legBase - legLen);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(-4, legBase);
        ctx.lineTo(-2, legBase - legLen * 0.55);
        ctx.lineTo(1, legBase - legLen);
        ctx.moveTo(4, legBase);
        ctx.lineTo(2, legBase - legLen * 0.55);
        ctx.lineTo(1, legBase - legLen);
        ctx.stroke();
      }

      const bodyBase = legBase - legLen;
      ctx.beginPath();
      ctx.moveTo(1, bodyBase);
      ctx.lineTo(1, bodyBase - bodyLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(1, bodyBase - bodyLen * 0.35);
      ctx.lineTo(1 + sk.facing * 9, bodyBase - bodyLen * 0.05);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(1, bodyBase - bodyLen - headR * 0.8, headR, 0, Math.PI * 2);
      ctx.fillStyle = fg;
      ctx.fill();

      ctx.restore();
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}
