import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import firstSprite from "@/assets/birds/blue.svg?url";
import secondSprite from "@/assets/birds/bomb.svg?url";
import HeroSection from "./HeroSection";

let frameCallbacks: Map<number, FrameRequestCallback>;
let nextFrameId: number;
let reducedMotion = false;
let visibilityDescriptor: PropertyDescriptor | undefined;
let matchMediaDescriptor: PropertyDescriptor | undefined;
let requestAnimationFrameDescriptor: PropertyDescriptor | undefined;
let cancelAnimationFrameDescriptor: PropertyDescriptor | undefined;
let intersectionObserverDescriptor: PropertyDescriptor | undefined;
const motionListeners = new Set<(event: MediaQueryListEvent) => void>();

function createLayout(width: number, height: number): DOMRect {
  return {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    width,
    height,
    toJSON: () => ({}),
  } as DOMRect;
}

let currentLayout = createLayout(1000, 600);

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "0px";
  readonly thresholds = [0];

  private readonly callback: IntersectionObserverCallback;
  private target: Element | null = null;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    observers.push(this);
  }

  notify(isIntersecting: boolean) {
    if (!this.target) throw new Error("Hero observer did not observe a target");
    const entry = {
      isIntersecting,
      intersectionRatio: isIntersecting ? 1 : 0,
      target: this.target,
      time: 0,
      rootBounds: null,
      boundingClientRect: currentLayout,
      intersectionRect: currentLayout,
    } as IntersectionObserverEntry;
    this.callback([entry], this);
  }

  observe(target: Element) {
    this.target = target;
  }

  unobserve() {}

  disconnect() {}

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

const observers: MockIntersectionObserver[] = [];

function setRandomSequence(...values: number[]) {
  const random = vi.spyOn(Math, "random");
  random.mockReset();
  for (const value of values) random.mockReturnValueOnce(value);
  random.mockReturnValue(0.5);
}

function renderHero() {
  const result = render(
    <HeroSection
      countdown={{ days: 10, hours: 5, minutes: 30, seconds: 45 }}
      isLoggedIn={false}
      onLogin={() => {}}
      onRegister={() => {}}
      onDashboard={() => {}}
    />,
  );
  expect(result.container.querySelector(".hero-slingshot")).not.toBeNull();
  return result;
}

function activateHero() {
  const observer = observers.at(-1);
  if (!observer) throw new Error("Hero did not register an intersection observer");
  act(() => observer.notify(true));
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    writable: true,
    value: state,
  });
  act(() => document.dispatchEvent(new Event("visibilitychange")));
}

function setReducedMotion(matches: boolean) {
  reducedMotion = matches;
  const event = { matches, media: "(prefers-reduced-motion: reduce)" } as MediaQueryListEvent;
  act(() => motionListeners.forEach((listener) => listener(event)));
}

function resizeOverlay(width: number, height: number) {
  currentLayout = createLayout(width, height);
}

function advanceTimers(milliseconds: number) {
  act(() => vi.advanceTimersByTime(milliseconds));
}

function frame(timestamp: number) {
  const callbacks = [...frameCallbacks.entries()];
  for (const [id] of callbacks) frameCallbacks.delete(id);
  act(() => callbacks.forEach(([, callback]) => callback(timestamp)));
}

function activeFlight(container: HTMLElement) {
  return container.querySelector<HTMLElement>(".hero-flight");
}

