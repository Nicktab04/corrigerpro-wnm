/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { DEFAULT_SUBSCRIPTION_MONTHS, hasPaidAccess, subscriptionExpired, validSubscriptionMonths } from "./subscriptions";
import { isLocked, type DocumentRow } from "./licencehub";

const expiry = "2026-11-02T12:00:00Z";
const now = Date.parse(expiry);
const doc: DocumentRow = { id: "doc", title: "Correction", subject: "Mathématiques", major: "SEG", level: 1, year: 2026, kind: "correction", storage_path: "test.pdf", created_at: expiry };

describe("Abonnements", () => {
  test("la durée par défaut reste un mois", () => expect(DEFAULT_SUBSCRIPTION_MONTHS).toBe(1));
  test("la durée est un nombre entier positif de mois", () => {
    expect(validSubscriptionMonths(3)).toBe(true);
    expect(validSubscriptionMonths(0)).toBe(false);
    expect(validSubscriptionMonths(1.5)).toBe(false);
  });
  test("l'accès payant cesse à l'instant précis de l'expiration", () => {
    expect(hasPaidAccess("paid", expiry, now - 1)).toBe(true);
    expect(hasPaidAccess("paid", expiry, now)).toBe(false);
  });
  test("la notification devient applicable à expiration", () => {
    expect(subscriptionExpired(expiry, now - 1)).toBe(false);
    expect(subscriptionExpired(expiry, now)).toBe(true);
  });
  test("un document acquis reste ouvert après expiration", () => {
    expect(isLocked(doc, { isAdmin: false, plan: "paid", expiresAt: expiry, now, unlocked: new Set(["doc"]) })).toBe(false);
    expect(isLocked(doc, { isAdmin: false, plan: "paid", expiresAt: expiry, now })).toBe(true);
  });
  test("les sujets cours et TD restent accessibles après expiration", () => {
    for (const kind of ["exam", "cours", "td"] as const) expect(isLocked({ ...doc, kind }, { isAdmin: false, plan: "paid", expiresAt: expiry, now })).toBe(false);
  });
});