import { describe, it, expect } from "vitest";
import {
  DEFAULT_SITE_URL,
  SUBSCRIPTION_PRICE,
  REGION_COLORS,
  REGION_LABELS,
  REGION_SHORT,
  FILTER_LABELS,
  PUBLIC_NAV,
  PROTECTED_NAV,
  SITE_NAV,
  FOOTER_NAV,
  SOCIAL_LINKS,
  SITE_NAME,
  SITE_FULL_NAME,
  AUTHOR_NAME,
  AUTHOR_SHORT_NAME,
  REGION_KEYS,
} from "../constants";

describe("constants", () => {
  describe("DEFAULT_SITE_URL", () => {
    it("is a valid URL", () => {
      expect(DEFAULT_SITE_URL).toMatch(/^https?:\/\//);
    });
  });

  describe("SUBSCRIPTION_PRICE", () => {
    it("is a positive number", () => {
      expect(SUBSCRIPTION_PRICE).toBeGreaterThan(0);
    });
  });

  describe("REGION_COLORS", () => {
    it("has entries for all regions", () => {
      expect(REGION_COLORS).toHaveProperty("greece");
      expect(REGION_COLORS).toHaveProperty("rome");
      expect(REGION_COLORS).toHaveProperty("mesopotamia");
      expect(REGION_COLORS).toHaveProperty("kuban");
      expect(REGION_COLORS).toHaveProperty("general");
    });

    it("all values are oklch colors", () => {
      for (const color of Object.values(REGION_COLORS)) {
        expect(color).toMatch(/^oklch\(/);
      }
    });
  });

  describe("REGION_LABELS", () => {
    it("has entries for all regions", () => {
      expect(REGION_LABELS).toHaveProperty("greece");
      expect(REGION_LABELS).toHaveProperty("rome");
      expect(REGION_LABELS).toHaveProperty("mesopotamia");
      expect(REGION_LABELS).toHaveProperty("kuban");
      expect(REGION_LABELS).toHaveProperty("general");
    });

    it("all values are non-empty strings", () => {
      for (const label of Object.values(REGION_LABELS)) {
        expect(label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("REGION_SHORT", () => {
    it("has entries for all regions", () => {
      expect(REGION_SHORT).toHaveProperty("greece");
      expect(REGION_SHORT).toHaveProperty("rome");
      expect(REGION_SHORT).toHaveProperty("mesopotamia");
      expect(REGION_SHORT).toHaveProperty("kuban");
      expect(REGION_SHORT).toHaveProperty("general");
    });

    it("all values are 2-character strings", () => {
      for (const short of Object.values(REGION_SHORT)) {
        expect(short.length).toBe(2);
      }
    });
  });

  describe("FILTER_LABELS", () => {
    it('has entries for all regions plus "all"', () => {
      expect(FILTER_LABELS).toHaveProperty("all");
      expect(FILTER_LABELS).toHaveProperty("greece");
      expect(FILTER_LABELS).toHaveProperty("rome");
      expect(FILTER_LABELS).toHaveProperty("mesopotamia");
      expect(FILTER_LABELS).toHaveProperty("kuban");
      expect(FILTER_LABELS).toHaveProperty("general");
    });
  });

  describe("navigation", () => {
    it("PUBLIC_NAV has items with href and label", () => {
      for (const item of PUBLIC_NAV) {
        expect(item.href).toMatch(/^#/);
        expect(item.label.length).toBeGreaterThan(0);
      }
    });

    it("PROTECTED_NAV has items with href and label", () => {
      for (const item of PROTECTED_NAV) {
        expect(item.href).toMatch(/^#/);
        expect(item.label.length).toBeGreaterThan(0);
      }
    });

    it("SITE_NAV is union of PUBLIC_NAV and PROTECTED_NAV", () => {
      expect(SITE_NAV.length).toBe(PUBLIC_NAV.length + PROTECTED_NAV.length);
    });

    it("FOOTER_NAV includes all nav items", () => {
      expect(FOOTER_NAV.length).toBe(SITE_NAV.length);
    });
  });

  describe("SOCIAL_LINKS", () => {
    it("has at least one link", () => {
      expect(SOCIAL_LINKS.length).toBeGreaterThan(0);
    });

    it("each link has href, label, and title", () => {
      for (const link of SOCIAL_LINKS) {
        expect(link.href).toMatch(/^https?:\/\//);
        expect(link.label.length).toBeGreaterThan(0);
        expect(link.title.length).toBeGreaterThan(0);
      }
    });

    it("has unique labels", () => {
      const labels = SOCIAL_LINKS.map((l) => l.label.toLowerCase());
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("has no duplicate hrefs", () => {
      const hrefs = SOCIAL_LINKS.map((l) => l.href);
      expect(new Set(hrefs).size).toBe(hrefs.length);
    });
  });

  describe("region consistency", () => {
    it("REGION_COLORS, REGION_LABELS, REGION_SHORT have same keys", () => {
      const colorKeys = Object.keys(REGION_COLORS);
      const labelKeys = Object.keys(REGION_LABELS);
      const shortKeys = Object.keys(REGION_SHORT);
      expect(colorKeys).toEqual(labelKeys);
      expect(colorKeys).toEqual(shortKeys);
    });

    it("FILTER_LABELS includes all region keys", () => {
      for (const key of Object.keys(REGION_COLORS)) {
        expect(FILTER_LABELS).toHaveProperty(key);
      }
    });
  });

  describe("navigation consistency", () => {
    it("no duplicate hrefs in SITE_NAV", () => {
      const hrefs = SITE_NAV.map((n) => n.href);
      expect(new Set(hrefs).size).toBe(hrefs.length);
    });

    it("all nav items have unique labels", () => {
      const labels = SITE_NAV.map((n) => n.label.toLowerCase());
      expect(new Set(labels).size).toBe(labels.length);
    });
  });

  describe("site identity", () => {
    it("SITE_NAME is a non-empty string", () => {
      expect(typeof SITE_NAME).toBe("string");
      expect(SITE_NAME.length).toBeGreaterThan(0);
    });

    it("SITE_FULL_NAME is a non-empty string", () => {
      expect(typeof SITE_FULL_NAME).toBe("string");
      expect(SITE_FULL_NAME.length).toBeGreaterThan(0);
    });

    it("AUTHOR_NAME is a non-empty string", () => {
      expect(typeof AUTHOR_NAME).toBe("string");
      expect(AUTHOR_NAME.length).toBeGreaterThan(0);
    });

    it("AUTHOR_SHORT_NAME is a non-empty string", () => {
      expect(typeof AUTHOR_SHORT_NAME).toBe("string");
      expect(AUTHOR_SHORT_NAME.length).toBeGreaterThan(0);
    });
  });

  describe("REGION_KEYS", () => {
    it("contains exactly greece, rome, mesopotamia, kuban", () => {
      expect(REGION_KEYS).toEqual(["greece", "rome", "mesopotamia", "kuban"]);
    });

    it("does not include 'general'", () => {
      expect(REGION_KEYS).not.toContain("general");
    });

    it("every key has a corresponding REGION_LABELS entry", () => {
      for (const key of REGION_KEYS) {
        expect(REGION_LABELS).toHaveProperty(key);
      }
    });
  });
});
