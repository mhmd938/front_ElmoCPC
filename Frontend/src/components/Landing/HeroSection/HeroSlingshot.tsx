import { useEffect, useRef, useState } from "react";
import birdSprite from "@/assets/hero-birds/bird.svg";
import owlSprite from "@/assets/hero-birds/owl.svg";
import duckSprite from "@/assets/hero-birds/duck.svg";

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

const SPRITES = [birdSprite, owlSprite, duckSprite];
const FIRST_LAUNCH_DELAY_MS = 2000;
const MIN_LAUNCH_INTERVAL_MS = 3000;
const LAUNCH_INTERVAL_RANGE_MS = 2000;
const TRAIL_SAMPLE_INTERVAL_MS = 75;
const TRAIL_LIFETIME_MS = 520;
const MAX_TRAIL_DOTS = 14;

function positionAt(plan: FlightPlan, elapsedMs: number) {
  const elapsedSeconds = elapsedMs / 1000;
  const y = plan.y0 + plan.vy * elapsedSeconds + 0.5 * plan.gravity * elapsedSeconds ** 2;
  const verticalVelocity = plan.vy + plan.gravity * elapsedSeconds;
  const pitch = Math.max(
    -14,
    Math.min(14, (Math.atan2(verticalVelocity, Math.abs(plan.vx)) * 180) / Math.PI),
  );

  return {
    x: plan.x0 + plan.vx * elapsedSeconds,
    y,
    pitch,
  };
}

function createFlight(width: number, height: number): FlightPlan {
  const entry: EntrySide = Math.random() < 0.5 ? "left" : "right";
  const exit: ExitSide = Math.random() < 0.5 ? "side" : "bottom";
  const image = SPRITES[Math.floor(Math.random() * SPRITES.length)] ?? birdSprite;
  const durationMs = 1100 + Math.random() * 400;
  const durationSeconds = durationMs / 1000;
  const size = Math.min(64, Math.max(44, Math.min(width, height) * 0.12));
  const x0 = entry === "left" ? -size : width;
  const y0 = height * 0.68;
  const gravity = (1.4 * height) / durationSeconds ** 2;
  const targetY = exit === "side" ? height * 0.34 : height;
  const targetX =
    exit === "side"
      ? entry === "left"
        ? width
        : -size
      : entry === "left"
        ? width * 0.52 - size
        : width * 0.48;
  const vx = (targetX - x0) / durationSeconds;
  const vy = (targetY - y0 - 0.5 * gravity * durationSeconds ** 2) / durationSeconds;

  return {
    entry,
    exit,
    image,
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
        animationFrame = window.requestAnimationFrame(animate);
      } else {
        animationFrame = undefined;
      }
    };

    const launch = () => {
      launchTimeout = undefined;
      if (disposed) return;

      const bounds = layer.getBoundingClientRect();
      const width = layer.clientWidth || bounds.width;
      const height = layer.clientHeight || bounds.height;
      if (width > 0 && height > 0) {
        const plan = createFlight(width, height);
        activePlan = plan;
        startedAt = null;
        nextTrailSampleAt = TRAIL_SAMPLE_INTERVAL_MS;
        setFlightView({ ...plan, ...positionAt(plan, 0) });
        animationFrame = window.requestAnimationFrame(animate);
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
