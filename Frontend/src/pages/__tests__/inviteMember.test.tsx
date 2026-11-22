import source from "../inviteMember.tsx?raw";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import InviteMember from "../inviteMember";

vi.mock("@/services/teamService", () => ({
  inviteUserService: vi.fn(),
}));

describe("InviteMember design shell", () => {
  it("renders labeled design inputs and actions", () => {
    const { container } = render(
      <MemoryRouter>
        <InviteMember />
      </MemoryRouter>
    );

    expect(screen.getByText("دعوت عضو جدید")).toBeInTheDocument();
    expect(screen.getByLabelText("نام")).toBeInTheDocument();
    expect(screen.getByLabelText("نام خانوادگی")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("dir", "rtl");
    expect(screen.getByLabelText("ایمیل")).toHaveAttribute("dir", "ltr");
    expect(screen.getByLabelText("شماره موبایل")).toHaveAttribute("dir", "ltr");
    expect(container.querySelector(".auth-card.auth-card-2xl")).toBeInTheDocument();
    expect(container.querySelector(".form-grid")).toBeInTheDocument();
    expect(container.querySelector(".select")).toBeInTheDocument();
    expect(container.querySelector(".btn.btn-yellow")).toBeInTheDocument();
    expect(container.querySelector(".btn.btn-ghost")).toBeInTheDocument();
    expect(container.querySelectorAll(".corner-logo")).toHaveLength(2);
  });

  it("renders required-field errors outside the floating label wrappers", async () => {
    const { container } = render(
      <MemoryRouter>
        <InviteMember />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "ارسال دعوت" }));

    await screen.findByText("نام الزامی است");
    expect(container.querySelectorAll(".fl + .field-error")).toHaveLength(6);
  });

  it("does not use the old background or hardcoded brand colors", () => {
    expect(source).not.toMatch(/BG\.png|#00274D|#FFD500|rounded-3xl|CustomInput/);
  });
});
