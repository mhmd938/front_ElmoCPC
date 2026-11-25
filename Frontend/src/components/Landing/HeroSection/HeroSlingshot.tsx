import spriteBlue from "@/assets/birds/blue.svg?url";
import spriteBomb from "@/assets/birds/bomb.svg?url";
import spriteChuck from "@/assets/birds/chuck.svg?url";
import spriteMatilda from "@/assets/birds/matilda.svg?url";
import spriteMightyEagle from "@/assets/birds/mighty_eagle.svg?url";
import spriteRed from "@/assets/birds/red.svg?url";
import spriteStella from "@/assets/birds/stella.svg?url";
import spriteTerence from "@/assets/birds/terence.svg?url";
import { useEffect, useRef, useState } from "react";

type EntrySide = "left" | "right";
type ExitSide = "side" | "bottom";

interface FlightPlan {
  entry: EntrySide;
  exit: ExitSide;
  image: string;
  size: number;
  durationMs: number;
  x0: number;
  y0: number;
  vx: number;
  vy: number;
  gravity: number;
}

interface FlightView extends FlightPlan {
  x: number;
  y: number;
  pitch: number;
}

interface TrailDot {
  id: number;
  x: number;
  y: number;
  createdAt: number;
  opacity: number;
}

const FIRST_LAUNCH_DELAY_MS = 2000;
const MIN_LAUNCH_INTERVAL_MS = 3000;
const LAUNCH_INTERVAL_RANGE_MS = 2000;
const TRAIL_SAMPLE_INTERVAL_MS = 75;
const TRAIL_LIFETIME_MS = 520;
const MAX_TRAIL_DOTS = 14;
const MAX_PITCH_DEGREES = 14;
const TERMINAL_CLEARANCE_MS = 40;

const SPRITES = [
  { image: spriteBlue, bmu: 75 },
  { image: spriteBomb, bmu: 135 },
  { image: spriteChuck, bmu: 115 },
  { image: spriteMatilda, bmu: 140 },
  { image: spriteMightyEagle, bmu: 210 },
  { image: spriteRed, bmu: 100 },
  { image: spriteStella, bmu: 90 },
  { image: spriteTerence, bmu: 180 },
] as const;

function positionAt(plan: FlightPlan, elapsedMs: number) {
  const elapsedSeconds = elapsedMs / 1000;
  const y = plan.y0 + plan.vy * elapsedSeconds + 0.5 * plan.gravity * elapsedSeconds ** 2;
  const verticalVelocity = plan.vy + plan.gravity * elapsedSeconds;
  const pitch = Math.max(
    -MAX_PITCH_DEGREES,
    Math.min(
      MAX_PITCH_DEGREES,
      (Math.atan2(verticalVelocity, Math.abs(plan.vx)) * 180) / Math.PI,
    ),
  );

  return {
    x: plan.x0 + plan.vx * elapsedSeconds,
    y,
    pitch,
  };
}

