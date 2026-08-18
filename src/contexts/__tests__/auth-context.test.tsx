import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

const USER_DATA = { id: "u1", email: "a@b.c", name: "A" };

describe("AuthContext", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it("HTTP 5xx от /api/auth/me не сбрасывает пользователя", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ ok: true, data: USER_DATA }))
      .mockResolvedValueOnce(jsonResponse({ ok: false, error: "boom" }, 500));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user?.id).toBe("u1");

    await act(async () => {
      await result.current.refresh();
    });

    // 5xx — транзиентный сбой сервера, а не «нет сессии»: пользователь остаётся
    expect(result.current.user?.id).toBe("u1");
  });

  it("logout при сетевой ошибке не сбрасывает пользователя (сессия жива)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ ok: true, data: USER_DATA }))
      .mockRejectedValueOnce(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user?.id).toBe("u1"));

    await act(async () => {
      await result.current.logout();
    });

    // Сервер не инвалидировал сессию — состояние не сбрасываем,
    // иначе пользователь «вернётся» при следующем refresh
    expect(result.current.user?.id).toBe("u1");
  });

  it("успешный logout сбрасывает пользователя", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ ok: true, data: USER_DATA }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, data: null }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user?.id).toBe("u1"));

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
  });
});