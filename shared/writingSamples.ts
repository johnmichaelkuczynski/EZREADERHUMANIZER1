// Writing samples and instruction presets for GPT Bypass functionality

export interface WritingSample {
  id: string;
  title: string;
  category: 'content-neutral' | 'epistemology' | 'paradoxes';
  content: string;
}

export interface InstructionPreset {
  id: string;
  title: string;
  description: string;
  isDefault: boolean;
  category: 'core-humanization' | 'structure-cadence' | 'framing-inference' | 'diction-tone' | 'concreteness' | 'asymmetry' | 'formatting' | 'safety' | 'combo';
}

export const WRITING_SAMPLES: WritingSample[] = [
  // Content-Neutral
  {
    id: 'formal-functional-relationships',
    title: 'Formal and Functional Relationships',
    category: 'content-neutral',
    content: `There are two broad types of relationships: formal and functional.
Formal relationships hold between descriptions. A description is any statement that can be true or false.
Example of a formal relationship: The description that a shape is a square cannot be true unless the description that it has four equal sides is true. Therefore, a shape's being a square depends on its having four equal sides.

Functional relationships hold between events or conditions. (An event is anything that happens in time.)
Example of a functional relationship: A plant cannot grow without water. Therefore, a plant's growth depends on its receiving water.

The first type is structural, i.e., it holds between statements about features.
The second is operational, i.e., it holds between things in the world as they act or change.

Descriptions as objects of consideration
The objects of evaluation are descriptions. Something is not evaluated unless it is described, and it is not described unless it can be stated. One can notice non-descriptions — sounds, objects, movements — but in the relevant sense one evaluates descriptions of them.

Relationships not known through direct observation
Some relationships are known, not through direct observation, but through reasoning. Such relationships are structural, as opposed to observational. Examples of structural relationships are:

If A, then A or B.

All tools require some form of use.

Nothing can be both moving and perfectly still.

There are no rules without conditions.

1 obviously expresses a relationship; 2–4 do so less obviously, as their meanings are:

2*. A tool's being functional depends on its being usable.
3*. An object's being both moving and still depends on contradictory conditions, which cannot occur together.
4*. The existence of rules depends on the existence of conditions to which they apply.

Structural truth and structural understanding
Structural understanding is always understanding of relationships. Observational understanding can be either direct or indirect; the same is true of structural understanding.`
  },
  {
    id: 'alternative-explanatory-efficiency',
    title: 'Alternative Account of Explanatory Efficiency',
    category: 'content-neutral',
    content: `A continuation of the earlier case will make it clear what this means and why it matters. Why doesn't the outcome change under the given conditions? Because, says the standard account, the key factor remained in place. But, the skeptic will counter, perhaps we can discard that account; perhaps there's an alternative that fits the observations equally well. But, I would respond, even granting for argument's sake that such an alternative exists, it doesn't follow that it avoids more gaps than the one it replaces. It doesn't follow that it is comparable from a trade-off standpoint to the original—that it reduces as many issues as the old view while introducing no more new ones. In fact, the opposite often holds. Consider the alternative mentioned earlier. The cost of that account—meaning what new puzzles it creates—is vastly greater than its value—meaning what old puzzles it removes. It would be difficult to devise an account inconsistent with the conventional one that, while still matching the relevant evidence, is equally efficient in explanatory terms. You can test this for yourself. If there is reason to think even one such account exists, it is not because it has ever been produced. That reason, if it exists, must be purely theoretical. And for reasons soon to be made clear, no such purely theoretical reason can justify accepting it. But there is a further difficulty for this—or, by a similar line of thought, for any non-standard—replacement of the conventional view. It is not at all clear that, once the relevant details are considered, the replacement is even logically possible. Taken on its own, a substitute account may describe a situation that seems coherent. It may not be contradictory in the strict sense. But that alone is not enough for it to serve as a viable model of the relevant information. Think of the range of underlying principles that would have to be set aside. Setting them aside, if possible at all, would create ripple effects. Consider the various assumptions about causation, evidence, and reasoning that the conventional view presupposes. If these are discarded, what replaces them? And how do we know that what replaces them isn't vulnerable to objections even more serious than those raised against the original?`
  },
  {
    id: 'explanatory-goodness-vs-correctness',
    title: 'Explanatory Goodness vs Correctness',
    category: 'content-neutral',
    content: `For an explanation to be good isn't for it to be correct. Sometimes the right explanations are bad ones. A story will make this clear. I'm on a bus. The bus driver is smiling. A mystery! 'What on Earth does he have to smile about?' I ask myself. His job is so boring, and his life must therefore be such a horror.' But then I remember that, just a minute ago, a disembarking passenger gave him fifty $100 bills as a tip. So I have my explanation: 'he just came into a lot of money.' But here is the very different explanation tendered by my seatmate Gus, who, in addition to being unintelligent, is also completely insane. 'The bus-driver is a CIA assassin. This morning he killed somebody who, by coincidence, had the name Benjamin Franklin. Benjamin Franklin (the statesman, not the murder victim) is on the $100 bill. So when the bus driver saw those bills, he immediately thought of that morning's murder. The murder was a particularly enjoyable one; the bus driver is remembering the fun he had, and that's why he's smiling.' Gus and I have access to the same empirical data. (Gus hasn't read the bus driver's diary; he doesn't know the bus driver any more intimately than I do; and so on.) And Gus doesn't have some sort of psychic gift that would give him access to otherwise unknowable facts about the bus driver's mind that would legitimize his explanation. Indeed, a belief that he has such a gift isn't even among Gus's many delusions. Nor does he have any good reason—even if, for argumentative purposes, we grant him his delusions—to believe what he believes. But Gus is right. His explanation is correct down to the last detail. Given that it turned out to be correct, should we say that, despite first appearances, Gus's explanation is not a bad one? No! It's a datum that it's bad. It's a bad explanation that turned out to be correct. Thus, for an explanation to be a good one isn't for it to be correct. But a short extension of our story illustrates the even stronger principle that for an explanation to be correct isn't for it to be a good one.`
  },
  // Epistemology
  {
    id: 'rational-belief-structure',
    title: 'Rational Belief and Underlying Structure',
    category: 'epistemology',
    content: `When would it become rational to believe that, next time, you're more likely than not to roll this as opposed to that number—that, for example, you're especially likely to roll a 27? This belief becomes rational when, and only when, you have reason to believe that a 27-roll is favored by the structures involved in the game. And that belief, in its turn, is rational if you know that circumstances at all like the following obtain: *The dice are magnetically attracted to the 27-slot. *On any given occasion, you have an unconscious intention to roll a 27 (even though you have no conscious intention of doing this), and you're such a talented dice-thrower that, if you can roll a 27 if it is your (subconscious) intention to do so. *The 27-slot is much bigger than any of the other slots. In fact, it takes up so much space on the roulette wheel that the remaining spaces are too small for the ball to fit into them. You are rational to believe that you'll continue to roll 27s to the extent that your having thus far rolled multiple 27s in a row gives you reason to believe there to be some underlying structure favoring that outcome. And to the extent that a long run of 27-rolls doesn't give you such a reason, you are irrational to believe that you're any more (or any less) likely to roll a 27 than you are any other number. So, no matter how many consecutive 27s you roll, if you know with certainty that there is no underlying structure that would favor such an outcome, then you have no more reason to expect a 27 than you are a 5 or a 32. Put pedantically, it is only insofar as you have reason to believe in such a structure that you have reason to expect something that has the property of being a die thrown by you to have the property of landing in the 27-slot. Your knowing of many phi's that are psi's and of none that are not doesn't necessarily give you any reason to believe that the next phi you encounter will be a psi; it gives you such a reason only insofar as it gives you a reason to believe in a structure that would dispose phi's to be psi's.`
  },
  {
    id: 'hume-induction-explanation',
    title: 'Hume, Induction, and the Logic of Explanation',
    category: 'epistemology',
    content: `We haven't yet refuted Hume's argument—we've only taken the first step towards doing so. Hume could defend his view against what we've said thus by far by saying the following: Suppose that, to explain why all phi's thus far known are psi's, you posit some underlying structure or law that disposes phi's to be psi's. Unless you think that nature is uniform, you have no right to expect that connection to continue to hold. But if, in order to deal with this, you suppose that nature is uniform, then you're caught in the vicious circle that I described. HR is correct. One is indeed caught in a vicious circle if, in order to show the legitimacy of inductive inference, one assumes UP; and the reason is that, just as Hume says, UP can be known, if at all, only on inductive grounds. But in making an inductive inference, one doesn't assume UP and, moreover, one doesn't assume anything that, like UP, can be known only on inductive grounds. What one assumes is that explanations are supposed to eliminate causal anomalies—that they are supposed to reduce the number of them and to limit the scope of those that aren't eliminated. What one assumes, then, is that it is inherent in the very concept of explanation that, other things being equal, T1 is a better explanation than T2 if T1 generates fewer anomalies than T2. The purpose of explanation is to minimize the breadth and depth of what must be taken for granted. The more a proposed theory requires you to say: 'things just happen that way; there's no explaining it,' the less successful an explanation it is. Here's an illustration. On Monday night, you park your car in the usual place, viz. right in front of your house, which is in a quiet residential neighborhood. As usual, you make sure that you lock the car and turn the car alarm on. You also put an almost, but not quite, indestructible device (popularly known as 'The Club') on the steering-wheel that locks it into place, making the car undriveable. Given where your home is in relation to various things (police stations, shopping areas, etc.), car thefts are very rare, and given all the precautions you've taken, car theft would seem to be impossible.`
  },
  // Paradoxes
  {
    id: 'knowledge-vs-awareness',
    title: 'Knowledge vs Awareness',
    category: 'paradoxes',
    content: `Knowledge is conceptually articulated awareness. In order for me to know that my shoes are uncomfortably tight, I need to have the concepts shoe, tight, discomfort, etc. I do not need to have these concepts—or, arguably, any concepts—to be aware of the uncomfortable tightness in my shoes. My knowledge of that truth is a conceptualization of my awareness of that state of affairs. Equivalently, there are two kinds of awareness: propositional and objectual. My visual perception of the dog in front of me is a case of objectual awareness, as is my awareness of the tightness of my shoes. My knowledge that there is a dog in front of me is a case of proposition-awareness, as is my knowledge that my shoes are uncomfortably tight. Truths, not objects, the objects of explanation. Observations are objectual awarenesses. The contents of such awarenesses must be converted into propositions if they are to be explained. This is because it is truths that are explained, and truths are true propositions. 'But don't we explain events?' it will be objected. 'Don't we explain bolts of lightning and avalanches?' To explain some avalanche or lightning-bolt x is to explain why it is a truth that x occurred. One is aware of lightning-bolts and avalanches. One explains the corresponding truths. Causal relations known through observation. Causal relations can be known only through one's senses (through sight, touch, etc.) and through real-time awareness of one's own psychological processes. In other words, causal relations can only be known empirically; and knowledge of them is therefore empirical. All theoretical knowledge inferential but not vice versa. Theoretical truths are necessarily known through inference, and knowledge of such truths is therefore inferential. But not all inferential knowledge is theoretical knowledge. I notice that you look tired and on that basis know that you didn't get enough sleep. That knowledge is inferential but non-theoretical. Theories and theoretical knowledge concern unobservable entities and processes.`
  },
  {
    id: 'loser-paradox',
    title: 'The Loser Paradox',
    category: 'paradoxes',
    content: `People who are the bottom of a hierarchy are far less likely to spurn that hierarchy than they are to use it against people who are trying to climb the ranks of that hierarchy. The person who never graduates from college may in some contexts claim that a college degree is worthless, but he is unlikely to act accordingly. When he comes across someone without a college degree who is trying to make something of himself, he is likely to pounce on that person, claiming he is an uncredentialed fraud. Explanation: Losers want others to share their coffin, and if that involves hyper-valuing the very people or institutions that put them in that coffin, then so be it.`
  },
  {
    id: 'indie-writers-paradox',
    title: 'The Indie Writer\'s Paradox',
    category: 'paradoxes',
    content: `People don't give good reviews to writers who do not already have positive reviews. Analysis: This is a veridical paradox, in the sense that it describes an actual vicious circle and does not represent a logical blunder. An independent writer is by definition one who does not have a marketing apparatus behind him, and such a writer depends on uncoerced positive reviews. But people are extremely reluctant to give good reviews to writers who are not popular already or who do not have the weight of some institution behind them. This circle can be broken by writers who mass-produce schlock, but there is no real way for other writers to break it. This is a special form of the Grass Roots Movement Paradox.`
  },
  {
    id: 'primerica-paradox',
    title: 'The Primerica Paradox',
    category: 'paradoxes',
    content: `In order to work for Primerica, you need to have money, since you don't make any money working there. But if you have money you won't work for Primerica, because there is no reason to do so. And yet people work for Primerica. Explanation: Primerica is a multi-level insurance company. Its representatives have to pay to work there. They do not make a salary and only make money off of commissions. But they don't make money off of commissions since they almost never make sales, and they don't make sales because nobody wants Primerica insurance since it's bad and definitely don't want to buy it from some sleazy Primerica sales representative. And yet Primerica has hundreds of thousands of 'employees.' What's the explanation? Part of it, of course, is that Primerica sales reps are chumps. Another part of it is that, although they sometimes vaguely understand that it is a scam, they give their money to Primerica thinking that in due course they will be on the inside of that scam. But there is a simpler and more cogent explanation. People who are on welfare often have to provide proof that either have employment or are looking for it. If you pay a monthly fee of $50 to Primerica, you can list it as an employer. Plus, given that you are technically employed but are making no money at all, you are entitled to major tax exemptions. There is no money to be made at Primerica. Zero. The people who work there are slimy lying chumps. But it makes it possible to get welfare, and what Primerica charges its fake employees is a lot less than their subsequent welfare checks. So it's worth it for them to let Primerica rip them off a little bit, and that's why Primerica remains 'in business.'`
  }
];

