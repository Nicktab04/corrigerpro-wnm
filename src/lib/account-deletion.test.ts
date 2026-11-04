import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { canDeleteAccount } from "./account-deletion";

describe("account deletion permissions", () => {
  test("students can delete their own account", () => {
    assert.equal(canDeleteAccount("student", "student", false, false), true);
  });
  test("students cannot delete another account", () => {
    assert.equal(canDeleteAccount("student", "other", false, false), false);
  });
  test("administrators can delete any student, including uploaders", () => {
    assert.equal(canDeleteAccount("admin", "student", true, false), true);
  });
  test("student deletion cannot delete another administrator", () => {
    assert.equal(canDeleteAccount("admin", "other-admin", true, true), false);
  });
});