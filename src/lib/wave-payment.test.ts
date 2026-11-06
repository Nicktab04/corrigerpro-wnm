import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
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
    const destinations: string[] = [];
    const assign = (url: string | URL) => {
      assert.deepEqual(readWaveReturn(storage, "student"), payment);
      destinations.push(String(url));
    };
    startWavePayment(payment, storage, { assign });
    assert.deepEqual(destinations, ["https://pay.wave.com/m/M_ci_vd5eYWll6jXx/c/ci/"]);
    assert.equal(WAVE_PAYMENT_URL, "https://pay.wave.com/m/M_ci_vd5eYWll6jXx/c/ci/");
  });

  it("restores the document and request after returning from Wave", () => {
    const storage = memoryStorage();
    startWavePayment(payment, storage, { assign: () => {} });
    assert.deepEqual(readWaveReturn(storage, "student"), payment);
    clearWaveReturn(storage);
    assert.equal(readWaveReturn(storage, "student"), null);
  });

  it("never restores another student's payment", () => {
    const storage = memoryStorage();
    startWavePayment(payment, storage, { assign: () => {} });
    assert.equal(readWaveReturn(storage, "other-student"), null);
  });

  it("ignores malformed return data", () => {
    assert.equal(readWaveReturn({ getItem: () => "not-json" }, "student"), null);
    assert.equal(readWaveReturn({ getItem: () => '{"userId":"student"}' }, "student"), null);
  });
});