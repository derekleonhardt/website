"use client";

import { useEffect, useRef } from "react";

// ── Virtual coordinate system ───────────────────────────────────────────
// All dimensions are in design units, scaled to fit the container height.
// Width adapts to the container's aspect ratio (more width = more flat ground).
const DESIGN_H = 300;

// Physics (design units per frame at 60fps)
const GRAVITY = 0.45;
const MOVE_ACCEL = 0.38;
const GND_FRICTION = 0.975;
const AIR_FRICTION = 0.994;
const RAIL_FRICTION = 0.965;
const JUMP_SPEED = 7.0;
const MAX_SPEED = 9;
const BOOST_MIN_SPD = 4.0;

// Terrain (design units)
const QP_MAX_R = 105;
const VERT_H = 14;
const PLAT_W = 24;
const GROUND_MARGIN = 28;
const RAIL_HALF_W = 85;
const RAIL_HEIGHT = 20;
const RAIL_POST_INSET = 18;

// Board (design units)
const BW = 24;
const BH = 3;
const WR = 2.8;
const KICK_Y = -3;
const KICK_TRANS = 4;
const TIP_OVER = 1.6;
const TRUCK_X = BW / 2 - 5;

// Body (design units)
const HEAD_R = 5.5;
const TORSO = 13;
const LEG_GND = 12;
const LEG_AIR = 7;
const ARM = 9;
const LIMB_W = 2;
const HIP_X = 4;
const KNEE_X = 7;
const STAND_KNEE_X = 2;
const FLICK_REACH = 6;
const FLICK_EXT = 8;
const TUCK_KNEE = 6;
const TUCK_FOOT = 2;
const TUCK_FOOT_EXT = 4;

// Derived board geometry
const WHEEL_CY = BH / 2 + WR + 1;
const TRUCK_GRIND_Y = BH / 2 + (WHEEL_CY - BH / 2) * 0.4;
const WHEEL_BOTTOM = WHEEL_CY + WR;
const RAIL_SNAP = WHEEL_BOTTOM - TRUCK_GRIND_Y;

// Sparks
const MAX_SPARKS = 50;
const SPARK_CHANCE = 0.35;

const GAME_KEYS = new Set([
  "ArrowUp",
  "ArrowLeft",
  "ArrowRight",
  "KeyW",
  "KeyA",
  "KeyD",
]);

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface Props {
  className?: string;
  visible?: boolean;
}

