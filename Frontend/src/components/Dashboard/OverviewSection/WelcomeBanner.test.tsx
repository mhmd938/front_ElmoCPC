import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import WelcomeBanner from "./WelcomeBanner";

describe("Dashboard welcome banner", () => {
  it("does not render the smiley decoration", () => {
    const { container } = render(<WelcomeBanner name="نورا" />);

    expect(container.querySelector(".banner-icon")).not.toBeInTheDocument();
  });
});
