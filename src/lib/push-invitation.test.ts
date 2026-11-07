import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { pushInvitationKey, pushLoginId, shouldInvitePush } from "./push-invitation";

describe("Automatic student notification invitation", () => {
  it("invites a new account without requiring home-screen installation", () => {
    assert.equal(shouldInvitePush({ permission: "default", lastInvitation: null, loginId: "signup" }), true);
  });
  it("invites an existing student again on their next login", () => {
    assert.equal(shouldInvitePush({ permission: "default", lastInvitation: "old-login", loginId: "new-login" }), true);
  });
  it("does not repeat after dismissal, reload or profile completion in the same login", () => {
    assert.equal(shouldInvitePush({ permission: "default", lastInvitation: "login", loginId: "login" }), false);
  });
  it("does not invite students whose browser permission is already granted", () => {
    assert.equal(shouldInvitePush({ permission: "granted", lastInvitation: null, loginId: "login" }), false);
  });
  it("keeps the invitation available to previously denied or unsupported students", () => {
    for (const permission of ["denied", "unsupported"]) {
      assert.equal(shouldInvitePush({ permission, lastInvitation: null, loginId: "login" }), true);
    }
  });
  it("scopes invitation history to each student", () => {
    assert.notEqual(pushInvitationKey("student-one"), pushInvitationKey("student-two"));
  });
  it("does not repeat when the same login uses different timestamp formats", () => {
    const previous = pushLoginId("2026-11-07T07:24:00.123456+00:00");
    const current = pushLoginId("2026-11-07T07:24:00.123Z");
    assert.equal(shouldInvitePush({ permission: "default", lastInvitation: previous, loginId: current }), false);
  });
});