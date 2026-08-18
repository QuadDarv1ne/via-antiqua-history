import { describe, it, expect } from "vitest";
import { useInView } from "../use-in-view";
import { renderHook } from "@testing-library/react";

describe("useInView", () => {
  it("returns initial state with inView false", () => {
    const { result } = renderHook(() => useInView());
    expect(result.current.inView).toBe(false);
    expect(result.current.ref).toBeInstanceOf(Object);
  });

  it("uses default options", () => {
    const { result } = renderHook(() => useInView());
    expect(result.current.inView).toBe(false);
  });

  it("returns a ref callback (может привязываться позже монтирования)", () => {
    const { result } = renderHook(() => useInView());
    expect(result.current.ref).toBeDefined();
    expect(typeof result.current.ref).toBe("function");
  });
});
