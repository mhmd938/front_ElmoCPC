import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HeroSection from "./HeroSection";

type ObserverInstance = {
  target: Element | null;
  notify: (isIntersecting: boolean) => void;
};

const observers: ObserverInstance[] = [];
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
    observers.push({
      get target() {
        return thisObserver.target;
      },
      notify: (isIntersecting) => {
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
      },
    });
    const thisObserver = this;
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
    ["left", "side", 0.1, 0.1],
    ["left", "bottom", 0.1, 0.9],
    ["right", "side", 0.9, 0.1],
    ["right", "bottom", 0.9, 0.9],
  ] as const)(
    "flies from the physical %s and exits through the %s",
    (entry, exit, entryRandom, exitRandom) => {
      setRandomSequence(entryRandom, exitRandom, 0.1, 0.5, 0.5);
      const { container } = renderHero();
      const heroInner = container.querySelector(".hero-inner");
      expect(heroInner?.lastElementChild).toHaveClass("hero-slingshot");

      const overlay = heroInner?.lastElementChild;
      expect(overlay).toHaveAttribute("aria-hidden", "true");
      activateHero();

      advanceTimers(1999);
      expect(activeFlight(container)).toBeNull();
      advanceTimers(1);

      const flight = activeFlight(container);
      expect(flight).not.toBeNull();
      expect(flight).toHaveAttribute("data-entry", entry);
      expect(flight).toHaveAttribute("data-exit", exit);

      const spriteWidth = Number.parseFloat(flight!.style.width);
      const initialX = Number.parseFloat(flight!.style.left);
      const initialY = Number.parseFloat(flight!.style.top);
      if (entry === "left") {
        expect(initialX).toBeLessThanOrEqual(-spriteWidth);
      } else {
        expect(initialX).toBe(1000);
      }

      frame(0);
      frame(100);
      const movingFlight = activeFlight(container)!;
      const movingX = Number.parseFloat(movingFlight.style.left);
      const movingY = Number.parseFloat(movingFlight.style.top);
      expect(entry === "left" ? movingX : -movingX).toBeGreaterThan(
        entry === "left" ? initialX : -initialX,
      );
      expect(movingY).toBeLessThan(initialY);

      frame(1299);
      const nearExit = activeFlight(container)!;
      const exitX = Number.parseFloat(nearExit.style.left);
      const exitY = Number.parseFloat(nearExit.style.top);
      if (exit === "side") {
        if (entry === "left") expect(exitX).toBeGreaterThan(900);
        else expect(exitX).toBeLessThan(100);
        expect(exitY).toBeLessThan(500);
      } else {
        expect(exitY).toBeGreaterThan(500);
        expect(exitX).toBeGreaterThan(0);
        expect(exitX).toBeLessThan(1000 - spriteWidth);
      }
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

  it("uses the overlay's current physical dimensions when a launch starts", () => {
    setRandomSequence(0.9, 0.1, 0.1, 0.5, 0.5);
    const { container } = renderHero();
    activateHero();

    advanceTimers(1999);
    resizeOverlay(500, 300);
    advanceTimers(1);

    const flight = activeFlight(container)!;
    expect(flight).toHaveAttribute("data-entry", "right");
    expect(Number.parseFloat(flight.style.left)).toBe(500);
    expect(Number.parseFloat(flight.style.top)).toBeCloseTo(204, 10);
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
    expect(Number.parseFloat(flight.style.left)).toBe(500);
    expect(Number.parseFloat(flight.style.top)).toBeCloseTo(204, 10);
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
