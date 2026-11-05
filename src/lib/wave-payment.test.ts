import { describe, expect, it, vi } from "vitest";
import { clearWaveReturn, readWaveReturn, startWavePayment, WAVE_PAYMENT_URL } from "./wave-payment";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

const payment = { userId: "student", documentId: "correction", requestId: "payment" };

describe("Wave mobile return", () => {
  it("saves the proof step before navigating the current tab to Wave", () => {
    const storage = memoryStorage();
    const assign = vi.fn(() => expect(readWaveReturn(storage, "student")).toEqual(payment));
    startWavePayment(payment, storage, { assign });
    expect(assign).toHaveBeenCalledExactlyOnceWith("https://pay.wave.com/m/M_ci_vd5eYWll6jXx/c/ci/");
    expect(WAVE_PAYMENT_URL).toBe("https://pay.wave.com/m/M_ci_vd5eYWll6jXx/c/ci/");
  });

  it("restores the document and request after returning from Wave", () => {
    const storage = memoryStorage();
    startWavePayment(payment, storage, { assign: vi.fn() });
    expect(readWaveReturn(storage, "student")).toEqual(payment);
    clearWaveReturn(storage);
    expect(readWaveReturn(storage, "student")).toBeNull();
  });

  it("never restores another student's payment", () => {
    const storage = memoryStorage();
    startWavePayment(payment, storage, { assign: vi.fn() });
    expect(readWaveReturn(storage, "other-student")).toBeNull();
  });

  it("ignores malformed return data", () => {
    expect(readWaveReturn({ getItem: () => "not-json" }, "student")).toBeNull();
    expect(readWaveReturn({ getItem: () => '{"userId":"student"}' }, "student")).toBeNull();
  });
});