import { describe, expect, test } from "bun:test";
import { studentDestination } from "./student-access";

describe("registration access", () => {
  test("completed student information opens the application immediately", () => {
    expect(studentDestination("approved")).toBe("/dashboard");
  });
  test("legacy students awaiting approval no longer wait", () => {
    expect(studentDestination("pending")).toBe("/dashboard");
  });
  test("incomplete information still requires the student form", () => {
    expect(studentDestination(undefined)).toBe("/register");
  });
  test("administrators keep direct access to administration", () => {
    expect(studentDestination(undefined, true)).toBe("/admin");
  });
  test("explicitly revoked accounts are not automatically reinstated", () => {
    expect(studentDestination("rejected")).toBe("/pending");
  });
});