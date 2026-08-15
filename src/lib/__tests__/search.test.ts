import { describe, it, expect } from "vitest";
import {
  buildSearchIndex,
  searchItems,
  searchIndex,
  findHighlightRanges,
  normalizeQuery,
} from "@/lib/search";
import {
  allRegions,
  glossary,
  persons,
  mapRegions,
  wonders,
  architecturalOrders,
  epochs,
  timeline,
  additionalTimelineEvents,
  authorAnalysis,
  FAQ_DATA,
} from "@/lib/history-data";

describe("search index", () => {
  it("covers all content types", () => {
    const index = buildSearchIndex();
    const types = new Set(index.map((i) => i.type));
    for (const t of [
      "city",
      "landmark",
      "term",
      "person",
      "map-city",
      "wonder",
      "order",
      "epoch",
      "event",
      "analysis",
      "faq",
    ]) {
      expect(types).toContain(t);
    }
  });

  it("includes every city and landmark", () => {
    const index = buildSearchIndex();
    const cities = new Set(
      index.filter((i) => i.type === "city").map((i) => i.title),
    );
    for (const r of allRegions) {
      for (const c of r.cities) {
        expect(cities).toContain(c.name);
      }
    }
    const landmarks = new Set(
      index.filter((i) => i.type === "landmark").map((i) => i.title),
    );
    for (const r of allRegions) {
      for (const c of r.cities) {
        for (const l of c.landmarks) {
          expect(landmarks).toContain(l.name);
        }
      }
    }
  });

  it("includes every wonder, order, epoch and person", () => {
    const index = buildSearchIndex();
    const wondersTitles = new Set(
      index.filter((i) => i.type === "wonder").map((i) => i.title),
    );
    for (const w of wonders) expect(wondersTitles).toContain(w.name);

    const ordersTitles = new Set(
      index.filter((i) => i.type === "order").map((i) => i.title),
    );
    for (const o of architecturalOrders) expect(ordersTitles).toContain(o.name);

    const epochsTitles = new Set(
      index.filter((i) => i.type === "epoch").map((i) => i.title),
    );
    for (const e of epochs) expect(epochsTitles).toContain(e.name);

    const personsTitles = new Set(
      index.filter((i) => i.type === "person").map((i) => i.title),
    );
    for (const p of persons) expect(personsTitles).toContain(p.name);
  });

  it("includes every glossary term and map city", () => {
    const index = buildSearchIndex();
    const terms = new Set(
      index.filter((i) => i.type === "term").map((i) => i.title),
    );
    for (const t of glossary) expect(terms).toContain(t.term);

    const mapCities = new Set(
      index.filter((i) => i.type === "map-city").map((i) => i.title),
    );
    for (const m of mapRegions) expect(mapCities).toContain(m.name);
  });

  it("includes every timeline event region and analysis section", () => {
    const index = buildSearchIndex();
    const events = index.filter((i) => i.type === "event");
    const allEvents = [...timeline, ...additionalTimelineEvents];
    const expectedEventCount = allEvents.reduce(
      (acc, ev) =>
        acc +
        (ev.greece ? 1 : 0) +
        (ev.rome ? 1 : 0) +
        (ev.mesopotamia ? 1 : 0) +
        (ev.kuban ? 1 : 0),
      0,
    );
    expect(events.length).toBe(expectedEventCount);
    expect(events.length).toBeGreaterThan(0);

    // Дополнительные события (Марафон, Коринф, Акциум) тоже ищутся
    expect(events.some((i) => i.subtitle.includes("Марафон"))).toBe(true);
    expect(events.some((i) => i.subtitle.includes("Карфаген"))).toBe(true);
    expect(events.some((i) => i.subtitle.includes("Акциум"))).toBe(true);

    const analysisTitles = new Set(
      index.filter((i) => i.type === "analysis").map((i) => i.title),
    );
    for (const s of authorAnalysis.sections) {
      expect(analysisTitles).toContain(s.title);
    }
  });

  it("has unique keys", () => {
    const keys = buildSearchIndex().map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("includes every FAQ question and answers search", () => {
    const index = buildSearchIndex();
    const faqItems = index.filter((i) => i.type === "faq");
    expect(faqItems.length).toBe(FAQ_DATA.length);
    expect(faqItems.length).toBeGreaterThan(0);
    // Заголовок FAQ — это вопрос целиком, а не его обрывок
    const titles = new Set(faqItems.map((i) => i.title));
    for (const f of FAQ_DATA) expect(titles).toContain(f.question);
    // Все FAQ-записи ведут на секцию #faq
    expect(faqItems.every((i) => i.href === "#faq")).toBe(true);
    // Поиск находит ответ в подзаголовке («Хаммурапи» из текста ответа)
    const byAnswer = searchItems(index, "хаммурапи");
    expect(byAnswer.some((i) => i.type === "faq")).toBe(true);
  });

  it("points hrefs to existing sections", () => {
    const validHrefs = new Set([
      "#greece",
      "#rome",
      "#mesopotamia",
      "#kuban",
      "#persons",
      "#wonders",
      "#orders",
      "#epochs",
      "#timeline",
      "#map",
      "#glossary",
      "#analysis",
      "#faq",
    ]);
    for (const item of buildSearchIndex()) {
      expect(validHrefs).toContain(item.href);
    }
  });

  it("has non-empty titles and subtitles", () => {
    for (const item of buildSearchIndex()) {
      expect(item.title.trim().length).toBeGreaterThan(0);
      expect(item.subtitle.trim().length).toBeGreaterThan(0);
    }
  });

  it("searchItems matches title case-insensitively", () => {
    const index = buildSearchIndex();
    const byLower = searchItems(index, "парфенон");
    const byUpper = searchItems(index, "ПАРФЕНОН");
    expect(byLower.length).toBeGreaterThan(0);
    expect(byUpper.length).toBe(byLower.length);
  });

  it("searchItems matches subtitle content", () => {
    const index = buildSearchIndex();
    // «зиккурат» встречается в определениях терминов и описаниях
    const hits = searchItems(index, "зиккурат");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("searchItems matches multi-word queries across title+subtitle", () => {
    const index = buildSearchIndex();
    // Все слова запроса должны встретиться (в любом поле) — «храм» в заголовке,
    // «артемиды» тоже в заголовке/подзаголовке; по одному слову такого результата нет.
    const hits = searchItems(index, "храм артемиды");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.title.includes("Храм Артемиды"))).toBe(true);
    // Отсутствующее слово отбрасывает результат целиком
    const none = searchItems(index, "храм артемиды сфинкс");
    expect(none).toEqual([]);
  });

  it("ranks title matches above subtitle matches", () => {
    const index = buildSearchIndex();
    // Город «Рим» — точное совпадение заголовка; «рим» также встречается
    // в подзаголовках других записей, но они должны идти позже.
    const hits = searchItems(index, "рим");
    expect(hits[0].title).toBe("Рим");
    expect(hits[0].type).toBe("city");
  });

  it("ranks exact title match first", () => {
    const index = buildSearchIndex();
    // «Эллинизм» — точное совпадение заголовка и у эпохи, и у термина глоссария:
    // обе записи должны опередить любые совпадения по подзаголовку.
    const hits = searchItems(index, "Эллинизм");
    expect(hits[0].title).toBe("Эллинизм");
    expect(hits.some((h) => h.type === "epoch" && h.title === "Эллинизм")).toBe(
      true,
    );
    const firstNonTitle = hits.findIndex(
      (h) => h.title.toLowerCase() !== "эллинизм",
    );
    const firstTitleOnly = hits.findIndex(
      (h) => h.title.toLowerCase() !== "эллинизм" && h.type === "epoch",
    );
    expect(firstTitleOnly).toBe(-1);
    expect(firstNonTitle).toBeGreaterThan(0);
  });

  it("searchIndex reports the full total even when capped", () => {
    const index = buildSearchIndex();
    const { items, total } = searchIndex(index, "а", 5);
    expect(items.length).toBeLessThanOrEqual(5);
    expect(total).toBeGreaterThan(items.length);
  });

  it("searchIndex returns empty result for empty query", () => {
    expect(searchIndex(buildSearchIndex(), "   ")).toEqual({
      items: [],
      total: 0,
    });
  });

  it("searchItems limits results", () => {
    const index = buildSearchIndex();
    const hits = searchItems(index, "а", 5);
    expect(hits.length).toBeLessThanOrEqual(5);
  });

  it("searchItems returns [] for empty query", () => {
    expect(searchItems(buildSearchIndex(), "   ")).toEqual([]);
  });

  it("searchItems returns [] when nothing matches", () => {
    expect(searchItems(buildSearchIndex(), "zqxwv-no-such-thing")).toEqual([]);
  });

  it("normalizeQuery lowercases and folds ё to е", () => {
    expect(normalizeQuery("Мёд И Молоко")).toBe("мед и молоко");
    expect(normalizeQuery("  ПАРФЕНОН  ")).toBe("парфенон");
  });

  it("searchItems matches ё/е interchangeably", () => {
    const index = buildSearchIndex();
    // В глоссарии есть «изобретённая» — «изобретенная» должна найти ту же запись
    const withYo = searchItems(index, "изобретённая");
    const withE = searchItems(index, "изобретенная");
    expect(withYo.length).toBeGreaterThan(0);
    expect(withE.length).toBe(withYo.length);
  });
});

describe("findHighlightRanges", () => {
  it("returns [] for empty query", () => {
    expect(findHighlightRanges("Парфенон", "   ")).toEqual([]);
  });

  it("finds all case-insensitive occurrences in order", () => {
    // «Акрополь в Афинах»: А(0), А(11), а(15)
    expect(findHighlightRanges("Акрополь в Афинах", "а")).toEqual([
      [0, 1],
      [11, 12],
      [15, 16],
    ]);
  });

  it("matches ё/е regardless of the letter used in query", () => {
    // «мёд» нормализуется в «мед» — индексы совпадают с оригинальным текстом
    expect(findHighlightRanges("Мёд и молоко", "мед")).toEqual([[0, 3]]);
    expect(findHighlightRanges("Мёд и молоко", "мёд")).toEqual([[0, 3]]);
  });

  it("matches multi-word query tokens", () => {
    expect(findHighlightRanges("Храм Артемиды Эфесской", "храм артемиды")).toEqual([
      [0, 4],
      [5, 13],
    ]);
  });

  it("merges overlapping ranges", () => {
    // «храм» даёт [0,4], вложенный в него «рам» — [1,4]; пересечение схлопывается
    expect(findHighlightRanges("Храмида", "храм рам")).toEqual([[0, 4]]);
  });

  it("returns [] when nothing matches", () => {
    expect(findHighlightRanges("Акрополь", "зиккурат")).toEqual([]);
  });
});
