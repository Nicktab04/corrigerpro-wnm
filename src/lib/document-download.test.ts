import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { documentFilename, downloadBlob, deliverDocument } from "./document-download";

describe("direct document delivery", () => {
  test("keeps PDF and image extensions and safe filenames", () => {
    assert.equal(documentFilename("student/exam.PDF", "Sujet / examen"), "Sujet - examen.pdf");
    assert.equal(documentFilename("student/photo.jpg", "Photo.jpg"), "Photo.jpg");
  });

  test("downloads a blob without targeting or opening another tab", () => {
    const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    const originalCreate = URL.createObjectURL;
    let clicked = false;
    let cleanupDelay = 0;
    const anchor = { href: "", download: "", target: "", style: {}, click: () => { clicked = true; }, remove() {} };
    Object.defineProperty(globalThis, "document", { configurable: true, value: { createElement: () => anchor, body: { appendChild() {} } } });
    Object.defineProperty(globalThis, "window", { configurable: true, value: { setTimeout: (_fn: unknown, delay: number) => { cleanupDelay = delay; } } });
    URL.createObjectURL = () => "blob:local-file";
    try {
      downloadBlob(new Blob(["PDF"], { type: "application/pdf" }), "Sujet.pdf");
      assert.equal(clicked, true);
      assert.equal(anchor.href, "blob:local-file");
      assert.equal(anchor.download, "Sujet.pdf");
      assert.equal(anchor.target, "");
      assert.equal(cleanupDelay, 60_000);
    } finally {
      URL.createObjectURL = originalCreate;
      if (originalDocument) Object.defineProperty(globalThis, "document", originalDocument);
      else Reflect.deleteProperty(globalThis, "document");
      if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
      else Reflect.deleteProperty(globalThis, "window");
    }
  });

  test("iPhone saves through the native file sheet from the click", async () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
    const file = new File(["image"], "Image.png", { type: "image/png" });
    let shared: File[] = [];
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: {
      userAgent: "iPhone", canShare: () => true,
      share: async ({ files }: { files: File[] }) => { shared = files; },
    } });
    try {
      await deliverDocument(file);
      assert.deepEqual(shared, [file]);
    } finally {
      if (original) Object.defineProperty(globalThis, "navigator", original);
      else Reflect.deleteProperty(globalThis, "navigator");
    }
  });
});