---
name: Requested essay length
description: User's tolerance for requested essay length and why actual output length matters.
---

Dr. Kuczynski accepts 1,900 or 2,100 words for a requested 2,000-word essay, but not 800 words. Treat explicit requested length as a substantive requirement, with a five-percent tolerance for a single approximate target.

**Why:** The user received an approximately 800-word essay after requesting 2,000 words and explicitly rejected that discrepancy.

**How to apply:** Count the returned text, not the model's claimed word count. Correct outputs outside the requested range before treating generation as successful. Preserve specific user-provided ranges or upper/lower limits.

Prefer counted, limited passage repairs over repeatedly asking for an entirely new essay.

**Why:** Live generation repeatedly returned short full rewrites despite explicit count feedback. Other providers overshot and continued missing the range. Adding the measured missing material before the conclusion and condensing selected passages resolved the length without cutting off the essay.

**How to apply:** Keep introduction and conclusion in place where possible, measure the assembled result after each repair, and bound repair attempts before trying the next provider.