export default function SkatePark({ className, visible = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!visible) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    const keys: Record<string, boolean> = {};
    let raf = 0;

    // Virtual dimensions
    let vW = 0;
    const vH = DESIGN_H;
    let realW = 0;
    let dpr = 1;

    // Terrain geometry (recomputed on resize)
    let groundY = 0;
    let lipY = 0;
    let vertEndY = 0;
    let curveR = 0;
    let railX1 = 0;
    let railX2 = 0;
    let railY = 0;

    // Cached theme (updated on resize)
    let fg = "#1c1916";
    let muted = "#8a7a6e";
    let borderColor = "#ddd5cc";
    let accent = "#b05c3a";
    let monoFont = "monospace";

    const sk = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      onGround: false,
      onRail: false,
      facing: 1 as 1 | -1,
      flipAngle: 0,
      flipSpeed: 13.5,
      kickflipping: false,
      sparks: [] as Spark[],
      drawAngle: 0,
    };

    // ── Surface helpers ───────────────────────────────────────────────────
    function surfaceY(x: number): number {
      if (x <= PLAT_W) return lipY;
      if (x <= PLAT_W + curveR) {
        const dx = x - (PLAT_W + curveR);
        return vertEndY + Math.sqrt(Math.max(0, curveR * curveR - dx * dx));
      }
      if (x >= vW - PLAT_W - curveR && x <= vW - PLAT_W) {
        const dx = x - (vW - PLAT_W - curveR);
        return vertEndY + Math.sqrt(Math.max(0, curveR * curveR - dx * dx));
      }
      if (x >= vW - PLAT_W) return lipY;
      return groundY;
    }

    function surfaceNormal(x: number): [number, number] {
      if (x <= PLAT_W) return [0, -1];
      if (x <= PLAT_W + curveR) {
        const sy = surfaceY(x);
        return [
          (PLAT_W + curveR - x) / curveR,
          (vertEndY - sy) / curveR,
        ];
      }
      if (x >= vW - PLAT_W - curveR && x <= vW - PLAT_W) {
        const sy = surfaceY(x);
        return [
          (vW - PLAT_W - curveR - x) / curveR,
          (vertEndY - sy) / curveR,
        ];
      }
      if (x >= vW - PLAT_W) return [0, -1];
      return [0, -1];
    }

    function surfaceAngle(x: number): number {
      const [nx, ny] = surfaceNormal(x);
      return Math.atan2(nx, -ny);
    }

    // ── Resize ────────────────────────────────────────────────────────────
    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      const { offsetWidth: w, offsetHeight: h } = container;
      const s = h / DESIGN_H;
      vW = w / s;
      realW = w;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr * s, 0, 0, dpr * s, 0, 0);

      const cs = getComputedStyle(document.body);
      fg = cs.getPropertyValue("--fg").trim() || "#1c1916";
      muted = cs.getPropertyValue("--muted").trim() || "#8a7a6e";
      borderColor = cs.getPropertyValue("--border").trim() || "#ddd5cc";
      accent = cs.getPropertyValue("--accent").trim() || "#b05c3a";
      monoFont = cs.getPropertyValue("--font-mono").trim() || "monospace";

      groundY = vH - GROUND_MARGIN;
      const qpR = Math.max(
        VERT_H + 1,
        Math.min(QP_MAX_R, groundY - PLAT_W - 4),
      );
      curveR = Math.max(1, qpR - VERT_H);
      lipY = groundY - qpR;
      vertEndY = lipY + VERT_H;

      railX1 = vW / 2 - RAIL_HALF_W;
      railX2 = vW / 2 + RAIL_HALF_W;
      railY = groundY - RAIL_HEIGHT;

      if (sk.x === 0) {
        sk.x = vW / 2;
        sk.y = groundY;
      }
    };

    // ── Jump / kickflip ───────────────────────────────────────────────────
    function ollie() {
      if (sk.onGround) {
        const [nx, ny] = surfaceNormal(sk.x);
        sk.vx += nx * JUMP_SPEED * 0.35;
        sk.vy = ny * JUMP_SPEED;
        sk.onGround = false;
      } else if (sk.onRail) {
        sk.vy = -JUMP_SPEED;
        sk.onRail = false;
      } else if (!sk.kickflipping) {
        const dy = surfaceY(sk.x) - sk.y;
        const disc = sk.vy * sk.vy + 2 * GRAVITY * Math.max(0, dy);
        const tLand = (-sk.vy + Math.sqrt(disc)) / GRAVITY;
        sk.kickflipping = true;
        sk.flipAngle = 0;
        sk.flipSpeed = Math.min(40, Math.max(12, 360 / (tLand * 0.75)));
      }
    }

    // ── Input ─────────────────────────────────────────────────────────────
    const onKeyDown = (e: KeyboardEvent) => {
      if (GAME_KEYS.has(e.code)) e.preventDefault();
      keys[e.code] = true;
      if (e.code === "ArrowUp" || e.code === "KeyW") ollie();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // ── Physics step ──────────────────────────────────────────────────────
    function step(t: number) {
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
        sk.y = railY + RAIL_SNAP;
        sk.vx *= Math.pow(RAIL_FRICTION, t);
        if (sk.sparks.length < MAX_SPARKS && Math.random() < SPARK_CHANCE) {
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

      if (sk.onGround && !sk.onRail) sk.y = surfaceY(sk.x);

      // Rotation
      if (sk.onGround) {
        sk.drawAngle = surfaceAngle(sk.x);
      } else if (sk.onRail) {
        sk.drawAngle += -sk.drawAngle * 0.15 * t;
      } else {
        sk.drawAngle += -sk.drawAngle * 0.04 * t;
      }

      // Wall bounce
      if (sk.x < 1) {
        sk.x = 1;
        sk.vx = Math.abs(sk.vx) * 0.4;
      }
      if (sk.x > vW - 1) {
        sk.x = vW - 1;
        sk.vx = -Math.abs(sk.vx) * 0.4;
      }

      // Surface / rail collision
      if (!sk.onRail) {
        const prevOnGround = sk.onGround;
        sk.onGround = false;
        const sy = surfaceY(sk.x);

        if (sk.y >= sy) {
          sk.y = sy;
          if (sk.x <= PLAT_W && sk.vx < -BOOST_MIN_SPD) {
            sk.vy = -Math.min(Math.abs(sk.vx) * 0.7, JUMP_SPEED * 1.2);
            sk.vx *= 0.25;
          } else if (sk.x >= vW - PLAT_W && sk.vx > BOOST_MIN_SPD) {
            sk.vy = -Math.min(Math.abs(sk.vx) * 0.7, JUMP_SPEED * 1.2);
            sk.vx *= 0.25;
          } else {
            sk.vy = 0;
            sk.onGround = true;
            if (!prevOnGround) {
              sk.kickflipping = false;
              sk.flipAngle = 0;
            }
          }
        } else {
          const truckWorldY = sk.y - RAIL_SNAP;
          if (
            sk.x > railX1 &&
            sk.x < railX2 &&
            sk.vy > 0 &&
            truckWorldY <= railY &&
            truckWorldY + sk.vy * t + GRAVITY * t * 2 >= railY
          ) {
            sk.onRail = true;
            sk.y = railY + RAIL_SNAP;
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

      // Spark physics
      sk.sparks = sk.sparks.filter((sp) => {
        sp.x += sp.vx * t;
        sp.y += sp.vy * t;
        sp.vy += 0.15 * t;
        sp.life -= 0.06 * t;
        return sp.life > 0;
      });
    }

    // ── Render ─────────────────────────────────────────────────────────────
    function render() {
      const airborne = !sk.onGround && !sk.onRail;

      ctx.clearRect(0, 0, vW, vH);

      // Terrain fill
      ctx.beginPath();
      ctx.moveTo(0, lipY);
      ctx.lineTo(PLAT_W, lipY);
      ctx.lineTo(PLAT_W, vertEndY);
      ctx.arc(PLAT_W + curveR, vertEndY, curveR, Math.PI, Math.PI / 2, true);
      ctx.lineTo(vW - PLAT_W - curveR, groundY);
      ctx.arc(vW - PLAT_W - curveR, vertEndY, curveR, Math.PI / 2, 0, true);
      ctx.lineTo(vW - PLAT_W, vertEndY);
      ctx.lineTo(vW - PLAT_W, lipY);
      ctx.lineTo(vW, lipY);
      ctx.lineTo(vW, vH);
      ctx.lineTo(0, vH);
      ctx.closePath();
      ctx.fillStyle = fg;
      ctx.globalAlpha = 0.05;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Left quarter-pipe
      ctx.beginPath();
      ctx.moveTo(PLAT_W, lipY);
      ctx.lineTo(PLAT_W, vertEndY);
      ctx.arc(PLAT_W + curveR, vertEndY, curveR, Math.PI, Math.PI / 2, true);
      ctx.strokeStyle = fg;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Right quarter-pipe
      ctx.beginPath();
      ctx.arc(vW - PLAT_W - curveR, vertEndY, curveR, Math.PI / 2, 0, true);
      ctx.lineTo(vW - PLAT_W, lipY);
      ctx.strokeStyle = fg;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Coping
      ctx.beginPath();
      ctx.moveTo(0, lipY);
      ctx.lineTo(PLAT_W, lipY);
      ctx.moveTo(vW - PLAT_W, lipY);
      ctx.lineTo(vW, lipY);
      ctx.strokeStyle = fg;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Back walls
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, lipY);
      ctx.moveTo(vW, 0);
      ctx.lineTo(vW, lipY);
      ctx.strokeStyle = fg;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.2;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Flat ground
      ctx.beginPath();
      ctx.moveTo(PLAT_W + curveR, groundY);
      ctx.lineTo(vW - PLAT_W - curveR, groundY);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Rail posts
      ctx.beginPath();
      ctx.moveTo(railX1 + RAIL_POST_INSET, railY);
      ctx.lineTo(railX1 + RAIL_POST_INSET, groundY);
      ctx.moveTo(railX2 - RAIL_POST_INSET, railY);
      ctx.lineTo(railX2 - RAIL_POST_INSET, groundY);
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Rail bar
      ctx.beginPath();
      ctx.moveTo(railX1, railY);
      ctx.lineTo(railX2, railY);
      ctx.strokeStyle = fg;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();

      // Sparks
      for (const sp of sk.sparks) {
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.globalAlpha = sp.life * 0.9;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // ── Skater ──────────────────────────────────────────────────────
      ctx.save();
      ctx.translate(sk.x, sk.y);
      ctx.rotate(sk.drawAngle);
      ctx.translate(0, -WHEEL_BOTTOM);

      // Board
      ctx.save();
      if (sk.kickflipping) {
        ctx.scale(1, Math.cos((sk.flipAngle * Math.PI) / 180));
      }
      ctx.beginPath();
      ctx.moveTo(-BW / 2 - TIP_OVER, KICK_Y);
      ctx.lineTo(-BW / 2 + KICK_TRANS, 0);
      ctx.lineTo(BW / 2 - KICK_TRANS, 0);
      ctx.lineTo(BW / 2 + TIP_OVER, KICK_Y);
      ctx.strokeStyle = fg;
      ctx.lineWidth = BH;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = 0.9;
      ctx.stroke();

      [-TRUCK_X, TRUCK_X].forEach((wx) => {
        ctx.beginPath();
        ctx.arc(wx, WHEEL_CY, WR, 0, Math.PI * 2);
        ctx.fillStyle = fg;
        ctx.globalAlpha = 0.85;
        ctx.fill();
      });
      ctx.restore();
      ctx.globalAlpha = 1;

      // Body
      const legBase = -BH * 0.5;
      const onCurve =
        sk.onGround &&
        ((sk.x > PLAT_W && sk.x <= PLAT_W + curveR) ||
          (sk.x >= vW - PLAT_W - curveR && sk.x < vW - PLAT_W));
      const legLen = airborne || onCurve ? LEG_AIR : LEG_GND;

      ctx.strokeStyle = fg;
      ctx.lineWidth = LIMB_W;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (sk.kickflipping) {
        const frontExt = Math.max(
          0,
          Math.sin((sk.flipAngle * Math.PI) / 180),
        );
        const f = sk.facing;
        ctx.beginPath();
        ctx.moveTo(f * HIP_X, legBase);
        ctx.lineTo(f * (FLICK_REACH + frontExt * FLICK_EXT), legBase - legLen * 0.25);
        ctx.lineTo(f * (TUCK_FOOT + frontExt * TUCK_FOOT_EXT), legBase - legLen);
        ctx.moveTo(-f * HIP_X, legBase);
        ctx.lineTo(-f * TUCK_KNEE, legBase - legLen * 0.5);
        ctx.lineTo(-f * 1, legBase - legLen);
        ctx.stroke();
      } else if (airborne) {
        ctx.beginPath();
        ctx.moveTo(-HIP_X, legBase);
        ctx.lineTo(-KNEE_X, legBase - legLen * 0.5);
        ctx.lineTo(-1, legBase - legLen);
        ctx.moveTo(HIP_X, legBase);
        ctx.lineTo(KNEE_X, legBase - legLen * 0.5);
        ctx.lineTo(1, legBase - legLen);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(-HIP_X, legBase);
        ctx.lineTo(-STAND_KNEE_X, legBase - legLen * 0.55);
        ctx.lineTo(1, legBase - legLen);
        ctx.moveTo(HIP_X, legBase);
        ctx.lineTo(STAND_KNEE_X, legBase - legLen * 0.55);
        ctx.lineTo(1, legBase - legLen);
        ctx.stroke();
      }

      const bodyBase = legBase - legLen;
      ctx.beginPath();
      ctx.moveTo(1, bodyBase);
      ctx.lineTo(1, bodyBase - TORSO);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(1, bodyBase - TORSO * 0.35);
      ctx.lineTo(1 + sk.facing * ARM, bodyBase - TORSO * 0.05);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(1, bodyBase - TORSO - HEAD_R * 0.8, HEAD_R, 0, Math.PI * 2);
      ctx.fillStyle = fg;
      ctx.fill();

      ctx.restore();
      ctx.globalAlpha = 1;

      // Controls hint (screen coords)
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `10px ${monoFont}`;
      ctx.fillStyle = muted;
      ctx.globalAlpha = 0.6;
      const rows: [string, string][] = [
        ["← → / AD", "move"],
        ["↑ / W", "ollie"],
        ["↑↑ / WW", "kickflip"],
      ];
      const keyCol = realW - 70;
      let y = 18;
      for (const [key, label] of rows) {
        ctx.textAlign = "right";
        ctx.fillText(key, keyCol, y);
        ctx.textAlign = "left";
        ctx.fillText(label, keyCol + 8, y);
        y += 14;
      }
      ctx.restore();
    }

    // ── Draw loop ─────────────────────────────────────────────────────────
    let lastTime = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;
      const t = dt / 16.67;

      step(t);
      render();

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
  }, [visible]);

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
