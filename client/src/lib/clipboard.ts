/**
 * Clipboard access can be absent on HTTP or denied inside embedded previews.
 * Keep the synchronous selection-based path available for those browsers.
 */
export async function writeClipboardText(text: string): Promise<void> {
  try {
    if (typeof navigator.clipboard?.writeText === "function") {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // Permission policies may reject the modern API but allow a user-initiated copy.
  }

  const previousFocus = document.activeElement as HTMLElement | null;
  const selection = window.getSelection();
  const ranges = selection
    ? Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i).cloneRange())
    : [];
  const input = previousFocus instanceof HTMLTextAreaElement || previousFocus instanceof HTMLInputElement
    ? previousFocus : null;
  const start = input?.selectionStart;
  const end = input?.selectionEnd;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.readOnly = true;
  textarea.setAttribute("aria-label", "Copy text");
  Object.assign(textarea.style, {
    position: "fixed",
    top: "0",
    left: "-9999px",
    fontSize: "16px",
  });
  document.body.appendChild(textarea);
  try {
    textarea.focus({ preventScroll: true });
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    if (!document.execCommand?.("copy")) {
      throw new Error("Your browser blocked copying. Select the text and copy it manually.");
    }
  } finally {
    textarea.remove();
    previousFocus?.focus({ preventScroll: true });
    if (input && start != null && end != null) {
      input.setSelectionRange(start, end);
    } else if (selection) {
      selection.removeAllRanges();
      ranges.forEach(range => selection.addRange(range));
    }
  }
}
