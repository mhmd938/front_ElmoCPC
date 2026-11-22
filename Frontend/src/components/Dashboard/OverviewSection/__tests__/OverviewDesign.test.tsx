import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TeamStatusInfo from "../TeamStatusInfo";

describe("TeamStatusInfo design classes", () => {
  it("renders the draft steps for an inherited object key", () => {
    const { container } = render(
      <TeamStatusInfo teamData={{ status: "constructor" }} formatPrice={String} />
    );
    expect(container.querySelector(".stat-icon.is-yellow")).toBeInTheDocument();
    expect(container.querySelector(".status-step")).toBeInTheDocument();
  });

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

import PaymentInfoSection from "../PaymentInfoSection";
import OverviewSection from "../OverviewSection";

describe("PaymentInfoSection design classes", () => {
  it("renders the design payment card and grid", () => {
    const { container } = render(
      <PaymentInfoSection
        paymentInfo={{
          ticketPrice: 660000,
          cardNumber: "6104-3387-4761-8581",
          bankName: "بانک ملت مهدی تقی دولابی",
        }}
        formatPrice={(price) => `${price} هزار تومان برای کل تیم`}
        onUploadReceipt={vi.fn()}
      />
    );

    expect(container.querySelector(".card.payment-card")).toBeInTheDocument();
    expect(container.querySelector(".payment-grid")).toBeInTheDocument();
    expect(container.querySelectorAll(".payment-cell")).toHaveLength(2);
    expect(container.querySelector(".btn.btn-secondary")).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/#FFD500|bg-orange|text-orange/);
  });

  it("shows the payment card even when the team is not waiting for payment", () => {
    const { container } = render(
      <OverviewSection
        userData={{ name: "نورا" }}
        teamData={{ status: "accepted", members: [] }}
        isCaptain={false}
        daysLeft={23}
        notifications={[]}
        onUploadReceipt={vi.fn()}
        paymentInfo={{
          ticketPrice: 660000,
          cardNumber: "6104-3387-4761-8581",
          bankName: "بانک ملت مهدی تقی دولابی",
        }}
      />
    );

    expect(container.querySelector(".payment-card")).toBeInTheDocument();
  });

  it.each([undefined, { ticketPrice: 0, cardNumber: "", bankName: "" }])("renders unloaded or empty payment info %j", (paymentInfo) => {
    const { container } = render(
      <PaymentInfoSection
        paymentInfo={paymentInfo}
        formatPrice={(price) => `${price} تومان`}
        onUploadReceipt={vi.fn()}
      />
    );

    expect(container.querySelector(".payment-grid")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });
});

import NotificationsList from "../NotificationsList";

describe("NotificationsList design classes", () => {
  it("renders the design empty state", () => {
    const { container } = render(<NotificationsList notifications={[]} />);

    expect(container.querySelector(".empty")).toBeInTheDocument();
    expect(container.querySelector(".empty-text")).toHaveTextContent(
      "اطلاعیه‌ای برای نمایش وجود ندارد"
    );
  });

  it("renders unread notifications as list rows with a badge", () => {
    const { container } = render(
      <NotificationsList
        notifications={[
          {
            id: 1,
            title: "اطلاعیه مهم",
            message: "زمان مسابقه تغییر کرد",
            type: "warning",
            date: "۱۴۰۴/۰۹/۰۱",
            read: false,
          },
        ]}
      />
    );

    expect(container.querySelector(".list-row")).toBeInTheDocument();
    expect(container.querySelector(".badge.badge-warning")).toHaveTextContent(
      "جدید"
    );
    expect(container.innerHTML).not.toMatch(/#FFD500|bg-white|text-gray/);
  });
});
