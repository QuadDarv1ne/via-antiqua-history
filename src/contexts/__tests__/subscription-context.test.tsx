import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  SubscriptionProvider,
  useSubscriptionContext,
} from "@/contexts/SubscriptionContext";

const AUTH_STATE: {
  user: { id: string } | null;
  loading: boolean;
} = {
  user: { id: "u1" },
  loading: false,
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => AUTH_STATE,
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SubscriptionProvider>{children}</SubscriptionProvider>
);

function mockFetchStatus(data: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: async () => ({ ok, data }),
  });
}

beforeEach(() => {
  AUTH_STATE.user = { id: "u1" };
  AUTH_STATE.loading = false;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SubscriptionContext", () => {
  it("делает ровно один запрос статуса на пользователя", async () => {
    const fetchMock = mockFetchStatus({
      status: "active",
      amount: 999,
      startedAt: "2026-08-01 00:00:00",
      expiresAt: "2026-09-01 00:00:00",
      daysLeft: 20,
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useSubscriptionContext(), { wrapper });

    // начальное состояние — загрузка
    expect(result.current.subscriptionLoading).toBe(true);
    expect(result.current.hasSubscription).toBe(false);

    await act(async () => {});

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.subscriptionLoading).toBe(false);
    expect(result.current.hasSubscription).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/subscription/status");
  });

  it("при отсутствии пользователя не делает запрос и не блокирует загрузку", async () => {
    AUTH_STATE.user = null;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useSubscriptionContext(), { wrapper });

    await act(async () => {});

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.subscriptionLoading).toBe(false);
    expect(result.current.hasSubscription).toBe(false);
  });

  it("refresh() повторно запрашивает статус", async () => {
    const fetchMock = mockFetchStatus(null);
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useSubscriptionContext(), { wrapper });

    await act(async () => {});
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.refresh();
    });
    await act(async () => {});

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("ошибка сети не ломает состояние: hasSubscription=false", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useSubscriptionContext(), { wrapper });

    await act(async () => {});

    expect(result.current.subscriptionLoading).toBe(false);
    expect(result.current.hasSubscription).toBe(false);
  });

  it("отменённая, но не истёкшая подписка даёт доступ (до конца периода)", async () => {
    const fetchMock = mockFetchStatus({
      status: "cancelled",
      isCancelled: true,
      amount: 999,
      startedAt: "2026-08-01 00:00:00",
      expiresAt: "2026-09-01 00:00:00",
      daysLeft: 20,
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useSubscriptionContext(), { wrapper });

    await act(async () => {});

    expect(result.current.hasSubscription).toBe(true);
    expect(result.current.isCancelled).toBe(true);
  });

  it("действующая подписка не помечена как отменённая", async () => {
    const fetchMock = mockFetchStatus({
      status: "active",
      isCancelled: false,
      amount: 999,
      startedAt: "2026-08-01 00:00:00",
      expiresAt: "2026-09-01 00:00:00",
      daysLeft: 20,
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useSubscriptionContext(), { wrapper });

    await act(async () => {});

    expect(result.current.hasSubscription).toBe(true);
    expect(result.current.isCancelled).toBe(false);
  });
});
