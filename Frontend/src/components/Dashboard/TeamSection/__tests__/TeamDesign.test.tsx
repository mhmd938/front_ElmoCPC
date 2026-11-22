import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TeamHeader from "../TeamHeader";
import TeamMembers from "../TeamMembers";

describe("TeamHeader design classes", () => {
  it("renders a team head card with a design status pill", () => {
    const { container } = render(
      <TeamHeader
        teamData={{
          name: "تیم کوانتوم",
          description: "سه‌نفره، هدف: فینال",
          status: "submitted",
        }}
        isCaptain
        invites={[]}
        onInviteMember={vi.fn()}
        onUploadReceipt={vi.fn()}
        onDeleteTeam={vi.fn()}
        onSubmitTeam={vi.fn()}
      />
    );

    expect(container.querySelector(".card.team-head")).toBeInTheDocument();
    expect(container.querySelector(".status-pill.is-submitted")).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/#FFD500|#00274D|bg-(blue|green|red|yellow)-/);
  });

  it("renders the non-captain notice as a design alert", () => {
    const { container } = render(
      <TeamHeader
        teamData={{ name: "تیم", status: "submitted" }}
        isCaptain={false}
        invites={[]}
        onInviteMember={vi.fn()}
        onUploadReceipt={vi.fn()}
        onDeleteTeam={vi.fn()}
        onSubmitTeam={vi.fn()}
      />
    );

    expect(container.querySelector(".alert.alert-info")).toBeInTheDocument();
  });
});

describe("TeamMembers design classes", () => {
  it("renders member cards with design badges and meta", () => {
    const { container } = render(
      <TeamMembers
        members={[
          {
            id: 1,
            name: "نورا",
            familyName: "محمدی",
            email: "nora@elmocpc.ir",
            phone: "09120000000",
            isCaptain: true,
          },
        ]}
      />
    );

    expect(container.querySelector(".member-card")).toBeInTheDocument();
    expect(container.querySelector(".member-top")).toBeInTheDocument();
    expect(container.querySelector(".member-foot")).toBeInTheDocument();
    expect(container.querySelector(".badge.badge-cyan")).toHaveTextContent("کاپیتان");
    expect(container.innerHTML).not.toMatch(/#FFD500|bg-gradient|text-\[#/);
  });
});
