import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("test harness", () => {
  it("renders and applies jest-dom matchers", () => {
    render(<p>harness ready</p>);
    expect(screen.getByText("harness ready")).toBeInTheDocument();
  });
});
