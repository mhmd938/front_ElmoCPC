// @vitest-environment node

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Admin receipt modal copy", () => {
  it("asks a neutral confirmation question", () => {
    const source = readFileSync(
      new URL("../Admin.tsx", import.meta.url),
      "utf8"
    );

    expect(source).toContain("آیا از تایید یا رد فیش پرداخت تیم");
    expect(source).not.toContain('selectedReceipt.approved ? "تایید" : "رد"');
  });
});