function rotatedBounds(element: HTMLElement) {
  const size = Number.parseFloat(element.style.width);
  const left = Number.parseFloat(element.style.left);
  const top = Number.parseFloat(element.style.top);
  const rotationDegrees = Number.parseFloat(
    element.style.transform.match(/rotate\((-?\d+(?:\.\d+)?)deg\)/)?.[1] ?? "0",
  );
  const rotation = (Math.abs(rotationDegrees) * Math.PI) / 180;
  const halfExtent = (size / 2) * (Math.cos(rotation) + Math.sin(rotation));
  const centerX = left + size / 2;
  const centerY = top + size / 2;

  return {
    left: centerX - halfExtent,
    right: centerX + halfExtent,
    top: centerY - halfExtent,
    bottom: centerY + halfExtent,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  observers.length = 0;
  motionListeners.clear();
  currentLayout = createLayout(1000, 600);
  reducedMotion = false;
  frameCallbacks = new Map();
  nextFrameId = 0;

  visibilityDescriptor = Object.getOwnPropertyDescriptor(document, "visibilityState");
  matchMediaDescriptor = Object.getOwnPropertyDescriptor(window, "matchMedia");
  requestAnimationFrameDescriptor = Object.getOwnPropertyDescriptor(window, "requestAnimationFrame");
  cancelAnimationFrameDescriptor = Object.getOwnPropertyDescriptor(window, "cancelAnimationFrame");
  intersectionObserverDescriptor = Object.getOwnPropertyDescriptor(window, "IntersectionObserver");

  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    writable: true,
    value: "visible",
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: () =>
      ({
        get matches() {
          return reducedMotion;
        },
        media: "(prefers-reduced-motion: reduce)",
        onchange: null,
        addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
          motionListeners.add(listener),
        removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
          motionListeners.delete(listener),
        addListener: (listener: (event: MediaQueryListEvent) => void) =>
          motionListeners.add(listener),
        removeListener: (listener: (event: MediaQueryListEvent) => void) =>
          motionListeners.delete(listener),
        dispatchEvent: () => true,
      }) as MediaQueryList,
  });
  Object.defineProperty(window, "requestAnimationFrame", {
    configurable: true,
    writable: true,
    value: (callback: FrameRequestCallback) => {
      const id = ++nextFrameId;
      frameCallbacks.set(id, callback);
      return id;
    },
  });
  Object.defineProperty(window, "cancelAnimationFrame", {
    configurable: true,
    writable: true,
    value: (id: number) => frameCallbacks.delete(id),
  });
  Object.defineProperty(window, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: MockIntersectionObserver,
  });
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    return this.classList.contains("hero-slingshot") ? currentLayout : new DOMRect();
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();

  const restore = (target: object, property: PropertyKey, descriptor?: PropertyDescriptor) => {
    if (descriptor) Object.defineProperty(target, property, descriptor);
    else Reflect.deleteProperty(target, property);
  };
  restore(document, "visibilityState", visibilityDescriptor);
  restore(window, "matchMedia", matchMediaDescriptor);
  restore(window, "requestAnimationFrame", requestAnimationFrameDescriptor);
  restore(window, "cancelAnimationFrame", cancelAnimationFrameDescriptor);
  restore(window, "IntersectionObserver", intersectionObserverDescriptor);
});

