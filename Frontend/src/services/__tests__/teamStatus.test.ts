import { describe, expect, it } from "vitest";
import {
  getStatusPillClass,
  getUserRegistrationStatus,
  translateTeamStatus,
} from "../teamService";

describe("team status mapping", () => {
  it.each([
    ["draft", "is-draft"],
    ["submitted", "is-submitted"],
    ["waiting_for_payment", "is-waiting"],
    ["receipt_pending", "is-receipt"],
    ["accepted", "is-accepted"],
    ["rejected", "is-rejected"],
    ["unknown", "is-draft"],
    ["constructor", "is-draft"],
  ])("maps %s to %s", (status, expected) => {
    expect(getStatusPillClass(status)).toBe(expected);
  });

  it("keeps Persian status labels", () => {
    expect(translateTeamStatus("waiting_for_payment")).toBe("در انتظار پرداخت");
  });

  it("treats inherited object keys as unknown statuses", () => {
    expect(translateTeamStatus("constructor")).toBe("constructor");
    expect(getUserRegistrationStatus({
      status: "constructor", id: "1", name: "", description: "", creator_id: 1, members: [],
    })).toEqual({ text: "نامشخص", color: "is-draft" });
  });

  it("returns a design pill class for unregistered users", () => {
    expect(getUserRegistrationStatus(null)).toEqual({
      text: "ثبت‌نام نشده",
      color: "is-rejected",
    });
  });
});
