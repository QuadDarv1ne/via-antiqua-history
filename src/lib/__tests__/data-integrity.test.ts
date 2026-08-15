import { describe, it, expect } from "vitest";
import {
  allRegions,
  glossary,
  persons,
  mapRegions,
  wonders,
  architecturalOrders,
  epochs,
  timeline,
  quizQuestions,
  comparisonRows,
  sources,
  authorAnalysis,
  FAQ_DATA,
} from "@/lib/history-data";
import { AUTHOR_NAME, REGION_KEYS } from "@/lib/constants";

describe("search-index data completeness", () => {
  it("all regions have valid icon values", () => {
    const validIcons = ["temple", "crown", "tablets", "amphora"];
    for (const region of allRegions) {
      expect(validIcons).toContain(region.icon);
    }
  });

  it("all cities have unique IDs within their region", () => {
    for (const region of allRegions) {
      const ids = new Set<string>();
      for (const city of region.cities) {
        expect(ids.has(city.id)).toBe(false);
        ids.add(city.id);
      }
    }
  });

  it("all landmarks have unique IDs within their city", () => {
    for (const region of allRegions) {
      for (const city of region.cities) {
        const ids = new Set<string>();
        for (const lm of city.landmarks) {
          expect(ids.has(lm.id)).toBe(false);
          ids.add(lm.id);
        }
      }
    }
  });

  it("glossary terms have valid origins", () => {
    const validOrigins = ["greece", "rome", "mesopotamia", "kuban", "general"];
    for (const term of glossary) {
      expect(validOrigins).toContain(term.origin);
    }
  });

  it("persons have valid regions", () => {
    const validRegions = ["greece", "rome", "mesopotamia", "kuban"];
    for (const p of persons) {
      expect(validRegions).toContain(p.region);
    }
  });

  it("wonders have valid regions", () => {
    const validRegions = ["greece", "rome", "mesopotamia", "kuban", "egypt"];
    for (const w of wonders) {
      expect(validRegions).toContain(w.region);
    }
  });

  it("architectural orders have unique IDs", () => {
    const ids = architecturalOrders.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("epochs have valid year ranges", () => {
    for (const e of epochs) {
      expect(e.startYear).toBeLessThanOrEqual(e.endYear);
    }
  });

  it("timeline events are sorted by year", () => {
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i].year).toBeGreaterThanOrEqual(timeline[i - 1].year);
    }
  });

  it("quiz questions have unique IDs", () => {
    const ids = quizQuestions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("quiz covers every region (result screen iterates REGION_KEYS)", () => {
    const covered = new Set(quizQuestions.map((q) => q.region));
    // Квиз-секция на экране результатов обращается к regionStats[key] для
    // каждого REGION_KEYS — отсутствующий регион уронил бы страницу
    for (const key of REGION_KEYS) {
      expect(covered.has(key)).toBe(true);
    }
    // И наоборот: регионов вне REGION_KEYS в квизе быть не должно
    for (const region of covered) {
      expect(REGION_KEYS).toContain(region);
    }
  });

  it("glossary terms have no duplicates", () => {
    const terms = glossary.map((t) => t.term.toLowerCase());
    expect(new Set(terms).size).toBe(terms.length);
  });

  it("persons have unique IDs", () => {
    const ids = persons.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("map regions have unique IDs", () => {
    const ids = mapRegions.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("sources have valid categories", () => {
    const validCategories = ["primary", "literature", "web", "museum"];
    for (const s of sources) {
      expect(validCategories).toContain(s.category);
    }
  });

  it("author analysis sections have unique IDs", () => {
    const ids = authorAnalysis.sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("FAQ questions are unique", () => {
    const questions = FAQ_DATA.map((f) => f.question.toLowerCase());
    expect(new Set(questions).size).toBe(questions.length);
  });

  it("comparison rows have unique criteria", () => {
    const criteria = comparisonRows.map((r) => r.criterion.toLowerCase());
    expect(new Set(criteria).size).toBe(criteria.length);
  });

  it("regions have non-empty description paragraphs", () => {
    for (const region of allRegions) {
      for (const para of region.description) {
        expect(para.trim().length).toBeGreaterThan(50);
      }
    }
  });

  it("cities have non-empty summaries", () => {
    for (const region of allRegions) {
      for (const city of region.cities) {
        expect(city.summary.trim().length).toBeGreaterThan(20);
      }
    }
  });

  it("landmarks have non-empty full descriptions", () => {
    for (const region of allRegions) {
      for (const city of region.cities) {
        for (const lm of city.landmarks) {
          expect(lm.fullDesc.trim().length).toBeGreaterThan(50);
        }
      }
    }
  });

  describe("author consistency", () => {
    it("authorAnalysis.author matches AUTHOR_NAME constant", () => {
      expect(authorAnalysis.author).toBe(AUTHOR_NAME);
    });
  });
});
