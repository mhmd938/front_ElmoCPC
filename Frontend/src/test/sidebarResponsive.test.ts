import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postcss, { type Declaration, type Rule } from "postcss";
import { describe, expect, it } from "vitest";

const stylesheet = postcss.parse(
  readFileSync(resolve(process.cwd(), "src/styles/institutional-navy.css"), "utf8"),
);

function responsiveSidebarRule(selector: string): Rule | undefined {
  let match: Rule | undefined;

  stylesheet.walkAtRules("media", (media) => {
    if (!media.params.includes("max-width: 900px")) return;
    media.walkRules(selector, (rule) => {
      match = rule;
    });
  });

  return match;
}

function declaration(rule: Rule | undefined, property: string) {
  return rule?.nodes
    .filter((node): node is Declaration => node.type === "decl")
    .find((node) => node.prop === property)?.value;
}

describe("responsive dashboard sidebar", () => {
  it("keeps a compact rail visible when collapsed", () => {
    expect(declaration(responsiveSidebarRule(".sidebar:not(.is-collapsed)"), "transform")).toBe(
      "translateX(0)",
    );
    expect(declaration(responsiveSidebarRule(".sidebar.is-collapsed"), "transform")).toBe(
      "translateX(0)",
    );
    expect(declaration(responsiveSidebarRule(".sidebar.is-collapsed"), "width")).toBe(
      "var(--sidebar-w-collapsed)",
    );
    expect(
      declaration(responsiveSidebarRule(".with-sidebar.is-collapsed"), "padding-inline-start"),
    ).toBe("var(--sidebar-w-collapsed)");
  });
});
