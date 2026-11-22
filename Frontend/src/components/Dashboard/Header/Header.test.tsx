import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Header from "./Header";

describe("Dashboard header", () => {
  it("shows the active badge without a green dot", () => {
    const { container } = render(
      <Header
        userData={{ name: "نورا", familyName: "محمدی" }}
        teamData={null}
        isCaptain={false}
        onNavigateHome={vi.fn()}
      />,
    );

    expect(container.querySelector(".badge-success .dot")).not.toBeInTheDocument();
    expect(container.querySelector("button[aria-expanded]")).not.toBeInTheDocument();
  });
});
