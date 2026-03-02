"use client";

import { useEffect, useRef } from "react";

// ── Virtual coordinate system ───────────────────────────────────────────
// All geometry uses "design units" against a fixed height. A scale factor
// (containerHeight / VIRTUAL_H) maps them to pixels via ctx.setTransform.
// Virtual width stretches to match the container aspect ratio.
const VIRTUAL_H = 300;

// ── Physics (design units / frame @ 60 fps) ─────────────────────────────
const GRAVITY = 0.45;
const PUSH_ACCEL = 0.38;
const FRICTION_GROUND = 0.975;
const FRICTION_AIR = 0.994;
const FRICTION_RAIL = 0.965;
const OLLIE_VEL = 7.0;
const MAX_SPEED = 9;
const BOOST_THRESHOLD = 4.0;

// ── Terrain (design units) ──────────────────────────────────────────────
const QP_MAX_R = 105; // quarterpipe max radius
const VERT_H = 14; // vertical section above the curve
const PLAT_W = 24; // flat deck width atop each quarterpipe
const GROUND_MARGIN = 28; // space below ground line to canvas edge
const RAIL_HALF_LEN = 85;
const RAIL_H = 20; // rail height above ground
const RAIL_POST_INSET = 18;

// ── Board (design units) ────────────────────────────────────────────────
const BOARD_W = 24;
const BOARD_H = 3;
const WHEEL_R = 2.8;
const KICK_RISE = -3; // nose/tail rise (negative = up)
const KICK_BLEND = 4; // flat-to-kick transition zone
const TIP_OVER = 1.6; // overhang past the kick
const TRUCK_X = BOARD_W / 2 - 5;

// ── Body (design units) ─────────────────────────────────────────────────
const HEAD_R = 5.5;
const TORSO = 13;
const LEG_STAND = 12;
const LEG_AIR = 7;
const ARM = 9;
const LIMB_W = 2;
const HIP_X = 4;
const KNEE_X_AIR = 7;
const KNEE_X_STAND = 2;

// Kickflip leg offsets
const FLICK_REACH = 6;
const FLICK_EXT = 8;
const TUCK_KNEE = 6;
const TUCK_FOOT = 2;
const TUCK_FOOT_EXT = 4;

// ── Derived board geometry ──────────────────────────────────────────────
const WHEEL_CY = BOARD_H / 2 + WHEEL_R + 1;
const TRUCK_GRIND_Y = BOARD_H / 2 + (WHEEL_CY - BOARD_H / 2) * 0.4;
const WHEEL_BOTTOM = WHEEL_CY + WHEEL_R;
const RAIL_SNAP = WHEEL_BOTTOM - TRUCK_GRIND_Y; // feet-to-truck offset for rail snapping

