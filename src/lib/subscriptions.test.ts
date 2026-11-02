import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { DEFAULT_SUBSCRIPTION_MONTHS, hasPaidAccess, subscriptionExpired, validSubscriptionMonths } from "./subscriptions";
import { isLocked, type DocumentRow } from "./licencehub";

const expiry = "2026-11-02T12:00:00Z";
const now = Date.parse(expiry);
const doc: DocumentRow = { id: "doc", title: "Correction", subject: "Mathématiques", major: "SEG", level: 1, year: 2026, kind: "correction", storage_path: "test.pdf", created_at: expiry };

describe("Abonnements", () => {
  test("la durée par défaut reste un mois", () => assert.equal(DEFAULT_SUBSCRIPTION_MONTHS, 1));
  test("la durée est un nombre entier positif de mois", () => {
    assert.equal(validSubscriptionMonths(3), true);
    assert.equal(validSubscriptionMonths(0), false);
    assert.equal(validSubscriptionMonths(1.5), false);
  });
  test("l'accès payant cesse à l'instant précis de l'expiration", () => {
    assert.equal(hasPaidAccess("paid", expiry, now - 1), true);
    assert.equal(hasPaidAccess("paid", expiry, now), false);
  });
  test("la notification devient applicable à expiration", () => {
    assert.equal(subscriptionExpired(expiry, now - 1), false);
    assert.equal(subscriptionExpired(expiry, now), true);
  });
  test("un document acquis reste ouvert après expiration", () => {
    assert.equal(isLocked(doc, { isAdmin: false, plan: "paid", expiresAt: expiry, now, unlocked: new Set(["doc"]) }), false);
    assert.equal(isLocked(doc, { isAdmin: false, plan: "paid", expiresAt: expiry, now }), true);
  });
  test("les sujets cours et TD restent accessibles après expiration", () => {
    for (const kind of ["exam", "cours", "td"] as const) assert.equal(isLocked({ ...doc, kind }, { isAdmin: false, plan: "paid", expiresAt: expiry, now }), false);
  });
});