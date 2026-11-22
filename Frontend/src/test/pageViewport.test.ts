import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const globalStyles = readFileSync(
  resolve(process.cwd(), "src/styles/institutional-navy.css"),
  "utf8",
);

describe("global page canvas", () => {
  it("keeps the body background covering a viewport taller than its content", () => {
    const bodyRule = globalStyles.match(/body\s*\{([^}]*)\}/)?.[1] ?? "";

    expect(bodyRule).toMatch(/min-height:\s*100vh\s*;/);
  });
});
