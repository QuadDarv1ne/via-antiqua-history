import { describe, it, expect, beforeEach } from "vitest";
import {
  QUIZ_STORAGE_KEY,
  loadQuizState,
  saveQuizState,
  clearQuizState,
} from "@/lib/quiz-storage";

describe("quiz-storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and loads a valid state", () => {
    const state = { current: 3, answers: [0, null, 2, 1], finished: false };
    saveQuizState(state);
    expect(loadQuizState(4)).toEqual(state);
  });

  it("returns null when nothing is stored", () => {
    expect(loadQuizState(4)).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    localStorage.setItem(QUIZ_STORAGE_KEY, "{not json");
    expect(loadQuizState(4)).toBeNull();
  });

  it("returns null for wrong answer array length", () => {
    localStorage.setItem(
      QUIZ_STORAGE_KEY,
      JSON.stringify({ current: 0, answers: [1, 2], finished: false }),
    );
    expect(loadQuizState(4)).toBeNull();
  });

  it("sanitizes non-integer answers to null", () => {
    localStorage.setItem(
      QUIZ_STORAGE_KEY,
      JSON.stringify({
        current: 0,
        answers: [0, "2", 4.5, { a: 1 }, null],
        finished: false,
      }),
    );
    expect(loadQuizState(5)).toEqual({
      current: 0,
      answers: [0, null, null, null, null],
      finished: false,
    });
  });

  it("clamps out-of-range current to 0", () => {
    localStorage.setItem(
      QUIZ_STORAGE_KEY,
      JSON.stringify({
        current: 999,
        answers: [null, null],
        finished: false,
      }),
    );
    expect(loadQuizState(2)).toEqual({
      current: 0,
      answers: [null, null],
      finished: false,
    });
  });

  it("returns null for non-object payloads", () => {
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify([1, 2, 3]));
    expect(loadQuizState(3)).toBeNull();
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(42));
    expect(loadQuizState(3)).toBeNull();
  });

  it("returns null for invalid question count", () => {
    localStorage.setItem(
      QUIZ_STORAGE_KEY,
      JSON.stringify({ current: 0, answers: [], finished: false }),
    );
    expect(loadQuizState(0)).toBeNull();
    expect(loadQuizState(2.5)).toBeNull();
  });

  it("clearQuizState removes the stored state", () => {
    saveQuizState({ current: 1, answers: [0], finished: true });
    clearQuizState();
    expect(loadQuizState(1)).toBeNull();
  });

  it("sanitizes answers beyond the per-question option count", () => {
    // Ответ 3 валиден по общему числу вопросов (4), но в вопросе 0 только
    // 2 варианта — повреждённый/устаревший localStorage не должен выглядеть
    // «отвеченным» без выделенного варианта
    localStorage.setItem(
      QUIZ_STORAGE_KEY,
      JSON.stringify({
        current: 0,
        answers: [3, 1, 2, 0],
        finished: false,
      }),
    );
    expect(loadQuizState(4, [2, 3, 4, 1])).toEqual({
      current: 0,
      answers: [null, 1, 2, 0],
      finished: false,
    });
  });

  it("keeps legacy behavior when option counts are omitted", () => {
    localStorage.setItem(
      QUIZ_STORAGE_KEY,
      JSON.stringify({
        current: 0,
        answers: [3, 1, 0, 2],
        finished: false,
      }),
    );
    expect(loadQuizState(4)).toEqual({
      current: 0,
      answers: [3, 1, 0, 2],
      finished: false,
    });
  });
});
