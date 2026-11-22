import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BaseModal from "../BaseModal";
import UploadReceiptModal from "../UploadReceiptModal";

describe("BaseModal design classes", () => {
  it("renders the design modal shell and header", () => {
    render(
      <BaseModal isOpen onClose={vi.fn()} showHeader title="عنوان تست">
        <p>بدنه</p>
      </BaseModal>
    );

    expect(screen.getByRole("dialog")).toHaveClass("modal");
    expect(document.querySelector(".modal-overlay")).toBeInTheDocument();
    expect(document.querySelector(".modal-head")).toBeInTheDocument();
    expect(document.querySelector(".modal-title")).toHaveTextContent("عنوان تست");
  });
});

describe("UploadReceiptModal design classes", () => {
  it("renders the design payment grid, dropzone, and actions", () => {
    const { container } = render(
      <UploadReceiptModal
        isOpen
        onClose={vi.fn()}
        onUpload={async () => true}
        paymentInfo={{
          ticketPrice: 660000,
          cardNumber: "6104-3387-4761-8581",
          bankName: "بانک ملت",
        }}
      />
    );

    expect(container.querySelector(".payment-grid")).toBeInTheDocument();
    expect(container.querySelector(".dropzone")).toBeInTheDocument();
    expect(container.querySelector(".modal-actions")).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/#FFD500|bg-orange|text-orange/);
  });

  it("closes with Escape during an in-flight upload without crashing", () => {
    const onClose = vi.fn();
    render(
      <UploadReceiptModal
        isOpen
        onClose={onClose}
        onUpload={() => new Promise(() => {})}
        paymentInfo={{
          ticketPrice: 660000,
          cardNumber: "6104-3387-4761-8581",
          bankName: "بانک ملت",
        }}
      />
    );

    const input = document.getElementById("receipt-input") as HTMLInputElement;
    fireEvent.change(input, {
      target: {
        files: [new File(["fish"], "fish.png", { type: "image/png" })],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "آپلود فایل" }));

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
