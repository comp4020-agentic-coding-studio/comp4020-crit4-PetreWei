import { describe, expect, it } from "vitest";
import { pages } from "./built-site.ts";

// The invariants run against the BUILT site, so they check what actually
// ships, not the source. Run `pnpm build` first (the `check` script does).
// These hold for any good website, whatever the week's brief asks — the
// week-specific contracts live in your own spec/*.test.ts alongside this file.
// Reading dist/ lives in ./built-site.ts, shared with the other spec files.

describe("invariants: every page", () => {
  it("built at least one page", () => {
    expect(pages.length).toBeGreaterThan(0);
  });

  for (const { name, doc } of pages) {
    describe(name, () => {
      it("declares its language", () => {
        expect(doc.documentElement.getAttribute("lang")).toBeTruthy();
      });

      it("has a real title", () => {
        expect(doc.title.trim()).not.toBe("");
      });

      it("has a meta description", () => {
        const description = doc
          .querySelector('meta[name="description"]')
          ?.getAttribute("content")
          ?.trim();
        expect(
          description,
          "a search result and a link preview both read this page's description",
        ).toBeTruthy();
      });

      it("has an og:image card", () => {
        // presence only: whether the path resolves shows up in the gallery
        const card = doc
          .querySelector('meta[property="og:image"]')
          ?.getAttribute("content")
          ?.trim();
        expect(
          card,
          "with no card image, a shared link renders as a bare row of text",
        ).toBeTruthy();
      });

      it("has a mobile viewport", () => {
        expect(doc.querySelector('meta[name="viewport"]')).toBeTruthy();
      });

      it("has a navigation landmark", () => {
        expect(doc.querySelector("nav")).toBeTruthy();
      });

      it("has exactly one top-level heading", () => {
        expect(doc.querySelectorAll("h1").length).toBe(1);
      });

      it("gives every image alt text", () => {
        for (const img of doc.querySelectorAll("img")) {
          expect(
            img.hasAttribute("alt"),
            `<img src="${img.getAttribute("src")}"> needs alt text`,
          ).toBe(true);
        }
      });
    });
  }
});

describe("invariants: home page", () => {
  const home = pages.find(({ name }) => name === "index.html");

  it("exists", () => {
    expect(home).toBeTruthy();
  });
});
