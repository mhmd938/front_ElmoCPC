import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TimelineSection from "../TimelineSection";
import { getTimelineMarker } from "../timelineMarkers";

describe("Landing timetable markers", () => {
  it("renders a decorative 48px square marker on each of the six events", () => {
    render(<TimelineSection />);

    const events = screen.getAllByRole("listitem");
    const expectedMarkers = [
      /normal_pig_defeated\.webp$/,
      /red\.svg(?:\?url)?$/,
      /normal_pig\.webp$/,
      /old_pig\.webp$/,
      /king_pig\.webp$/,
      /egg\.webp$/,
    ];

    expect(events).toHaveLength(expectedMarkers.length);
    events.forEach((event, index) => {
      const image = within(event).getByAltText("");

      expect(image.getAttribute("src")).toMatch(expectedMarkers[index]);
      expect(image).toHaveAttribute("width", "48");
      expect(image).toHaveAttribute("height", "48");
    });
  });

  it.each(["normal", "old", "king"] as const)(
    "uses Red while the %s pig event is active and defeated art once it ends",
    (role) => {
      expect(getTimelineMarker("active", role)).toMatch(/red\.svg(?:\?url)?$/);
      expect(getTimelineMarker("done", role)).toMatch(new RegExp(`${role}_pig_defeated\\.webp$`));
    },
  );

  it.each(["upcoming", "active", "done"] as const)(
    "uses Egg when the closing ceremony is %s",
    (status) => {
      expect(getTimelineMarker(status, "egg")).toMatch(/egg\.webp$/);
    },
  );
});
