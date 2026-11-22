import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { readFileSync } from "node:fs";
import { beforeEach, expect, it, vi } from "vitest";
import { loginService, verifyOtpLoginService } from "@/services/authService";
import { saveSession } from "@/services/authSession";
import Admin from "../Admin";
import Dashboard from "../Dashboard";

vi.mock("@/services/mock/flags", () => ({ USE_MOCKS: true }));
vi.mock("@/services/mock/helpers", async original => ({
  ...await original<typeof import("@/services/mock/helpers")>(), delay: async () => {},
}));

async function signIn(alias: string) {
  const email = alias + "@example.test";
  await loginService({ email });
  saveSession((await verifyOtpLoginService({ email, code: "111111" })).data);
}
beforeEach(() => localStorage.clear());

it("moves an approved team into the payment filter and opens the seeded receipt for review", async () => {
  await signIn("admin");
  render(<MemoryRouter><Admin /></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button", { name: "تایید تیم" }));
  fireEvent.click(await screen.findByRole("button", { name: "در انتظار پرداخت" }));
  expect(await screen.findByRole("heading", { name: "تیم کوانتوم" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "در انتظار رسید" }));
  const preview = screen.getByRole("link", { name: "مشاهده رسید" });
  expect(preview).toHaveAttribute("href", "/mock-receipt.png");
  const png = readFileSync("public/mock-receipt.png");
  expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  fireEvent.click(screen.getByRole("button", { name: "تایید/رد فیش" }));
  expect(within(screen.getByRole("dialog")).getByRole("button", { name: "تایید فیش" })).toBeEnabled();
});

it("explains local sample uploads without a transfer on both payment tabs and in the dialog", async () => {
  await signIn("payment");
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  const instructions = /واریز واقعی لازم نیست.*فایل نمونه.*همین مرورگر/;
  expect(await screen.findByText(instructions)).toBeInTheDocument();
  expect(screen.queryByText(/واریز کنید|پس از واریز/)).toBeNull();
  fireEvent.click(screen.getByRole("tab", { name: "تیم من" }));
  expect(await screen.findByText(instructions)).toBeInTheDocument();
  expect(screen.queryByText(/واریز کنید|پس از واریز/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "آپلود فیش" }));
  expect(within(screen.getByRole("dialog")).getByText(instructions)).toBeInTheDocument();
});

it.each(["captain", "draft", "payment-a", "receipt", "accepted"])("hides upload on the overview for %s", async alias => {
  await signIn(alias);
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  fireEvent.click(await screen.findByRole("tab", { name: "تیم من" }));
  await screen.findByText(alias === "captain" ? "شما هنوز تیمی ندارید" : "اعضای تیم");
  fireEvent.click(screen.getByRole("tab", { name: "خانه" }));
  expect(screen.queryByRole("button", { name: "آپلود فیش" })).toBeNull();
});