function createFlight(width: number, height: number): FlightPlan {
  const entry: EntrySide = Math.random() < 0.5 ? "left" : "right";
  let exit: ExitSide = Math.random() < 0.5 ? "side" : "bottom";
  const sprite = SPRITES[Math.floor(Math.random() * SPRITES.length)] ?? SPRITES[0];
  const durationMs = 1100 + Math.random() * 400;
  const routeDurationSeconds = (durationMs - TERMINAL_CLEARANCE_MS) / 1000;
  const redSize = width < 768 ? 48 : 64;
  const size = Math.round((redSize * sprite.bmu) / 100);
  const maxPitchRadians = (MAX_PITCH_DEGREES * Math.PI) / 180;
  const rotatedHalfExtent = (size / 2) * (Math.cos(maxPitchRadians) + Math.sin(maxPitchRadians));
  const rotationClearance = rotatedHalfExtent - size / 2 + 1;
  const x0 = entry === "left" ? -size - rotationClearance : width + rotationClearance;
  const y0 = height * (0.56 + Math.random() * 0.2);
  const trajectoryVariation = Math.random();
  let targetY = exit === "side" ? height * (0.24 + Math.random() * 0.2) : height + rotationClearance;
  const gravity =
    ((1.05 + trajectoryVariation * 0.55) * height) / routeDurationSeconds ** 2;
  // The route clears the rotated body at this point, then remains offscreen for the final 40 ms.
  const sideTargetX = entry === "left" ? width + rotationClearance : -size - rotationClearance;
  const bottomTargetX = exit === "bottom"
    ? entry === "left"
      ? width * (0.38 + Math.random() * 0.24) - size
      : width * (0.62 - Math.random() * 0.24)
    : width / 2;
  const minFittingX = rotatedHalfExtent - size / 2 + 1;
  const maxFittingX = width - rotatedHalfExtent - size / 2 - 1;
  let vy =
    (targetY - y0 - 0.5 * gravity * routeDurationSeconds ** 2) / routeDurationSeconds;
  const overlapY = height - size / 2 - rotatedHalfExtent;
  const discriminant = vy ** 2 - 2 * gravity * (y0 - overlapY);
  const overlapTime = discriminant >= 0 ? (-vy + Math.sqrt(discriminant)) / gravity : Infinity;
  const overlapProgress = overlapTime / routeDurationSeconds;
  const launchSideLimit =
    entry === "left"
      ? (minFittingX - x0 * (1 - overlapProgress)) / overlapProgress
      : (maxFittingX - x0 * (1 - overlapProgress)) / overlapProgress;
  const minBottomX = entry === "left" ? Math.max(minFittingX, launchSideLimit) : minFittingX;
  const maxBottomX = entry === "right" ? Math.min(maxFittingX, launchSideLimit) : maxFittingX;
  if (exit === "bottom" && (overlapProgress <= 0 || overlapProgress > 1 || minBottomX > maxBottomX)) {
    exit = "side";
    targetY = height * 0.34;
    vy = (targetY - y0 - 0.5 * gravity * routeDurationSeconds ** 2) / routeDurationSeconds;
  }
  const targetX = exit === "side"
    ? sideTargetX
    : Math.max(minBottomX, Math.min(maxBottomX, bottomTargetX));
  const vx = (targetX - x0) / routeDurationSeconds;

  return {
    entry,
    exit,
    image: sprite.image,
    size,
    durationMs,
    x0,
    y0,
    vx,
    vy,
    gravity,
  };
}

