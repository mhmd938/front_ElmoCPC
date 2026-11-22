import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TeamHeader from "../TeamHeader";
import TeamMembers from "../TeamMembers";
import TeamStatusCard from "../TeamStatusCard";
import InvitesList from "../InvitesList";
import TeamSection from "../TeamSection";

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

describe("TeamStatusCard design classes", () => {
  const paymentInfo = {
    ticketPrice: 660000,
    cardNumber: "6104-3387-4761-8581",
    bankName: "بانک ملت مهدی تقی دولابی",
  };

  it("renders the submitted state with design steps and alert", () => {
    const { container } = render(
      <TeamStatusCard
        teamData={{ status: "submitted" }}
        formatPrice={(price) => `${price} تومان`}
        paymentInfo={paymentInfo}
      />
    );

    expect(container.querySelector(".card.stack")).toBeInTheDocument();
    expect(container.querySelectorAll(".status-step")).toHaveLength(3);
    expect(container.querySelector(".alert.alert-info")).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/bg-(yellow|blue|orange|purple|green|red)-/);
  });

  it("renders payment cells when waiting for payment", () => {
    const { container } = render(
      <TeamStatusCard
        teamData={{ status: "waiting_for_payment" }}
        formatPrice={(price) => `${price} تومان`}
        paymentInfo={paymentInfo}
      />
    );

    expect(container.querySelector(".payment-grid")).toBeInTheDocument();
    expect(container.querySelectorAll(".payment-cell")).toHaveLength(2);
  });
});

describe("InvitesList design classes", () => {
  it("renders a design list row with a waiting pill", () => {
    const { container } = render(
      <InvitesList
        invites={[
          {
            id: "1",
            token: "tok",
            email: "mahdi@example.com",
            first_name: "مهدی",
            last_name: "احمدی",
            expires_at: "2026-11-19T00:00:00Z",
          },
        ]}
        isCaptain
        onCancelInvite={async () => true}
        teamId="1"
      />
    );

    expect(container.querySelector(".card")).toBeInTheDocument();
    expect(container.querySelector(".list-row")).toBeInTheDocument();
    expect(container.querySelector(".status-pill.is-waiting")).toBeInTheDocument();
    expect(container.querySelector(".btn.btn-destructive")).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/bg-(yellow|red|blue)-/);
  });
});

describe("TeamSection design classes", () => {
  it("renders the design empty state when there is no team", () => {
    const { container } = render(
      <TeamSection
        teamData={null}
        invites={[]}
        isCaptain={false}
        loading={false}
        onRefresh={vi.fn()}
        onDeleteTeam={vi.fn()}
        onSubmitTeam={vi.fn()}
        onUploadReceipt={vi.fn()}
        onCancelInvite={async () => true}
        onCreateTeam={vi.fn()}
        onInviteMember={vi.fn()}
        paymentInfo={{
          ticketPrice: 660000,
          cardNumber: "6104-3387-4761-8581",
          bankName: "بانک ملت",
        }}
      />
    );

    expect(container.querySelector(".empty")).toBeInTheDocument();
    expect(container.querySelector(".btn.btn-primary")).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/#FFD500|#00274D/);
  });
});