export const INSTRUCTION_PRESETS: InstructionPreset[] = [
  // Core Humanization (1-8, selected by default)
  {
    id: 'mixed-cadence-sprawl',
    title: 'Mixed cadence + clause sprawl',
    description: 'Alternate short and long sentences; allow some long sentences to wander with extra clauses.',
    isDefault: true,
    category: 'core-humanization'
  },
  {
    id: 'asymmetric-emphasis',
    title: 'Asymmetric emphasis',
    description: 'Over-elaborate one point; compress or skate past another.',
    isDefault: true,
    category: 'core-humanization'
  },
  {
    id: 'one-aside',
    title: 'One aside',
    description: 'Add a quick parenthetical or em-dash remark — factual, not jokey.',
    isDefault: true,
    category: 'core-humanization'
  },
  {
    id: 'hedge-twice',
    title: 'Hedge twice',
    description: 'Use two mild uncertainty markers ("probably," "seems," "roughly," "I think").',
    isDefault: true,
    category: 'core-humanization'
  },
  {
    id: 'local-disfluency',
    title: 'Local disfluency',
    description: 'Keep one redundant or slightly awkward phrase that still makes sense.',
    isDefault: true,
    category: 'core-humanization'
  },
  {
    id: 'analogy-injection',
    title: 'Analogy injection',
    description: 'Insert a short, concrete comparison to something unrelated but illustrative.',
    isDefault: true,
    category: 'core-humanization'
  },
  {
    id: 'topic-snap',
    title: 'Topic snap',
    description: 'Abruptly shift focus once, then return.',
    isDefault: true,
    category: 'core-humanization'
  },
  {
    id: 'friction-detail',
    title: 'Friction detail',
    description: 'Drop in a small, seemingly unnecessary but real-world-plausible detail.',
    isDefault: true,
    category: 'core-humanization'
  },
  
  // Structure & Cadence
  {
    id: 'compression-light',
    title: 'Compression — light (−15%)',
    description: 'Cut filler; merge short clauses; keep meaning.',
    isDefault: false,
    category: 'structure-cadence'
  },
  {
    id: 'compression-medium',
    title: 'Compression — medium (−30%)',
    description: 'Trim hard; delete throat-clearing; tighten syntax.',
    isDefault: false,
    category: 'structure-cadence'
  },
  {
    id: 'compression-heavy',
    title: 'Compression — heavy (−45%)',
    description: 'Sever redundancies; collapse repeats; keep core claims.',
    isDefault: false,
    category: 'structure-cadence'
  },
  {
    id: 'decrease-50',
    title: 'DECREASE BY 50%',
    description: 'REDUCE THE LENGTH BY HALF WHILE PRESERVING MEANING',
    isDefault: false,
    category: 'structure-cadence'
  },
  {
    id: 'increase-150',
    title: 'INCREASE BY 150%',
    description: 'EXPAND THE TEXT TO 150% LONGER WITH ADDITIONAL DETAIL AND ELABORATION',
    isDefault: false,
    category: 'structure-cadence'
  },
  {
    id: 'mixed-cadence',
    title: 'Mixed cadence',
    description: 'Alternate 5–35-word sentences; no uniform rhythm.',
    isDefault: false,
    category: 'structure-cadence'
  },
  {
    id: 'clause-surgery',
    title: 'Clause surgery',
    description: 'Reorder main/subordinate clauses in 30% of sentences.',
    isDefault: false,
    category: 'structure-cadence'
  },
  {
    id: 'front-load-claim',
    title: 'Front-load claim',
    description: 'Put the main conclusion in sentence 1; support follows.',
    isDefault: false,
    category: 'structure-cadence'
  },
  {
    id: 'back-load-claim',
    title: 'Back-load claim',
    description: 'Delay the conclusion to the final 2–3 sentences.',
    isDefault: false,
    category: 'structure-cadence'
  },
  {
    id: 'seam-pivot',
    title: 'Seam/pivot',
    description: 'Drop smooth connectors once; abrupt turn is fine.',
    isDefault: false,
    category: 'structure-cadence'
  },

  // Framing & Inference
  {
    id: 'imply-one-step',
    title: 'Imply one step',
    description: 'Omit an obvious inferential step; leave it implicit.',
    isDefault: false,
    category: 'framing-inference'
  },
  {
    id: 'conditional-framing',
    title: 'Conditional framing',
    description: 'Recast one key sentence as "If/Unless …, then …".',
    isDefault: false,
    category: 'framing-inference'
  },
  {
    id: 'local-contrast',
    title: 'Local contrast',
    description: 'Use "but/except/aside" once to mark a boundary—no new facts.',
    isDefault: false,
    category: 'framing-inference'
  },
  {
    id: 'scope-check',
    title: 'Scope check',
    description: 'Replace one absolute with a bounded form ("in cases like these").',
    isDefault: false,
    category: 'framing-inference'
  },

  // Diction & Tone
  {
    id: 'deflate-jargon',
    title: 'Deflate jargon',
    description: 'Swap nominalizations for verbs where safe (e.g., "utilization" → "use").',
    isDefault: false,
    category: 'diction-tone'
  },
  {
    id: 'kill-stock-transitions',
    title: 'Kill stock transitions',
    description: 'Delete "Moreover/Furthermore/In conclusion" everywhere.',
    isDefault: false,
    category: 'diction-tone'
  },
  {
    id: 'hedge-once',
    title: 'Hedge once',
    description: 'Use exactly one: "probably/roughly/more or less."',
    isDefault: false,
    category: 'diction-tone'
  },
  {
    id: 'drop-intensifiers',
    title: 'Drop intensifiers',
    description: 'Remove "very/clearly/obviously/significantly."',
    isDefault: false,
    category: 'diction-tone'
  },
  {
    id: 'low-heat-voice',
    title: 'Low-heat voice',
    description: 'Prefer plain verbs; avoid showy synonyms.',
    isDefault: false,
    category: 'diction-tone'
  },

  // Concreteness & Benchmarks
  {
    id: 'concrete-benchmark',
    title: 'Concrete benchmark',
    description: 'Replace one vague scale with a testable one (e.g., "enough to X").',
    isDefault: false,
    category: 'concreteness'
  },
  {
    id: 'swap-generic-example',
    title: 'Swap generic example',
    description: 'If the source has an example, make it slightly more specific; else skip.',
    isDefault: false,
    category: 'concreteness'
  },
  {
    id: 'metric-nudge',
    title: 'Metric nudge',
    description: 'Replace "more/better" with a minimal, source-safe comparator ("more than last case").',
    isDefault: false,
    category: 'concreteness'
  },

  // Asymmetry & Focus
  {
    id: 'cull-repeats',
    title: 'Cull repeats',
    description: 'Delete duplicated sentences/ideas; keep the strongest instance.',
    isDefault: false,
    category: 'asymmetry'
  },

  // Formatting & Output Hygiene
  {
    id: 'no-lists',
    title: 'No lists',
    description: 'Force continuous prose; remove bullets/numbering.',
    isDefault: false,
    category: 'formatting'
  },
  {
    id: 'no-meta',
    title: 'No meta',
    description: 'No prefaces, apologies, or "as requested" scaffolding.',
    isDefault: false,
    category: 'formatting'
  },
  {
    id: 'exact-nouns',
    title: 'Exact nouns',
    description: 'Replace vague pronouns where antecedent is ambiguous.',
    isDefault: false,
    category: 'formatting'
  },
  {
    id: 'quote-once',
    title: 'Quote once',
    description: 'If the source contains a strong phrase, quote it once; else skip.',
    isDefault: false,
    category: 'formatting'
  },

  // Safety / Guardrails
  {
    id: 'claim-lock',
    title: 'Claim lock',
    description: 'Do not add examples, scenarios, or data not present in the source.',
    isDefault: false,
    category: 'safety'
  },
  {
    id: 'entity-lock',
    title: 'Entity lock',
    description: 'Keep names, counts, and attributions exactly as given.',
    isDefault: false,
    category: 'safety'
  },

  // Combo presets
  {
    id: 'lean-sharp',
    title: 'Lean & Sharp',
    description: 'Compression-medium + mixed cadence + imply one step + kill stock transitions.',
    isDefault: false,
    category: 'combo'
  },
  {
    id: 'analytic',
    title: 'Analytic',
    description: 'Clause surgery + front-load claim + scope check + exact nouns + no lists.',
    isDefault: false,
    category: 'combo'
  }
];

export const DEFAULT_WRITING_SAMPLE = WRITING_SAMPLES[0]; // Formal and Functional Relationships
export const DEFAULT_INSTRUCTION_PRESETS = INSTRUCTION_PRESETS.filter(preset => preset.isDefault);