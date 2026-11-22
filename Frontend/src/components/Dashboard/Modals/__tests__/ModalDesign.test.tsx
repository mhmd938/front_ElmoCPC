import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import { describe, expect, it, vi } from "vitest";
import BaseModal from "../BaseModal";
import SubmitTeamModal from "../SubmitTeamModal";
import UploadReceiptModal from "../UploadReceiptModal";

const { startSubmit, submitTeam } = vi.hoisted(() => ({
  startSubmit: vi.fn(),
  submitTeam: vi.fn(),
}));
vi.mock("@/hooks/useDashboard.ts", () => ({
  useDashboard: () => ({
    userData: { name: "نورا" },
    teamData: { id: "1", name: "تیم تست", status: "draft", members: [{ id: 1 }, { id: 2 }, { id: 3 }] },
    isCaptain: true,
    invites: [],
    notifications: [],
    daysLeft: 1,
    handleStartSubmitProcess: startSubmit,
    handleSubmitTeam: submitTeam,
  }),
}));

it("submits from the team tab only after the start check and confirmation", async () => {
  startSubmit.mockReturnValueOnce(false).mockReturnValueOnce(true);
  submitTeam.mockResolvedValue(true);
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  fireEvent.click(screen.getByRole("tab", { name: "تیم من" }));
  const start = screen.getByRole("button", { name: "ثبت نهایی تیم" });
  fireEvent.click(start);
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(start);
  const dialog = within(screen.getByRole("dialog"));
  fireEvent.click(dialog.getByRole("button", { name: "بررسی شرایط" }));
  expect(submitTeam).not.toHaveBeenCalled();
  fireEvent.click(dialog.getByRole("button", { name: "ثبت نهایی تیم" }));
  expect(submitTeam).toHaveBeenCalledTimes(1);
  expect(await dialog.findByText(/تیم با موفقیت ثبت نهایی شد/)).toBeInTheDocument();
});

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

  it.each([true, false])("handles an upload resolving to %s after Escape", async (success) => {
    let finishUpload!: (success: boolean) => void;
    const onUpload = vi.fn(() => new Promise<boolean>((resolve) => { finishUpload = resolve; }));
    function ReceiptDialog() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button onClick={() => setOpen(true)}>Reopen</button>
          <UploadReceiptModal
            isOpen={open}
            onClose={() => setOpen(false)}
            onUpload={onUpload}
            paymentInfo={{ ticketPrice: 660000, cardNumber: "6104", bankName: "بانک ملت" }}
          />
        </>
      );
    }
    render(<ReceiptDialog />);

    const input = document.getElementById("receipt-input") as HTMLInputElement;
    const file = new File(["fish"], "fish.png", { type: "image/png" });
    fireEvent.change(input, {
      target: {
        files: [file],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "آپلود فایل" }));
    expect(onUpload).toHaveBeenCalledWith(file);
    expect(screen.getByRole("button", { name: "در حال آپلود..." })).toBeDisabled();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    await act(async () => finishUpload(success));
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Reopen" }));
    const retry = screen.getByRole("button", { name: "آپلود فایل" });
    if (success) expect(retry).toBeDisabled();
    else expect(retry).toBeEnabled();
  });
});

describe("SubmitTeamModal design classes", () => {
  it("renders step one with design modal and buttons", () => {
    const { container } = render(
      <SubmitTeamModal
        isOpen
        onClose={vi.fn()}
        teamName="تیم کوانتوم"
        memberCount={3}
        pendingInvites={0}
        onSubmit={async () => true}
      />
    );

    expect(screen.getByText("آمادگی برای ثبت نهایی")).toBeInTheDocument();
    expect(container.querySelector(".modal")).toBeInTheDocument();
    expect(container.querySelector(".modal-head")).toBeInTheDocument();
    expect(container.querySelector(".btn.btn-ghost")).toBeInTheDocument();
    expect(container.querySelector(".btn.btn-primary")).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(
      /#FFD500|#00274D|bg-(white|blue|green|red|yellow|purple|gray)-/
    );
  });
});