describe("HeroSlingshot", () => {
  it.each([
    [0, 48, 36], [1, 86, 65], [2, 74, 55], [3, 90, 67],
    [4, 134, 101], [5, 64, 48], [6, 58, 43], [7, 115, 86],
  ])("sizes catalog entry %i at each hero width", (index, laptop, phone) => {
    for (const [width, expected] of [[1366, laptop], [390, phone]]) {
      resizeOverlay(width, 700);
      setRandomSequence(0.1, 0.1, (index + 0.5) / 8);
      const { container, unmount } = renderHero();
      activateHero();
      advanceTimers(2000);
      expect(activeFlight(container)).toHaveStyle({
        width: `${expected}px`,
        height: `${expected}px`,
      });
      unmount();
    }
  });

  it.each([
    [0, firstSprite],
    [0.2, secondSprite],
  ])("selects the pool sprite at the deterministic random draw %s", (spriteDraw, expectedSprite) => {
    setRandomSequence(0.1, 0.1, spriteDraw, 0.5);
    const { container } = renderHero();
    activateHero();
    advanceTimers(2000);

    expect(activeFlight(container)?.querySelector("img")).toHaveAttribute("src", expectedSprite);
  });

  it("varies entry height and path length for the same route, sprite, and duration", () => {
    const launch = (pathRandom: number) => {
      setRandomSequence(0.1, 0.1, 0.1, 0.5, pathRandom, pathRandom);
      const { container, unmount } = renderHero();
      activateHero();
      advanceTimers(2000);
      const initialY = Number.parseFloat(activeFlight(container)!.style.top);
      let previous = { x: Number.parseFloat(activeFlight(container)!.style.left), y: initialY };
      let distance = 0;
      let midY = initialY;
      for (let timestamp = 0; timestamp <= 1000; timestamp += 100) {
        frame(timestamp);
        const flight = activeFlight(container)!;
        const current = {
          x: Number.parseFloat(flight.style.left),
          y: Number.parseFloat(flight.style.top),
        };
        distance += Math.hypot(current.x - previous.x, current.y - previous.y);
        previous = current;
        if (timestamp === 500) midY = current.y;
      }
      unmount();
      return { initialY, midY, distance };
    };

    const shallow = launch(0.1);
    const steep = launch(0.9);
    expect(Math.abs(shallow.initialY - steep.initialY)).toBeGreaterThan(40);
    expect(Math.abs(shallow.midY - steep.midY)).toBeGreaterThan(10);
    expect(Math.abs(shallow.distance - steep.distance)).toBeGreaterThan(10);
  });

  it("starts upward at the shortest tablet-height bottom-route extrema", () => {
    setRandomSequence(0.9, 0.9, 0.55, 0.5, 0, 0, 0.5);
    resizeOverlay(1152, 701);
    const { container } = renderHero();
    activateHero();
    advanceTimers(2000);
    const initialY = Number.parseFloat(activeFlight(container)!.style.top);
    frame(0);
    frame(100);
    expect(activeFlight(container)).toHaveAttribute("data-exit", "bottom");
    expect(Number.parseFloat(activeFlight(container)!.style.top)).toBeLessThan(initialY);
  });

  it("keeps the Mighty Eagle inside the horizontal bounds at descending bottom contact", () => {
    setRandomSequence(0.1, 0.9, 0.55, 0.99, 0.99, 0, 0);
    resizeOverlay(320, 701);
    const { container } = renderHero();
    activateHero();
    advanceTimers(2000);
    expect(activeFlight(container)).toHaveAttribute("data-exit", "bottom");

    let checkedContact = false;
    for (let timestamp = 0; timestamp <= 1480; timestamp += 20) {
      frame(timestamp);
      const flight = activeFlight(container);
      if (!flight) break;
      const bounds = rotatedBounds(flight);
      if (bounds.top <= 701 && bounds.bottom > 701) {
        checkedContact = true;
        expect(bounds.left).toBeGreaterThanOrEqual(0);
        expect(bounds.right).toBeLessThanOrEqual(320);
      }
    }
    expect(checkedContact).toBe(true);
  });

  it.each([
    { entry: "left", exit: "side", entryRandom: 0.1, exitRandom: 0.1, width: 1152, height: 828 },
    { entry: "left", exit: "bottom", entryRandom: 0.1, exitRandom: 0.9, width: 1152, height: 828 },
    { entry: "right", exit: "side", entryRandom: 0.9, exitRandom: 0.1, width: 1152, height: 828 },
    { entry: "right", exit: "bottom", entryRandom: 0.9, exitRandom: 0.9, width: 1152, height: 828 },
    { entry: "right", exit: "bottom", entryRandom: 0.9, exitRandom: 0.9, width: 1152, height: 701 },
    { entry: "left", exit: "side", entryRandom: 0.1, exitRandom: 0.1, width: 375, height: 780 },
    { entry: "left", exit: "bottom", entryRandom: 0.1, exitRandom: 0.9, width: 375, height: 780 },
    { entry: "right", exit: "side", entryRandom: 0.9, exitRandom: 0.1, width: 375, height: 780 },
    { entry: "right", exit: "bottom", entryRandom: 0.9, exitRandom: 0.9, width: 375, height: 780 },
    { entry: "left", exit: "bottom", expectedExit: "side", entryRandom: 0.1, exitRandom: 0.9, width: 120, height: 780, targetRandom: 0 },
    ...[1366, 390, 320, 280, 180].flatMap((width) => [
      { entry: "left", exit: "side", entryRandom: 0.1, exitRandom: 0.1, width, height: 780, targetRandom: 0.5 },
      { entry: "left", exit: "bottom", entryRandom: 0.1, exitRandom: 0.9, width, height: 780, targetRandom: 0 },
      { entry: "left", exit: "bottom", entryRandom: 0.1, exitRandom: 0.9, width, height: 780, targetRandom: 1 },
      { entry: "right", exit: "side", entryRandom: 0.9, exitRandom: 0.1, width, height: 780, targetRandom: 0.5 },
      { entry: "right", exit: "bottom", entryRandom: 0.9, exitRandom: 0.9, width, height: 780, targetRandom: 0 },
      { entry: "right", exit: "bottom", entryRandom: 0.9, exitRandom: 0.9, width, height: 780, targetRandom: 1 },
    ]),
  ])(
    "flies from the physical $entry and exits through the $exit at $width×$height",
    ({ entry, exit, expectedExit = exit, entryRandom, exitRandom, width, height, targetRandom = 0.5 }) => {
      setRandomSequence(entryRandom, exitRandom, 0.55, 0.5, 0.5, 0.5, targetRandom);
      resizeOverlay(width, height);
      const { container } = renderHero();
      const hero = container.querySelector(".hero");
      const heroInner = container.querySelector(".hero-inner");
      const overlay = hero?.lastElementChild;
      expect(overlay).toHaveClass("hero-slingshot");
      expect(overlay?.parentElement).toBe(hero);
      expect(heroInner?.contains(overlay ?? null)).toBe(false);

      expect(overlay).toHaveAttribute("aria-hidden", "true");
      activateHero();

      advanceTimers(1999);
      expect(activeFlight(container)).toBeNull();
      advanceTimers(1);

      const flight = activeFlight(container);
      expect(flight).not.toBeNull();
      expect(flight).toHaveAttribute("data-entry", entry);
      expect(flight).toHaveAttribute("data-exit", expectedExit);

      const spriteWidth = Number.parseFloat(flight!.style.width);
      const initialX = Number.parseFloat(flight!.style.left);
      const initialY = Number.parseFloat(flight!.style.top);
      if (entry === "left") {
        expect(initialX).toBeLessThanOrEqual(-spriteWidth);
      } else {
        expect(initialX).toBeGreaterThanOrEqual(width);
      }
      const originBounds = rotatedBounds(flight!);

      frame(0);
      frame(100);
      const movingFlight = activeFlight(container)!;
      const movingX = Number.parseFloat(movingFlight.style.left);
      const movingY = Number.parseFloat(movingFlight.style.top);
      expect(entry === "left" ? movingX : -movingX).toBeGreaterThan(
        entry === "left" ? initialX : -initialX,
      );
      expect(movingY).toBeLessThan(initialY);

      if (expectedExit === "bottom") {
        for (let timestamp = 120; timestamp <= 1260; timestamp += 20) {
          frame(timestamp);
          const bounds = rotatedBounds(activeFlight(container)!);
          if (bounds.top <= height && bounds.bottom > height) {
            expect(bounds.left).toBeGreaterThanOrEqual(0);
            expect(bounds.right).toBeLessThanOrEqual(width);
          }
        }
      }

      frame(1260);
      const nearExit = activeFlight(container)!;
      const bodyBounds = rotatedBounds(nearExit);
      if (expectedExit === "side") {
        if (entry === "left") expect(bodyBounds.left).toBeGreaterThan(width);
        else expect(bodyBounds.right).toBeLessThan(0);
        expect(bodyBounds.top).toBeGreaterThan(0);
        expect(bodyBounds.bottom).toBeLessThan(height);
      } else {
        expect(bodyBounds.top).toBeGreaterThan(height);
        expect(bodyBounds.left).toBeGreaterThan(0);
        expect(bodyBounds.right).toBeLessThan(width);
      }
      if (entry === "left") expect(originBounds.right).toBeLessThanOrEqual(0);
      else expect(originBounds.left).toBeGreaterThanOrEqual(width);
      frame(1301);
      expect(activeFlight(container)).toBeNull();
    },
  );

  it("starts each later launch three to five seconds after the previous launch starts", () => {
    const { container } = renderHero();
    activateHero();

    advanceTimers(2000);
    expect(activeFlight(container)).not.toBeNull();
    frame(0);
    frame(1301);
    expect(activeFlight(container)).toBeNull();

    advanceTimers(3999);
    frame(1700);
    expect(activeFlight(container)).toBeNull();
    advanceTimers(1);
    expect(activeFlight(container)).not.toBeNull();
  });

  it.each([
    ["left", 0.1, 1],
    ["right", 0.9, -1],
  ] as const)("faces the selected sprite toward travel for a %s-origin launch", (entry, entryRandom, direction) => {
    setRandomSequence(entryRandom, 0.1, 0.2, 0.5, 0.5);
    const { container } = renderHero();
    activateHero();
    advanceTimers(2000);

    const flight = activeFlight(container)!;
    const image = flight.querySelector("img")!;
    expect(image).toHaveAttribute("src", secondSprite);
    expect(image.style.transform).toBe("");
    const wrapperDirection = flight.style.transform.startsWith("scaleX(-1)") ? -1 : 1;
    expect(wrapperDirection).toBe(direction);
    expect(flight).toHaveAttribute("data-entry", entry);
  });

  it("uses the overlay's current physical dimensions when a launch starts", () => {
    setRandomSequence(0.9, 0.1, 0.1, 0.5, 0.5);
    const { container } = renderHero();
    activateHero();

    advanceTimers(1999);
    resizeOverlay(500, 300);
    advanceTimers(1);

    const flight = activeFlight(container)!;
    expect(flight).toHaveAttribute("data-entry", "right");
    expect(rotatedBounds(flight).left).toBeGreaterThanOrEqual(500);
    expect(Number.parseFloat(flight.style.top)).toBeCloseTo(198, 10);
  });

  it("keeps scheduling after a zero-size measurement and fits a later launch", () => {
    setRandomSequence(0.5, 0.9, 0.1, 0.1, 0.5, 0.5);
    resizeOverlay(0, 0);
    const { container } = renderHero();
    activateHero();

    advanceTimers(2000);
    expect(activeFlight(container)).toBeNull();
    resizeOverlay(500, 300);
    advanceTimers(3999);
    expect(activeFlight(container)).toBeNull();
    advanceTimers(1);

    const flight = activeFlight(container)!;
    expect(rotatedBounds(flight).left).toBeGreaterThanOrEqual(500);
    expect(Number.parseFloat(flight.style.top)).toBeCloseTo(198, 10);
  });

  it("does not queue another RAF when a later launch timer fires first", () => {
    const { unmount } = renderHero();
    activateHero();
    advanceTimers(2000);
    expect(frameCallbacks.size).toBe(1);
    advanceTimers(4000);
    expect(frameCallbacks.size).toBe(1);
    unmount();
    expect(frameCallbacks.size).toBe(0);
  });

  it("cancels the older pending RAF if a second launch fires before animation resumes", () => {
    const { unmount } = renderHero();
    activateHero();
    advanceTimers(2000);
    advanceTimers(4000);
    unmount();
    expect(frameCallbacks.size).toBe(0);
  });

  it("removes expired trail dots immediately when a stalled flight is replaced", () => {
    const { container } = renderHero();
    activateHero();
    advanceTimers(2000);
    frame(2000);
    frame(2100);
    expect(container.querySelectorAll(".hero-trail-dot").length).toBeGreaterThan(0);

    advanceTimers(4000);
    expect(activeFlight(container)).not.toBeNull();
    expect(container.querySelectorAll(".hero-trail-dot")).toHaveLength(0);
  });

  it("clears the active bird and trail on exit and waits two seconds after re-entry", () => {
    setRandomSequence(0.1, 0.1, 0.1, 0.5, 0.5);
    const { container } = renderHero();
    activateHero();

    advanceTimers(2000);
    frame(0);
    frame(100);
    expect(activeFlight(container)).not.toBeNull();
    expect(container.querySelectorAll(".hero-trail-dot").length).toBeGreaterThan(0);

    const observer = observers.at(-1)!;
    act(() => observer.notify(false));
    expect(activeFlight(container)).toBeNull();
    expect(container.querySelectorAll(".hero-trail-dot")).toHaveLength(0);
    expect(frameCallbacks.size).toBe(0);

    advanceTimers(5000);
    expect(activeFlight(container)).toBeNull();
    act(() => observer.notify(true));
    advanceTimers(1999);
    expect(activeFlight(container)).toBeNull();
    advanceTimers(1);
    expect(activeFlight(container)).not.toBeNull();
  });

  it("cancels the scheduled launch and animation frame on unmount", () => {
    const { unmount } = renderHero();
    activateHero();
    advanceTimers(2000);
    frame(0);
    frame(100);
    expect(frameCallbacks.size).toBe(1);
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(frameCallbacks.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(["hidden tab", "reduced motion"] as const)(
    "suppresses launches, clears flight and trail, and restarts the delay when %s is enabled",
    (preference) => {
      setRandomSequence(0.1, 0.1, 0.1, 0.5, 0.5);
      const { container } = renderHero();
      activateHero();

      advanceTimers(2000);
      frame(0);
      frame(100);
      expect(activeFlight(container)).not.toBeNull();
      expect(container.querySelectorAll(".hero-trail-dot").length).toBeGreaterThan(0);

      if (preference === "hidden tab") setVisibility("hidden");
      else setReducedMotion(true);

      expect(activeFlight(container)).toBeNull();
      expect(container.querySelectorAll(".hero-trail-dot")).toHaveLength(0);
      advanceTimers(5000);
      expect(activeFlight(container)).toBeNull();

      if (preference === "hidden tab") setVisibility("visible");
      else setReducedMotion(false);
      advanceTimers(1999);
      expect(activeFlight(container)).toBeNull();
      advanceTimers(1);
      expect(activeFlight(container)).not.toBeNull();
    },
  );

  it("fades and removes trail dots shortly after the bird exits", () => {
    const { container } = renderHero();
    activateHero();
    advanceTimers(2000);

    frame(0);
    frame(100);
    const firstTrailDot = container.querySelector<HTMLElement>(".hero-trail-dot")!;
    const firstTrailPosition = `${firstTrailDot.style.left}|${firstTrailDot.style.top}`;
    const initialOpacity = Number.parseFloat(firstTrailDot.style.opacity);
    expect(initialOpacity).toBeGreaterThan(0);

    frame(300);
    const sameTrailDot = Array.from(
      container.querySelectorAll<HTMLElement>(".hero-trail-dot"),
    ).find((dot) => `${dot.style.left}|${dot.style.top}` === firstTrailPosition);
    expect(Number.parseFloat(sameTrailDot!.style.opacity)).toBeLessThan(initialOpacity);

    frame(1301);
    expect(activeFlight(container)).toBeNull();
    expect(container.querySelectorAll(".hero-trail-dot").length).toBeGreaterThan(0);

    frame(1900);
    expect(container.querySelectorAll(".hero-trail-dot")).toHaveLength(0);
  });
});
