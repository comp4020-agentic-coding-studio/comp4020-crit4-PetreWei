import { describe, expect, it } from "vitest";
import astroConfig from "../astro.config.ts";
import { LOCALES, ORDER, TRANSLATED_KEYS, type Locale } from "../src/i18n/strings.ts";
import { pageNamed, shipped } from "./built-site.ts";

// The page ships in English and Simplified Chinese as two real documents, each
// declaring one language. Half of this reads the copy table directly --- the
// only place a string missing from one language shows up before it ships --- and
// half reads the BUILT site, because what a reader and a crawler get is the
// HTML, not the source.
//
// The load-bearing test here is "the instrument survives translation": main.ts
// finds the stage, hint, meter and panel by id and reads no copy at all, so a
// translation should not be able to break playability. That only stays true if
// something checks it.
const HAN = /\p{Script=Han}/u;

/**
 * The relative hrefs in the table, resolved to the file the build emits. Read
 * from the config rather than restated: `build.format: "file"` is why a page
 * ships as `name.html` instead of `name/index.html`, and flipping it should red
 * this test rather than silently change what it goes looking for.
 */
const BUILD_FORMAT = astroConfig.build?.format ?? "directory";

function fileFor(href: string): string {
  const slug = href.replace(/^\.\//, "");
  if (slug === "") return "index.html";
  return BUILD_FORMAT === "file" ? slug : `${slug.replace(/\.html$/, "")}/index.html`;
}

// Derived from astro.config.ts rather than restated, so this can't certify a
// stale origin after a repo rename. The paths a *scraper* reads have to be
// absolute --- Open Graph requires it and a relative hreflang is ignored --- and
// a relative one of either is invisible from the page itself, so the check has
// to be here.
const SITE_ROOT = new URL(String(astroConfig.base).replace(/\/?$/, "/"), astroConfig.site).href;
const absolute = (href: string) => new URL(href.replace(/^\.\//, ""), SITE_ROOT).href;

function docFor(code: Locale): Document {
  const name = fileFor(LOCALES[code].href);
  const doc = pageNamed(name);
  if (!doc) throw new Error(`${name} was not built`);
  return doc;
}

describe("i18n: the copy table", () => {
  it("lists every locale exactly once, in a stable order", () => {
    expect([...ORDER].sort()).toEqual(Object.keys(LOCALES).sort());
    expect(new Set(ORDER).size).toBe(ORDER.length);
  });

  for (const code of ORDER) {
    const strings = LOCALES[code];

    describe(code, () => {
      it("leaves nothing blank", () => {
        for (const [key, value] of Object.entries(strings)) {
          const parts = Array.isArray(value) ? value : [value];
          expect(parts.length, `${key} is empty`).toBeGreaterThan(0);
          for (const part of parts) {
            expect(String(part).trim(), `${code}.${key} is blank`).not.toBe("");
          }
        }
      });

      it("declares a language tag matching its own key", () => {
        expect(strings.lang.split("-")[0]).toBe(code);
      });

      it("has the same number of panel paragraphs as every other locale", () => {
        expect(strings.panel.length).toBe(LOCALES[ORDER[0]!]!.panel.length);
      });
    });
  }

  it("gives each locale its own page, card and language tag", () => {
    for (const field of ["lang", "href", "card"] as const) {
      const values = ORDER.map((code) => LOCALES[code][field]);
      expect(new Set(values).size, `two locales share the same ${field}`).toBe(values.length);
    }
  });

  it("actually translates every string a reader reads", () => {
    // A key added to English and forgotten in Chinese leaves the two identical.
    // meterUnit is the deliberate exception and is not in TRANSLATED_KEYS: Hz
    // is Hz.
    for (const key of TRANSLATED_KEYS) {
      expect(LOCALES.zh[key], `zh.${key} is still the English string`).not.toBe(LOCALES.en[key]);
    }
    for (const paragraph of LOCALES.en.panel) {
      expect(LOCALES.zh.panel, "a panel paragraph is still in English").not.toContain(paragraph);
    }
  });

  it("writes the Chinese copy in Chinese", () => {
    for (const key of TRANSLATED_KEYS) {
      expect(HAN.test(LOCALES.zh[key]), `zh.${key} contains no Han characters`).toBe(true);
    }
    for (const paragraph of LOCALES.zh.panel) {
      expect(HAN.test(paragraph)).toBe(true);
    }
  });

  it("keeps Hz as Hz", () => {
    // Not an oversight: the unit is written Hz in both, and the parity check
    // above would otherwise be trivially satisfiable by translating it.
    expect(LOCALES.zh.meterUnit).toBe(LOCALES.en.meterUnit);
  });
});

describe("i18n: the built site", () => {
  for (const code of ORDER) {
    const strings = LOCALES[code];

    describe(fileFor(strings.href), () => {
      it("was built", () => {
        expect(shipped, `${fileFor(strings.href)} is missing from dist`).toContain(
          fileFor(strings.href),
        );
      });

      it("declares this page's language, and only this one", () => {
        expect(docFor(code).documentElement.getAttribute("lang")).toBe(strings.lang);
      });

      it("serves this language's own title and description", () => {
        const doc = docFor(code);
        expect(doc.title).toBe(strings.title);
        expect(doc.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
          strings.description,
        );
      });

      it("serves this language's own link card, absolutely, and ships the file", () => {
        const card = docFor(code)
          .querySelector('meta[property="og:image"]')
          ?.getAttribute("content");
        // Absolute: a scraper fetches og:image with no page to resolve it
        // against, so a relative URL means no card at all --- and a page with
        // no card renders a shared link as a bare row of text.
        expect(card).toBe(absolute(strings.card));
        // ...and the file behind it exists, which the tag alone cannot see.
        expect(shipped, `${strings.card} is referenced but not shipped`).toContain(
          strings.card.replace(/^\.\//, ""),
        );
      });

      it("points a crawler at every language, including itself", () => {
        const alternates = [...docFor(code).querySelectorAll('link[rel="alternate"]')].map(
          (link) => [link.getAttribute("hreflang"), link.getAttribute("href")].join(" "),
        );
        for (const other of ORDER) {
          expect(alternates).toContain(`${LOCALES[other].lang} ${absolute(LOCALES[other].href)}`);
        }
      });

      it("leaves nothing a scraper reads relative", () => {
        // The general form of the two failures above: anything consumed away
        // from the page must be fully qualified. Belt and braces on purpose ---
        // this one fires on a *new* tag added relative, not just these two.
        const doc = docFor(code);
        const offsite = [
          ...[...doc.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]')].map(
            (meta) => [
              meta.getAttribute("property") ?? meta.getAttribute("name"),
              meta.getAttribute("content"),
            ],
          ),
          ...[...doc.querySelectorAll('link[rel="alternate"], link[rel="canonical"]')].map(
            (link) => [link.getAttribute("rel"), link.getAttribute("href")],
          ),
        ].filter(([, value]) => value?.startsWith(".") || value?.startsWith("/"));
        expect(offsite, "a scraper cannot resolve a relative URL").toEqual([]);
      });

      it("offers a real link to every other language", () => {
        // A real <a href> rather than a scripted swap: reachable by Tab, works
        // with JS off, and gives each language its own address to share.
        const hrefs = [...docFor(code).querySelectorAll("a[href]")].map((a) =>
          a.getAttribute("href"),
        );
        for (const other of ORDER) {
          if (other === code) continue;
          expect(hrefs, `no link from ${code} to ${other}`).toContain(LOCALES[other].href);
        }
      });

      it("names the other language in that language, and marks it as such", () => {
        for (const other of ORDER) {
          if (other === code) continue;
          const link = docFor(code).querySelector(`a[href="${LOCALES[other].href}"]`);
          expect(link?.textContent?.trim()).toBe(LOCALES[other].endonym);
          // Without lang on the anchor a screen reader reads the endonym in the
          // wrong voice --- the one case on the page where the two disagree.
          expect(link?.getAttribute("lang")).toBe(LOCALES[other].lang);
        }
      });

      it("still gives the script every hook it looks for", () => {
        // main.ts addresses all of these by id or class and reads no copy, so
        // translation must not be able to cost the page its instrument.
        const doc = docFor(code);
        for (const selector of [
          '#stage[role="application"][tabindex="0"]',
          "#stage[aria-label]",
          "#hint",
          '#cabinet[aria-hidden="true"]',
          ".nameplate",
          ".meter",
          "#meter-value",
          "#info-toggle[aria-controls='info-panel'][aria-expanded='false']",
          "#info-panel[hidden]",
        ]) {
          expect(doc.querySelector(selector), `${selector} is missing`).not.toBeNull();
        }
      });

      it("reads out the same instructions it shows a screen reader", () => {
        const doc = docFor(code);
        expect(doc.querySelector("#stage")?.getAttribute("aria-label")).toBe(strings.stageLabel);
        expect(doc.querySelector("#hint")?.textContent?.trim()).toBe(strings.hint);
        expect(doc.querySelector("#info-toggle")?.textContent?.trim()).toBe(strings.infoToggle);
      });

      it("keeps the nameplate's Latin stamping", () => {
        // Deliberate, not an omission: a nameplate is a plate stamped by
        // whoever built the instrument, and a real one carries the maker's
        // script wherever it is played. Asserted so translating it later has to
        // be a decision rather than a reflex.
        expect(docFor(code).querySelector(".nameplate")?.textContent?.trim()).toBe("THEREMIN");
      });
    });
  }

  it("builds every language from the same markup", () => {
    // Both pages render one component, so their element sequences must match
    // exactly --- only the text inside differs. This is what stops a change
    // landing on one language and not the other.
    const shapes = ORDER.map((code) =>
      [...docFor(code).querySelectorAll("*")].map((el) => el.tagName).join(" "),
    );
    for (const shape of shapes) {
      expect(shape, "the languages have drifted apart structurally").toBe(shapes[0]);
    }
  });
});
