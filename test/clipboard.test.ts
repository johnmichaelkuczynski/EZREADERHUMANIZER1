import assert from "node:assert/strict";
import { test } from "node:test";
import { writeClipboardText } from "../client/src/lib/clipboard";

test("copy supports modern, missing, denied, and blocked clipboard APIs", async () => {
  let copied = "";
  let removed = 0;
  let restored = 0;
  let allowed = true;
  class Input {}
  Object.assign(globalThis, { HTMLInputElement: Input, HTMLTextAreaElement: Input });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: {
    clipboard: { writeText: async (text: string) => { copied = text; } },
  } });
  const field = {
    value: "", style: {}, setAttribute() {}, focus() {}, select() {},
    setSelectionRange() {}, remove() { removed++; },
  };
  Object.assign(globalThis, {
    window: { getSelection: () => null },
    document: {
      activeElement: { focus() { restored++; } },
      body: { appendChild() {} },
      createElement: () => field,
      execCommand: (command: string) => {
        assert.equal(command, "copy");
        copied = field.value;
        return allowed;
      },
    },
  });
  const text = "Thesis: α + β\n第二行";
  await writeClipboardText(text);
  assert.equal(copied, text);
  assert.equal(removed, 0);

  Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
  await writeClipboardText(text);
  assert.equal(copied, text);
  assert.equal(removed, 1);
  assert.equal(restored, 1);

  Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
    writeText: async () => { throw new Error("NotAllowedError"); },
  } });
  await writeClipboardText(text);
  assert.equal(removed, 2);
  allowed = false;
  await assert.rejects(writeClipboardText(text), /browser blocked copying/);
  assert.equal(removed, 3);
  assert.equal(restored, 3);
});