// ── Sparks ──────────────────────────────────────────────────────────────
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
  life: number; // 1 → 0
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
    let rafId = 0;

    // Virtual viewport (width recomputed on resize)
    let vW = 0;
    const vH = VIRTUAL_H;
    let pixelW = 0;
    let dpr = 1;

    // Terrain geometry (recomputed on resize)
    let groundY = 0;
    let lipY = 0; // quarterpipe deck / coping
    let curveTopY = 0; // where curve meets vert
    let curveR = 0;
    let railX1 = 0;
    let railX2 = 0;
    let railY = 0;

    // Theme (synced from CSS vars on resize)
    let fg = "#1c1916";
    let muted = "#8a7a6e";
    let border = "#ddd5cc";
    let accent = "#b05c3a";
    let mono = "monospace";

    const skater = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      onGround: false,
      onRail: false,
      facing: 1 as 1 | -1,
      flipAngle: 0,
      flipSpeed: 13.5,
      flipping: false,
      sparks: [] as Spark[],
      tilt: 0, // board rotation to match surface slope
    };

    // ── Surface helpers ─────────────────────────────────────────────────
    // Terrain profile: platform → vert → curve → flat → curve → vert → platform
    function surfaceY(x: number): number {
      if (x <= PLAT_W) return lipY;
      if (x <= PLAT_W + curveR) {
        const dx = x - (PLAT_W + curveR);
        return curveTopY + Math.sqrt(Math.max(0, curveR * curveR - dx * dx));
      }
      if (x >= vW - PLAT_W - curveR && x <= vW - PLAT_W) {
        const dx = x - (vW - PLAT_W - curveR);
        return curveTopY + Math.sqrt(Math.max(0, curveR * curveR - dx * dx));
      }
      if (x >= vW - PLAT_W) return lipY;
      return groundY;
    }

    function surfaceNormal(x: number): [number, number] {
      if (x <= PLAT_W) return [0, -1];
      if (x <= PLAT_W + curveR) {
        const sy = surfaceY(x);
        return [(PLAT_W + curveR - x) / curveR, (curveTopY - sy) / curveR];
      }
      if (x >= vW - PLAT_W - curveR && x <= vW - PLAT_W) {
        const sy = surfaceY(x);
        return [(vW - PLAT_W - curveR - x) / curveR, (curveTopY - sy) / curveR];
      }
      if (x >= vW - PLAT_W) return [0, -1];
      return [0, -1];
    }

    function surfaceAngle(x: number): number {
      const [nx, ny] = surfaceNormal(x);
      return Math.atan2(nx, -ny);
    }

    // ── Resize ──────────────────────────────────────────────────────────
    const handleResize = () => {
      dpr = window.devicePixelRatio || 1;
      const { offsetWidth: w, offsetHeight: h } = container;
      const scale = h / VIRTUAL_H;
      vW = w / scale;
      pixelW = w;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);

      const cs = getComputedStyle(document.body);
      fg = cs.getPropertyValue("--fg").trim() || "#1c1916";
      muted = cs.getPropertyValue("--muted").trim() || "#8a7a6e";
      border = cs.getPropertyValue("--border").trim() || "#ddd5cc";
      accent = cs.getPropertyValue("--accent").trim() || "#b05c3a";
      mono = cs.getPropertyValue("--font-mono").trim() || "monospace";

      groundY = vH - GROUND_MARGIN;
      const qpR = Math.max(
        VERT_H + 1,
        Math.min(QP_MAX_R, groundY - PLAT_W - 4),
      );
      curveR = Math.max(1, qpR - VERT_H);
      lipY = groundY - qpR;
      curveTopY = lipY + VERT_H;

      railX1 = vW / 2 - RAIL_HALF_LEN;
      railX2 = vW / 2 + RAIL_HALF_LEN;
      railY = groundY - RAIL_H;

      if (skater.x === 0) {
        skater.x = vW / 2;
        skater.y = groundY;
      }
    };

    // ── Ollie / kickflip ────────────────────────────────────────────────
    function ollie() {
      if (skater.onGround) {
        // Jump along surface normal so ramp launches feel natural
        const [nx, ny] = surfaceNormal(skater.x);
        skater.vx += nx * OLLIE_VEL * 0.35;
        skater.vy = ny * OLLIE_VEL;
        skater.onGround = false;
      } else if (skater.onRail) {
        skater.vy = -OLLIE_VEL;
        skater.onRail = false;
      } else if (!skater.flipping) {
        // Airborne → kickflip. Set flip speed to land one full rotation.
        const h = surfaceY(skater.x) - skater.y;
        const disc = skater.vy * skater.vy + 2 * GRAVITY * Math.max(0, h);
        const tLand = (-skater.vy + Math.sqrt(disc)) / GRAVITY;
        skater.flipping = true;
        skater.flipAngle = 0;
        skater.flipSpeed = Math.min(40, Math.max(12, 360 / (tLand * 0.75)));
      }
    }

    // ── Input ───────────────────────────────────────────────────────────
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

    // ── Physics ─────────────────────────────────────────────────────────
    function step(t: number) {
      if (keys["ArrowLeft"] || keys["KeyA"]) {
        skater.vx -= PUSH_ACCEL * t;
        skater.facing = -1;
      }
      if (keys["ArrowRight"] || keys["KeyD"]) {
        skater.vx += PUSH_ACCEL * t;
        skater.facing = 1;
      }
      skater.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, skater.vx));

      if (skater.onRail) {
        skater.vy = 0;
        skater.y = railY + RAIL_SNAP;
        skater.vx *= Math.pow(FRICTION_RAIL, t);

        if (skater.sparks.length < MAX_SPARKS && Math.random() < SPARK_CHANCE) {
          const a = -Math.PI * 0.6 + Math.random() * Math.PI * 0.4;
          skater.sparks.push({
            x: skater.x,
            y: railY,
            vx: Math.cos(a) * (1.5 + Math.random() * 2.5),
            vy: Math.sin(a) * 1.5 - 1,
            life: 1,
          });
        }

        if (skater.x < railX1 - 2 || skater.x > railX2 + 2)
          skater.onRail = false;
      } else if (skater.onGround) {
        skater.vy = 0;
        skater.vx *= Math.pow(FRICTION_GROUND, t);
      } else {
        skater.vy += GRAVITY * t;
        skater.vx *= Math.pow(FRICTION_AIR, t);
      }

      skater.x += skater.vx * t;
      skater.y += skater.vy * t;

      if (skater.onGround && !skater.onRail) skater.y = surfaceY(skater.x);

      // Tilt: match surface on ground, ease toward level in air
      if (skater.onGround) {
        skater.tilt = surfaceAngle(skater.x);
      } else if (skater.onRail) {
        skater.tilt += -skater.tilt * 0.15 * t;
      } else {
        skater.tilt += -skater.tilt * 0.04 * t;
      }

      // Wall bounce
      if (skater.x < 1) {
        skater.x = 1;
        skater.vx = Math.abs(skater.vx) * 0.4;
      }
      if (skater.x > vW - 1) {
        skater.x = vW - 1;
        skater.vx = -Math.abs(skater.vx) * 0.4;
      }

      // ── Collision ───────────────────────────────────────────────────
      if (!skater.onRail) {
        const wasGrounded = skater.onGround;
        skater.onGround = false;
        const sy = surfaceY(skater.x);

        if (skater.y >= sy) {
          skater.y = sy;

          // Quarterpipe boost: convert horizontal speed into a vertical launch
          if (skater.x <= PLAT_W && skater.vx < -BOOST_THRESHOLD) {
            skater.vy = -Math.min(Math.abs(skater.vx) * 0.7, OLLIE_VEL * 1.2);
            skater.vx *= 0.25;
          } else if (skater.x >= vW - PLAT_W && skater.vx > BOOST_THRESHOLD) {
            skater.vy = -Math.min(Math.abs(skater.vx) * 0.7, OLLIE_VEL * 1.2);
            skater.vx *= 0.25;
          } else {
            skater.vy = 0;
            skater.onGround = true;
            if (!wasGrounded) {
              skater.flipping = false;
              skater.flipAngle = 0;
            }
          }
        } else {
          // Check rail grind: falling, within rail bounds, truck about to cross rail
          const truckY = skater.y - RAIL_SNAP;
          const truckNextY = truckY + skater.vy * t + GRAVITY * t * 2;
          if (
            skater.x > railX1 &&
            skater.x < railX2 &&
            skater.vy > 0 &&
            truckY <= railY &&
            truckNextY >= railY
          ) {
            skater.onRail = true;
            skater.y = railY + RAIL_SNAP;
            skater.vy = 0;
            skater.flipping = false;
            skater.flipAngle = 0;
          }
        }
      }

      if (skater.flipping) {
        skater.flipAngle += skater.flipSpeed * t;
        if (skater.flipAngle >= 360) {
          skater.flipAngle = 0;
          skater.flipping = false;
        }
      }

      skater.sparks = skater.sparks.filter((sp) => {
        sp.x += sp.vx * t;
        sp.y += sp.vy * t;
        sp.vy += 0.15 * t;
        sp.life -= 0.06 * t;
        return sp.life > 0;
      });
    }

    // ── Render ───────────────────────────────────────────────────────────
    function render() {
      const airborne = !skater.onGround && !skater.onRail;
      ctx.clearRect(0, 0, vW, vH);

      // Terrain fill
      ctx.beginPath();
      ctx.moveTo(0, lipY);
      ctx.lineTo(PLAT_W, lipY);
      ctx.lineTo(PLAT_W, curveTopY);
      ctx.arc(PLAT_W + curveR, curveTopY, curveR, Math.PI, Math.PI / 2, true);
      ctx.lineTo(vW - PLAT_W - curveR, groundY);
      ctx.arc(vW - PLAT_W - curveR, curveTopY, curveR, Math.PI / 2, 0, true);
      ctx.lineTo(vW - PLAT_W, curveTopY);
      ctx.lineTo(vW - PLAT_W, lipY);
      ctx.lineTo(vW, lipY);
      ctx.lineTo(vW, vH);
      ctx.lineTo(0, vH);
      ctx.closePath();
      ctx.fillStyle = fg;
      ctx.globalAlpha = 0.05;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Left quarterpipe
      ctx.beginPath();
      ctx.moveTo(PLAT_W, lipY);
      ctx.lineTo(PLAT_W, curveTopY);
      ctx.arc(PLAT_W + curveR, curveTopY, curveR, Math.PI, Math.PI / 2, true);
      ctx.strokeStyle = fg;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Right quarterpipe
      ctx.beginPath();
      ctx.arc(vW - PLAT_W - curveR, curveTopY, curveR, Math.PI / 2, 0, true);
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
      ctx.strokeStyle = border;
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
      for (const sp of skater.sparks) {
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.globalAlpha = sp.life * 0.9;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // ── Skater ──────────────────────────────────────────────────────
      ctx.save();
      ctx.translate(skater.x, skater.y);
      ctx.rotate(skater.tilt);
      ctx.translate(0, -WHEEL_BOTTOM);

      // Board
      ctx.save();
      if (skater.flipping) {
        ctx.scale(1, Math.cos((skater.flipAngle * Math.PI) / 180));
      }
      ctx.beginPath();
      ctx.moveTo(-BOARD_W / 2 - TIP_OVER, KICK_RISE);
      ctx.lineTo(-BOARD_W / 2 + KICK_BLEND, 0);
      ctx.lineTo(BOARD_W / 2 - KICK_BLEND, 0);
      ctx.lineTo(BOARD_W / 2 + TIP_OVER, KICK_RISE);
      ctx.strokeStyle = fg;
      ctx.lineWidth = BOARD_H;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = 0.9;
      ctx.stroke();

      [-TRUCK_X, TRUCK_X].forEach((wx) => {
        ctx.beginPath();
        ctx.arc(wx, WHEEL_CY, WHEEL_R, 0, Math.PI * 2);
        ctx.fillStyle = fg;
        ctx.globalAlpha = 0.85;
        ctx.fill();
      });
      ctx.restore();
      ctx.globalAlpha = 1;

      // Stick figure
      const hipY = -BOARD_H * 0.5;
      const onCurve =
        skater.onGround &&
        ((skater.x > PLAT_W && skater.x <= PLAT_W + curveR) ||
          (skater.x >= vW - PLAT_W - curveR && skater.x < vW - PLAT_W));
      const leg = airborne || onCurve ? LEG_AIR : LEG_STAND;

      ctx.strokeStyle = fg;
      ctx.lineWidth = LIMB_W;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (skater.flipping) {
        const progress = Math.max(
          0,
          Math.sin((skater.flipAngle * Math.PI) / 180),
        );
        const d = skater.facing;
        ctx.beginPath();
        ctx.moveTo(d * HIP_X, hipY);
        ctx.lineTo(d * (FLICK_REACH + progress * FLICK_EXT), hipY - leg * 0.25);
        ctx.lineTo(d * (TUCK_FOOT + progress * TUCK_FOOT_EXT), hipY - leg);
        ctx.moveTo(-d * HIP_X, hipY);
        ctx.lineTo(-d * TUCK_KNEE, hipY - leg * 0.5);
        ctx.lineTo(-d * 1, hipY - leg);
        ctx.stroke();
      } else if (airborne) {
        ctx.beginPath();
        ctx.moveTo(-HIP_X, hipY);
        ctx.lineTo(-KNEE_X_AIR, hipY - leg * 0.5);
        ctx.lineTo(-1, hipY - leg);
        ctx.moveTo(HIP_X, hipY);
        ctx.lineTo(KNEE_X_AIR, hipY - leg * 0.5);
        ctx.lineTo(1, hipY - leg);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(-HIP_X, hipY);
        ctx.lineTo(-KNEE_X_STAND, hipY - leg * 0.55);
        ctx.lineTo(1, hipY - leg);
        ctx.moveTo(HIP_X, hipY);
        ctx.lineTo(KNEE_X_STAND, hipY - leg * 0.55);
        ctx.lineTo(1, hipY - leg);
        ctx.stroke();
      }

      const waist = hipY - leg;
      ctx.beginPath();
      ctx.moveTo(1, waist);
      ctx.lineTo(1, waist - TORSO);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(1, waist - TORSO * 0.35);
      ctx.lineTo(1 + skater.facing * ARM, waist - TORSO * 0.05);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(1, waist - TORSO - HEAD_R * 0.8, HEAD_R, 0, Math.PI * 2);
      ctx.fillStyle = fg;
      ctx.fill();

      ctx.restore();
      ctx.globalAlpha = 1;

      // Controls hint (screen-pixel coords)
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `10px ${mono}`;
      ctx.fillStyle = muted;
      ctx.globalAlpha = 0.6;
      const controls: [string, string][] = [
        ["← → / AD", "move"],
        ["↑ / W", "ollie"],
        ["↑↑ / WW", "kickflip"],
      ];
      const col = pixelW - 70;
      let y = 18;
      for (const [key, label] of controls) {
        ctx.textAlign = "right";
        ctx.fillText(key, col, y);
        ctx.textAlign = "left";
        ctx.fillText(label, col + 8, y);
        y += 14;
      }
      ctx.restore();
    }

    // ── Game loop ───────────────────────────────────────────────────────
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;
      const t = dt / 16.67; // normalize to 60fps

      step(t);
      render();
      rafId = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);
    handleResize();
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
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
