import assert from "node:assert/strict";
import { test } from "node:test";
import { countWords, enforceWordLength, requestedWordLength, wordLengthTokenBudget } from "../server/llm/word-length";
import { withProviderFallback } from "../server/llm/provider-fallback";

const words = (n: number) => Array(n).fill("word").join(" ");

test("numeric length requests use five percent tolerance and instruction priority", () => {
  for (const request of ["Write a 2000 word essay", "Write a 2,000-word essay", "Approximately 2000 words"]) {
    assert.deepEqual(requestedWordLength(request), { target: 2000, min: 1900, max: 2100 });
  }
  assert.deepEqual(requestedWordLength("Write 2000 words", "Write 800 words"), { target: 2000, min: 1900, max: 2100 });
  assert.deepEqual(requestedWordLength("Write between 1900 and 2100 words"), { target: 2000, min: 1900, max: 2100 });
  assert.deepEqual(requestedWordLength("Write 1,900–2,100 words"), { target: 2000, min: 1900, max: 2100 });
  assert.equal(requestedWordLength("Rewrite well"), undefined);
  assert.equal(requestedWordLength("The year was 2000."), undefined);
  assert.equal(requestedWordLength("At least 2000 words")?.min, 2000);
  assert.equal(requestedWordLength("No more than 2000 words")?.max, 2000);
  assert.equal(countWords(" \n\t "), 0);
  assert.equal(countWords("first\nsecond\tthird"), 3);
  assert.ok(wordLengthTokenBudget(requestedWordLength("2000 words")) > 4000);
});

test("rejects an 800-word draft and corrects it before returning", async () => {
  let calls = 0;
  const result = await enforceWordLength(requestedWordLength("2000 words"), async prompt => {
    calls++;
    assert.match(prompt, /1900–2100/);
    if (calls === 1) return words(800);
    assert.match(prompt, /current draft contains 800 words/);
    assert.match(prompt, /ONLY NEW BODY PARAGRAPHS/);
    return words(1200);
  });
  assert.equal(calls, 2);
  assert.equal(countWords(result), 2000);
});

test("accepts both tolerance boundaries and rejects excess length", async () => {
  for (const n of [1900, 2100]) {
    let calls = 0;
    await enforceWordLength(requestedWordLength("2000 words"), async () => { calls++; return words(n); });
    assert.equal(calls, 1);
  }
  let calls = 0;
  const result = await enforceWordLength(requestedWordLength("2000 words"), async prompt => {
    if (++calls === 1) return words(2300);
    assert.match(prompt, /Condense/);
    return words(2050);
  });
  assert.equal(countWords(result), 2050);
});

test("repeated noncompliance tries the next provider; never returns the short draft", async () => {
  const providers: string[] = [];
  const result = await withProviderFallback("openai", "length regression", provider =>
    enforceWordLength(requestedWordLength("2000 words"), async () => {
      providers.push(provider);
      return words(provider === "openai" ? 800 : 1950);
    }));
  assert.equal(providers.at(-1), "anthropic");
  assert.ok(providers.slice(0, -1).every(p => p === "openai"));
  assert.equal(countWords(result), 1950);
  await assert.rejects(enforceWordLength(requestedWordLength("2000 words"), async () => ""), /requested word length/);
});

test("requests without a length constraint remain unchanged and do not retry", async () => {
  let calls = 0;
  const result = await enforceWordLength(undefined, async prompt => {
    calls++;
    assert.equal(prompt, "");
    return "Original response";
  });
  assert.equal(result, "Original response");
  assert.equal(calls, 1);
});
