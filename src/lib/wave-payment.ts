export const WAVE_PAYMENT_URL = "https://pay.wave.com/m/M_ci_vd5eYWll6jXx/c/ci/";
const RETURN_KEY = "corrigepro-wave-return";

export interface WaveReturn {
  userId: string;
  documentId: string;
  requestId: string;
}

export function readWaveReturn(storage: Pick<Storage, "getItem">, userId: string): WaveReturn | null {
  try {
    const value = JSON.parse(storage.getItem(RETURN_KEY) ?? "null");
    if (value?.userId !== userId || typeof value.documentId !== "string" || typeof value.requestId !== "string") return null;
    return value;
  } catch {
    return null;
  }
}

export function clearWaveReturn(storage: Pick<Storage, "removeItem">) {
  storage.removeItem(RETURN_KEY);
}

/** Save the proof step before leaving, without creating an auxiliary tab. */
export function startWavePayment(
  payment: WaveReturn,
  storage: Pick<Storage, "setItem">,
  location: Pick<Location, "assign">,
) {
  storage.setItem(RETURN_KEY, JSON.stringify(payment));
  location.assign(WAVE_PAYMENT_URL);
}