const HeroSlingshot = () => {
  const layerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(
    typeof document !== "undefined" && document.visibilityState === "visible",
  );
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [flightView, setFlightView] = useState<FlightView | null>(null);
  const [trailDots, setTrailDots] = useState<TrailDot[]>([]);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.find((candidate) => candidate.target === layer);
        if (entry) setIsInView(entry.isIntersecting);
      },
      { threshold: 0 },
    );
    observer.observe(layer);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = (event: MediaQueryListEvent) => setIsReducedMotion(event.matches);
    setIsReducedMotion(motionQuery.matches);

    if (motionQuery.addEventListener) {
      motionQuery.addEventListener("change", updatePreference);
      return () => motionQuery.removeEventListener("change", updatePreference);
    }

    motionQuery.addListener(updatePreference);
    return () => motionQuery.removeListener(updatePreference);
  }, []);

  useEffect(() => {
    const updateVisibility = () => setIsTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  const canAnimate = isInView && isTabVisible && !isReducedMotion;

  useEffect(() => {
    if (!canAnimate) {
      setFlightView(null);
      setTrailDots([]);
      return;
    }

    const layer = layerRef.current;
    if (!layer) return;

    let disposed = false;
    let nextDotId = 0;
    let launchTimeout: number | undefined;
    let animationFrame: number | undefined;
    let activePlan: FlightPlan | null = null;
    let dots: TrailDot[] = [];
    let startedAt: number | null = null;
    let nextTrailSampleAt = TRAIL_SAMPLE_INTERVAL_MS;

    const animate = (timestamp: number) => {
      if (disposed) return;

      let shouldContinue = false;
      if (activePlan) {
        const plan = activePlan;
        if (startedAt === null) startedAt = timestamp;
        const elapsedMs = Math.max(0, timestamp - startedAt);
        const trajectoryElapsedMs = Math.min(elapsedMs, plan.durationMs);

        while (trajectoryElapsedMs >= nextTrailSampleAt) {
          const sampleTime = Math.max(0, nextTrailSampleAt - TRAIL_SAMPLE_INTERVAL_MS);
          const samplePosition = positionAt(plan, sampleTime);
          dots = [
            ...dots,
            {
              id: nextDotId++,
              x: samplePosition.x + plan.size / 2,
              y: samplePosition.y + plan.size / 2,
              createdAt: timestamp - (elapsedMs - sampleTime),
              opacity: 1,
            },
          ].slice(-MAX_TRAIL_DOTS);
          nextTrailSampleAt += TRAIL_SAMPLE_INTERVAL_MS;
        }

        if (elapsedMs >= plan.durationMs) {
          activePlan = null;
          startedAt = null;
          setFlightView(null);
        } else {
          setFlightView({ ...plan, ...positionAt(plan, elapsedMs) });
          shouldContinue = true;
        }
      }

      dots = dots
        .filter((dot) => timestamp - dot.createdAt < TRAIL_LIFETIME_MS)
        .map((dot) => ({
          ...dot,
          opacity: Math.max(0, 1 - (timestamp - dot.createdAt) / TRAIL_LIFETIME_MS),
        }));
      setTrailDots(dots);

      if (dots.length > 0) shouldContinue = true;
      if (shouldContinue) {
        scheduleFrame();
      }
    };

    const scheduleFrame = () => {
      if (disposed || animationFrame !== undefined) return;
      animationFrame = window.requestAnimationFrame((timestamp) => {
        animationFrame = undefined;
        animate(timestamp);
      });
    };

    const launch = () => {
      launchTimeout = undefined;
      if (disposed) return;

      activePlan = null;
      startedAt = null;
      dots = [];
      setFlightView(null);
      setTrailDots([]);

      const bounds = layer.getBoundingClientRect();
      const width = layer.clientWidth || bounds.width;
      const height = layer.clientHeight || bounds.height;
      if (width > 0 && height > 0) {
        const plan = createFlight(width, height);
        activePlan = plan;
        startedAt = null;
        nextTrailSampleAt = TRAIL_SAMPLE_INTERVAL_MS;
        setFlightView({ ...plan, ...positionAt(plan, 0) });
        scheduleFrame();
      }

      const interval =
        MIN_LAUNCH_INTERVAL_MS + Math.random() * LAUNCH_INTERVAL_RANGE_MS;
      launchTimeout = window.setTimeout(launch, interval);
    };

    launchTimeout = window.setTimeout(launch, FIRST_LAUNCH_DELAY_MS);

    return () => {
      disposed = true;
      if (launchTimeout !== undefined) window.clearTimeout(launchTimeout);
      if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame);
      activePlan = null;
      dots = [];
    };
  }, [canAnimate]);

  return (
    <div
      ref={layerRef}
      className="hero-slingshot"
      aria-hidden="true"
    >
      {trailDots.map((dot) => (
        <span
          key={dot.id}
          className="hero-trail-dot"
          style={{
            left: `${dot.x}px`,
            top: `${dot.y}px`,
            opacity: dot.opacity,
          }}
        />
      ))}
      {flightView && (
        <span
          className="hero-flight"
          data-entry={flightView.entry}
          data-exit={flightView.exit}
          style={{
            left: `${flightView.x}px`,
            top: `${flightView.y}px`,
            width: `${flightView.size}px`,
            height: `${flightView.size}px`,
            transform: `scaleX(${flightView.entry === "left" ? 1 : -1}) rotate(${flightView.pitch}deg)`,
          }}
        >
          <img
            src={flightView.image}
            width={flightView.size}
            height={flightView.size}
            alt=""
            draggable={false}
          />
        </span>
      )}
    </div>
  );
};

export default HeroSlingshot;
