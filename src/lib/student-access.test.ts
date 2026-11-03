import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { studentDestination } from "./student-access";

describe("registration access", () => {
  test("a newly signed-in student without information goes directly to registration", () => {
    assert.equal(studentDestination(undefined, false), "/register");
  });
  test("completed student information opens the application immediately", () => {
    assert.equal(studentDestination("approved"), "/dashboard");
  });
  test("legacy students awaiting approval no longer wait", () => {
    assert.equal(studentDestination("pending"), "/dashboard");
  });
  test("incomplete information still requires the student form", () => {
    assert.equal(studentDestination(undefined), "/register");
  });
  test("administrators keep direct access to administration", () => {
    assert.equal(studentDestination(undefined, true), "/admin");
  });
  test("explicitly revoked accounts are not automatically reinstated", () => {
    assert.equal(studentDestination("rejected"), "/pending");
  });
});