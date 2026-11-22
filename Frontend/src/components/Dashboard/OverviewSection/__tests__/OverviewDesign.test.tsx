import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TeamStatusInfo from "../TeamStatusInfo";

describe("TeamStatusInfo design classes", () => {
  it("renders a submitted status with design card, steps, and alert", () => {
    const { container } = render(
      <TeamStatusInfo
        teamData={{ status: "submitted" }}
        formatPrice={(price) => `${price} تومان`}
      />
    );

    expect(container.querySelector(".card.stack")).toBeInTheDocument();
    expect(container.querySelector(".stat-icon.is-cyan")).toBeInTheDocument();
    expect(container.querySelectorAll(".status-step")).toHaveLength(3);
    expect(container.querySelector(".alert.alert-info")).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/bg-(yellow|blue|orange|purple|green|red)-/);
    expect(container.innerHTML).not.toMatch(/text-(yellow|blue|orange|purple|green|red)-/);
  });

  it("uses the waiting tone and payment note", () => {
    const { container } = render(
      <TeamStatusInfo
        teamData={{ status: "waiting_for_payment" }}
        formatPrice={(price) => `${price} تومان`}
      />
    );

    expect(container.querySelector(".stat-icon.is-yellow")).toBeInTheDocument();
    expect(container.querySelector(".alert.alert-warning")).toBeInTheDocument();
    expect(container.textContent).toContain("660000 تومان");
  });
});
