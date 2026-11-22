import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import type { ChangeEvent } from "react";
import Login from "../LogIn";
import Signup from "../SignUp";
import Admin from "../Admin";
import { clearSession, saveSession } from "@/services/authSession";
import { loginService, verifyOtpLoginService } from "@/services/authService";
import { readMockState, updateMockState } from "@/services/mock/mockData";

vi.mock("@/services/mock/flags", () => ({ USE_MOCKS: true }));
vi.mock("@/services/mock/helpers", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/services/mock/helpers")>(),
  delay: async () => {},
}));
vi.mock("@/components/ui/input-otp", () => ({
  InputOTP: ({ value, onChange }: { value: string; onChange: (value: string) => void }) =>
    <input aria-label="OTP" value={value} onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} />,
  InputOTPGroup: () => null,
  InputOTPSlot: () => null,
}));

beforeEach(() => {
  localStorage.clear();
  clearSession();
});

function InviteDestination() {
  const [params] = useSearchParams();
  return <h1>{params.get("token")}</h1>;
}

function renderAuth(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/accept-invite" element={<InviteDestination />} />
    <Route path="/admin" element={<h1>Admin destination</h1>} />
    <Route path="/dashboard" element={<h1>Dashboard destination</h1>} />
  </Routes></MemoryRouter>);
}

async function resendExpiredAndVerify() {
  await screen.findByLabelText("OTP");
  updateMockState(state => { state.challenges[0].expiresAt = 0; });
  fireEvent.click(screen.getByRole("button", { name: "ارسال مجدد کد تایید" }));
  await waitFor(() => expect(readMockState().challenges[0].expiresAt).toBeGreaterThan(Date.now()));
  fireEvent.change(screen.getByLabelText("OTP"), { target: { value: "111111" } });
  fireEvent.click(screen.getByRole("button", { name: "تایید" }));
}

it("renews a mock login challenge and sends the seeded admin to the admin page", async () => {
  renderAuth("/login");
  fireEvent.change(screen.getByLabelText("ایمیل"), { target: { value: "admin@example.test" } });
  fireEvent.click(screen.getByRole("button", { name: "دریافت کد تایید" }));
  await resendExpiredAndVerify();
  expect(await screen.findByText("Admin destination")).toBeInTheDocument();
  expect(localStorage.getItem("access_token")).toBeNull();
});

it("renews signup using the saved form and signs the new participant in", async () => {
  const { container } = renderAuth("/signup");
  const form = {
    name: "Demo", familyName: "Student", email: "student@example.test", phone: "09123456789",
    national_code: "1234567890", tshirt_size: "M", university: "Demo",
  };
  for (const [name, value] of Object.entries(form)) {
    fireEvent.change(container.querySelector(`[name="${name}"]`)!, { target: { value } });
  }
  fireEvent.click(screen.getByRole("button", { name: "ثبت اطلاعات" }));
  await resendExpiredAndVerify();
  expect(await screen.findByText("Dashboard destination")).toBeInTheDocument();
  expect(readMockState().users.find(user => user.email === form.email)).toMatchObject({
    first_name: form.name, last_name: form.familyName, university: form.university,
  });
  expect(localStorage.getItem("access_token")).toBeNull();
});

it("redirects a signed-in mock participant away from admin", async () => {
  const email = "captain@example.test";
  await loginService({ email });
  saveSession((await verifyOtpLoginService({ email, code: "111111" })).data);
  render(<MemoryRouter initialEntries={["/admin"]}><Routes>
    <Route path="/admin" element={<Admin />} />
    <Route path="/dashboard" element={<h1>Dashboard destination</h1>} />
    <Route path="/login" element={<h1>Login destination</h1>} />
  </Routes></MemoryRouter>);
  expect(await screen.findByText("Dashboard destination")).toBeInTheDocument();
});

it.each(["member-a@example.test", "admin@example.test"])("preserves an encoded invite across login for %s", async email => {
  renderAuth("/login?invite=a%26b%2Fc");
  fireEvent.change(screen.getByLabelText("ایمیل"), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "دریافت کد تایید" }));
  await resendExpiredAndVerify();
  expect(await screen.findByRole("heading", { name: "a&b/c" })).toBeInTheDocument();
});

it("preserves an invite when the visitor switches from login to signup", async () => {
  const { container } = renderAuth("/login?invite=a%26b%2Fc");
  fireEvent.click(container.querySelector('a[href^="/signup"]')!);
  const form = { name: "Guest", familyName: "Student", email: "guest@example.test", phone: "09123456789",
    national_code: "1234567890", tshirt_size: "M", university: "Demo" };
  for (const [name, value] of Object.entries(form)) {
    fireEvent.change(container.querySelector(`[name="${name}"]`)!, { target: { value } });
  }
  fireEvent.click(screen.getByRole("button", { name: "ثبت اطلاعات" }));
  await resendExpiredAndVerify();
  expect(await screen.findByRole("heading", { name: "a&b/c" })).toBeInTheDocument();
});
