export interface WordLength {
  target: number;
  min: number;
  max: number;
}

export function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

// Inspect user instructions before the input; never infer length from reference sources.
export function requestedWordLength(...prompts: string[]): WordLength | undefined {
  const number = String.raw`(\d{1,3}(?:,\d{3})+|\d+)`;
  for (const prompt of prompts) {
    const range = new RegExp(String.raw`\b(?:between\s+)?${number}\s*(?:to|and|[-–—])\s*${number}[\s-]*words?\b`, "i").exec(prompt);
    if (range) {
      const min = Number(range[1].replaceAll(",", ""));
      const max = Number(range[2].replaceAll(",", ""));
      if (min > 0 && max >= min) return { min, max, target: Math.round((min + max) / 2) };
    }
    const matches = Array.from(prompt.matchAll(new RegExp(String.raw`\b${number}[\s-]*words?\b`, "gi")));
    const match = matches.at(-1);
    if (!match) continue;
    const target = Number(match[1].replaceAll(",", ""));
    if (target <= 0) continue;
    const prefix = prompt.slice(Math.max(0, match.index! - 30), match.index);
    if (/(?:at least|minimum(?: of)?|no fewer than)\s*$/i.test(prefix)) {
      return { target, min: target, max: Math.ceil(target * 1.05) };
    }
    if (/(?:at most|maximum(?: of)?|no more than|under|up to)\s*$/i.test(prefix)) {
      return { target, min: 0, max: target };
    }
    return { target, min: Math.ceil(target * 0.95), max: Math.floor(target * 1.05) };
  }
}

export function wordLengthTokenBudget(length?: WordLength): number {
  return length ? Math.min(16000, Math.max(4000, Math.ceil(length.target * 2.5) + 1024)) : 4000;
}

/**
 * Run inside the provider fallback callback so an exhausted length correction
 * tries the next provider instead of publishing a known noncompliant draft.
 */
export async function enforceWordLength(
  length: WordLength | undefined,
  generate: (lengthInstruction: string) => Promise<string>,
): Promise<string> {
  if (!length) return generate("");
  const requirement = `OUTPUT LENGTH REQUIREMENT: Aim for ${length.target} words. The complete response must contain ${length.min}–${length.max} whitespace-separated words. This overrides conflicting default brevity, preservation, or expansion instructions. Return only the complete requested work, not a plan, a word-count claim, or an explanation. Develop substantive reasoning and examples; do not pad or repeat.`;
  let result = await generate(requirement);
  if (!result.trim()) throw new Error("Generated text did not meet the requested word length.");
  for (let attempt = 0; attempt < 4; attempt++) {
    const actual = countWords(result);
    if (actual >= length.min && actual <= length.max) return result;
    console.warn(`[Word length] Draft rejected: ${actual} words; required ${length.min}–${length.max}; correction ${attempt + 1}/4.`);
    const paragraphs = result.trim().split(/\n\s*\n/);
    if (actual < length.min) {
      const missing = length.target - actual;
      const addition = await generate(
        `LENGTH REPAIR — THIS CALL RETURNS ONLY NEW BODY PARAGRAPHS, NOT A COMPLETE ESSAY.
The current draft contains ${actual} words; the full essay needs ${length.min}–${length.max}.
Write approximately ${missing} NEW words of substantive development, examples, objections, or analysis that add to the argument without repetition.
Do not reproduce the draft, its introduction, or its conclusion. Do not add a preface or explain the repair.
These paragraphs will be inserted immediately before the final paragraph of the existing draft. Match its voice and ensure the transition into the final paragraph makes sense.
EXISTING DRAFT:
${result}
FOR THIS CALL ONLY: Return approximately ${missing} words of new body paragraphs, NOT the entire ${length.target}-word essay.`,
      );
      // Keep the conclusion at the end; never cut an essay off to hit a count.
      if (!addition.trim()) throw new Error("Generated text did not meet the requested word length.");
      paragraphs.splice(paragraphs.length > 1 ? paragraphs.length - 1 : 1, 0, addition.trim());
      result = paragraphs.join("\n\n");
    } else {
      // Repair a limited passage instead of repeatedly regenerating the whole essay.
      const excess = actual - length.target;
      let start = paragraphs.length > 2 ? 1 : 0;
      let end = start;
      let passageWords = 0;
      while (end < paragraphs.length && passageWords < excess + 100) {
        passageWords += countWords(paragraphs[end++]);
      }
      const replacementTarget = Math.max(20, passageWords - excess);
      const replacement = await generate(
        `LENGTH REPAIR — THIS CALL RETURNS ONLY A REPLACEMENT FOR THE MARKED PASSAGE.
The full draft is ${actual} words, above its required ${length.min}–${length.max} words.
Condense ONLY the marked passage from ${passageWords} words to approximately ${replacementTarget} words. Preserve its essential claims and connections. Do not rewrite the rest of the essay or add commentary.
FULL DRAFT FOR CONTEXT:
${result}
PASSAGE TO REPLACE:
${paragraphs.slice(start, end).join("\n\n")}
FOR THIS CALL ONLY: Return approximately ${replacementTarget} words replacing the marked passage, not the entire essay.`,
      );
      if (!replacement.trim()) throw new Error("Generated text did not meet the requested word length.");
      paragraphs.splice(start, end - start, replacement.trim());
      result = paragraphs.join("\n\n");
    }
  }
  const finalCount = countWords(result);
  if (finalCount >= length.min && finalCount <= length.max) return result;
  throw new Error("Generated text did not meet the requested word length.");
}
