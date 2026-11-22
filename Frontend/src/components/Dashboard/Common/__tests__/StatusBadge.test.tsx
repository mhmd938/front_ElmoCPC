import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StatusBadge from "../StatusBadge";

describe("StatusBadge", () => {
  it("uses the design pill classes and a dot", () => {
    const { container } = render(<StatusBadge status="receipt_pending" />);
    const pill = container.querySelector(".status-pill");

    expect(pill).toHaveClass("is-receipt");
    expect(pill?.querySelector(".dot")).toBeInTheDocument();
    expect(screen.getByText("در انتظار تایید فیش")).toBeInTheDocument();
  });
});
